import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { authenticate } from "../middleware/auth.js";

export async function workoutRoutes(app: FastifyInstance) {
  // ─── Get today's workout ──────────────────────────────────────────────────
  app.get("/today", { preHandler: authenticate }, async (request, reply) => {
    const { userId } = request.user;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const plan = await app.prisma.trainingPlan.findFirst({
      where: { userId, status: "active" },
      select: { id: true },
    });
    if (!plan) return reply.status(404).send({ error: "No active plan" });

    const workout = await app.prisma.workout.findFirst({
      where: {
        week: { planId: plan.id },
        scheduledDate: { gte: today, lt: tomorrow },
      },
    });

    if (!workout) return { message: "Rest day", workout: null };
    return { workout };
  });

  // ─── Get upcoming workouts ────────────────────────────────────────────────
  app.get("/upcoming", { preHandler: authenticate }, async (request) => {
    const { userId } = request.user;
    const q = z.object({ days: z.coerce.number().default(7) }).parse(request.query);

    const plan = await app.prisma.trainingPlan.findFirst({
      where: { userId, status: "active" },
      select: { id: true },
    });
    if (!plan) return [];

    const from = new Date();
    const to = new Date();
    to.setDate(to.getDate() + q.days);

    return app.prisma.workout.findMany({
      where: {
        week: { planId: plan.id },
        scheduledDate: { gte: from, lte: to },
        status: "scheduled",
      },
      orderBy: { scheduledDate: "asc" },
    });
  });

  // ─── Get single workout ───────────────────────────────────────────────────
  app.get("/:workoutId", { preHandler: authenticate }, async (request, reply) => {
    const { userId } = request.user;
    const { workoutId } = request.params as { workoutId: string };

    const workout = await app.prisma.workout.findFirst({
      where: {
        id: workoutId,
        week: { plan: { userId } },
      },
      include: { run: true },
    });

    if (!workout) return reply.status(404).send({ error: "Workout not found" });
    return workout;
  });

  // ─── Mark workout complete / skipped ─────────────────────────────────────
  app.patch("/:workoutId/status", { preHandler: authenticate }, async (request, reply) => {
    const { userId } = request.user;
    const { workoutId } = request.params as { workoutId: string };

    const Schema = z.object({
      status: z.enum(["completed", "skipped"]),
      skippedReason: z.string().optional(),
    });

    const body = Schema.safeParse(request.body);
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() });

    const workout = await app.prisma.workout.findFirst({
      where: { id: workoutId, week: { plan: { userId } } },
    });
    if (!workout) return reply.status(404).send({ error: "Workout not found" });

    const updated = await app.prisma.workout.update({
      where: { id: workoutId },
      data: {
        status: body.data.status,
        completedAt: body.data.status === "completed" ? new Date() : undefined,
        skippedAt: body.data.status === "skipped" ? new Date() : undefined,
        skippedReason: body.data.skippedReason,
      },
    });

    return updated;
  });
}
