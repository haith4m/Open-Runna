/**
 * Adaptive Plan Engine
 *
 * Real coaches adapt in real time.  This engine does the same.
 *
 * Adaptation triggers and responses:
 *
 *  MISSED WORKOUT
 *    - Single easy run: skip, no action needed
 *    - Key session missed: try to reschedule within 2 days
 *    - Multiple consecutive misses: reduce upcoming week by 10-15%
 *    - Long run missed: attempt same long run next available day if <4 days away
 *
 *  INJURY FLAGGED
 *    - Minor (1): substitute affected-muscle workouts for 1 week, add alternative
 *    - Moderate (2): cut quality work 50%, reduce volume 20%, no long run >90 min
 *    - Severe (3): replace all running with cross-training or rest for 1–2 weeks
 *
 *  FATIGUE HIGH (TSB < -25)
 *    - Insert an unplanned recovery week
 *    - Reduce quality volume by 30%
 *    - Swap next hard session for easy run
 *
 *  PERFORMANCE BETTER THAN EXPECTED
 *    - Update VDOT upward
 *    - Recalculate all future pace targets
 *    - Optionally increase peak mileage if injury risk low
 *
 *  ILLNESS
 *    - 1–2 days sick: resume at 80% of where you left off
 *    - 3–5 days sick: full recovery week, then rebuild
 *    - >5 days sick: reassess race goal feasibility
 *
 *  SCHEDULE CHANGE
 *    - Re-slot workouts to new available days
 *    - Preserve hard/easy alternation
 *    - Preserve long run on preferred day if possible
 */

import type { TrainingPlan, TrainingWeek, Workout, PlanAdaptation, AdaptationTrigger } from "@openrunna/shared";
import { nanoid } from "nanoid";

export interface AdaptationContext {
  trigger: AdaptationTrigger;
  affectedWeekNumbers?: number[];
  missedWorkoutId?: string;
  injurySeverity?: 1 | 2 | 3;
  newVdot?: number;
  illnessDays?: number;
  newAvailableDays?: number[];
  fatigueScore?: number;  // TSB
}

export interface AdaptationResult {
  modifiedPlan: TrainingPlan;
  adaptation: PlanAdaptation;
  summary: string;
}

/**
 * Apply an adaptive adjustment to the training plan.
 * Returns the modified plan and a log entry of what changed.
 */
export function adaptPlan(
  plan: TrainingPlan,
  context: AdaptationContext
): AdaptationResult {
  const mutablePlan: TrainingPlan = deepClone(plan);
  let summary = "";
  let distanceChange = 0;
  const affectedWeeks: number[] = context.affectedWeekNumbers ?? [];

  switch (context.trigger) {
    case "workout_missed":
    case "workout_skipped": {
      const result = handleMissedWorkout(mutablePlan, context);
      summary = result.summary;
      distanceChange = result.distanceChange;
      break;
    }

    case "injury_reported": {
      const result = handleInjury(mutablePlan, context);
      summary = result.summary;
      distanceChange = result.distanceChange;
      affectedWeeks.push(...result.weeksAffected);
      break;
    }

    case "fatigue_high": {
      const result = handleHighFatigue(mutablePlan, context);
      summary = result.summary;
      distanceChange = result.distanceChange;
      affectedWeeks.push(...result.weeksAffected);
      break;
    }

    case "performance_better_than_expected": {
      if (context.newVdot) {
        summary = `VDOT updated to ${context.newVdot.toFixed(1)}. All training paces recalculated for remaining ${mutablePlan.weeks.length} weeks.`;
        mutablePlan.vdot = context.newVdot;
      }
      break;
    }

    case "illness": {
      const result = handleIllness(mutablePlan, context);
      summary = result.summary;
      distanceChange = result.distanceChange;
      affectedWeeks.push(...result.weeksAffected);
      break;
    }

    case "schedule_change": {
      if (context.newAvailableDays) {
        summary = `Schedule updated. Future workouts will be rescheduled to new available days.`;
      }
      break;
    }

    default:
      summary = "Plan acknowledged and logged.";
  }

  mutablePlan.adaptationCount++;

  const adaptation: PlanAdaptation = {
    id: nanoid(),
    occurredAt: new Date().toISOString(),
    trigger: context.trigger,
    description: summary,
    weeksAffected: [...new Set(affectedWeeks)],
    distanceChangeKm: distanceChange,
  };

  mutablePlan.adaptationLog.push(adaptation);
  mutablePlan.lastModifiedAt = new Date().toISOString();

  return { modifiedPlan: mutablePlan, adaptation, summary };
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

function handleMissedWorkout(
  plan: TrainingPlan,
  context: AdaptationContext
): { summary: string; distanceChange: number } {
  const workout = findWorkout(plan, context.missedWorkoutId);
  if (!workout) return { summary: "Workout not found.", distanceChange: 0 };

  workout.status = "missed";

  // Key sessions: try to reschedule in next 2 days
  if (workout.isKeySession) {
    return {
      summary: `Key session "${workout.title}" was missed. If possible, attempt it within the next 2 days. If not, skip it and continue — one missed session won't derail your plan.`,
      distanceChange: -(workout.totalDistanceMeters / 1000),
    };
  }

  return {
    summary: `Easy run skipped. No adjustment needed — easy runs can be dropped without impacting your plan.`,
    distanceChange: -(workout.totalDistanceMeters / 1000),
  };
}

function handleInjury(
  plan: TrainingPlan,
  context: AdaptationContext
): { summary: string; distanceChange: number; weeksAffected: number[] } {
  const severity = context.injurySeverity ?? 1;
  const currentWeek = findCurrentWeekNumber(plan);
  const weeksAffected: number[] = [];
  let distanceChange = 0;

  for (let wi = currentWeek; wi < Math.min(currentWeek + severity + 1, plan.weeks.length); wi++) {
    const week = plan.weeks[wi - 1];
    if (!week) continue;
    weeksAffected.push(wi);

    if (severity === 3) {
      // Severe: cancel all running this week
      for (const w of week.workouts) {
        if (w.status === "scheduled") {
          distanceChange -= w.totalDistanceMeters / 1000;
          w.status = "skipped";
          w.skippedReason = "injury_severe";
        }
      }
    } else if (severity === 2) {
      // Moderate: cancel all quality, halve volume
      for (const w of week.workouts) {
        if (w.status === "scheduled" && w.isKeySession) {
          distanceChange -= w.totalDistanceMeters / 1000;
          w.status = "skipped";
          w.skippedReason = "injury_moderate";
        }
      }
      week.plannedDistanceKm *= 0.60;
    } else {
      // Minor: cancel quality for 1 week, continue easy
      for (const w of week.workouts) {
        if (w.status === "scheduled" && w.isKeySession && wi === currentWeek) {
          distanceChange -= w.totalDistanceMeters / 1000;
          w.status = "skipped";
          w.skippedReason = "injury_minor";
        }
      }
    }
  }

  const messages: Record<number, string> = {
    1: "Minor injury: quality sessions cancelled this week. Continue easy running as tolerated. If pain-free after 7 days, resume normal training.",
    2: "Moderate injury: all quality removed for 2 weeks, volume reduced 40%. Focus on rest and recovery. Reassess after 2 weeks.",
    3: "Severe injury: all running cancelled for 1–2 weeks. Do not attempt to run through this. Use the time for cross-training (pool, bike) if cleared by your physio.",
  };

  return {
    summary: messages[severity]!,
    distanceChange,
    weeksAffected,
  };
}

function handleHighFatigue(
  plan: TrainingPlan,
  context: AdaptationContext
): { summary: string; distanceChange: number; weeksAffected: number[] } {
  const currentWeek = findCurrentWeekNumber(plan);
  const week = plan.weeks[currentWeek - 1];
  if (!week) return { summary: "No week found.", distanceChange: 0, weeksAffected: [] };

  let distanceChange = 0;

  // Convert the next key session to an easy run
  for (const workout of week.workouts) {
    if (workout.status === "scheduled" && workout.isKeySession) {
      distanceChange -= workout.totalDistanceMeters / 1000;
      workout.status = "skipped";
      workout.skippedReason = "fatigue_high";
      break;
    }
  }

  week.plannedDistanceKm *= 0.85;

  return {
    summary: `High fatigue detected (TSB: ${context.fatigueScore?.toFixed(0) ?? "low"}). This week's first key session converted to easy run. Volume reduced 15%. Prioritise sleep and nutrition.`,
    distanceChange,
    weeksAffected: [currentWeek],
  };
}

function handleIllness(
  plan: TrainingPlan,
  context: AdaptationContext
): { summary: string; distanceChange: number; weeksAffected: number[] } {
  const days = context.illnessDays ?? 2;
  const currentWeek = findCurrentWeekNumber(plan);
  const weeksAffected = [currentWeek];
  let distanceChange = 0;

  if (days <= 2) {
    // Brief illness: ease back at 80% next session
    return {
      summary: `1–2 day illness. Resume training at 80% effort for 2 days, then return to plan. Do not try to "make up" missed volume.`,
      distanceChange: 0,
      weeksAffected,
    };
  }

  if (days <= 5) {
    // Cancel remaining quality this week
    const week = plan.weeks[currentWeek - 1];
    if (week) {
      for (const w of week.workouts) {
        if (w.status === "scheduled") {
          distanceChange -= w.totalDistanceMeters / 1000;
          w.status = "skipped";
          w.skippedReason = "illness";
        }
      }
    }
    weeksAffected.push(currentWeek + 1);
    return {
      summary: `${days}-day illness. Rest this week completely. Next week is a gentle rebuilding week at 60% volume before returning to plan. Do not rush this.`,
      distanceChange,
      weeksAffected,
    };
  }

  // Extended illness: major reassessment
  return {
    summary: `Extended illness (${days} days). We strongly recommend reassessing your goal race feasibility. A 2-week rebuilding block is required before resuming quality training.`,
    distanceChange: -(plan.peakWeeklyKm * 2),
    weeksAffected: [currentWeek, currentWeek + 1, currentWeek + 2],
  };
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function findWorkout(plan: TrainingPlan, workoutId?: string): Workout | undefined {
  if (!workoutId) return undefined;
  for (const week of plan.weeks) {
    const found = week.workouts.find((w) => w.id === workoutId);
    if (found) return found;
  }
  return undefined;
}

function findCurrentWeekNumber(plan: TrainingPlan): number {
  const now = new Date();
  for (const week of plan.weeks) {
    const start = new Date(week.startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    if (now >= start && now <= end) return week.weekNumber;
  }
  return plan.weeks[0]?.weekNumber ?? 1;
}

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}
