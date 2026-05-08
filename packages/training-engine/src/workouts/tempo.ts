/**
 * Threshold & Marathon Pace Workout Builders
 *
 * Threshold training raises the lactate threshold — the pace at which
 * lactate production exceeds clearance.  This is THE most important
 * physiological adaptation for distance runners beyond 5K.
 *
 * Three forms ranked by accessibility:
 *  1. Cruise Intervals  — 3–5 × 5–10 min at T pace, 1–2 min jog recovery
 *     Best for runners new to threshold work.  Equal physiological benefit
 *     to continuous tempo but more manageable mentally.
 *
 *  2. Tempo Run  — 20–40 min continuous at T pace ("comfortably hard")
 *     The gold standard.  Must be truly at threshold, not faster.
 *     Faster = interval training (different adaptation).
 *
 *  3. Long Threshold  — 45–60 min at T pace
 *     Advanced runners only.  Enormous aerobic system stress.
 *
 * Marathon Pace Runs:
 *  - Specificity principle: train at race pace
 *  - Typically mid-week or as a long run finish
 *  - Critical in peak phase for marathon/ultramarathon prep
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

// ─── Tempo Run ────────────────────────────────────────────────────────────────

export function buildTempoRun(p: BaseParams): Workout {
  const warmupKm = 2;
  const cooldownKm = 1.5;
  const tempoKm = Math.max(3, Math.min(p.targetKm - warmupKm - cooldownKm, 8));

  const steps: WorkoutStep[] = [
    makeStep({
      type: "warmup",
      order: 0,
      distanceMeters: Math.round(warmupKm * 1000),
      paceZone: "easy",
      targetPaceRangeMin: p.paces.easy.fastSecPerKm,
      targetPaceRangeMax: p.paces.easy.slowSecPerKm,
      description: `${warmupKm} km easy warm-up`,
      coachingNote: "Start conservatively. Warm-up is not optional — cold muscles are injury-prone.",
    }),
    makeStep({
      type: "steady",
      order: 1,
      distanceMeters: Math.round(tempoKm * 1000),
      paceZone: "threshold",
      targetPaceRangeMin: p.paces.threshold.fastSecPerKm,
      targetPaceRangeMax: p.paces.threshold.slowSecPerKm,
      description: `${tempoKm} km at threshold pace — "comfortably hard"`,
      coachingNote: "You should be able to say 3–4 words at a time. Not conversational, not gasping. The pace should feel controlled hard — 7/10 effort.",
    }),
    makeStep({
      type: "cooldown",
      order: 2,
      distanceMeters: Math.round(cooldownKm * 1000),
      paceZone: "easy",
      targetPaceRangeMin: p.paces.easy.fastSecPerKm,
      targetPaceRangeMax: p.paces.easy.slowSecPerKm,
      description: `${cooldownKm} km easy cool-down`,
    }),
  ];

  const totalKm = warmupKm + tempoKm + cooldownKm;

  return makeWorkout({
    planId: p.planId,
    weekNumber: p.weekNumber,
    dayOfWeek: p.dayIndex,
    scheduledDate: p.date.toISOString().split("T")[0]!,
    type: "tempo",
    phase: p.phase as any,
    title: `Tempo Run — ${tempoKm} km`,
    description: `Warm up ${warmupKm} km easy, then ${tempoKm} km at threshold pace, cool down ${cooldownKm} km easy.`,
    coachRationale: "Threshold training is the most efficient way to improve your lactate threshold — the single biggest predictor of distance running performance. This session raises the pace you can sustain for 40–60 minutes.",
    steps,
    totalDistanceMeters: Math.round(totalKm * 1000),
    estimatedDurationMinutes: Math.round(
      warmupKm * (p.paces.easy.midpointSecPerKm / 60) +
      tempoKm * (p.paces.threshold.midpointSecPerKm / 60) +
      cooldownKm * (p.paces.easy.midpointSecPerKm / 60)
    ),
    primaryZone: "threshold",
    intensityScore: 7,
    isKeySession: true,
    isOptional: false,
  });
}

// ─── Cruise Intervals ─────────────────────────────────────────────────────────

export function buildCruiseIntervals(p: BaseParams): Workout {
  const warmupKm = 2;
  const cooldownKm = 1.5;
  const qualityBudgetKm = Math.max(3, p.targetKm - warmupKm - cooldownKm);

  // Rep structure: 5–10 min efforts (1–2 km each) with 1 min recovery
  const repKm = 1.5;
  const repCount = Math.max(3, Math.min(5, Math.floor(qualityBudgetKm / repKm)));

  const repSteps: WorkoutStep[] = [
    makeStep({
      type: "steady",
      order: 0,
      distanceMeters: Math.round(repKm * 1000),
      paceZone: "threshold",
      targetPaceRangeMin: p.paces.threshold.fastSecPerKm,
      targetPaceRangeMax: p.paces.threshold.slowSecPerKm,
      description: `${repKm} km at threshold pace`,
    }),
    makeStep({
      type: "jog_recovery",
      order: 1,
      durationSeconds: 60,
      paceZone: "recovery",
      description: "60 s easy jog recovery",
      coachingNote: "Keep moving — stopping defeats the purpose. Heart rate should partially recover but not fully.",
    }),
  ];

  const steps: WorkoutStep[] = [
    makeStep({
      type: "warmup",
      order: 0,
      distanceMeters: Math.round(warmupKm * 1000),
      paceZone: "easy",
      description: `${warmupKm} km warm-up`,
    }),
    makeStep({
      type: "repeat_set",
      order: 1,
      repeatCount: repCount,
      repeatSteps: repSteps,
      description: `${repCount} × ${repKm} km @ threshold with 60 s jog recovery`,
    }),
    makeStep({
      type: "cooldown",
      order: 2,
      distanceMeters: Math.round(cooldownKm * 1000),
      paceZone: "easy",
      description: `${cooldownKm} km cool-down`,
    }),
  ];

  const totalKm = warmupKm + repCount * repKm + cooldownKm;

  return makeWorkout({
    planId: p.planId,
    weekNumber: p.weekNumber,
    dayOfWeek: p.dayIndex,
    scheduledDate: p.date.toISOString().split("T")[0]!,
    type: "cruise_intervals",
    phase: p.phase as any,
    title: `Cruise Intervals — ${repCount} × ${repKm} km`,
    description: `${warmupKm} km warm-up, then ${repCount} × ${repKm} km at threshold pace with 60 s jog recovery, ${cooldownKm} km cool-down.`,
    coachRationale: "Cruise intervals deliver identical lactate threshold adaptation to a continuous tempo run, but the recovery periods make the session more psychologically accessible and slightly lower overall stress.",
    steps,
    totalDistanceMeters: Math.round(totalKm * 1000),
    estimatedDurationMinutes: Math.round(
      warmupKm * (p.paces.easy.midpointSecPerKm / 60) +
      repCount * (repKm * (p.paces.threshold.midpointSecPerKm / 60) + 1) +
      cooldownKm * (p.paces.easy.midpointSecPerKm / 60)
    ),
    primaryZone: "threshold",
    intensityScore: 7,
    isKeySession: true,
    isOptional: false,
  });
}

// ─── Marathon Pace Run ────────────────────────────────────────────────────────

export function buildMarathonPaceRun(p: BaseParams): Workout {
  const warmupKm  = 2;
  const cooldownKm = 1.5;
  const mpKm = Math.max(5, Math.min(p.targetKm - warmupKm - cooldownKm, 16));

  const steps: WorkoutStep[] = [
    makeStep({
      type: "warmup",
      order: 0,
      distanceMeters: Math.round(warmupKm * 1000),
      paceZone: "easy",
      description: `${warmupKm} km easy warm-up`,
    }),
    makeStep({
      type: "steady",
      order: 1,
      distanceMeters: Math.round(mpKm * 1000),
      paceZone: "marathon",
      targetPaceRangeMin: p.paces.marathon.fastSecPerKm,
      targetPaceRangeMax: p.paces.marathon.slowSecPerKm,
      description: `${mpKm} km at goal marathon pace`,
      coachingNote: "This should feel comfortably controlled — you're practising race pace, not racing. Aim for perfect even splits.",
    }),
    makeStep({
      type: "cooldown",
      order: 2,
      distanceMeters: Math.round(cooldownKm * 1000),
      paceZone: "easy",
      description: `${cooldownKm} km cool-down`,
    }),
  ];

  const totalKm = warmupKm + mpKm + cooldownKm;

  return makeWorkout({
    planId: p.planId,
    weekNumber: p.weekNumber,
    dayOfWeek: p.dayIndex,
    scheduledDate: p.date.toISOString().split("T")[0]!,
    type: "marathon_pace",
    phase: p.phase as any,
    title: `Marathon Pace — ${mpKm} km`,
    description: `${warmupKm} km warm-up, then ${mpKm} km locked onto goal marathon pace, ${cooldownKm} km cool-down.`,
    coachRationale: "Marathon pace runs teach your body to run efficiently at race pace, build metabolic specificity, and train the mental discipline of controlled effort over long distance.",
    steps,
    totalDistanceMeters: Math.round(totalKm * 1000),
    estimatedDurationMinutes: Math.round(
      warmupKm * (p.paces.easy.midpointSecPerKm / 60) +
      mpKm * (p.paces.marathon.midpointSecPerKm / 60) +
      cooldownKm * (p.paces.easy.midpointSecPerKm / 60)
    ),
    primaryZone: "marathon",
    intensityScore: 6,
    isKeySession: true,
    isOptional: false,
  });
}
