/**
 * Race Time Predictions & Fitness Trend Analysis
 *
 * Beyond single-race VDOT, this module handles:
 *  - Multi-race VDOT averaging with recency weighting
 *  - Predicting VDOT trajectory over a training plan
 *  - Equivalent performance tables
 *  - Goal time feasibility assessment
 */

import { computeVdot, predictRaceTime } from "./vdot.js";
import type { RaceDistance } from "@openrunna/shared";
import { RACE_DISTANCE_METERS } from "@openrunna/shared";

// ─── Race Record ──────────────────────────────────────────────────────────────

export interface RaceRecord {
  distanceMeters: number;
  finishTimeSeconds: number;
  date: Date;
  courseType?: "road" | "trail" | "track";
  elevationGainMeters?: number;
}

// ─── Recency-Weighted VDOT ────────────────────────────────────────────────────

/**
 * Compute VDOT from multiple races, weighting recent performances more heavily.
 *
 * Recency half-life: 90 days.  A race 90 days ago gets half the weight of
 * a race today.  Trail races with significant elevation are penalised (flatter
 * VDOT overestimates road fitness).
 */
export function computeWeightedVdot(races: RaceRecord[]): {
  vdot: number;
  confidence: number;
} {
  if (races.length === 0) return { vdot: 35, confidence: 0.1 };

  const HALF_LIFE_DAYS = 90;
  const now = new Date();

  let totalWeight = 0;
  let weightedVdot = 0;

  for (const race of races) {
    const daysSince = (now.getTime() - race.date.getTime()) / (1000 * 60 * 60 * 24);

    // Exponential decay by recency
    let weight = Math.exp((-Math.LN2 * daysSince) / HALF_LIFE_DAYS);

    // Trail / elevation penalty: ~+30 s/km per 100m/km gain degrades VDOT accuracy
    if (race.courseType === "trail" && race.elevationGainMeters) {
      const gainPerKm = race.elevationGainMeters / (race.distanceMeters / 1000);
      const elevationPenalty = Math.min(0.4, gainPerKm * 0.005);
      weight *= 1 - elevationPenalty;
    }

    // Discard races older than 18 months (no longer representative)
    if (daysSince > 548) continue;

    const vdot = computeVdot(race.distanceMeters, race.finishTimeSeconds);
    totalWeight += weight;
    weightedVdot += vdot * weight;
  }

  if (totalWeight === 0) return { vdot: 35, confidence: 0.1 };

  const vdot = weightedVdot / totalWeight;

  // Confidence scales with number of recent data points and total weight
  const confidence = Math.min(0.95, 0.5 + Math.min(races.length, 4) * 0.1 + totalWeight * 0.05);

  return { vdot: Math.round(vdot * 10) / 10, confidence };
}

// ─── VDOT Improvement Projections ────────────────────────────────────────────

/**
 * Project VDOT improvement over a training plan.
 *
 * Models use conservative gains based on published literature:
 * - Beginners:     3–6 VDOT points over 16 weeks (high trainability)
 * - Intermediate:  1–3 VDOT points over 16 weeks
 * - Advanced:      0.5–1 VDOT point over 16 weeks (diminishing returns)
 *
 * Assumes consistent training without injury.  Plan adaptation
 * (missed weeks, illness) will reduce actual gain proportionally.
 */
export function projectVdotImprovement(params: {
  currentVdot: number;
  trainingWeeks: number;
  experienceLevel: "beginner" | "intermediate" | "advanced" | "elite";
  weeklyHoursAvg: number;
}): { projectedVdot: number; rangeMin: number; rangeMax: number } {
  const { currentVdot, trainingWeeks, experienceLevel, weeklyHoursAvg } = params;

  // Base gain per week by experience (in VDOT points)
  const weeklyGainBase: Record<typeof experienceLevel, [number, number]> = {
    beginner:     [0.25, 0.45],
    intermediate: [0.08, 0.20],
    advanced:     [0.03, 0.08],
    elite:        [0.01, 0.04],
  };

  const [minGain, maxGain] = weeklyGainBase[experienceLevel];

  // Adjust for training volume (more hours → slightly more gain, up to a point)
  const volumeMultiplier = Math.min(1.3, 0.7 + weeklyHoursAvg * 0.06);

  const totalMin = minGain * trainingWeeks * volumeMultiplier;
  const totalMax = maxGain * trainingWeeks * volumeMultiplier;

  // Diminishing returns — gains slow as VDOT increases
  const ceilingFactor = Math.max(0.5, 1 - (currentVdot - 40) * 0.01);

  return {
    projectedVdot:  currentVdot + (totalMin + totalMax) / 2 * ceilingFactor,
    rangeMin:       currentVdot + totalMin * ceilingFactor,
    rangeMax:       currentVdot + totalMax * ceilingFactor,
  };
}

// ─── Goal Time Feasibility ────────────────────────────────────────────────────

export type FeasibilityRating =
  | "conservative"   // Easily achievable; athlete may be undershooting
  | "achievable"     // Realistic with consistent training
  | "challenging"    // Requires near-perfect preparation; stretch goal
  | "aggressive"     // Would need significant VDOT jump; risky
  | "unrealistic";   // Not achievable even with maximum improvement

/**
 * Assess how feasible a goal time is given current fitness and time to race.
 */
export function assessGoalFeasibility(params: {
  currentVdot: number;
  targetTimeSeconds: number;
  targetDistanceMeters: number;
  weeksUntilRace: number;
  experienceLevel: "beginner" | "intermediate" | "advanced" | "elite";
}): {
  rating: FeasibilityRating;
  requiredVdot: number;
  currentPredictedTime: number;
  vdotGapRequired: number;
  message: string;
} {
  const { currentVdot, targetTimeSeconds, targetDistanceMeters, weeksUntilRace, experienceLevel } = params;

  const requiredVdot = computeVdot(targetDistanceMeters, targetTimeSeconds);
  const currentPredictedTime = predictRaceTime(currentVdot, targetDistanceMeters);
  const vdotGapRequired = requiredVdot - currentVdot;

  const projection = projectVdotImprovement({
    currentVdot,
    trainingWeeks: weeksUntilRace,
    experienceLevel,
    weeklyHoursAvg: 5,
  });

  let rating: FeasibilityRating;
  let message: string;

  if (vdotGapRequired <= -2) {
    rating = "conservative";
    message = "Your current fitness already exceeds this goal. Consider a more ambitious target.";
  } else if (vdotGapRequired <= 0) {
    rating = "achievable";
    message = "This goal aligns with your current fitness. With consistent training you should hit it.";
  } else if (vdotGapRequired <= projection.rangeMax) {
    rating = "achievable";
    message = `Requires a VDOT gain of ${vdotGapRequired.toFixed(1)} points — realistic for ${weeksUntilRace} weeks of training.`;
  } else if (vdotGapRequired <= projection.rangeMax * 1.3) {
    rating = "challenging";
    message = `Requires a VDOT gain of ${vdotGapRequired.toFixed(1)} points — a stretch goal requiring near-perfect preparation.`;
  } else if (vdotGapRequired <= projection.rangeMax * 1.6) {
    rating = "aggressive";
    message = `Requires a VDOT gain of ${vdotGapRequired.toFixed(1)} points — beyond typical improvement in ${weeksUntilRace} weeks. Consider adjusting your target.`;
  } else {
    rating = "unrealistic";
    message = `This goal requires a VDOT jump of ${vdotGapRequired.toFixed(1)} points in ${weeksUntilRace} weeks. We recommend resetting expectations for this race and targeting a longer preparation cycle.`;
  }

  return { rating, requiredVdot, currentPredictedTime, vdotGapRequired, message };
}

// ─── Equivalent Performance Table ────────────────────────────────────────────

const STANDARD_DISTANCES: RaceDistance[] = [
  "5k", "10k", "half_marathon", "marathon"
];

/**
 * Given a race performance, return equivalent predicted times across
 * standard distances.  Useful for onboarding screens.
 */
export function equivalentPerformances(
  distanceMeters: number,
  finishTimeSeconds: number
): Record<RaceDistance, number> {
  const vdot = computeVdot(distanceMeters, finishTimeSeconds);
  const result = {} as Record<RaceDistance, number>;

  for (const dist of STANDARD_DISTANCES) {
    result[dist] = Math.round(predictRaceTime(vdot, RACE_DISTANCE_METERS[dist]));
  }

  return result;
}
