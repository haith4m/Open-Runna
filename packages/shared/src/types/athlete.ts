// ─── Athlete Profile Types ────────────────────────────────────────────────────

export type ExperienceLevel = "beginner" | "intermediate" | "advanced" | "elite";
export type Gender = "male" | "female" | "non_binary" | "prefer_not_to_say";
export type HeartRateMonitorType = "chest_strap" | "optical_wrist" | "none";
export type WearableDevice =
  | "apple_watch"
  | "garmin"
  | "coros"
  | "polar"
  | "suunto"
  | "fitbit"
  | "wahoo"
  | "none";

export interface AthleteProfile {
  id: string;
  userId: string;

  // Demographics
  dateOfBirth?: string; // ISO date
  gender?: Gender;
  weightKg?: number;
  heightCm?: number;

  // Running background
  experienceLevel: ExperienceLevel;
  weeklyMileageKm: number;     // current comfortable weekly mileage
  longestRecentRunKm: number;  // longest run in past 3 months
  yearsRunning: number;

  // Fitness markers
  vdot?: number;               // calculated from race performance
  estimatedVdot?: number;      // estimated from easy-pace self-report
  vdotConfidence: number;      // 0-1 how confident we are in VDOT estimate
  lactateThresholdPaceSecPerKm?: number;
  maxHeartRate?: number;
  restingHeartRate?: number;

  // Injury history (determines conservatism in plan generation)
  injuryHistory: InjuryRecord[];
  currentInjuries: InjuryRecord[];
  injuryRiskScore: number;     // 0-10 (10 = very injury-prone)

  // Lifestyle
  availableTrainingDays: DayOfWeek[];
  preferredLongRunDay: DayOfWeek;
  maxRunDurationMinutes: number;   // time budget per session
  hasGymAccess: boolean;
  hasTreadmillAccess: boolean;
  doesStrengthTraining: boolean;
  strengthDaysPerWeek: number;
  sleepQuality: SleepQuality;
  stressLevel: StressLevel;   // occupation/lifestyle stress

  // Wearables
  primaryDevice?: WearableDevice;
  heartRateMonitor: HeartRateMonitorType;
  hasGps: boolean;

  // Preferences
  preferredSurface: RunningSurface[];
  preferMetric: boolean;

  createdAt: string;
  updatedAt: string;
}

export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type InjuryLocation =
  | "knee"
  | "shin"
  | "achilles"
  | "plantar_fascia"
  | "hip"
  | "it_band"
  | "hamstring"
  | "calf"
  | "stress_fracture"
  | "ankle"
  | "back"
  | "other";

export interface InjuryRecord {
  id: string;
  location: InjuryLocation;
  description?: string;
  occurredAt: string;    // ISO date
  resolvedAt?: string;   // null if ongoing
  severity: 1 | 2 | 3;  // 1=minor, 2=moderate, 3=severe
  causedBy?: "overtraining" | "bad_surface" | "shoes" | "accident" | "unknown";
}

export type SleepQuality = "poor" | "fair" | "good" | "excellent";
export type StressLevel = "low" | "moderate" | "high" | "very_high";
export type RunningSurface = "road" | "trail" | "track" | "treadmill" | "grass";

// ─── Race Performance ─────────────────────────────────────────────────────────

export type RaceDistance =
  | "5k"
  | "8k"
  | "10k"
  | "15k"
  | "10mi"
  | "half_marathon"
  | "25k"
  | "30k"
  | "marathon"
  | "50k"
  | "50mi"
  | "100k"
  | "100mi";

export const RACE_DISTANCE_METERS: Record<RaceDistance, number> = {
  "5k": 5000,
  "8k": 8000,
  "10k": 10000,
  "15k": 15000,
  "10mi": 16093.4,
  half_marathon: 21097.5,
  "25k": 25000,
  "30k": 30000,
  marathon: 42195,
  "50k": 50000,
  "50mi": 80467.2,
  "100k": 100000,
  "100mi": 160934,
};

export interface RacePerformance {
  id: string;
  athleteId: string;
  distance: RaceDistance;
  customDistanceMeters?: number;
  finishTimeSeconds: number;
  racedAt: string;            // ISO date
  courseType: "road" | "trail" | "track" | "mixed";
  elevationGainMeters?: number;
  temperatureCelsius?: number;
  isGoalRace: boolean;
  name?: string;
  vdotCalculated?: number;
}

// ─── Goal Race ────────────────────────────────────────────────────────────────

export interface GoalRace {
  id: string;
  athleteId: string;
  distance: RaceDistance;
  customDistanceMeters?: number;
  name: string;
  date: string;              // ISO date
  goalTimeSeconds?: number;  // null = "finish" / "PR" without specific time
  goalType: "finish" | "time" | "place" | "pr";
  courseType: "road" | "trail" | "track" | "mixed";
  estimatedElevationGainMeters?: number;
  location?: string;
  isA?: boolean; // A/B/C priority
}
