import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { authenticate } from "../middleware/auth.js";
import { computeWeightedVdot } from "@openrunna/pace-calculator";

export async function profileRoutes(app: FastifyInstance) {
  // ─── GET profile ──────────────────────────────────────────────────────────
  app.get("/", { preHandler: authenticate }, async (request, reply) => {
    const { userId } = request.user;
    const profile = await app.prisma.athleteProfile.findUnique({
      where: { userId },
      include: { injuries: true },
    });
    if (!profile) return reply.status(404).send({ error: "Profile not found" });
    return profile;
  });

  // ─── UPSERT profile (onboarding + settings) ───────────────────────────────
  app.put("/", { preHandler: authenticate }, async (request, reply) => {
    const { userId } = request.user;

    const Schema = z.object({
      experienceLevel: z.enum(["beginner", "intermediate", "advanced", "elite"]).optional(),
      weeklyMileageKm: z.number().min(0).max(500).optional(),
      longestRecentRunKm: z.number().min(0).max(200).optional(),
      yearsRunning: z.number().min(0).max(50).optional(),
      availableTrainingDays: z.array(z.string()).min(3).max(7).optional(),
      preferredLongRunDay: z.string().optional(),
      maxRunDurationMinutes: z.number().min(20).max(600).optional(),
      hasTreadmillAccess: z.boolean().optional(),
      hasGymAccess: z.boolean().optional(),
      doesStrengthTraining: z.boolean().optional(),
      sleepQuality: z.enum(["poor", "fair", "good", "excellent"]).optional(),
      stressLevel: z.enum(["low", "moderate", "high", "very_high"]).optional(),
      primaryDevice: z.string().optional(),
      preferMetric: z.boolean().optional(),
      weightKg: z.number().optional(),
      heightCm: z.number().optional(),
      dateOfBirth: z.string().optional(),
      gender: z.string().optional(),
      maxHeartRate: z.number().optional(),
      restingHeartRate: z.number().optional(),
    });

    const body = Schema.safeParse(request.body);
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() });

    const profile = await app.prisma.athleteProfile.upsert({
      where: { userId },
      create: { userId, ...body.data },
      update: body.data,
    });

    return profile;
  });

  // ─── Recalculate VDOT from race history ──────────────────────────────────
  app.post("/recalculate-vdot", { preHandler: authenticate }, async (request) => {
    const { userId } = request.user;

    const races = await app.prisma.racePerformance.findMany({
      where: { userId },
      orderBy: { racedAt: "desc" },
      take: 10,
    });

    if (races.length === 0) {
      return { message: "No race data to calculate from" };
    }

    const { vdot, confidence } = computeWeightedVdot(
      races.map((r) => ({
        distanceMeters: r.customDistanceMeters ?? getDistanceMeters(r.distance),
        finishTimeSeconds: r.finishTimeSeconds,
        date: new Date(r.racedAt),
        courseType: r.courseType as "road" | "trail" | "track",
        elevationGainMeters: r.elevationGainMeters ?? undefined,
      }))
    );

    await app.prisma.athleteProfile.update({
      where: { userId },
      data: { vdot, vdotConfidence: confidence },
    });

    return { vdot, confidence };
  });

  // ─── Log injury ───────────────────────────────────────────────────────────
  app.post("/injuries", { preHandler: authenticate }, async (request, reply) => {
    const { userId } = request.user;

    const Schema = z.object({
      location: z.string(),
      description: z.string().optional(),
      severity: z.union([z.literal(1), z.literal(2), z.literal(3)]),
      causedBy: z.string().optional(),
    });

    const body = Schema.safeParse(request.body);
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() });

    const profile = await app.prisma.athleteProfile.findUnique({ where: { userId } });
    if (!profile) return reply.status(404).send({ error: "Profile not found" });

    const injury = await app.prisma.injuryRecord.create({
      data: {
        profileId: profile.id,
        occurredAt: new Date(),
        isActive: true,
        ...body.data,
      },
    });

    // Update injury risk score
    const activeInjuries = await app.prisma.injuryRecord.findMany({
      where: { profileId: profile.id, isActive: true },
    });
    const riskScore = Math.min(10, activeInjuries.reduce((s, i) => s + i.severity * 2, 0));
    await app.prisma.athleteProfile.update({
      where: { id: profile.id },
      data: { injuryRiskScore: riskScore },
    });

    return reply.status(201).send(injury);
  });
}

function getDistanceMeters(distanceKey: string): number {
  const map: Record<string, number> = {
    "5k": 5000, "10k": 10000, half_marathon: 21097.5, marathon: 42195,
  };
  return map[distanceKey] ?? 5000;
}
