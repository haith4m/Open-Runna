// ─── Pace & Zone Types ────────────────────────────────────────────────────────

export type PaceZone =
  | "recovery"      // Zone 1 — <65% VDOT — gentle active recovery
  | "easy"          // Zone 2 — 65-79% VDOT — conversational aerobic
  | "marathon"      // Zone 3 — 75-84% VDOT — marathon-specific endurance
  | "threshold"     // Zone 4 — 83-88% VDOT — lactate threshold, comfortably hard
  | "interval"      // Zone 5 — 95-100% VDOT — VO2max, hard effort
  | "repetition";   // Zone 6 — 105-120% VDOT — speed, running economy

export interface PaceRange {
  slowSecPerKm: number;  // slow end of zone (easier)
  fastSecPerKm: number;  // fast end of zone (harder)
}

export interface TrainingPaces {
  vdot: number;
  recovery: PaceRange;
  easy: PaceRange;
  marathon: PaceRange;
  threshold: PaceRange;
  interval: PaceRange;
  repetition: PaceRange;
}

export interface PaceAdjustments {
  heatAdjustmentFactor: number;        // multiply sec/km by this (heat → slower)
  elevationAdjustmentFactor: number;   // per 100m gain, multiply by factor
  treadmillInclineGrade: number;       // % incline to match road effort
  altitudeAdjustmentFactor: number;    // at altitude, paces are slower
  fatigueAdjustmentFactor: number;     // accumulated fatigue reduces performance
}

// All paces stored as seconds per kilometer internally.
// Display functions convert to the user's preference (min/km or min/mile).
export interface PaceDisplayOptions {
  useImperial: boolean;    // true = min/mile, false = min/km
  showRange: boolean;      // show as "4:30–4:45" or just "4:37"
}

export function formatPace(secPerKm: number, imperial = false): string {
  const secPerUnit = imperial ? secPerKm * 1.60934 : secPerKm;
  const mins = Math.floor(secPerUnit / 60);
  const secs = Math.round(secPerUnit % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function parsePace(paceStr: string, imperial = false): number {
  const [minsStr, secsStr] = paceStr.split(":");
  const mins = parseInt(minsStr, 10);
  const secs = parseInt(secsStr ?? "0", 10);
  const secPerUnit = mins * 60 + secs;
  return imperial ? secPerUnit / 1.60934 : secPerUnit;
}

export function paceToKmh(secPerKm: number): number {
  return 3600 / secPerKm;
}

export function kmhToPace(kmh: number): number {
  return 3600 / kmh;
}

// ─── Heart Rate Zones ─────────────────────────────────────────────────────────

export interface HeartRateZones {
  maxHeartRate: number;
  zone1: { min: number; max: number };  // <65% — recovery
  zone2: { min: number; max: number };  // 65-75% — aerobic
  zone3: { min: number; max: number };  // 75-85% — tempo
  zone4: { min: number; max: number };  // 85-93% — threshold
  zone5: { min: number; max: number };  // 93-100% — VO2max
}

export function computeHrZones(maxHr: number): HeartRateZones {
  return {
    maxHeartRate: maxHr,
    zone1: { min: 0, max: Math.round(maxHr * 0.65) },
    zone2: { min: Math.round(maxHr * 0.65), max: Math.round(maxHr * 0.75) },
    zone3: { min: Math.round(maxHr * 0.75), max: Math.round(maxHr * 0.85) },
    zone4: { min: Math.round(maxHr * 0.85), max: Math.round(maxHr * 0.93) },
    zone5: { min: Math.round(maxHr * 0.93), max: maxHr },
  };
}

// Tanaka formula — more accurate than 220-age for endurance athletes
export function estimateMaxHr(ageYears: number): number {
  return Math.round(208 - 0.7 * ageYears);
}
