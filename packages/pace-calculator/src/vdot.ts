/**
 * VDOT Engine — Jack Daniels Running Formula (3rd Edition)
 *
 * VDOT is an "effective VO2max" that captures both aerobic capacity AND
 * running economy in a single number derived from race performance.  Two
 * runners with identical lab VO2max values can have very different VDOTs
 * because running economy varies widely.
 *
 * Core formulae (Daniels & Gilbert, 1979):
 *
 *   Oxygen cost at velocity v (m·min⁻¹):
 *     VO2(v) = -4.60 + 0.182258·v + 0.000104·v²
 *
 *   Fraction of VO2max used at race duration t (minutes):
 *     pct(t) = 0.8 + 0.1894393·e^(−0.012778·t) + 0.2989558·e^(−0.1932605·t)
 *
 *   VDOT from a race of distance d (m) completed in time t (min):
 *     v    = d / t
 *     VDOT = VO2(v) / pct(t)
 *
 * Training paces are derived by inverting VO2(v) for a target fraction of VDOT.
 */

import type { RaceDistance } from "@openrunna/shared";
import { RACE_DISTANCE_METERS } from "@openrunna/shared";

// ─── Core VDOT Mathematics ────────────────────────────────────────────────────

/** Oxygen cost (mL·kg⁻¹·min⁻¹) to sustain velocity v (m·min⁻¹). */
function vo2AtVelocity(vMetersPerMin: number): number {
  return -4.60 + 0.182258 * vMetersPerMin + 0.000104 * vMetersPerMin ** 2;
}

/** Fraction of VO2max elicited during a maximal effort of duration t (minutes). */
function pctVo2maxAtDuration(durationMinutes: number): number {
  return (
    0.8 +
    0.1894393 * Math.exp(-0.012778 * durationMinutes) +
    0.2989558 * Math.exp(-0.1932605 * durationMinutes)
  );
}

/**
 * Compute VDOT from a race performance.
 *
 * @param distanceMeters  Race distance in metres
 * @param finishTimeSeconds  Finish time in seconds
 * @returns VDOT value (roughly equivalent to VO2max in mL·kg⁻¹·min⁻¹)
 */
export function computeVdot(
  distanceMeters: number,
  finishTimeSeconds: number
): number {
  const durationMinutes = finishTimeSeconds / 60;
  const velocityMpm = distanceMeters / durationMinutes; // metres per minute
  const vo2 = vo2AtVelocity(velocityMpm);
  const pct = pctVo2maxAtDuration(durationMinutes);
  return vo2 / pct;
}

/**
 * Given a VDOT and a target fraction of that VDOT, return the corresponding
 * running velocity in metres per minute.
 *
 * Inverting VO2(v) = target:
 *   0.000104·v² + 0.182258·v − (4.60 + target) = 0
 *   v = [−0.182258 + √(0.182258² + 4·0.000104·(4.60+target))] / (2·0.000104)
 */
function velocityAtVo2Fraction(vdot: number, fraction: number): number {
  const target = fraction * vdot;
  const a = 0.000104;
  const b = 0.182258;
  const c = -(4.60 + target);
  const discriminant = b * b - 4 * a * c;
  return (-b + Math.sqrt(discriminant)) / (2 * a); // m·min⁻¹
}

/** Convert velocity (m·min⁻¹) to pace (seconds per kilometre). */
export function velocityToPaceSecPerKm(vMetersPerMin: number): number {
  return (1000 / vMetersPerMin) * 60; // (m/km) / (m/min) * (s/min)
}

/** Convert pace (s·km⁻¹) back to velocity (m·min⁻¹). */
export function paceSecPerKmToVelocity(secPerKm: number): number {
  return (1000 / secPerKm) * 60;
}

// ─── Training Pace Zones (Jack Daniels percentages of VDOT) ──────────────────
//
// Zones are expressed as [slow, fast] fraction of VDOT.
// Recovery  59–65 %  — flush, gentle aerobic stimulus
// Easy      65–79 %  — conversational, primary aerobic base
// Marathon  75–84 %  — race-specific endurance
// Threshold 83–88 %  — lactate clearance equals production (~60-min race pace)
// Interval  95–100 % — VO2max development, 3–5 min repeats
// Repetition 105–120 % — neuromuscular speed, <2 min repeats with full recovery

export const ZONE_FRACTIONS = {
  recovery:   [0.59, 0.65] as [number, number],
  easy:       [0.65, 0.79] as [number, number],
  marathon:   [0.75, 0.84] as [number, number],
  threshold:  [0.83, 0.88] as [number, number],
  interval:   [0.95, 1.00] as [number, number],
  repetition: [1.05, 1.20] as [number, number],
} as const;

export interface TrainingPaceZone {
  name: string;
  slowSecPerKm: number;   // easier end (higher number = slower)
  fastSecPerKm: number;   // harder end (lower number = faster)
  midpointSecPerKm: number;
}

export interface VdotPaces {
  vdot: number;
  recovery: TrainingPaceZone;
  easy: TrainingPaceZone;
  marathon: TrainingPaceZone;
  threshold: TrainingPaceZone;
  interval: TrainingPaceZone;
  repetition: TrainingPaceZone;
}

/**
 * Compute all training pace zones from a VDOT value.
 * Returns paces in seconds-per-kilometre (higher = slower).
 */
export function computeTrainingPaces(vdot: number): VdotPaces {
  function zone(name: string, [slowFrac, fastFrac]: [number, number]): TrainingPaceZone {
    // Higher fraction → faster velocity → lower sec/km
    const fastVelocity = velocityAtVo2Fraction(vdot, fastFrac);
    const slowVelocity = velocityAtVo2Fraction(vdot, slowFrac);
    const fastSecPerKm = velocityToPaceSecPerKm(fastVelocity);
    const slowSecPerKm = velocityToPaceSecPerKm(slowVelocity);
    const midpointSecPerKm = (fastSecPerKm + slowSecPerKm) / 2;
    return { name, slowSecPerKm, fastSecPerKm, midpointSecPerKm };
  }

  return {
    vdot,
    recovery:   zone("Recovery",   ZONE_FRACTIONS.recovery),
    easy:       zone("Easy",       ZONE_FRACTIONS.easy),
    marathon:   zone("Marathon",   ZONE_FRACTIONS.marathon),
    threshold:  zone("Threshold",  ZONE_FRACTIONS.threshold),
    interval:   zone("Interval",   ZONE_FRACTIONS.interval),
    repetition: zone("Repetition", ZONE_FRACTIONS.repetition),
  };
}

// ─── VDOT from Known Easy Pace ────────────────────────────────────────────────
//
// When a runner has no race data, we estimate VDOT from their stated easy pace.
// Easy running sits at ~68 % of VDOT intensity.  We iterate to find the VDOT
// whose easy-zone midpoint matches the provided pace.

const EASY_ZONE_MID_FRACTION = 0.72; // midpoint of easy zone (65-79%)

/**
 * Estimate VDOT from a runner's self-reported easy/comfortable pace.
 * Returns a conservative estimate (lower VDOT) and a confidence score.
 *
 * @param easyPaceSecPerKm   The pace they consider "easy" or "comfortable"
 * @returns { vdot, confidence }  confidence 0–1 (self-report is inherently noisy)
 */
export function estimateVdotFromEasyPace(easyPaceSecPerKm: number): {
  vdot: number;
  confidence: number;
} {
  // Binary search for VDOT whose easy midpoint matches the provided pace
  let lo = 20;
  let hi = 85;

  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2;
    const paces = computeTrainingPaces(mid);
    if (paces.easy.midpointSecPerKm > easyPaceSecPerKm) {
      // This VDOT produces a slower easy pace — need higher VDOT
      hi = mid;
    } else {
      lo = mid;
    }
  }

  const vdot = (lo + hi) / 2;

  // Self-report is less reliable than race performance.
  // Confidence is also reduced for very slow/fast stated paces (more likely wrong).
  const confidence = 0.50;

  return { vdot, confidence };
}

// ─── Race Time Prediction (Riegel / Daniels) ──────────────────────────────────
//
// The Riegel formula:  T2 = T1 × (D2/D1)^1.06
// This tends to over-predict marathon time from shorter races for untrained
// runners.  We use VDOT-based prediction (more physiologically grounded).

/**
 * Predict finish time for targetDistance using an athlete's known VDOT.
 *
 * We find the duration t such that:
 *   VO2(targetDist / t) / pct(t) = VDOT
 *
 * Solved via bisection (no closed form).
 *
 * @param vdot              Athlete VDOT
 * @param targetMeters      Distance to predict for
 * @returns predicted finish time in seconds
 */
export function predictRaceTime(vdot: number, targetMeters: number): number {
  // Bracket: 1 km/h (60 min/km) to 30 km/h (2 min/km)
  const minSeconds = targetMeters / (30_000 / 3600); // ~fastest possible
  const maxSeconds = targetMeters / (1_000 / 3600);  // ~slowest reasonable

  let lo = minSeconds;
  let hi = maxSeconds;

  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    const predicted = computeVdot(targetMeters, mid);
    if (predicted > vdot) {
      // Predicted VDOT too high → going too fast → need more time
      lo = mid;
    } else {
      hi = mid;
    }
  }

  return (lo + hi) / 2;
}

/**
 * Predict finish time for a named race distance.
 */
export function predictRaceTimeForDistance(
  vdot: number,
  distance: RaceDistance
): number {
  return predictRaceTime(vdot, RACE_DISTANCE_METERS[distance]);
}

// ─── VDOT Confidence Scoring ──────────────────────────────────────────────────

export interface VdotEstimate {
  vdot: number;
  confidence: number; // 0–1
  source: "race_recent" | "race_old" | "easy_pace" | "default";
  notes: string;
}

/**
 * Merge multiple VDOT estimates (race results + self-reports) into a single
 * best estimate, weighted by recency and source reliability.
 */
export function mergeVdotEstimates(estimates: VdotEstimate[]): VdotEstimate {
  if (estimates.length === 0) {
    return { vdot: 35, confidence: 0.1, source: "default", notes: "No data — using default VDOT 35" };
  }

  // Weight: confidence × recency factor (race > pace estimate, recent > old)
  const totalWeight = estimates.reduce((sum, e) => sum + e.confidence, 0);
  const weightedVdot = estimates.reduce(
    (sum, e) => sum + e.vdot * (e.confidence / totalWeight),
    0
  );

  const maxConfidence = Math.max(...estimates.map((e) => e.confidence));

  return {
    vdot: Math.round(weightedVdot * 10) / 10,
    confidence: maxConfidence,
    source: estimates[0]!.source,
    notes: `Merged from ${estimates.length} data point(s)`,
  };
}

// ─── Condition-based Pace Adjustments ────────────────────────────────────────

export interface PaceConditions {
  temperatureCelsius?: number;
  humidityPct?: number;
  elevationGainPerKm?: number;  // metres of gain per km of race
  altitudeMeters?: number;
  isIndoorTreadmill?: boolean;
}

/**
 * Compute a pace adjustment multiplier (>1 = slower).
 *
 * Heat: Based on ACSM guidelines, performance degrades ~1% per °C above 15°C
 *       above ~65% intensity (Ely et al., 2007).
 *
 * Altitude: ~1% slower per 100m above 1000m (Daniels & Daniels, 1992).
 *
 * Elevation gain: +8 s/km per 10 m/km of climb is widely used in trail running.
 *
 * Treadmill: 1% gradient matches outdoor road running effort (Jones & Doust, 1996).
 */
export function computePaceAdjustmentFactor(conditions: PaceConditions): number {
  let factor = 1.0;

  if (conditions.temperatureCelsius !== undefined) {
    const heatDegAbove15 = Math.max(0, conditions.temperatureCelsius - 15);
    // High humidity compounds heat stress
    const humidityMultiplier =
      conditions.humidityPct !== undefined && conditions.humidityPct > 60
        ? 1 + (conditions.humidityPct - 60) * 0.002
        : 1.0;
    factor += heatDegAbove15 * 0.010 * humidityMultiplier;
  }

  if (conditions.altitudeMeters !== undefined && conditions.altitudeMeters > 1000) {
    const hundredsAbove1000 = (conditions.altitudeMeters - 1000) / 100;
    factor += hundredsAbove1000 * 0.010;
  }

  if (conditions.elevationGainPerKm !== undefined) {
    // +8 s/km per 10 m/km of gain → +0.8 s/km per 1 m/km
    // Factor is vs flat pace; we express as a fractional increase
    // Assume ~5:00/km base pace (300 s/km) for normalisation
    const addedSecondsPerKm = conditions.elevationGainPerKm * 0.8;
    factor += addedSecondsPerKm / 300;
  }

  // Treadmill at 0% feels slightly easier than road (no air resistance)
  // recommend setting to 1% to compensate
  if (conditions.isIndoorTreadmill) {
    factor *= 0.99; // effectively 1% easier, so target paces can be ~1% faster
  }

  return factor;
}
