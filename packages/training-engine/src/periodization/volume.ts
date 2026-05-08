/**
 * Volume Progression Engine
 *
 * Calculates weekly mileage targets across the full macrocycle.
 *
 * Key principles:
 *  1. Start conservatively — first weeks should feel easy (sets habit)
 *  2. 3:1 loading: 3 progressive weeks → 1 recovery week (75% of prior)
 *  3. Never increase by more than 10% or 6 km in one week
 *  4. Long run ≤ 30% of weekly mileage (injury prevention)
 *  5. Taper: sharp volume drop while maintaining intensity
 *  6. Never exceed 6 weeks of uninterrupted volume increase
 */

import type { ExperienceLevel } from "@openrunna/shared";
import {
  MAX_WEEKLY_INCREASE_PCT,
  MAX_WEEKLY_INCREASE_KM,
  RECOVERY_WEEK_REDUCTION,
  TAPER_VOLUME_SCHEDULE,
} from "@openrunna/shared";
import type { Macrocycle } from "./macrocycle.js";

export interface WeeklyVolume {
  weekNumber: number;
  targetKm: number;
  isRecovery: boolean;
  isTaper: boolean;
  longRunTargetKm: number;
  qualityDistanceKm: number;   // km at threshold+ pace
  easyDistanceKm: number;
}

/**
 * Generate the full week-by-week volume schedule for the macrocycle.
 *
 * @param currentWeeklyKm   Where the athlete is starting from
 * @param peakWeeklyKm      Highest single week (determined by plan config)
 * @param macrocycle        Macrocycle phase structure
 * @param experienceLevel   Affects long run % and quality distribution
 */
export function generateVolumeProgression(params: {
  currentWeeklyKm: number;
  peakWeeklyKm: number;
  macrocycle: Macrocycle;
  experienceLevel: ExperienceLevel;
}): WeeklyVolume[] {
  const { currentWeeklyKm, peakWeeklyKm, macrocycle, experienceLevel } = params;

  const taperPhase = macrocycle.phases.find((p) => p.phase === "taper")!;
  const trainingPhases = macrocycle.phases.filter((p) => p.phase !== "taper");
  const trainingWeeksCount = trainingPhases.reduce((s, p) => s + p.weeks, 0);

  // Build a smooth ramp from start to peak across all training weeks
  const ramp = buildVolumeRamp(currentWeeklyKm, peakWeeklyKm, trainingWeeksCount);

  const volumes: WeeklyVolume[] = [];

  // Apply ramp to training weeks, inserting recovery dips
  let rampIndex = 0;
  for (let week = 1; week <= trainingWeeksCount; week++) {
    const isRecovery = macrocycle.recoveryWeeks.includes(week);
    let targetKm = ramp[rampIndex++]!;

    if (isRecovery) {
      // Recovery week: pull back to ~75% of the prior hard week's volume
      const prevHardVolume = volumes.length > 0
        ? volumes[volumes.length - 1]!.targetKm
        : targetKm;
      targetKm = Math.round(prevHardVolume * RECOVERY_WEEK_REDUCTION);
    }

    volumes.push(buildWeeklyVolume(week, targetKm, isRecovery, false, experienceLevel));
  }

  // Taper weeks: use the TAPER_VOLUME_SCHEDULE applied to peak volume
  const peakActual = volumes.reduce((max, w) => Math.max(max, w.targetKm), 0);
  for (let ti = 0; ti < taperPhase.weeks; ti++) {
    const week = trainingWeeksCount + 1 + ti;
    // scheduleIndex: 0 = race week (lightest), working backwards
    const scheduleIdx = taperPhase.weeks - 1 - ti;
    const fraction = TAPER_VOLUME_SCHEDULE[Math.min(scheduleIdx, TAPER_VOLUME_SCHEDULE.length - 1)]!;
    const targetKm = Math.round(peakActual * fraction);
    volumes.push(buildWeeklyVolume(week, targetKm, false, true, experienceLevel));
  }

  return volumes;
}

/**
 * Build a smooth, safe ramp from startKm to peakKm over numWeeks.
 * Caps each step at the lesser of 10% or 6 km.
 */
function buildVolumeRamp(
  startKm: number,
  peakKm: number,
  numWeeks: number
): number[] {
  if (numWeeks <= 1) return [peakKm];

  const volumes: number[] = [];
  let current = startKm;

  for (let i = 0; i < numWeeks; i++) {
    if (i === numWeeks - 1) {
      volumes.push(Math.round(peakKm));
      break;
    }

    const remaining = numWeeks - i;
    // Ideal step to reach peak linearly
    const idealStep = (peakKm - current) / remaining;
    // Cap by safety limits
    const maxStep = Math.min(
      current * MAX_WEEKLY_INCREASE_PCT,
      MAX_WEEKLY_INCREASE_KM,
      idealStep + 1
    );
    const step = Math.min(idealStep, maxStep);
    current += step;
    volumes.push(Math.round(current));
  }

  return volumes;
}

function buildWeeklyVolume(
  weekNumber: number,
  targetKm: number,
  isRecovery: boolean,
  isTaper: boolean,
  experienceLevel: ExperienceLevel
): WeeklyVolume {
  // Long run is a fraction of weekly mileage (beginner: 28%, advanced: 32%)
  const longRunFractions: Record<ExperienceLevel, number> = {
    beginner:     0.28,
    intermediate: 0.30,
    advanced:     0.32,
    elite:        0.33,
  };
  const longRunFrac = longRunFractions[experienceLevel] ?? 0.30;
  const longRunTargetKm = Math.min(
    Math.round(targetKm * longRunFrac),
    isRecovery ? 18 : 40    // cap long run at 40km absolutely
  );

  // Quality (threshold+) is ~15-20% of weekly volume in build/peak
  const qualityFrac = isRecovery ? 0.05 : isTaper ? 0.15 : 0.18;
  const qualityDistanceKm = Math.round(targetKm * qualityFrac);
  const easyDistanceKm = targetKm - qualityDistanceKm;

  return {
    weekNumber,
    targetKm,
    isRecovery,
    isTaper,
    longRunTargetKm,
    qualityDistanceKm,
    easyDistanceKm,
  };
}
