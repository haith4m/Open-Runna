/**
 * Background Jobs
 *
 * Runs on a cron-style schedule (called from server.ts via setInterval).
 * Keeps plans healthy without user interaction.
 *
 * Jobs:
 *  1. missedWorkoutScan   — hourly: detect overdue scheduled workouts, trigger adapt
 *  2. fatigueSafetyCheck  — daily:  flag users with TSB < -25, insert recovery week
 *  3. vdotRecalculation   — daily:  update VDOT from recent race-effort runs
 *  4. staleTokenRefresh   — hourly: proactively refresh Strava tokens expiring soon
 */

import type { PrismaClient } from "@prisma/client";
import { adaptPlan } from "@openrunna/training-engine";
import { updatePerformanceMetrics } from "@openrunna/training-engine";
import { computeVdot, computeTrainingPaces } from "@openrunna/pace-calculator";
import { StravaService } from "./integrations.js";

const strava = new StravaService();

// ─── Missed workout detection ─────────────────────────────────────────────────

export async function missedWorkoutScan(prisma: PrismaClient): Promise<void> {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(23, 59, 59, 999);

  // Workouts that were scheduled for any day up to yesterday, still "scheduled"
  const overdueWorkouts = await prisma.workout.findMany({
    where: {
      status: "scheduled",
      scheduledDate: { lt: yesterday },
    },
    include: {
      week: {
        include: {
          plan: {
            select: {
              id: true,
              userId: true,
              status: true,
              weeks: { include: { workouts: true } },
              targetDistance: true,
              raceDate: true,
              experienceLevel: true,
              currentWeeklyKm: true,
              peakWeeklyKm: true,
              thresholdPaceSecPerKm: true,
              easyPaceSecPerKm: true,
              marathonPaceSecPerKm: true,
              intervalPaceSecPerKm: true,
              repetitionPaceSecPerKm: true,
              recoveryPaceSecPerKm: true,
              startDate: true,
            },
          },
        },
      },
    },
    take: 200,
  });

  // Group by plan to avoid redundant adaptations
  const planIds = new Set<string>();

  for (const workout of overdueWorkouts) {
    const plan = workout.week.plan;
    if (plan.status !== "active") continue;
    if (planIds.has(plan.id)) continue;
    planIds.add(plan.id);

    // Determine if the workout type is a "key session" (quality work)
    const isKeySession = [
      "tempo_run", "cruise_intervals", "vo2max_intervals",
      "repetitions", "hill_repeats", "marathon_pace_run",
    ].includes(workout.type);

    // Build a minimal plan snapshot compatible with adaptPlan
    const planSnapshot = buildPlanSnapshot(plan);

    const adapted = adaptPlan(planSnapshot, {
      trigger: "workout_missed",
      workoutId: workout.id,
      isKeySession,
      missedDate: workout.scheduledDate,
    });

    // Persist adaptation log
    await prisma.planAdaptation.create({
      data: {
        planId: plan.id,
        trigger: "workout_missed",
        description: `Auto-detected missed ${workout.type} on ${workout.scheduledDate.toDateString()}`,
        appliedAt: now,
      },
    });

    // Mark the workout as skipped only if it's not a key session
    // (key sessions are rescheduled by adaptPlan — we don't change them here)
    if (!isKeySession) {
      await prisma.workout.update({
        where: { id: workout.id },
        data: { status: "skipped" },
      });
    }

    // Re-persist rescheduled workouts from adaptation result
    for (const adaptedWeek of adapted.weeks) {
      for (const adaptedWorkout of adaptedWeek.workouts) {
        if (adaptedWorkout.id === workout.id && adaptedWorkout.scheduledDate) {
          await prisma.workout.update({
            where: { id: workout.id },
            data: {
              scheduledDate: adaptedWorkout.scheduledDate,
              status: "scheduled",
            },
          });
        }
      }
    }
  }
}

// ─── Fatigue safety check ─────────────────────────────────────────────────────

export async function fatigueSafetyCheck(prisma: PrismaClient): Promise<void> {
  const users = await prisma.user.findMany({
    where: { plans: { some: { status: "active" } } },
    select: { id: true },
  });

  for (const user of users) {
    // Reconstruct last 60 days of TSS to get current CTL/ATL
    const since = new Date();
    since.setDate(since.getDate() - 60);

    const runs = await prisma.run.findMany({
      where: { userId: user.id, startedAt: { gte: since }, status: "completed" },
      orderBy: { startedAt: "asc" },
      select: { startedAt: true, trainingLoad: true },
    });

    let metrics = { ctl: 30, atl: 30, tsb: 0 }; // sensible defaults
    for (const run of runs) {
      metrics = updatePerformanceMetrics(metrics, run.trainingLoad);
    }

    const tsb = metrics.tsb;

    if (tsb >= -25) continue; // athlete is fine

    // Too much fatigue — find the active plan and insert recovery
    const activePlan = await prisma.trainingPlan.findFirst({
      where: { userId: user.id, status: "active" },
      include: {
        weeks: { include: { workouts: true } },
      },
    });
    if (!activePlan) continue;

    const alreadyAdaptedToday = await prisma.planAdaptation.findFirst({
      where: {
        planId: activePlan.id,
        trigger: "fatigue_high",
        appliedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    });
    if (alreadyAdaptedToday) continue;

    const planSnapshot = buildPlanSnapshot(activePlan);
    adaptPlan(planSnapshot, { trigger: "fatigue_high", tsb });

    await prisma.planAdaptation.create({
      data: {
        planId: activePlan.id,
        trigger: "fatigue_high",
        description: `TSB dropped to ${Math.round(tsb)}. Recovery inserted automatically.`,
        appliedAt: new Date(),
      },
    });

    // Swap next quality session to recovery run
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const nextWeek = new Date(tomorrow);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const nextHardWorkout = await prisma.workout.findFirst({
      where: {
        week: { planId: activePlan.id },
        scheduledDate: { gte: tomorrow, lt: nextWeek },
        status: "scheduled",
        type: {
          in: [
            "tempo_run", "cruise_intervals", "vo2max_intervals",
            "repetitions", "hill_repeats",
          ],
        },
      },
      orderBy: { scheduledDate: "asc" },
    });

    if (nextHardWorkout) {
      await prisma.workout.update({
        where: { id: nextHardWorkout.id },
        data: { type: "recovery_run", name: "Recovery Run (auto — high fatigue)" },
      });
    }
  }
}

// ─── VDOT recalculation ───────────────────────────────────────────────────────

export async function vdotRecalculation(prisma: PrismaClient): Promise<void> {
  // Look for runs in the last 90 days that look like race efforts:
  // high compliance score (≥ 0.95) on a vo2max or repetition session, OR
  // any run explicitly tagged with a race-level perceived effort (8–10)
  const since = new Date();
  since.setDate(since.getDate() - 90);

  const users = await prisma.user.findMany({
    where: { plans: { some: { status: "active" } } },
    select: { id: true },
  });

  for (const user of users) {
    const raceEffortRuns = await prisma.run.findMany({
      where: {
        userId: user.id,
        startedAt: { gte: since },
        status: "completed",
        OR: [
          { perceivedEffort: { gte: 8 }, totalDistanceMeters: { gte: 3000 } },
          {
            complianceScore: { gte: 0.95 },
            workout: { type: { in: ["vo2max_intervals", "repetitions"] } },
            totalDistanceMeters: { gte: 3000 },
          },
        ],
      },
      orderBy: { startedAt: "desc" },
      take: 5,
      select: {
        totalDistanceMeters: true,
        durationSeconds: true,
        averagePaceSecPerKm: true,
        startedAt: true,
      },
    });

    if (!raceEffortRuns.length) continue;

    // Pick the best VDOT from recent race-effort runs
    let bestVdot = 0;
    for (const run of raceEffortRuns) {
      if (!run.averagePaceSecPerKm || run.totalDistanceMeters < 1000) continue;
      // Adjust duration to represent a flat-effort full distance at that pace
      const estimatedRaceSeconds = (run.averagePaceSecPerKm / 1000) * run.totalDistanceMeters;
      const v = computeVdot(run.totalDistanceMeters, estimatedRaceSeconds);
      if (v > bestVdot) bestVdot = v;
    }

    if (bestVdot < 20) continue; // sanity check

    const profile = await prisma.athleteProfile.findUnique({ where: { userId: user.id } });
    if (!profile || !profile.vdot) continue;

    // Only update if the new VDOT is meaningfully better (≥ 0.5 points)
    const currentVdot = profile.vdot as number;
    if (bestVdot - currentVdot < 0.5) continue;

    const newVdot = Math.min(bestVdot, currentVdot + 2.0); // cap single jump at 2 points
    const paces = computeTrainingPaces(newVdot);

    await prisma.athleteProfile.update({
      where: { userId: user.id },
      data: { vdot: newVdot, vdotConfidence: Math.min(1.0, (profile.vdotConfidence as number ?? 0.5) + 0.1) },
    });

    // Update active plan's pace anchors
    await prisma.trainingPlan.updateMany({
      where: { userId: user.id, status: "active" },
      data: {
        easyPaceSecPerKm: Math.round((paces.easy.min + paces.easy.max) / 2),
        marathonPaceSecPerKm: Math.round((paces.marathon.min + paces.marathon.max) / 2),
        thresholdPaceSecPerKm: Math.round((paces.threshold.min + paces.threshold.max) / 2),
        intervalPaceSecPerKm: Math.round((paces.interval.min + paces.interval.max) / 2),
        repetitionPaceSecPerKm: Math.round((paces.repetition.min + paces.repetition.max) / 2),
        recoveryPaceSecPerKm: Math.round((paces.recovery.min + paces.recovery.max) / 2),
      },
    });

    await prisma.planAdaptation.create({
      data: {
        planId: (await prisma.trainingPlan.findFirst({ where: { userId: user.id, status: "active" }, select: { id: true } }))!.id,
        trigger: "performance_better_than_expected",
        description: `VDOT updated ${currentVdot.toFixed(1)} → ${newVdot.toFixed(1)}. Training paces recalculated.`,
        appliedAt: new Date(),
      },
    });
  }
}

// ─── Stale Strava token refresh ───────────────────────────────────────────────

export async function stravaTokenRefresh(prisma: PrismaClient): Promise<void> {
  const soon = new Date();
  soon.setMinutes(soon.getMinutes() + 30); // tokens expiring in next 30 min

  const expiring = await prisma.wearableConnection.findMany({
    where: {
      source: "strava",
      connected: true,
      refreshToken: { not: null },
      tokenExpiresAt: { lte: soon },
    },
  });

  for (const conn of expiring) {
    try {
      const refreshed = await strava.refreshTokens(conn.refreshToken!);
      await prisma.wearableConnection.update({
        where: { id: conn.id },
        data: {
          accessToken: refreshed.accessToken,
          refreshToken: refreshed.refreshToken,
          tokenExpiresAt: new Date(refreshed.expiresAt * 1000),
        },
      });
    } catch {
      // Token may have been revoked — mark as disconnected
      await prisma.wearableConnection.update({
        where: { id: conn.id },
        data: { connected: false },
      });
    }
  }
}

// ─── Scheduler ───────────────────────────────────────────────────────────────

export function startBackgroundJobs(prisma: PrismaClient): void {
  const HOUR_MS = 60 * 60 * 1000;
  const DAY_MS  = 24 * HOUR_MS;

  // Hourly
  setInterval(() => void missedWorkoutScan(prisma).catch(console.error), HOUR_MS);
  setInterval(() => void stravaTokenRefresh(prisma).catch(console.error), HOUR_MS);

  // Daily (offset to avoid all jobs firing simultaneously)
  setInterval(() => void fatigueSafetyCheck(prisma).catch(console.error), DAY_MS);
  setTimeout(() => {
    setInterval(() => void vdotRecalculation(prisma).catch(console.error), DAY_MS);
    void vdotRecalculation(prisma).catch(console.error);
  }, 5 * 60 * 1000); // start VDOT recalc 5 min after boot

  // Run immediately on start
  void missedWorkoutScan(prisma).catch(console.error);
  void stravaTokenRefresh(prisma).catch(console.error);
  void fatigueSafetyCheck(prisma).catch(console.error);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildPlanSnapshot(plan: any) {
  return {
    id: plan.id,
    userId: plan.userId,
    status: plan.status,
    targetRaceDistance: plan.targetDistance,
    targetRaceDate: plan.raceDate,
    experienceLevel: plan.experienceLevel,
    currentWeeklyKm: plan.currentWeeklyKm,
    peakWeeklyKm: plan.peakWeeklyKm,
    paces: {
      threshold: plan.thresholdPaceSecPerKm,
      easy: plan.easyPaceSecPerKm,
      marathon: plan.marathonPaceSecPerKm,
      interval: plan.intervalPaceSecPerKm,
      repetition: plan.repetitionPaceSecPerKm,
      recovery: plan.recoveryPaceSecPerKm,
    },
    startDate: plan.startDate,
    weeks: (plan.weeks ?? []).map((w: any) => ({
      id: w.id,
      weekNumber: w.weekNumber,
      phase: w.phase,
      targetWeeklyKm: w.targetWeeklyKm,
      workouts: (w.workouts ?? []).map((wo: any) => ({
        id: wo.id,
        type: wo.type,
        scheduledDate: wo.scheduledDate,
        status: wo.status,
        totalDistanceMeters: wo.totalDistanceMeters,
        steps: wo.steps,
      })),
    })),
  };
}
