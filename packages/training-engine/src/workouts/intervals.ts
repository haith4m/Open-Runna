/**
 * VO2max Interval & Speed Repetition Workout Builders
 *
 * VO2max Intervals (I pace):
 *  - Goal: maximise time spent at VO2max
 *  - Duration per rep: 3–5 minutes (shorter → not enough time at VO2max)
 *  - Recovery: equal time jogging (1:1 work:rest ratio)
 *  - Total I-pace volume per session: 4–10% of weekly mileage, capped at 8 km
 *  - Physiological effect: raises VO2max ceiling
 *
 * Speed Repetitions (R pace):
 *  - Goal: improve running economy and speed
 *  - Duration per rep: 30 sec – 2 minutes
 *  - Recovery: 2–3× work time (full recovery, not partial)
 *  - Total R-pace volume per session: 5% of weekly mileage, capped at 5 km
 *  - Physiological effect: better neuromuscular efficiency, faster max speed
 *
 * Hill Repeats:
 *  - Strong, short efforts uphill with easy jog down
 *  - Builds running-specific strength and power without the eccentric stress
 *    of flat-road speed work (injury-prevention friendly)
 */

import type { Workout, WorkoutStep } from "@openrunna/shared";
import type { VdotPaces } from "@openrunna/pace-calculator";
import { makeWorkout, makeStep } from "./generator.js";

interface BaseParams {
  planId: string;
  weekNumber: number;
  dayIndex: number;
  date: Date;
  phase: string;
  paces: VdotPaces;
  targetKm: number;
}

// ─── VO2max Intervals ─────────────────────────────────────────────────────────

export function buildVo2maxIntervals(p: BaseParams): Workout {
  const warmupKm  = 2.5;
  const cooldownKm = 1.5;

  // Rep structure: 800m–1200m repeats at interval pace
  // Chose 800m for clarity; can be 1000m in later build weeks
  const repMeters = 800;
  const recoveryMeters = 800; // 1:1 work:recovery distance

  const intervalBudgetKm = Math.max(3.2, p.targetKm - warmupKm - cooldownKm);
  const repCount = Math.max(4, Math.min(8,
    Math.floor((intervalBudgetKm * 1000) / (repMeters + recoveryMeters))
  ));

  const repSteps: WorkoutStep[] = [
    makeStep({
      type: "steady",
      order: 0,
      distanceMeters: repMeters,
      paceZone: "interval",
      targetPaceRangeMin: p.paces.interval.fastSecPerKm,
      targetPaceRangeMax: p.paces.interval.slowSecPerKm,
      description: `${repMeters}m @ interval pace`,
      coachingNote: "This is hard but controlled — not an all-out sprint. Maintain form throughout.",
    }),
    makeStep({
      type: "jog_recovery",
      order: 1,
      distanceMeters: recoveryMeters,
      paceZone: "recovery",
      description: `${recoveryMeters}m easy jog recovery`,
      coachingNote: "Recover enough to hit the next rep at the same pace. If you're slowing significantly each rep, you started too fast.",
    }),
  ];

  const steps: WorkoutStep[] = [
    makeStep({
      type: "warmup",
      order: 0,
      distanceMeters: Math.round(warmupKm * 1000),
      paceZone: "easy",
      description: `${warmupKm} km warm-up — include 4 × 100m strides in final km`,
      coachingNote: "The warm-up is non-negotiable for VO2max work. Your heart rate needs to be elevated before the first rep.",
    }),
    makeStep({
      type: "repeat_set",
      order: 1,
      repeatCount: repCount,
      repeatSteps: repSteps,
      description: `${repCount} × ${repMeters}m @ interval pace with ${recoveryMeters}m jog recovery`,
    }),
    makeStep({
      type: "cooldown",
      order: 2,
      distanceMeters: Math.round(cooldownKm * 1000),
      paceZone: "easy",
      description: `${cooldownKm} km easy cool-down`,
    }),
  ];

  const totalMeters =
    Math.round(warmupKm * 1000) +
    repCount * (repMeters + recoveryMeters) +
    Math.round(cooldownKm * 1000);

  const intervalPaceAvgSecPerKm = p.paces.interval.midpointSecPerKm;
  const easyPaceAvgSecPerKm = p.paces.easy.midpointSecPerKm;

  const estimatedMinutes = Math.round(
    warmupKm * (easyPaceAvgSecPerKm / 60) +
    repCount * (repMeters / 1000) * (intervalPaceAvgSecPerKm / 60) +
    repCount * (recoveryMeters / 1000) * (p.paces.recovery.midpointSecPerKm / 60) +
    cooldownKm * (easyPaceAvgSecPerKm / 60)
  );

  return makeWorkout({
    planId: p.planId,
    weekNumber: p.weekNumber,
    dayOfWeek: p.dayIndex,
    scheduledDate: p.date.toISOString().split("T")[0]!,
    type: "intervals",
    phase: p.phase as any,
    title: `VO2max Intervals — ${repCount} × ${repMeters}m`,
    description: `${warmupKm} km warm-up, then ${repCount} × ${repMeters}m at interval pace with ${recoveryMeters}m jog recovery, ${cooldownKm} km cool-down.`,
    coachRationale: "VO2max intervals raise your aerobic ceiling — the highest sustained rate of oxygen consumption your body can achieve. This is the physiological limiter for 5K–10K and a key component for half and full marathon performance.",
    steps,
    totalDistanceMeters: totalMeters,
    estimatedDurationMinutes: estimatedMinutes,
    primaryZone: "interval",
    intensityScore: 9,
    isKeySession: true,
    isOptional: false,
  });
}

// ─── Speed Repetitions ────────────────────────────────────────────────────────

export function buildRepetitions(p: BaseParams & { repDistanceMeters: number }): Workout {
  const warmupKm  = 2;
  const cooldownKm = 1.5;
  const repMeters = p.repDistanceMeters;

  // Full rest between reps (2–3× work time in terms of distance)
  const recoveryMeters = repMeters * 2;

  const repCount = Math.max(4, Math.min(10,
    Math.floor((p.targetKm * 1000 * 0.5) / repMeters)
  ));

  const repSteps: WorkoutStep[] = [
    makeStep({
      type: "steady",
      order: 0,
      distanceMeters: repMeters,
      paceZone: "repetition",
      targetPaceRangeMin: p.paces.repetition.fastSecPerKm,
      targetPaceRangeMax: p.paces.repetition.slowSecPerKm,
      description: `${repMeters}m @ repetition pace`,
      coachingNote: "Each rep should feel fast but controlled. Focus on form: tall posture, quick cadence, relaxed shoulders.",
    }),
    makeStep({
      type: "rest",
      order: 1,
      distanceMeters: recoveryMeters,
      paceZone: "recovery",
      description: `${recoveryMeters}m walk/jog full recovery`,
      coachingNote: "Full recovery here — this is speed work, not fitness work. Take as much time as you need to feel ready for the next rep.",
    }),
  ];

  const steps: WorkoutStep[] = [
    makeStep({
      type: "warmup",
      order: 0,
      distanceMeters: Math.round(warmupKm * 1000),
      paceZone: "easy",
      description: `${warmupKm} km warm-up with 4 × 100m strides`,
    }),
    makeStep({
      type: "repeat_set",
      order: 1,
      repeatCount: repCount,
      repeatSteps: repSteps,
      description: `${repCount} × ${repMeters}m fast with full recovery`,
    }),
    makeStep({
      type: "cooldown",
      order: 2,
      distanceMeters: Math.round(cooldownKm * 1000),
      paceZone: "easy",
      description: `${cooldownKm} km easy cool-down`,
    }),
  ];

  const totalMeters =
    Math.round(warmupKm * 1000) +
    repCount * (repMeters + recoveryMeters) +
    Math.round(cooldownKm * 1000);

  return makeWorkout({
    planId: p.planId,
    weekNumber: p.weekNumber,
    dayOfWeek: p.dayIndex,
    scheduledDate: p.date.toISOString().split("T")[0]!,
    type: "repetitions",
    phase: p.phase as any,
    title: `Speed Reps — ${repCount} × ${repMeters}m`,
    description: `${warmupKm} km warm-up, then ${repCount} × ${repMeters}m at repetition pace with full recovery, ${cooldownKm} km cool-down.`,
    coachRationale: "Repetition training improves running economy — how efficiently you use oxygen at any given pace — making every other pace feel easier. The full recovery is intentional: this is neuromuscular quality work, not a fitness grind.",
    steps,
    totalDistanceMeters: totalMeters,
    estimatedDurationMinutes: Math.round(totalMeters / 1000 * (p.paces.easy.midpointSecPerKm / 60) * 1.5),
    primaryZone: "repetition",
    intensityScore: 8,
    isKeySession: true,
    isOptional: false,
  });
}

// ─── Hill Repeats ─────────────────────────────────────────────────────────────

export function buildHillRepeats(p: BaseParams): Workout {
  const warmupKm  = 2;
  const cooldownKm = 1.5;
  const repCount = 8;
  const hillDurationSeconds = 60; // ~200–300m uphill

  const repSteps: WorkoutStep[] = [
    makeStep({
      type: "steady",
      order: 0,
      durationSeconds: hillDurationSeconds,
      paceZone: "interval",
      description: `60 s strong uphill effort`,
      coachingNote: "Drive your arms, shorten your stride, lean forward slightly from the ankles. This is hard effort — 8/10.",
    }),
    makeStep({
      type: "jog_recovery",
      order: 1,
      durationSeconds: hillDurationSeconds * 1.5,
      paceZone: "recovery",
      description: "Walk/jog back down (90 s recovery)",
    }),
  ];

  const steps: WorkoutStep[] = [
    makeStep({
      type: "warmup",
      order: 0,
      distanceMeters: Math.round(warmupKm * 1000),
      paceZone: "easy",
      description: `${warmupKm} km easy warm-up`,
    }),
    makeStep({
      type: "repeat_set",
      order: 1,
      repeatCount: repCount,
      repeatSteps: repSteps,
      description: `${repCount} × 60 s hill repeats with jog-down recovery`,
    }),
    makeStep({
      type: "cooldown",
      order: 2,
      distanceMeters: Math.round(cooldownKm * 1000),
      paceZone: "easy",
      description: `${cooldownKm} km easy cool-down`,
    }),
  ];

  const totalMeters = Math.round((warmupKm + cooldownKm) * 1000) + repCount * 250;

  return makeWorkout({
    planId: p.planId,
    weekNumber: p.weekNumber,
    dayOfWeek: p.dayIndex,
    scheduledDate: p.date.toISOString().split("T")[0]!,
    type: "hill_repeats",
    phase: p.phase as any,
    title: `Hill Repeats — ${repCount} × 60 s`,
    description: `${warmupKm} km warm-up, then ${repCount} × 60 s strong uphill with jog-down recovery, ${cooldownKm} km cool-down.`,
    coachRationale: "Hill repeats build running-specific leg strength and power with minimal injury risk (no eccentric overload on flat hard surfaces). They also improve VO2max, cadence, and form.",
    steps,
    totalDistanceMeters: totalMeters,
    estimatedDurationMinutes: Math.round(warmupKm * 6 + repCount * 4 + cooldownKm * 6),
    primaryZone: "interval",
    intensityScore: 8,
    isKeySession: true,
    isOptional: false,
  });
}
