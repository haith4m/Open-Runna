/**
 * Macrocycle Designer
 *
 * A macrocycle is the complete training arc from first workout to race day.
 * It is divided into mesocycles (phases), each with a distinct training emphasis.
 *
 * Phase structure (classic Daniels / Lydiard hybrid approach):
 *
 *   BASE    — High aerobic volume, mostly easy.  Builds the aerobic engine,
 *             strengthens connective tissue, establishes consistency habit.
 *             Rookie mistake: skipping this to go straight to intervals.
 *
 *   BUILD   — Introduce quality: tempo runs, cruise intervals, light VO2max
 *             work.  Volume still increasing but pace work now present.
 *
 *   PEAK    — Race-specific intensity. Marathon-pace runs, long threshold
 *             blocks, full-distance-specific intervals. Highest physiological
 *             stress.  Recovery management is critical here.
 *
 *   TAPER   — Volume drops sharply (40–50%), intensity maintained.
 *             Physiological "supercompensation" window.  Legs freshen up.
 *             Paradox: athletes feel flat mid-taper — this is normal.
 *
 * Recovery weeks are embedded every 4th week within each phase (3:1 loading).
 */

import type { RaceDistance, ExperienceLevel } from "@openrunna/shared";
import { PLAN_WEEKS, TAPER_WEEKS, RECOVERY_WEEK_FREQUENCY } from "@openrunna/shared";

export type TrainingPhase = "base" | "build" | "peak" | "taper";

export interface PhaseBlock {
  phase: TrainingPhase;
  startWeek: number;   // 1-indexed
  endWeek: number;     // inclusive
  weeks: number;
  emphasis: string;
  keyWorkouts: string[];
}

export interface Macrocycle {
  totalWeeks: number;
  raceWeek: number;         // final week number (taper ends here)
  phases: PhaseBlock[];
  recoveryWeeks: number[];  // 1-indexed week numbers that are recovery weeks
}

/**
 * Design a macrocycle given a target distance, experience level and total weeks.
 *
 * Phase allocation (% of total non-taper weeks):
 *   Beginner:     Base 50 % / Build 30 % / Peak 20 %
 *   Intermediate: Base 40 % / Build 35 % / Peak 25 %
 *   Advanced:     Base 35 % / Build 35 % / Peak 30 %
 */
export function designMacrocycle(params: {
  targetDistance: RaceDistance;
  experienceLevel: ExperienceLevel;
  totalWeeks?: number; // override default
}): Macrocycle {
  const { targetDistance, experienceLevel, totalWeeks: overrideWeeks } = params;

  const level = experienceLevel === "elite" ? "advanced" : experienceLevel;
  const totalWeeks = overrideWeeks ?? PLAN_WEEKS[targetDistance][level];
  const taperWeeks = TAPER_WEEKS[targetDistance];
  const trainingWeeks = totalWeeks - taperWeeks;

  const phaseAllocation: Record<typeof level, [number, number, number]> = {
    beginner:     [0.50, 0.30, 0.20],
    intermediate: [0.40, 0.35, 0.25],
    advanced:     [0.35, 0.35, 0.30],
  };

  const [baseFrac, buildFrac, peakFrac] = phaseAllocation[level];

  const baseWeeks = Math.max(2, Math.round(trainingWeeks * baseFrac));
  const buildWeeks = Math.max(2, Math.round(trainingWeeks * buildFrac));
  const peakWeeks = Math.max(1, trainingWeeks - baseWeeks - buildWeeks);

  const phases: PhaseBlock[] = [
    {
      phase: "base",
      startWeek: 1,
      endWeek: baseWeeks,
      weeks: baseWeeks,
      emphasis: "Aerobic foundation — build easy volume, strengthen tendons, establish routine",
      keyWorkouts: ["easy_run", "long_run", "strides"],
    },
    {
      phase: "build",
      startWeek: baseWeeks + 1,
      endWeek: baseWeeks + buildWeeks,
      weeks: buildWeeks,
      emphasis: "Quality introduction — tempo, cruise intervals, progressive long runs",
      keyWorkouts: ["tempo_run", "cruise_intervals", "progression_long_run"],
    },
    {
      phase: "peak",
      startWeek: baseWeeks + buildWeeks + 1,
      endWeek: baseWeeks + buildWeeks + peakWeeks,
      weeks: peakWeeks,
      emphasis: "Race-specific intensity — highest quality, marathon pace, VO2max",
      keyWorkouts: ["intervals", "marathon_pace_run", "long_threshold"],
    },
    {
      phase: "taper",
      startWeek: baseWeeks + buildWeeks + peakWeeks + 1,
      endWeek: totalWeeks,
      weeks: taperWeeks,
      emphasis: "Freshen legs — reduce volume sharply, maintain race-pace touches",
      keyWorkouts: ["race_pace_strides", "short_tempo", "easy_run"],
    },
  ];

  // Mark every 4th week within a phase as a recovery week (3:1 loading)
  const recoveryWeeks: number[] = [];
  for (const phase of phases.slice(0, 3)) {
    // No recovery weeks in taper (it IS a recovery phase)
    for (let offset = RECOVERY_WEEK_FREQUENCY; offset <= phase.weeks; offset += RECOVERY_WEEK_FREQUENCY) {
      recoveryWeeks.push(phase.startWeek + offset - 1);
    }
  }

  return { totalWeeks, raceWeek: totalWeeks, phases, recoveryWeeks };
}

/**
 * Given a week number, return which phase it belongs to.
 */
export function getPhaseForWeek(macrocycle: Macrocycle, weekNumber: number): PhaseBlock {
  const phase = macrocycle.phases.find(
    (p) => weekNumber >= p.startWeek && weekNumber <= p.endWeek
  );
  if (!phase) throw new Error(`Week ${weekNumber} not found in macrocycle`);
  return phase;
}
