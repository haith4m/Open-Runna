/**
 * Top-level Training Plan Generator
 *
 * Orchestrates the full pipeline:
 *   1. Assess fitness (VDOT)
 *   2. Design macrocycle (phases, weeks)
 *   3. Calculate volume progression
 *   4. Generate every workout for every week
 *   5. Return a complete TrainingPlan object
 */

import { nanoid } from "nanoid";
import { computeTrainingPaces, computeVdot, estimateVdotFromEasyPace, predictRaceTimeForDistance } from "@openrunna/pace-calculator";
import type { TrainingPlan, TrainingWeek, PlanGenerationRequest } from "@openrunna/shared";
import { RACE_DISTANCE_METERS } from "@openrunna/shared";
import { designMacrocycle, getPhaseForWeek } from "../periodization/macrocycle.js";
import { generateVolumeProgression } from "../periodization/volume.js";
import { buildTrainingWeek } from "../workouts/generator.js";

// ─── Training day index helpers ───────────────────────────────────────────────

const DAY_NAME_TO_INDEX: Record<string, number> = {
  monday: 0, tuesday: 1, wednesday: 2, thursday: 3,
  friday: 4, saturday: 5, sunday: 6,
};

function trainingDayIndexes(availableDays: number, preferredLongRunDay: number): number[] {
  // Distribute training days evenly across the week
  const allDays = [0, 1, 2, 3, 4, 5, 6];
  const spacedDays: number[] = [];

  // Always include the long run day
  if (!spacedDays.includes(preferredLongRunDay)) spacedDays.push(preferredLongRunDay);

  // Evenly space remaining days, avoiding adjacent days to the long run
  const candidates = allDays.filter(
    (d) => d !== preferredLongRunDay
  );

  // Prioritize days with at least 1-day gap between them
  while (spacedDays.length < availableDays && candidates.length > 0) {
    const nextBest = candidates.find(
      (d) => spacedDays.every((sd) => Math.abs(d - sd) >= 1)
    ) ?? candidates[0];
    if (nextBest === undefined) break;
    spacedDays.push(nextBest);
    candidates.splice(candidates.indexOf(nextBest), 1);
  }

  return spacedDays.sort((a, b) => a - b);
}

// ─── Peak Mileage Estimation ──────────────────────────────────────────────────

function estimatePeakWeeklyKm(
  currentWeeklyKm: number,
  totalWeeks: number,
  taperWeeks: number,
  experienceLevel: string,
  targetDistanceMeters: number
): number {
  const buildWeeks = totalWeeks - taperWeeks;

  // Maximum safe increase per week (caps at experience ceiling)
  const experienceCeiling: Record<string, number> = {
    beginner: 65,
    intermediate: 90,
    advanced: 130,
    elite: 180,
  };

  const ceiling = experienceCeiling[experienceLevel] ?? 90;

  // Long run should be achievable without exceeding 32% of weekly mileage
  // For marathon, the 32 km long run needs at least 100 km/week
  const longRunRequiredMin = Math.min(targetDistanceMeters / 1000 * 0.75, 35);
  const minPeakForLongRun = longRunRequiredMin / 0.30;

  // Project natural ramp
  let natural = currentWeeklyKm;
  for (let i = 0; i < buildWeeks; i++) {
    const increase = Math.min(natural * 0.10, 6);
    natural += increase;
    // Every 4th week is recovery (drop), then resume
    if ((i + 1) % 4 === 0) natural *= 0.80;
  }

  return Math.min(ceiling, Math.max(minPeakForLongRun, Math.round(natural)));
}

// ─── Main Plan Generator ──────────────────────────────────────────────────────

export function generateTrainingPlan(request: PlanGenerationRequest): TrainingPlan {
  // 1. Determine VDOT
  let vdot: number;
  let vdotConfidence: number;

  if (request.vdot) {
    vdot = request.vdot;
    vdotConfidence = 0.9;
  } else if (request.estimatedEasyPaceSecPerKm) {
    const est = estimateVdotFromEasyPace(request.estimatedEasyPaceSecPerKm);
    vdot = est.vdot;
    vdotConfidence = est.confidence;
  } else {
    // Default by experience level
    const defaultVdot: Record<string, number> = {
      beginner: 32, intermediate: 42, advanced: 52, elite: 62,
    };
    vdot = defaultVdot[request.experienceLevel] ?? 35;
    vdotConfidence = 0.2;
  }

  const paces = computeTrainingPaces(vdot);

  // 2. Design macrocycle
  const macrocycle = designMacrocycle({
    targetDistance: request.targetDistance,
    experienceLevel: request.experienceLevel,
  });

  const { totalWeeks } = macrocycle;
  const taperPhase = macrocycle.phases.find((p) => p.phase === "taper")!;

  // 3. Calculate volume progression
  const targetDistanceMeters = RACE_DISTANCE_METERS[request.targetDistance];
  const peakWeeklyKm = estimatePeakWeeklyKm(
    request.currentWeeklyKm,
    totalWeeks,
    taperPhase.weeks,
    request.experienceLevel,
    targetDistanceMeters
  );

  const volumeSchedule = generateVolumeProgression({
    currentWeeklyKm: request.currentWeeklyKm,
    peakWeeklyKm,
    macrocycle,
    experienceLevel: request.experienceLevel,
  });

  // 4. Build each week
  const planId = nanoid();
  const planStartDate = new Date(request.raceDate);
  planStartDate.setDate(planStartDate.getDate() - totalWeeks * 7);
  // Align to Monday
  const dayOfWeek = planStartDate.getDay();
  planStartDate.setDate(planStartDate.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

  const longRunDayIndex = 6; // Default Sunday; can be overridden by user preference
  const trainingDays = trainingDayIndexes(
    Math.min(Math.max(request.availableTrainingDays, 3), 7),
    longRunDayIndex
  );

  const weeks: TrainingWeek[] = [];

  for (let weekNum = 1; weekNum <= totalWeeks; weekNum++) {
    const weekStartDate = new Date(planStartDate);
    weekStartDate.setDate(weekStartDate.getDate() + (weekNum - 1) * 7);

    const volume = volumeSchedule[weekNum - 1]!;
    const phase = getPhaseForWeek(macrocycle, weekNum);
    const isRecovery = macrocycle.recoveryWeeks.includes(weekNum);

    const weekSchedule = buildTrainingWeek({
      planId,
      weekNumber: weekNum,
      startDate: weekStartDate,
      volume,
      phase,
      vdot,
      trainingDayIndexes: trainingDays,
      longRunDayIndex,
      targetDistanceMeters,
      experienceLevel: request.experienceLevel,
    });

    weeks.push({
      weekNumber: weekNum,
      startDate: weekStartDate.toISOString().split("T")[0]!,
      phase: phase.phase as any,
      phaseDescription: phase.emphasis,
      workouts: weekSchedule.days
        .filter((d) => d.workout !== null)
        .map((d) => d.workout!),
      plannedDistanceKm: Math.round(weekSchedule.plannedKm * 10) / 10,
      plannedIntensityScore: computeWeekIntensityScore(weekSchedule.days.map((d) => d.workout).filter(Boolean) as any),
      isRecoveryWeek: isRecovery,
      isTaperWeek: volume.isTaper,
    });
  }

  // 5. Build goal time estimate
  const predictedTimeSeconds = Math.round(
    predictRaceTimeForDistance(vdot, request.targetDistance)
  );
  const goalTimeSeconds = request.goalTimeSeconds ?? predictedTimeSeconds;

  const now = new Date().toISOString();

  return {
    id: planId,
    athleteId: request.athleteId,
    name: buildPlanName(request),
    targetRaceId: "",
    targetDistance: request.targetDistance,
    targetTimeSeconds: goalTimeSeconds,
    goalType: request.goalType,
    startDate: planStartDate.toISOString().split("T")[0]!,
    raceDate: request.raceDate,
    totalWeeks,
    experienceLevel: request.experienceLevel,
    peakWeeklyKm,
    currentWeeklyKm: request.currentWeeklyKm,
    longRunPeakKm: Math.max(...weeks.map((w) => w.plannedDistanceKm * 0.30)),
    weeks,
    vdot,
    easyPaceSecPerKm: paces.easy.midpointSecPerKm,
    marathonPaceSecPerKm: paces.marathon.midpointSecPerKm,
    thresholdPaceSecPerKm: paces.threshold.midpointSecPerKm,
    intervalPaceSecPerKm: paces.interval.midpointSecPerKm,
    repetitionPaceSecPerKm: paces.repetition.midpointSecPerKm,
    status: "active",
    generatedAt: now,
    lastModifiedAt: now,
    adaptationCount: 0,
    adaptationLog: [],
  };
}

function buildPlanName(req: PlanGenerationRequest): string {
  const distanceLabels: Record<string, string> = {
    "5k": "5K",
    "10k": "10K",
    half_marathon: "Half Marathon",
    marathon: "Marathon",
    "50k": "50K",
    "100k": "100K",
  };
  const label = distanceLabels[req.targetDistance] ?? req.targetDistance.toUpperCase();
  const year = new Date(req.raceDate).getFullYear();
  return `${label} Plan — ${year}`;
}

function computeWeekIntensityScore(workouts: Array<{ intensityScore: number; totalDistanceMeters: number }>): number {
  if (workouts.length === 0) return 0;
  const total = workouts.reduce((sum, w) => sum + w.intensityScore * (w.totalDistanceMeters / 1000), 0);
  const totalKm = workouts.reduce((sum, w) => sum + w.totalDistanceMeters / 1000, 0);
  return Math.round((total / totalKm) * 10) / 10;
}
