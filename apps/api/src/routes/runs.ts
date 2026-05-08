import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { authenticate } from "../middleware/auth.js";
import { computeTss } from "@openrunna/training-engine";

export async function runRoutes(app: FastifyInstance) {
  // ─── Start a run ──────────────────────────────────────────────────────────
  app.post("/start", { preHandler: authenticate }, async (request, reply) => {
    const { userId } = request.user;

    const Schema = z.object({
      workoutId: z.string().optional(),
      startLatitude: z.number().optional(),
      startLongitude: z.number().optional(),
    });

    const body = Schema.safeParse(request.body);
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() });

    const run = await app.prisma.run.create({
      data: {
        userId,
        workoutId: body.data.workoutId,
        startedAt: new Date(),
        startLatitude: body.data.startLatitude,
        startLongitude: body.data.startLongitude,
        status: "in_progress",
        totalDistanceMeters: 0,
        durationSeconds: 0,
        elapsedSeconds: 0,
        trainingLoad: 0,
      },
    });

    return reply.status(201).send({ runId: run.id });
  });

  // ─── Update live run metrics (called every ~5 seconds by device) ──────────
  app.patch("/:runId/live", { preHandler: authenticate }, async (request, reply) => {
    const { userId } = request.user;
    const { runId } = request.params as { runId: string };

    const Schema = z.object({
      totalDistanceMeters: z.number(),
      durationSeconds: z.number(),
      averagePaceSecPerKm: z.number().optional(),
      currentHeartRate: z.number().optional(),
      currentCadenceSpm: z.number().optional(),
      elevationGainMeters: z.number().optional(),
    });

    const body = Schema.safeParse(request.body);
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() });

    const run = await app.prisma.run.findFirst({
      where: { id: runId, userId, status: "in_progress" },
    });
    if (!run) return reply.status(404).send({ error: "Run not found" });

    await app.prisma.run.update({
      where: { id: runId },
      data: {
        totalDistanceMeters: body.data.totalDistanceMeters,
        durationSeconds: body.data.durationSeconds,
        averagePaceSecPerKm: body.data.averagePaceSecPerKm,
        averageHeartRate: body.data.currentHeartRate,
        averageCadenceSpm: body.data.currentCadenceSpm,
        elevationGainMeters: body.data.elevationGainMeters,
        elapsedSeconds: body.data.durationSeconds,
      },
    });

    return { ok: true };
  });

  // ─── Finish a run ─────────────────────────────────────────────────────────
  app.post("/:runId/finish", { preHandler: authenticate }, async (request, reply) => {
    const { userId } = request.user;
    const { runId } = request.params as { runId: string };

    const Schema = z.object({
      totalDistanceMeters: z.number(),
      durationSeconds: z.number(),
      elapsedSeconds: z.number(),
      averagePaceSecPerKm: z.number().optional(),
      bestPaceSecPerKm: z.number().optional(),
      averageHeartRate: z.number().optional(),
      maxHeartRate: z.number().optional(),
      averageCadenceSpm: z.number().optional(),
      elevationGainMeters: z.number().optional(),
      elevationLossMeters: z.number().optional(),
      calories: z.number().optional(),
      perceivedEffort: z.number().min(1).max(10).optional(),
      feelingRating: z.enum(["terrible", "hard", "ok", "good", "great"]).optional(),
      postRunNotes: z.string().optional(),
      splits: z.array(z.any()).optional(),
      routeGeoJson: z.any().optional(),
      temperatureCelsius: z.number().optional(),
    });

    const body = Schema.safeParse(request.body);
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() });

    const run = await app.prisma.run.findFirst({
      where: { id: runId, userId },
      include: { workout: { include: { week: { include: { plan: true } } } } },
    });
    if (!run) return reply.status(404).send({ error: "Run not found" });

    // Compute training load (TSS)
    let trainingLoad = 0;
    if (body.data.averagePaceSecPerKm && run.workout?.week.plan.thresholdPaceSecPerKm) {
      trainingLoad = computeTss({
        durationSeconds: body.data.durationSeconds,
        averagePaceSecPerKm: body.data.averagePaceSecPerKm,
        thresholdPaceSecPerKm: run.workout.week.plan.thresholdPaceSecPerKm,
        perceivedEffort: body.data.perceivedEffort,
      });
    }

    // Compute compliance vs planned workout
    let complianceScore: number | undefined;
    if (run.workoutId && run.workout) {
      const planned = run.workout.totalDistanceMeters;
      const actual = body.data.totalDistanceMeters;
      complianceScore = Math.min(1, Math.max(0, 1 - Math.abs(actual - planned) / planned));
    }

    const updated = await app.prisma.run.update({
      where: { id: runId },
      data: {
        ...body.data,
        status: "completed",
        completedAt: new Date(),
        trainingLoad,
        complianceScore,
        splits: body.data.splits as any,
        routeGeoJson: body.data.routeGeoJson as any,
        plannedDistanceMeters: run.workout?.totalDistanceMeters,
      },
    });

    // Mark linked workout as completed
    if (run.workoutId) {
      await app.prisma.workout.update({
        where: { id: run.workoutId },
        data: { status: "completed", completedAt: new Date() },
      });
    }

    return { run: updated, trainingLoad, complianceScore };
  });

  // ─── Get run history ──────────────────────────────────────────────────────
  app.get("/", { preHandler: authenticate }, async (request) => {
    const { userId } = request.user;
    const q = z.object({
      limit: z.coerce.number().default(20),
      offset: z.coerce.number().default(0),
    }).parse(request.query);

    const runs = await app.prisma.run.findMany({
      where: { userId, status: "completed" },
      orderBy: { startedAt: "desc" },
      take: q.limit,
      skip: q.offset,
      select: {
        id: true, startedAt: true, totalDistanceMeters: true,
        durationSeconds: true, averagePaceSecPerKm: true,
        averageHeartRate: true, trainingLoad: true, feelingRating: true,
        workoutId: true,
      },
    });

    const total = await app.prisma.run.count({ where: { userId, status: "completed" } });
    return { runs, total };
  });

  // ─── Get single run ───────────────────────────────────────────────────────
  app.get("/:runId", { preHandler: authenticate }, async (request, reply) => {
    const { userId } = request.user;
    const { runId } = request.params as { runId: string };

    const run = await app.prisma.run.findFirst({
      where: { id: runId, userId },
      include: { workout: true },
    });

    if (!run) return reply.status(404).send({ error: "Run not found" });
    return run;
  });
}
