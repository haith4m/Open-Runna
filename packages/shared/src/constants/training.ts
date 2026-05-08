import type { RaceDistance } from "../types/athlete.js";

// ─── Volume Progression Constants ────────────────────────────────────────────

// Maximum safe weekly mileage increase per week (% of previous week)
// The classic "10% rule" is actually too aggressive for low mileage;
// absolute increase caps are more appropriate.
export const MAX_WEEKLY_INCREASE_PCT = 0.10;     // 10% ceiling
export const MAX_WEEKLY_INCREASE_KM = 6;          // Never add more than 6km regardless
export const RECOVERY_WEEK_REDUCTION = 0.75;      // Drop to 75% of previous week
export const RECOVERY_WEEK_FREQUENCY = 4;         // Every 4th week is a recovery week

// Long run should not exceed 30% of weekly mileage (injury risk above this)
export const LONG_RUN_MAX_PCT_OF_WEEKLY = 0.30;
export const LONG_RUN_ABSOLUTE_CAP_KM: Record<string, number> = {
  beginner: 29,
  intermediate: 35,
  advanced: 40,
  elite: 45,
};

// ─── Plan Lengths by Race Distance ──────────────────────────────────────────

export const PLAN_WEEKS: Record<RaceDistance, { beginner: number; intermediate: number; advanced: number }> = {
  "5k":           { beginner: 8,  intermediate: 8,  advanced: 6  },
  "8k":           { beginner: 10, intermediate: 8,  advanced: 8  },
  "10k":          { beginner: 12, intermediate: 10, advanced: 8  },
  "15k":          { beginner: 14, intermediate: 12, advanced: 10 },
  "10mi":         { beginner: 14, intermediate: 12, advanced: 10 },
  half_marathon:  { beginner: 16, intermediate: 14, advanced: 12 },
  "25k":          { beginner: 18, intermediate: 16, advanced: 14 },
  "30k":          { beginner: 20, intermediate: 18, advanced: 16 },
  marathon:       { beginner: 20, intermediate: 18, advanced: 16 },
  "50k":          { beginner: 24, intermediate: 22, advanced: 20 },
  "50mi":         { beginner: 28, intermediate: 26, advanced: 24 },
  "100k":         { beginner: 32, intermediate: 30, advanced: 28 },
  "100mi":        { beginner: 36, intermediate: 32, advanced: 30 },
};

// ─── Taper Parameters ─────────────────────────────────────────────────────────

export const TAPER_WEEKS: Record<RaceDistance, number> = {
  "5k": 1,
  "8k": 1,
  "10k": 1,
  "15k": 2,
  "10mi": 2,
  half_marathon: 2,
  "25k": 2,
  "30k": 3,
  marathon: 3,
  "50k": 3,
  "50mi": 3,
  "100k": 3,
  "100mi": 4,
};

// Volume reduction during taper (% of peak week, by week from race)
export const TAPER_VOLUME_SCHEDULE = [0.60, 0.80, 1.00]; // week -1, -2, -3 (from race)

// ─── Intensity Distribution (% of weekly volume by zone) ─────────────────────

// 80/20 rule: ~80% easy, ~20% quality — well-established in endurance research
export const INTENSITY_DISTRIBUTION = {
  base: {
    easy: 0.85,
    quality: 0.15,   // mostly aerobic, some light threshold
  },
  build: {
    easy: 0.80,
    quality: 0.20,   // introduce intervals and tempo
  },
  peak: {
    easy: 0.75,
    quality: 0.25,   // highest quality load
  },
  taper: {
    easy: 0.80,
    quality: 0.20,   // maintain intensity, drastically reduce volume
  },
};

// ─── Fatigue Management ───────────────────────────────────────────────────────

// Fitness Time Constant (days) — how quickly fitness fades without stimulus
export const FITNESS_TIME_CONSTANT_DAYS = 42;

// Fatigue Time Constant (days) — how quickly acute fatigue dissipates
export const FATIGUE_TIME_CONSTANT_DAYS = 7;

// TSB (Training Stress Balance) thresholds
export const OPTIMAL_RACE_DAY_TSB_MIN = 10;  // "fresher" than this = undertapered
export const OPTIMAL_RACE_DAY_TSB_MAX = 25;  // "more" than this = too detrained

// ─── Workout Intensity Scoring (Training Stress Score proxy) ──────────────────

// Relative intensity factor per zone (vs threshold = 1.0)
export const ZONE_INTENSITY_FACTOR: Record<string, number> = {
  recovery:   0.40,
  easy:       0.65,
  marathon:   0.80,
  threshold:  1.00,
  interval:   1.20,
  repetition: 1.40,
};

// ─── VDOT Estimation Constants ────────────────────────────────────────────────

// When we only have easy pace self-report, we can estimate VDOT
// Easy pace corresponds to approximately 65-70% of VO2max effort
// This ratio is used to back-calculate VDOT from stated easy pace
export const EASY_PACE_VDOT_FRACTION = 0.68; // 68% of VDOT intensity

// Beginner estimations — without any real performance data
export const BEGINNER_VDOT_BY_EASY_PACE: Record<string, number> = {
  // easy pace (min/km) → estimated VDOT
  "6:30": 35,
  "7:00": 31,
  "7:30": 28,
  "8:00": 25,
  "8:30": 23,
  "9:00": 21,
};

// ─── Injury Risk Modifiers ────────────────────────────────────────────────────

// If injury risk is high, reduce volume and intensity by these factors
export const INJURY_RISK_MODIFIERS = {
  0:  { volumeFactor: 1.00, intensityFactor: 1.00 },
  3:  { volumeFactor: 0.95, intensityFactor: 0.95 },
  5:  { volumeFactor: 0.90, intensityFactor: 0.90 },
  7:  { volumeFactor: 0.82, intensityFactor: 0.85 },
  10: { volumeFactor: 0.70, intensityFactor: 0.75 },
} as const;

// ─── Race-Specific Workout Timing ─────────────────────────────────────────────

// Key sessions should not appear within N days of each other (recovery windows)
export const MIN_DAYS_BETWEEN_KEY_SESSIONS = 2;
export const MIN_DAYS_AFTER_LONG_RUN = 1;  // always have an easy/off day after long

// Long run timing from race day (final long run)
export const FINAL_LONG_RUN_WEEKS_OUT: Record<RaceDistance, number> = {
  "5k": 1,
  "8k": 2,
  "10k": 2,
  "15k": 2,
  "10mi": 3,
  half_marathon: 3,
  "25k": 3,
  "30k": 3,
  marathon: 3,
  "50k": 3,
  "50mi": 4,
  "100k": 4,
  "100mi": 4,
};
