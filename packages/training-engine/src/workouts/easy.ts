/**
 * Easy, Recovery, Long Run, and Stride Workout Builders
 *
 * These are the MAJORITY of your training — 80%+ of weekly volume.
 * Easy runs are the most important, most underestimated, and most
 * often done too hard.  The #1 coaching intervention for most runners:
 * slow down their easy days.
 *
 * Long run philosophy:
 *  - Primary stimulus for mitochondrial density and fat oxidation
 *  - Must be truly easy (Z2 HR, conversational)
 *  - Should not leave you depleted for 48+ hours
 *  - In marathon training: last 25-30% at marathon pace (progression long)
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

// ─── Easy Run ─────────────────────────────────────────────────────────────────

export function buildEasyRun(p: BaseParams): Workout {
  const distM = Math.round(p.targetKm * 1000);

  const steps: WorkoutStep[] = [
    makeStep({
      type: "steady",
      order: 0,
      distanceMeters: distM,
      paceZone: "easy",
      targetPaceRangeMin: p.paces.easy.fastSecPerKm,
      targetPaceRangeMax: p.paces.easy.slowSecPerKm,
      description: `${p.targetKm} km easy — conversational pace`,
      coachingNote: "If you can't hold a full sentence, you're going too fast. Slow down.",
    }),
  ];

  return makeWorkout({
    planId: p.planId,
    weekNumber: p.weekNumber,
    dayOfWeek: p.dayIndex,
    scheduledDate: p.date.toISOString().split("T")[0]!,
    type: "easy",
    phase: p.phase as any,
    title: `Easy ${p.targetKm} km`,
    description: `A comfortable aerobic run at easy/conversational pace. You should be able to talk in full sentences throughout.`,
    coachRationale: "Easy runs build your aerobic base, increase mitochondrial density, and promote active recovery without meaningful fatigue accumulation.",
    steps,
    totalDistanceMeters: distM,
    estimatedDurationMinutes: Math.round((distM / 1000) * (p.paces.easy.midpointSecPerKm / 60)),
    primaryZone: "easy",
    intensityScore: 3,
    isKeySession: false,
    isOptional: false,
  });
}

// ─── Recovery Run ─────────────────────────────────────────────────────────────

export function buildRecoveryRun(p: BaseParams): Workout {
  const km = Math.min(p.targetKm, 6);
  const distM = Math.round(km * 1000);

  const steps: WorkoutStep[] = [
    makeStep({
      type: "steady",
      order: 0,
      distanceMeters: distM,
      paceZone: "recovery",
      targetPaceRangeMin: p.paces.recovery.fastSecPerKm,
      targetPaceRangeMax: p.paces.recovery.slowSecPerKm,
      description: `${km} km recovery jog — very easy`,
      coachingNote: "This run flushes lactate and promotes blood flow to tired muscles. It should feel almost embarrassingly easy.",
    }),
  ];

  return makeWorkout({
    planId: p.planId,
    weekNumber: p.weekNumber,
    dayOfWeek: p.dayIndex,
    scheduledDate: p.date.toISOString().split("T")[0]!,
    type: "recovery",
    phase: p.phase as any,
    title: `Recovery ${km} km`,
    description: `A short, very gentle jog. Active recovery — the goal is movement, not fitness.`,
    coachRationale: "Recovery runs accelerate muscle repair and glycogen restoration while keeping your legs moving. Never skip the day after a long run or hard session.",
    steps,
    totalDistanceMeters: distM,
    estimatedDurationMinutes: Math.round((distM / 1000) * (p.paces.recovery.midpointSecPerKm / 60)),
    primaryZone: "recovery",
    intensityScore: 1,
    isKeySession: false,
    isOptional: true,
  });
}

// ─── Long Run ─────────────────────────────────────────────────────────────────

export function buildLongRun(p: BaseParams & {
  isRecovery: boolean;
  isTaper: boolean;
  experienceLevel: string;
  targetDistanceMeters: number;
}): Workout {
  const km = p.targetKm;
  const isMarathonOrLonger = p.targetDistanceMeters >= 42195;

  // In peak phase for marathon: last 3–5 km at marathon pace (progression long)
  const includeMarathonFinish =
    p.phase === "peak" &&
    isMarathonOrLonger &&
    !p.isRecovery &&
    km >= 20;

  const steps: WorkoutStep[] = [];

  if (includeMarathonFinish) {
    const marathonFinishKm = Math.min(5, Math.round(km * 0.20));
    const easyKm = km - marathonFinishKm;

    steps.push(
      makeStep({
        type: "steady",
        order: 0,
        distanceMeters: Math.round(easyKm * 1000),
        paceZone: "easy",
        targetPaceRangeMin: p.paces.easy.fastSecPerKm,
        targetPaceRangeMax: p.paces.easy.slowSecPerKm,
        description: `${easyKm} km easy`,
        coachingNote: "Stay disciplined — start slow. The marathon finish at the end is the work.",
      }),
      makeStep({
        type: "steady",
        order: 1,
        distanceMeters: Math.round(marathonFinishKm * 1000),
        paceZone: "marathon",
        targetPaceRangeMin: p.paces.marathon.fastSecPerKm,
        targetPaceRangeMax: p.paces.marathon.slowSecPerKm,
        description: `${marathonFinishKm} km at marathon pace`,
        coachingNote: "Now practise your goal race pace on tired legs — this is the most race-specific stimulus you'll get.",
      })
    );
  } else {
    steps.push(
      makeStep({
        type: "steady",
        order: 0,
        distanceMeters: Math.round(km * 1000),
        paceZone: "easy",
        targetPaceRangeMin: p.paces.easy.fastSecPerKm,
        targetPaceRangeMax: p.paces.easy.slowSecPerKm,
        description: `${km} km long easy run`,
        coachingNote: "The most important session of the week. Prioritise sleep and nutrition the night before.",
      })
    );
  }

  const totalKm = km;
  const desc = includeMarathonFinish
    ? `Long run with marathon-pace finish: ${km - Math.round(km * 0.20)} km easy + ${Math.round(km * 0.20)} km at marathon goal pace.`
    : `${km} km long easy run — the cornerstone of your week.`;

  return makeWorkout({
    planId: p.planId,
    weekNumber: p.weekNumber,
    dayOfWeek: p.dayIndex,
    scheduledDate: p.date.toISOString().split("T")[0]!,
    type: "long_run",
    phase: p.phase as any,
    title: `Long Run ${totalKm} km`,
    description: desc,
    coachRationale: "The long run builds your aerobic engine, increases fat utilisation efficiency, strengthens tendons and ligaments, and provides the endurance foundation that all other training rests on.",
    steps,
    totalDistanceMeters: Math.round(totalKm * 1000),
    estimatedDurationMinutes: Math.round(totalKm * (p.paces.easy.midpointSecPerKm / 60)),
    primaryZone: "easy",
    intensityScore: includeMarathonFinish ? 6 : 5,
    isKeySession: true,
    isOptional: false,
  });
}

// ─── Easy Run with Strides ────────────────────────────────────────────────────

export function buildStrideRun(p: BaseParams): Workout {
  const easyKm = Math.max(4, p.targetKm - 1);
  const strideCount = 4;

  const steps: WorkoutStep[] = [
    makeStep({
      type: "steady",
      order: 0,
      distanceMeters: Math.round(easyKm * 1000),
      paceZone: "easy",
      targetPaceRangeMin: p.paces.easy.fastSecPerKm,
      targetPaceRangeMax: p.paces.easy.slowSecPerKm,
      description: `${easyKm} km easy`,
    }),
    makeStep({
      type: "repeat_set",
      order: 1,
      repeatCount: strideCount,
      repeatSteps: [
        makeStep({
          type: "steady",
          order: 0,
          distanceMeters: 100,
          paceZone: "repetition",
          targetPaceRangeMin: p.paces.repetition.fastSecPerKm,
          targetPaceRangeMax: p.paces.repetition.slowSecPerKm,
          description: "100m stride — controlled acceleration, relaxed",
        }),
        makeStep({
          type: "jog_recovery",
          order: 1,
          distanceMeters: 100,
          paceZone: "recovery",
          description: "100m easy jog recovery",
        }),
      ],
      description: `${strideCount} × 100m strides with 100m jog recovery`,
    }),
  ];

  return makeWorkout({
    planId: p.planId,
    weekNumber: p.weekNumber,
    dayOfWeek: p.dayIndex,
    scheduledDate: p.date.toISOString().split("T")[0]!,
    type: "easy",
    phase: p.phase as any,
    title: `Easy + ${strideCount} Strides`,
    description: `Easy run followed by ${strideCount} × 100m strides. Strides are controlled accelerations — not sprints.`,
    coachRationale: "Strides activate fast-twitch muscle fibres and maintain neuromuscular sharpness during high-volume base training without meaningful fatigue cost.",
    steps,
    totalDistanceMeters: Math.round(easyKm * 1000) + strideCount * 200,
    estimatedDurationMinutes: Math.round(easyKm * (p.paces.easy.midpointSecPerKm / 60) + strideCount * 2),
    primaryZone: "easy",
    intensityScore: 3,
    isKeySession: false,
    isOptional: false,
  });
}
