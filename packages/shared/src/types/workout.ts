import type { PaceZone } from "./pace.js";

// ─── Workout Definition Types ─────────────────────────────────────────────────

export type WorkoutType =
  | "easy"           // Aerobic base — most common training stimulus
  | "recovery"       // Post-hard-day flush — very easy, short
  | "long_run"       // Weekly cornerstone — aerobic endurance
  | "tempo"          // Continuous threshold run — lactate threshold
  | "cruise_intervals" // Broken-up threshold — same benefit, more accessible
  | "intervals"      // VO2max repeats — aerobic power
  | "repetitions"    // Short speed reps — running economy & speed
  | "hill_repeats"   // Strength + power + form — injury prevention
  | "fartlek"        // Unstructured speed play — great for beginners
  | "progression"    // Start easy, finish fast — pace discipline
  | "marathon_pace"  // Race-specific pacing — critical in marathon prep
  | "race_simulation"; // Full dress-rehearsal effort

export type TrainingPhase =
  | "base"       // Weeks 1–N: Aerobic foundation, high easy volume
  | "build"      // Weeks N–M: Add quality, increase specific work
  | "peak"       // Weeks M–P: Highest quality, race-specific, key sessions
  | "taper"      // Final 2-3 weeks: Reduce volume, keep intensity, freshen legs
  | "recovery";  // Post-race: Active recovery, no pressure

// ─── Workout Step ─────────────────────────────────────────────────────────────

export type WorkoutStepType =
  | "warmup"
  | "cooldown"
  | "repeat_set"     // a repeating block (e.g., 6× [400m + 400m jog])
  | "steady"         // continuous at a single zone/pace
  | "progression"    // pace changes gradually
  | "rest"           // complete rest / walking
  | "jog_recovery";  // active recovery jog between reps

export interface WorkoutStep {
  id: string;
  type: WorkoutStepType;
  order: number;

  // Exactly one of distanceMeters or durationSeconds defines the length
  distanceMeters?: number;
  durationSeconds?: number;

  paceZone?: PaceZone;
  targetPaceSecPerKm?: number;    // exact target (overrides zone range)
  targetPaceRangeMin?: number;    // min end (slower)
  targetPaceRangeMax?: number;    // max end (faster)

  targetHrZone?: 1 | 2 | 3 | 4 | 5;

  // For repeat_set steps
  repeatCount?: number;
  repeatSteps?: WorkoutStep[];

  description?: string;           // coaching cue shown to athlete
  coachingNote?: string;          // deeper explanation
}

// ─── Workout ──────────────────────────────────────────────────────────────────

export interface Workout {
  id: string;
  planId: string;
  weekNumber: number;
  dayOfWeek: number;              // 0=Mon … 6=Sun
  scheduledDate: string;          // ISO date

  type: WorkoutType;
  phase: TrainingPhase;
  title: string;
  description: string;            // plain-language explanation shown to athlete
  coachRationale: string;         // WHY this workout is here (for coach screen)

  steps: WorkoutStep[];

  // Aggregate targets
  totalDistanceMeters: number;
  estimatedDurationMinutes: number;
  primaryZone: PaceZone;
  intensityScore: number;         // 0-10 training stress

  // State
  status: WorkoutStatus;
  completedAt?: string;
  skippedAt?: string;
  skippedReason?: string;
  runId?: string;                 // link to completed run

  // Difficulty context
  isKeySession: boolean;          // never skip key sessions without plan adjustment
  isOptional: boolean;            // can drop without affecting plan integrity
}

export type WorkoutStatus =
  | "scheduled"
  | "completed"
  | "skipped"
  | "missed"      // past date, not done, no explicit skip
  | "modified"    // completed but with significant deviation
  | "deferred";   // rescheduled to a different day

// ─── Weekly Training Block ────────────────────────────────────────────────────

export interface TrainingWeek {
  weekNumber: number;             // 1-indexed from plan start
  startDate: string;             // ISO Monday
  phase: TrainingPhase;
  phaseDescription: string;

  workouts: Workout[];

  plannedDistanceKm: number;
  plannedIntensityScore: number;  // aggregate weekly stress (TSS-like)
  isRecoveryWeek: boolean;
  isTaperWeek: boolean;

  // Post-week metrics (filled in as week completes)
  actualDistanceKm?: number;
  completionRate?: number;        // 0-1
  weeklyNotes?: string;           // from AI coach
}
