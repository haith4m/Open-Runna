/**
 * Workout Generator
 *
 * Generates specific workouts for each day of each training week.
 *
 * Core scheduling philosophy:
 *  - Hard/easy alternation — never two hard days back-to-back
 *  - Long run on the athlete's preferred day (usually Saturday/Sunday)
 *  - Key session (tempo/intervals) mid-week, Tuesday or Wednesday
 *  - Easy runs buffer hard sessions
 *  - Rest/cross-train day strategically placed (not after long run)
 *  - In base phase: no intervals; quality is strides and light tempo only
 *
 * Workout sequencing within a week (6-day example):
 *   Mon: Easy/recovery (after Sunday long run)
 *   Tue: Easy + strides (base) | Tempo/Intervals (build/peak)
 *   Wed: Easy
 *   Thu: Quality session #2 (build/peak only)
 *   Fri: Easy or REST
 *   Sat: Easy
 *   Sun: Long run
 */

import { nanoid } from "nanoid";
import type {
  Workout,
  WorkoutStep,
  WorkoutType,
  TrainingPhase,
  DayOfWeek,
} from "@openrunna/shared";
import { computeTrainingPaces } from "@openrunna/pace-calculator";
import type { WeeklyVolume } from "../periodization/volume.js";
import type { PhaseBlock } from "../periodization/macrocycle.js";
import {
  buildEasyRun,
  buildRecoveryRun,
  buildLongRun,
  buildStrideRun,
} from "./easy.js";
import {
  buildTempoRun,
  buildCruiseIntervals,
  buildMarathonPaceRun,
} from "./tempo.js";
import {
  buildVo2maxIntervals,
  buildRepetitions,
  buildHillRepeats,
} from "./intervals.js";
import { buildProgressionRun } from "./progression.js";

export type DaySchedule = {
  dayIndex: number;  // 0=Mon … 6=Sun
  workout: Workout | null;  // null = rest day
};

export interface WeekSchedule {
  weekNumber: number;
  startDate: Date;
  days: DaySchedule[];
  plannedKm: number;
}

// ─── Main Week Builder ────────────────────────────────────────────────────────

export function buildTrainingWeek(params: {
  planId: string;
  weekNumber: number;
  startDate: Date;
  volume: WeeklyVolume;
  phase: PhaseBlock;
  vdot: number;
  trainingDayIndexes: number[];    // 0=Mon…6=Sun
  longRunDayIndex: number;
  targetDistanceMeters: number;
  experienceLevel: "beginner" | "intermediate" | "advanced" | "elite";
}): WeekSchedule {
  const {
    planId, weekNumber, startDate, volume, phase, vdot,
    trainingDayIndexes, longRunDayIndex, experienceLevel,
  } = params;

  const paces = computeTrainingPaces(vdot);
  const isRecovery = volume.isRecovery;
  const isTaper   = volume.isTaper;

  const schedule: DaySchedule[] = Array.from({ length: 7 }, (_, i) => ({
    dayIndex: i,
    workout: null,
  }));

  // Sort training days so we place long run first, then arrange quality/easy
  const sortedDays = [...trainingDayIndexes].sort((a, b) => a - b);

  // Identify key session slots
  const longRunSlot = longRunDayIndex;
  const qualitySlots = pickQualitySlots(sortedDays, longRunSlot, phase.phase, isRecovery);

  // Day budget for runs (km)
  const nonLongKm = volume.targetKm - volume.longRunTargetKm;
  const dayCount = sortedDays.length - 1; // excluding long run day
  const avgEasyKm = dayCount > 0 ? nonLongKm / dayCount : 0;

  let qualityAssigned = 0;

  for (const dayIdx of sortedDays) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + dayIdx);

    if (dayIdx === longRunSlot) {
      schedule[dayIdx]!.workout = buildLongRun({
        planId, weekNumber, dayIndex: dayIdx, date,
        phase: phase.phase, paces,
        targetKm: volume.longRunTargetKm,
        isRecovery, isTaper,
        experienceLevel,
        targetDistanceMeters: params.targetDistanceMeters,
      });
      continue;
    }

    const isQualitySlot = qualitySlots.includes(dayIdx) && !isRecovery;
    const qualityIndex  = qualitySlots.indexOf(dayIdx);

    if (isQualitySlot) {
      const workout = buildQualityWorkout({
        planId, weekNumber, dayIndex: dayIdx, date,
        phase: phase.phase,
        paces,
        qualityIndex,
        qualityKmBudget: volume.qualityDistanceKm / Math.max(1, qualitySlots.length),
        isTaper,
        targetDistanceMeters: params.targetDistanceMeters,
        experienceLevel,
      });
      if (workout) {
        schedule[dayIdx]!.workout = workout;
        qualityAssigned++;
        continue;
      }
    }

    // Easy / recovery run
    const isAfterLongRun = (dayIdx - longRunSlot + 7) % 7 === 1;
    const easyKm = Math.max(4, Math.min(avgEasyKm, isAfterLongRun ? 6 : avgEasyKm));

    schedule[dayIdx]!.workout = isAfterLongRun
      ? buildRecoveryRun({ planId, weekNumber, dayIndex: dayIdx, date, phase: phase.phase, paces, targetKm: easyKm })
      : buildEasyRun({ planId, weekNumber, dayIndex: dayIdx, date, phase: phase.phase, paces, targetKm: easyKm });
  }

  const plannedKm = schedule
    .filter((d) => d.workout)
    .reduce((sum, d) => sum + (d.workout!.totalDistanceMeters / 1000), 0);

  return { weekNumber, startDate, days: schedule, plannedKm };
}

// ─── Quality Workout Selection ────────────────────────────────────────────────

function pickQualitySlots(
  sortedDays: number[],
  longRunDay: number,
  phase: TrainingPhase | string,
  isRecovery: boolean
): number[] {
  if (isRecovery || phase === "base") return [];

  // Exclude the long run day and day immediately after it
  const dayAfterLong = (longRunDay + 1) % 7;
  const eligible = sortedDays.filter(
    (d) => d !== longRunDay && d !== dayAfterLong
  );

  if (eligible.length === 0) return [];

  // 1 quality session in build, 2 in peak
  const count = phase === "peak" ? Math.min(2, Math.floor(eligible.length / 2)) : 1;

  // Space quality sessions as far apart as possible
  if (count === 1) return [eligible[Math.floor(eligible.length / 2)]!];

  // 2 sessions: pick indices 1/4 and 3/4 through eligible
  const i1 = Math.floor(eligible.length * 0.25);
  const i2 = Math.floor(eligible.length * 0.75);
  return [eligible[i1]!, eligible[i2]!];
}

// ─── Quality Workout Router ───────────────────────────────────────────────────

function buildQualityWorkout(params: {
  planId: string;
  weekNumber: number;
  dayIndex: number;
  date: Date;
  phase: string;
  paces: ReturnType<typeof computeTrainingPaces>;
  qualityIndex: number;      // 0 = primary, 1 = secondary
  qualityKmBudget: number;
  isTaper: boolean;
  targetDistanceMeters: number;
  experienceLevel: string;
}): Workout | null {
  const {
    planId, weekNumber, dayIndex, date, phase, paces,
    qualityIndex, qualityKmBudget, isTaper, targetDistanceMeters, experienceLevel,
  } = params;

  const base = { planId, weekNumber, dayIndex, date, paces };

  if (isTaper) {
    // Taper: short tempo or race-pace strides only
    return buildTempoRun({ ...base, phase: "taper", targetKm: Math.min(qualityKmBudget, 8) });
  }

  if (phase === "build") {
    return qualityIndex === 0
      ? buildTempoRun({ ...base, phase, targetKm: qualityKmBudget })
      : buildCruiseIntervals({ ...base, phase, targetKm: qualityKmBudget });
  }

  if (phase === "peak") {
    if (qualityIndex === 0) {
      // Marathon + half: VO2max intervals; 5K/10K: shorter reps
      if (targetDistanceMeters >= 21097) {
        return buildVo2maxIntervals({ ...base, phase, targetKm: qualityKmBudget });
      }
      return buildRepetitions({ ...base, phase, targetKm: qualityKmBudget, repDistanceMeters: targetDistanceMeters <= 10000 ? 400 : 800 });
    }
    // Secondary quality: race-specific marathon pace or threshold
    if (targetDistanceMeters >= 42195) {
      return buildMarathonPaceRun({ ...base, phase, targetKm: qualityKmBudget });
    }
    return buildCruiseIntervals({ ...base, phase, targetKm: qualityKmBudget });
  }

  return buildTempoRun({ ...base, phase, targetKm: qualityKmBudget });
}

// ─── Step Utilities ───────────────────────────────────────────────────────────

export function makeStep(
  overrides: Partial<WorkoutStep> & Pick<WorkoutStep, "type" | "order">
): WorkoutStep {
  return {
    id: nanoid(),
    distanceMeters: undefined,
    durationSeconds: undefined,
    paceZone: undefined,
    targetPaceSecPerKm: undefined,
    targetPaceRangeMin: undefined,
    targetPaceRangeMax: undefined,
    targetHrZone: undefined,
    repeatCount: undefined,
    repeatSteps: undefined,
    description: undefined,
    coachingNote: undefined,
    ...overrides,
  };
}

export function makeWorkout(
  base: Partial<Workout> & Pick<Workout, "type" | "title" | "description" | "coachRationale" | "steps">
): Workout {
  const totalDistance = base.steps
    ? sumStepDistance(base.steps)
    : (base.totalDistanceMeters ?? 0);

  return {
    id: nanoid(),
    planId: base.planId ?? "",
    weekNumber: base.weekNumber ?? 1,
    dayOfWeek: base.dayOfWeek ?? 0,
    scheduledDate: base.scheduledDate ?? new Date().toISOString().split("T")[0]!,
    phase: base.phase ?? "base",
    primaryZone: base.primaryZone ?? "easy",
    intensityScore: base.intensityScore ?? 3,
    status: "scheduled",
    isKeySession: base.isKeySession ?? false,
    isOptional: base.isOptional ?? false,
    estimatedDurationMinutes: base.estimatedDurationMinutes ?? Math.round(totalDistance / 1000 / (6 / 60)),
    ...base,
    totalDistanceMeters: totalDistance,
  };
}

export function sumStepDistance(steps: WorkoutStep[]): number {
  let total = 0;
  for (const step of steps) {
    if (step.repeatCount && step.repeatSteps) {
      total += step.repeatCount * sumStepDistance(step.repeatSteps);
    } else {
      total += step.distanceMeters ?? 0;
    }
  }
  return total;
}
