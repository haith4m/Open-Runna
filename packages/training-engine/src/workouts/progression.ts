/**
 * Progression Run Builder
 *
 * A progression run starts at easy pace and gradually accelerates
 * to marathon or threshold pace by the final km.
 *
 * Why progression runs are elite:
 *  - Teach pace discipline (the most common race mistake: starting too fast)
 *  - Train the body to run fast on already-fatigued muscles
 *  - Bridge easy and quality training — moderate overall stress
 *  - Psychologically rewarding — finish feeling strong
 *
 * Structure: divide into thirds
 *   Tier 1 (first 40%): easy pace
 *   Tier 2 (middle 35%): marathon pace
 *   Tier 3 (final 25%): threshold pace
 */

import type { Workout, WorkoutStep } from "@openrunna/shared";
import type { VdotPaces } from "@openrunna/pace-calculator";
import { makeWorkout, makeStep } from "./generator.js";

interface Params {
  planId: string;
  weekNumber: number;
  dayIndex: number;
  date: Date;
  phase: string;
  paces: VdotPaces;
  targetKm: number;
}

export function buildProgressionRun(p: Params): Workout {
  const tier1Km = Math.round(p.targetKm * 0.40);
  const tier2Km = Math.round(p.targetKm * 0.35);
  const tier3Km = p.targetKm - tier1Km - tier2Km;

  const steps: WorkoutStep[] = [
    makeStep({
      type: "steady",
      order: 0,
      distanceMeters: Math.round(tier1Km * 1000),
      paceZone: "easy",
      targetPaceRangeMin: p.paces.easy.fastSecPerKm,
      targetPaceRangeMax: p.paces.easy.slowSecPerKm,
      description: `${tier1Km} km easy`,
      coachingNote: "Start SLOW. You'll feel like you should be going faster. Trust the process.",
    }),
    makeStep({
      type: "steady",
      order: 1,
      distanceMeters: Math.round(tier2Km * 1000),
      paceZone: "marathon",
      targetPaceRangeMin: p.paces.marathon.fastSecPerKm,
      targetPaceRangeMax: p.paces.marathon.slowSecPerKm,
      description: `${tier2Km} km progressive — marathon pace`,
      coachingNote: "A noticeable gear change. Controlled and smooth.",
    }),
    makeStep({
      type: "steady",
      order: 2,
      distanceMeters: Math.round(tier3Km * 1000),
      paceZone: "threshold",
      targetPaceRangeMin: p.paces.threshold.fastSecPerKm,
      targetPaceRangeMax: p.paces.threshold.slowSecPerKm,
      description: `${tier3Km} km strong finish — threshold pace`,
      coachingNote: "Finish fast. This final block on tired legs is race simulation at its best.",
    }),
  ];

  const totalKm = p.targetKm;
  const estimatedMins = Math.round(
    tier1Km * (p.paces.easy.midpointSecPerKm / 60) +
    tier2Km * (p.paces.marathon.midpointSecPerKm / 60) +
    tier3Km * (p.paces.threshold.midpointSecPerKm / 60)
  );

  return makeWorkout({
    planId: p.planId,
    weekNumber: p.weekNumber,
    dayOfWeek: p.dayIndex,
    scheduledDate: p.date.toISOString().split("T")[0]!,
    type: "progression",
    phase: p.phase as any,
    title: `Progression Run ${totalKm} km`,
    description: `${tier1Km} km easy → ${tier2Km} km marathon pace → ${tier3Km} km threshold. Each section should feel progressively harder.`,
    coachRationale: "Progression runs are a highly efficient training stimulus: aerobic development in the first two-thirds, threshold adaptation in the final third. The fatigue-on-tired-legs finish is ideal race preparation.",
    steps,
    totalDistanceMeters: Math.round(totalKm * 1000),
    estimatedDurationMinutes: estimatedMins,
    primaryZone: "marathon",
    intensityScore: 6,
    isKeySession: false,
    isOptional: false,
  });
}
