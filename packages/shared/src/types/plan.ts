import type { RaceDistance, ExperienceLevel } from "./athlete.js";
import type { TrainingWeek } from "./workout.js";

// ─── Training Plan ────────────────────────────────────────────────────────────

export type PlanStatus =
  | "draft"       // being generated
  | "active"      // currently in use
  | "completed"   // race done
  | "abandoned"   // athlete stopped using it
  | "paused";     // temporary break

export interface TrainingPlan {
  id: string;
  athleteId: string;

  // Identity
  name: string;               // e.g., "Boston Marathon 2026 Plan"
  targetRaceId: string;
  targetDistance: RaceDistance;
  targetTimeSeconds?: number;
  goalType: "finish" | "time" | "pr";

  // Configuration
  startDate: string;          // ISO date
  raceDate: string;           // ISO date
  totalWeeks: number;
  experienceLevel: ExperienceLevel;

  // Volume parameters
  peakWeeklyKm: number;       // highest mileage week in the plan
  currentWeeklyKm: number;    // starting mileage
  longRunPeakKm: number;      // longest long run in plan

  // Generated plan
  weeks: TrainingWeek[];

  // Pace anchors used to generate the plan
  vdot: number;
  easyPaceSecPerKm: number;
  marathonPaceSecPerKm?: number;
  thresholdPaceSecPerKm: number;
  intervalPaceSecPerKm: number;
  repetitionPaceSecPerKm: number;

  status: PlanStatus;
  generatedAt: string;
  lastModifiedAt: string;

  // Adaptation metadata
  adaptationCount: number;     // how many times the plan has been auto-adjusted
  adaptationLog: PlanAdaptation[];
}

export interface PlanAdaptation {
  id: string;
  occurredAt: string;
  trigger: AdaptationTrigger;
  description: string;
  weeksAffected: number[];
  distanceChangeKm: number;  // positive = added, negative = reduced
}

export type AdaptationTrigger =
  | "workout_skipped"
  | "workout_missed"
  | "injury_reported"
  | "fatigue_high"
  | "fatigue_low"
  | "performance_better_than_expected"
  | "performance_worse_than_expected"
  | "schedule_change"
  | "illness"
  | "travel"
  | "race_cancelled"
  | "manual_adjustment";

// ─── Plan Generation Request ──────────────────────────────────────────────────

export interface PlanGenerationRequest {
  athleteId: string;

  // Race target
  targetDistance: RaceDistance;
  raceDate: string;             // ISO date
  goalType: "finish" | "time" | "pr";
  goalTimeSeconds?: number;

  // Current state
  currentWeeklyKm: number;
  longestRecentRunKm: number;
  vdot?: number;                // if we have a reliable race
  estimatedEasyPaceSecPerKm?: number; // fallback estimation
  experienceLevel: ExperienceLevel;

  // Constraints
  availableTrainingDays: number;  // 3-7
  maxSingleRunKm?: number;        // time / distance cap per session
  hasTreadmill: boolean;

  // Risk factors
  injuryRiskScore: number;       // 0-10
  hasRecentInjury: boolean;
}

// ─── Plan Summary (lightweight for list views) ────────────────────────────────

export interface PlanSummary {
  id: string;
  name: string;
  targetDistance: RaceDistance;
  raceDate: string;
  weeksRemaining: number;
  currentWeekNumber: number;
  currentPhase: string;
  completionRate: number;        // 0-1 overall
  status: PlanStatus;
}
