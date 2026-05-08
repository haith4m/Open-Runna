import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { authenticate } from "../middleware/auth.js";
import { computeVdot, predictRaceTimeForDistance } from "@openrunna/pace-calculator";

export async function analyticsRoutes(app: FastifyInstance) {
  // ─── Weekly mileage trend ─────────────────────────────────────────────────
  app.get("/weekly-mileage", { preHandler: authenticate }, async (request) => {
    const { userId } = request.user;
    const q = z.object({ weeks: z.coerce.number().default(12) }).parse(request.query);

    const since = new Date();
    since.setDate(since.getDate() - q.weeks * 7);

    const runs = await app.prisma.run.findMany({
      where: { userId, status: "completed", startedAt: { gte: since } },
      select: { startedAt: true, totalDistanceMeters: true, trainingLoad: true },
      orderBy: { startedAt: "asc" },
    });

    // Group by ISO week
    const byWeek = new Map<string, { km: number; tss: number; count: number }>();

    for (const run of runs) {
      const weekKey = getIsoWeek(new Date(run.startedAt));
      const existing = byWeek.get(weekKey) ?? { km: 0, tss: 0, count: 0 };
      existing.km += run.totalDistanceMeters / 1000;
      existing.tss += run.trainingLoad;
      existing.count++;
      byWeek.set(weekKey, existing);
    }

    // Also get planned mileage from plan
    const plan = await app.prisma.trainingPlan.findFirst({
      where: { userId, status: "active" },
      include: {
        weeks: {
          where: { startDate: { gte: since } },
          select: { startDate: true, plannedDistanceKm: true, weekNumber: true },
        },
      },
    });

    const weeks = Array.from(byWeek.entries()).map(([week, data]) => ({
      week,
      actualKm: Math.round(data.km * 10) / 10,
      tss: Math.round(data.tss),
      runCount: data.count,
      plannedKm: plan?.weeks.find(
        (w) => getIsoWeek(new Date(w.startDate)) === week
      )?.plannedDistanceKm ?? null,
    }));

    return { weeks };
  });

  // ─── Pace progression ─────────────────────────────────────────────────────
  app.get("/pace-progression", { preHandler: authenticate }, async (request) => {
    const { userId } = request.user;
    const q = z.object({ days: z.coerce.number().default(90) }).parse(request.query);

    const since = new Date();
    since.setDate(since.getDate() - q.days);

    const runs = await app.prisma.run.findMany({
      where: {
        userId, status: "completed",
        startedAt: { gte: since },
        totalDistanceMeters: { gte: 3000 }, // exclude very short runs
        averagePaceSecPerKm: { not: null },
      },
      select: {
        startedAt: true, totalDistanceMeters: true,
        averagePaceSecPerKm: true, trainingLoad: true,
      },
      orderBy: { startedAt: "asc" },
    });

    return runs.map((r) => ({
      date: r.startedAt,
      distanceKm: Math.round(r.totalDistanceMeters / 10) / 100,
      avgPaceSecPerKm: r.averagePaceSecPerKm,
      trainingLoad: r.trainingLoad,
    }));
  });

  // ─── Fitness score (VDOT trend) ───────────────────────────────────────────
  app.get("/fitness-trend", { preHandler: authenticate }, async (request) => {
    const { userId } = request.user;

    const [profile, races] = await Promise.all([
      app.prisma.athleteProfile.findUnique({
        where: { userId },
        select: { vdot: true, vdotConfidence: true },
      }),
      app.prisma.racePerformance.findMany({
        where: { userId },
        orderBy: { racedAt: "asc" },
        select: { racedAt: true, distance: true, finishTimeSeconds: true, customDistanceMeters: true },
      }),
    ]);

    const distanceMap: Record<string, number> = {
      "5k": 5000, "10k": 10000, half_marathon: 21097.5, marathon: 42195,
    };

    const vdotHistory = races
      .filter((r) => r.distance in distanceMap || r.customDistanceMeters)
      .map((r) => ({
        date: r.racedAt,
        vdot: computeVdot(
          r.customDistanceMeters ?? distanceMap[r.distance] ?? 5000,
          r.finishTimeSeconds
        ),
      }));

    return {
      currentVdot: profile?.vdot,
      confidence: profile?.vdotConfidence,
      history: vdotHistory,
    };
  });

  // ─── Race predictions ─────────────────────────────────────────────────────
  app.get("/race-predictions", { preHandler: authenticate }, async (request) => {
    const { userId } = request.user;

    const profile = await app.prisma.athleteProfile.findUnique({
      where: { userId },
      select: { vdot: true },
    });

    if (!profile?.vdot) return { predictions: [], message: "No VDOT data yet" };

    const distances = ["5k", "10k", "half_marathon", "marathon"] as const;
    const predictions = distances.map((d) => ({
      distance: d,
      predictedSeconds: Math.round(
        predictRaceTimeForDistance(profile.vdot!, d)
      ),
    }));

    return { predictions, vdot: profile.vdot };
  });

  // ─── Training load (CTL/ATL/TSB) ──────────────────────────────────────────
  app.get("/training-load", { preHandler: authenticate }, async (request) => {
    const { userId } = request.user;
    const q = z.object({ days: z.coerce.number().default(90) }).parse(request.query);

    const since = new Date();
    since.setDate(since.getDate() - q.days);

    const runs = await app.prisma.run.findMany({
      where: { userId, status: "completed", startedAt: { gte: since } },
      select: { startedAt: true, trainingLoad: true },
      orderBy: { startedAt: "asc" },
    });

    // Build daily TSS array
    const dailyTss = new Map<string, number>();
    for (const run of runs) {
      const d = new Date(run.startedAt).toISOString().split("T")[0]!;
      dailyTss.set(d, (dailyTss.get(d) ?? 0) + run.trainingLoad);
    }

    // Compute CTL/ATL rolling
    let ctl = 0;
    let atl = 0;
    const ctlDecay = 1 - Math.exp(-1 / 42);
    const atlDecay = 1 - Math.exp(-1 / 7);

    const timeline = [];
    const start = new Date(since);
    const now = new Date();

    for (let d = new Date(start); d <= now; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().split("T")[0]!;
      const tss = dailyTss.get(key) ?? 0;
      ctl = ctl + (tss - ctl) * ctlDecay;
      atl = atl + (tss - atl) * atlDecay;
      timeline.push({
        date: key,
        tss,
        ctl: Math.round(ctl * 10) / 10,
        atl: Math.round(atl * 10) / 10,
        tsb: Math.round((ctl - atl) * 10) / 10,
      });
    }

    return { timeline };
  });

  // ─── Consistency score ────────────────────────────────────────────────────
  app.get("/consistency", { preHandler: authenticate }, async (request) => {
    const { userId } = request.user;

    const plan = await app.prisma.trainingPlan.findFirst({
      where: { userId, status: "active" },
      include: {
        weeks: {
          where: { startDate: { lte: new Date() } },
          include: {
            workouts: {
              where: {
                scheduledDate: { lte: new Date() },
                isOptional: false,
              },
              select: { status: true, isKeySession: true },
            },
          },
        },
      },
    });

    if (!plan) return { score: null };

    let total = 0;
    let completed = 0;
    let keyTotal = 0;
    let keyCompleted = 0;

    for (const week of plan.weeks) {
      for (const workout of week.workouts) {
        total++;
        if (workout.status === "completed") completed++;
        if (workout.isKeySession) {
          keyTotal++;
          if (workout.status === "completed") keyCompleted++;
        }
      }
    }

    return {
      overallScore: total > 0 ? Math.round((completed / total) * 100) : null,
      keySessionScore: keyTotal > 0 ? Math.round((keyCompleted / keyTotal) * 100) : null,
      completedSessions: completed,
      totalSessions: total,
    };
  });
}

function getIsoWeek(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum = 1 + Math.round(
    ((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7
  );
  return `${d.getFullYear()}-W${weekNum.toString().padStart(2, "0")}`;
}
