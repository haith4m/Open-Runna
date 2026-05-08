import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { authenticate } from "../middleware/auth.js";
import { AiCoachService } from "../services/aiCoach.js";

export async function coachRoutes(app: FastifyInstance) {
  const coach = new AiCoachService();

  // ─── Send message to AI coach ─────────────────────────────────────────────
  app.post("/chat", { preHandler: authenticate }, async (request, reply) => {
    const { userId } = request.user;

    const Schema = z.object({
      message: z.string().min(1).max(2000),
      contextType: z.enum([
        "chat", "workout_explanation", "week_summary",
        "race_strategy", "pacing_question", "motivation"
      ]).default("chat"),
      workoutId: z.string().optional(),
    });

    const body = Schema.safeParse(request.body);
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() });

    // Fetch context
    const [profile, activePlan, recentRuns, history] = await Promise.all([
      app.prisma.athleteProfile.findUnique({ where: { userId } }),
      app.prisma.trainingPlan.findFirst({
        where: { userId, status: "active" },
        select: {
          name: true, targetDistance: true, raceDate: true, totalWeeks: true,
          vdot: true, easyPaceSecPerKm: true, thresholdPaceSecPerKm: true,
        },
      }),
      app.prisma.run.findMany({
        where: { userId, status: "completed" },
        orderBy: { startedAt: "desc" },
        take: 5,
        select: {
          startedAt: true, totalDistanceMeters: true,
          durationSeconds: true, averagePaceSecPerKm: true, trainingLoad: true,
        },
      }),
      app.prisma.coachMessage.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

    let workout = null;
    if (body.data.workoutId) {
      workout = await app.prisma.workout.findFirst({
        where: { id: body.data.workoutId, week: { plan: { userId } } },
      });
    }

    const response = await coach.chat({
      userId,
      userMessage: body.data.message,
      contextType: body.data.contextType,
      profile: profile as any,
      activePlan: activePlan as any,
      recentRuns: recentRuns as any,
      messageHistory: history.reverse() as any,
      workout: workout as any,
    });

    // Persist both sides of the conversation
    await app.prisma.coachMessage.createMany({
      data: [
        {
          userId, role: "user",
          content: body.data.message,
          contextType: body.data.contextType,
          metadata: body.data.workoutId ? { workoutId: body.data.workoutId } : null,
        },
        {
          userId, role: "assistant",
          content: response,
          contextType: body.data.contextType,
        },
      ],
    });

    return { response };
  });

  // ─── Get weekly summary from coach ───────────────────────────────────────
  app.get("/week-summary", { preHandler: authenticate }, async (request) => {
    const { userId } = request.user;

    const cacheKey = `week-summary:${userId}:${getWeekKey()}`;
    const cached = await app.redis.get(cacheKey);
    if (cached) return { summary: cached, cached: true };

    const [profile, currentWeek, recentRuns] = await Promise.all([
      app.prisma.athleteProfile.findUnique({ where: { userId } }),
      app.prisma.trainingPlan.findFirst({
        where: { userId, status: "active" },
        include: {
          weeks: {
            where: { startDate: { lte: new Date() } },
            orderBy: { weekNumber: "desc" },
            take: 1,
            include: { workouts: { orderBy: { scheduledDate: "asc" } } },
          },
        },
      }),
      app.prisma.run.findMany({
        where: {
          userId, status: "completed",
          startedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
        orderBy: { startedAt: "asc" },
        select: {
          startedAt: true, totalDistanceMeters: true,
          durationSeconds: true, averagePaceSecPerKm: true,
          trainingLoad: true, feelingRating: true,
        },
      }),
    ]);

    const week = currentWeek?.weeks[0];
    if (!week) return { summary: "No active training week found.", cached: false };

    const summary = await coach.generateWeekSummary({
      profile: profile as any,
      week: week as any,
      recentRuns: recentRuns as any,
    });

    // Cache for 4 hours
    await app.redis.setex(cacheKey, 60 * 60 * 4, summary);

    return { summary, cached: false };
  });

  // ─── Get message history ──────────────────────────────────────────────────
  app.get("/history", { preHandler: authenticate }, async (request) => {
    const { userId } = request.user;
    const q = z.object({ limit: z.coerce.number().default(50) }).parse(request.query);

    return app.prisma.coachMessage.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      take: q.limit,
      select: {
        id: true, role: true, content: true, contextType: true, createdAt: true,
      },
    });
  });
}

function getWeekKey(): string {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const weekNum = Math.floor((now.getTime() - startOfYear.getTime()) / (7 * 24 * 60 * 60 * 1000));
  return `${now.getFullYear()}-W${weekNum}`;
}
