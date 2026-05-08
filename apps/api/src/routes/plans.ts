import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { authenticate } from "../middleware/auth.js";
import { generateTrainingPlan } from "@openrunna/training-engine";
import { adaptPlan } from "@openrunna/training-engine";
import type { TrainingPlan, PlanGenerationRequest } from "@openrunna/shared";

export async function planRoutes(app: FastifyInstance) {
  // ─── Generate new plan ────────────────────────────────────────────────────
  app.post("/generate", { preHandler: authenticate }, async (request, reply) => {
    const { userId } = request.user;

    const Schema = z.object({
      targetDistance: z.enum([
        "5k", "8k", "10k", "15k", "10mi", "half_marathon",
        "25k", "30k", "marathon", "50k", "50mi", "100k", "100mi"
      ]),
      raceDate: z.string(),
      goalType: z.enum(["finish", "time", "pr"]).default("finish"),
      goalTimeSeconds: z.number().optional(),
      raceName: z.string().optional(),
    });

    const body = Schema.safeParse(request.body);
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() });

    const profile = await app.prisma.athleteProfile.findUnique({
      where: { userId },
    });
    if (!profile) return reply.status(400).send({ error: "Complete your profile before generating a plan" });

    const req: PlanGenerationRequest = {
      athleteId: userId,
      targetDistance: body.data.targetDistance as any,
      raceDate: body.data.raceDate,
      goalType: body.data.goalType,
      goalTimeSeconds: body.data.goalTimeSeconds,
      currentWeeklyKm: profile.weeklyMileageKm,
      longestRecentRunKm: profile.longestRecentRunKm,
      vdot: profile.vdot ?? undefined,
      estimatedEasyPaceSecPerKm: undefined,
      experienceLevel: profile.experienceLevel as any,
      availableTrainingDays: profile.availableTrainingDays.length || 4,
      hasTreadmill: profile.hasTreadmillAccess,
      injuryRiskScore: profile.injuryRiskScore,
      hasRecentInjury: false,
    };

    const plan = generateTrainingPlan(req);

    // Persist the plan
    const saved = await app.prisma.trainingPlan.create({
      data: {
        id: plan.id,
        userId,
        name: plan.name,
        targetDistance: plan.targetDistance,
        targetTimeSeconds: plan.targetTimeSeconds,
        goalType: plan.goalType,
        startDate: new Date(plan.startDate),
        raceDate: new Date(plan.raceDate),
        totalWeeks: plan.totalWeeks,
        experienceLevel: plan.experienceLevel,
        peakWeeklyKm: plan.peakWeeklyKm,
        currentWeeklyKm: plan.currentWeeklyKm,
        longRunPeakKm: plan.longRunPeakKm,
        vdot: plan.vdot,
        easyPaceSecPerKm: plan.easyPaceSecPerKm,
        marathonPaceSecPerKm: plan.marathonPaceSecPerKm,
        thresholdPaceSecPerKm: plan.thresholdPaceSecPerKm,
        intervalPaceSecPerKm: plan.intervalPaceSecPerKm,
        repetitionPaceSecPerKm: plan.repetitionPaceSecPerKm,
        status: "active",
        weeks: {
          create: plan.weeks.map((week) => ({
            weekNumber: week.weekNumber,
            startDate: new Date(week.startDate),
            phase: week.phase,
            phaseDescription: week.phaseDescription,
            plannedDistanceKm: week.plannedDistanceKm,
            plannedIntensityScore: week.plannedIntensityScore,
            isRecoveryWeek: week.isRecoveryWeek,
            isTaperWeek: week.isTaperWeek,
            workouts: {
              create: week.workouts.map((w) => ({
                id: w.id,
                weekNumber: w.weekNumber,
                dayOfWeek: w.dayOfWeek,
                scheduledDate: new Date(w.scheduledDate),
                type: w.type,
                phase: w.phase,
                title: w.title,
                description: w.description,
                coachRationale: w.coachRationale,
                steps: w.steps as any,
                totalDistanceMeters: w.totalDistanceMeters,
                estimatedDurationMinutes: w.estimatedDurationMinutes,
                primaryZone: w.primaryZone,
                intensityScore: w.intensityScore,
                isKeySession: w.isKeySession,
                isOptional: w.isOptional,
                status: "scheduled",
              })),
            },
          })),
        },
      },
    });

    return reply.status(201).send({ planId: saved.id, plan });
  });

  // ─── Get active plan ──────────────────────────────────────────────────────
  app.get("/active", { preHandler: authenticate }, async (request, reply) => {
    const { userId } = request.user;

    const plan = await app.prisma.trainingPlan.findFirst({
      where: { userId, status: "active" },
      include: {
        weeks: {
          include: { workouts: { orderBy: { scheduledDate: "asc" } } },
          orderBy: { weekNumber: "asc" },
        },
      },
    });

    if (!plan) return reply.status(404).send({ error: "No active plan" });
    return plan;
  });

  // ─── Get current week ─────────────────────────────────────────────────────
  app.get("/active/current-week", { preHandler: authenticate }, async (request, reply) => {
    const { userId } = request.user;
    const now = new Date();

    const plan = await app.prisma.trainingPlan.findFirst({
      where: { userId, status: "active" },
      select: { id: true },
    });
    if (!plan) return reply.status(404).send({ error: "No active plan" });

    const week = await app.prisma.trainingWeek.findFirst({
      where: {
        planId: plan.id,
        startDate: { lte: now },
      },
      orderBy: { weekNumber: "desc" },
      include: { workouts: { orderBy: { scheduledDate: "asc" } } },
    });

    if (!week) return reply.status(404).send({ error: "No current week" });
    return week;
  });

  // ─── Adapt plan ───────────────────────────────────────────────────────────
  app.post("/:planId/adapt", { preHandler: authenticate }, async (request, reply) => {
    const { userId } = request.user;
    const { planId } = request.params as { planId: string };

    const Schema = z.object({
      trigger: z.enum([
        "workout_skipped", "workout_missed", "injury_reported", "fatigue_high",
        "fatigue_low", "performance_better_than_expected", "performance_worse_than_expected",
        "schedule_change", "illness", "travel", "race_cancelled", "manual_adjustment"
      ]),
      workoutId: z.string().optional(),
      injurySeverity: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
      illnessDays: z.number().optional(),
      newVdot: z.number().optional(),
      fatigueScore: z.number().optional(),
    });

    const body = Schema.safeParse(request.body);
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() });

    // Verify ownership
    const dbPlan = await app.prisma.trainingPlan.findFirst({
      where: { id: planId, userId },
      include: {
        weeks: { include: { workouts: true } },
        adaptations: true,
      },
    });
    if (!dbPlan) return reply.status(404).send({ error: "Plan not found" });

    // Reconstruct plan object for adaptation engine
    const planObj = dbPlanToTrainingPlan(dbPlan);

    const { modifiedPlan, adaptation, summary } = adaptPlan(planObj, {
      trigger: body.data.trigger as any,
      missedWorkoutId: body.data.workoutId,
      injurySeverity: body.data.injurySeverity,
      illnessDays: body.data.illnessDays,
      newVdot: body.data.newVdot,
      fatigueScore: body.data.fatigueScore,
    });

    // Persist the adaptation log
    await app.prisma.planAdaptation.create({
      data: {
        planId,
        trigger: adaptation.trigger,
        description: adaptation.description,
        weeksAffected: adaptation.weeksAffected,
        distanceChangeKm: adaptation.distanceChangeKm,
      },
    });

    await app.prisma.trainingPlan.update({
      where: { id: planId },
      data: {
        adaptationCount: { increment: 1 },
        vdot: modifiedPlan.vdot,
      },
    });

    return { summary, adaptation };
  });

  // ─── List all plans ───────────────────────────────────────────────────────
  app.get("/", { preHandler: authenticate }, async (request) => {
    const { userId } = request.user;
    return app.prisma.trainingPlan.findMany({
      where: { userId },
      select: {
        id: true, name: true, targetDistance: true,
        raceDate: true, totalWeeks: true, status: true,
        _count: { select: { weeks: true } },
      },
      orderBy: { generatedAt: "desc" },
    });
  });
}

function dbPlanToTrainingPlan(dbPlan: any): TrainingPlan {
  return {
    ...dbPlan,
    startDate: dbPlan.startDate.toISOString().split("T")[0],
    raceDate: dbPlan.raceDate.toISOString().split("T")[0],
    generatedAt: dbPlan.generatedAt.toISOString(),
    lastModifiedAt: dbPlan.lastModifiedAt.toISOString(),
    adaptationLog: dbPlan.adaptations ?? [],
    weeks: (dbPlan.weeks ?? []).map((w: any) => ({
      ...w,
      startDate: w.startDate.toISOString().split("T")[0],
      workouts: (w.workouts ?? []).map((wo: any) => ({
        ...wo,
        scheduledDate: wo.scheduledDate.toISOString().split("T")[0],
        steps: wo.steps,
      })),
    })),
  };
}
