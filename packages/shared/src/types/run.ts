// ─── Run Tracking Types ───────────────────────────────────────────────────────

export interface GpsPoint {
  latitude: number;
  longitude: number;
  altitude?: number;       // meters
  accuracy?: number;       // meters
  timestamp: number;       // Unix ms
  speed?: number;          // m/s from GPS
  heading?: number;        // degrees
}

export interface RunSplit {
  splitNumber: number;
  distanceMeters: number;    // length of this split (usually 1000m)
  durationSeconds: number;
  paceSecPerKm: number;
  averageHeartRate?: number;
  averageCadenceSpm?: number;
  elevationGainMeters?: number;
}

export interface RunMetrics {
  totalDistanceMeters: number;
  durationSeconds: number;          // moving time
  elapsedSeconds: number;           // wall clock time
  averagePaceSecPerKm: number;
  bestPaceSecPerKm: number;         // fastest 1km split
  averageHeartRate?: number;
  maxHeartRate?: number;
  averageCadenceSpm?: number;       // steps per minute
  elevationGainMeters?: number;
  elevationLossMeters?: number;
  calories?: number;
  trainingLoad: number;             // TSS-equivalent (0-300+)
}

export interface Run {
  id: string;
  athleteId: string;
  workoutId?: string;               // linked planned workout (if any)
  planId?: string;

  // Timing
  startedAt: string;               // ISO datetime
  completedAt?: string;
  status: "in_progress" | "completed" | "abandoned";

  // Route
  gpsPoints: GpsPoint[];            // full GPS trace (stored compressed)
  route?: GeoJsonLineString;        // simplified route for map display
  startLatitude?: number;
  startLongitude?: number;
  city?: string;
  country?: string;

  // Metrics
  metrics: RunMetrics;
  splits: RunSplit[];

  // Context
  perceivedEffort?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10; // RPE
  feelingRating?: "terrible" | "hard" | "ok" | "good" | "great";
  postRunNotes?: string;
  weather?: RunWeather;

  // Device
  deviceType?: string;
  externalId?: string;              // Strava/Garmin activity ID
  externalSource?: "strava" | "garmin" | "apple_health" | "coros" | "polar";

  // Plan compliance
  plannedDistanceMeters?: number;
  complianceScore?: number;         // 0-1 how well it matched the plan
}

export interface GeoJsonLineString {
  type: "LineString";
  coordinates: [number, number][];  // [lng, lat] pairs
}

export interface RunWeather {
  temperatureCelsius: number;
  humidity: number;                 // 0-100
  windSpeedKmh: number;
  conditions: "sunny" | "cloudy" | "rainy" | "snowy" | "windy" | "foggy";
  feelsLikeCelsius?: number;
}

// ─── Live Run State ───────────────────────────────────────────────────────────

export interface LiveRunState {
  status: "idle" | "warmup" | "running" | "paused" | "cooldown" | "finished";
  elapsedSeconds: number;
  movingSeconds: number;
  distanceMeters: number;
  currentPaceSecPerKm: number;       // instantaneous (3-second smoothed)
  averagePaceSecPerKm: number;
  currentHeartRate?: number;
  currentCadenceSpm?: number;
  currentAltitude?: number;

  // Interval guidance
  currentStepIndex: number;
  currentStepType?: string;
  currentStepProgress: number;       // 0-1
  nextStepDescription?: string;
  isOnPace: boolean;
  paceDeviation: number;             // seconds from target (+ = slower, - = faster)

  // Lap
  currentLapDistanceMeters: number;
  currentLapPaceSecPerKm: number;
  lapCount: number;
}
