/**
 * Fatigue & Readiness Model
 *
 * Based on the Performance Manager (Banister impulse-response model):
 *
 *   Fitness (CTL)  — Chronic Training Load, 42-day exponential average
 *   Fatigue (ATL)  — Acute Training Load, 7-day exponential average
 *   Form (TSB)     — Training Stress Balance = CTL - ATL
 *
 *   TSB > 0   → Fresh/rested, good for racing or hard sessions
 *   TSB 0–-10 → Normal training state, slightly fatigued
 *   TSB < -25 → Overreaching, reduce load immediately
 *   TSB > +25  → Detrained — need to re-introduce stimulus
 *
 * Daily Training Stress Score (TSS) calculation:
 *   TSS = (duration_hours × IF² × 100)
 *   where IF (Intensity Factor) = normalised_pace / threshold_pace
 *
 * We extend this with a RPE-based TSS estimate when no HR/pace device data
 * is available, and a sleep/lifestyle stress modifier.
 */

import { FITNESS_TIME_CONSTANT_DAYS, FATIGUE_TIME_CONSTANT_DAYS } from "@openrunna/shared";

// ─── Training Stress Score ────────────────────────────────────────────────────

export interface TssInput {
  durationSeconds: number;
  averagePaceSecPerKm: number;
  thresholdPaceSecPerKm: number;
  perceivedEffort?: number;   // RPE 1–10
}

/**
 * Compute Training Stress Score for a single run.
 *
 * Intensity Factor = threshold pace / actual pace (faster = higher IF)
 * TSS = (duration_h × IF² × 100)
 * Capped at 400 (beyond which accuracy degrades anyway).
 */
export function computeTss(input: TssInput): number {
  const durationHours = input.durationSeconds / 3600;

  // IF uses velocity ratio: threshold_velocity / avg_velocity
  // velocity = 1 / pace, so faster pace = higher velocity = higher IF
  const intensityFactor = input.thresholdPaceSecPerKm / input.averagePaceSecPerKm;

  const tss = durationHours * intensityFactor * intensityFactor * 100;

  // If RPE available, blend with pace-based estimate
  if (input.perceivedEffort !== undefined) {
    const rpeTss = computeRpeTss(input.durationSeconds, input.perceivedEffort);
    return Math.min(400, (tss * 0.7 + rpeTss * 0.3));
  }

  return Math.min(400, tss);
}

/**
 * Estimate TSS from RPE alone (for runs without pace data).
 *
 * Calibrated against typical TSS values:
 *   60 min easy (RPE 4)  → ~55 TSS
 *   60 min threshold (RPE 7) → ~100 TSS
 *   60 min intervals (RPE 9) → ~130 TSS
 */
export function computeRpeTss(durationSeconds: number, rpe: number): number {
  const durationHours = durationSeconds / 3600;
  // RPE 1=0.3 IF, RPE 10=1.2 IF (approximate)
  const intensityFactor = 0.2 + rpe * 0.1;
  return Math.min(400, durationHours * intensityFactor * intensityFactor * 100);
}

// ─── Fitness / Fatigue / Form (CTL / ATL / TSB) ───────────────────────────────

export interface PerformanceMetrics {
  ctl: number;  // Chronic Training Load (fitness)
  atl: number;  // Acute Training Load (fatigue)
  tsb: number;  // Training Stress Balance (form)
}

/**
 * Update CTL and ATL given a new day's TSS.
 *
 * Exponential smoothing:
 *   CTL(t) = CTL(t-1) + (TSS(t) − CTL(t-1)) × (1 − e^(−1/42))
 *   ATL(t) = ATL(t-1) + (TSS(t) − ATL(t-1)) × (1 − e^(−1/7))
 */
export function updatePerformanceMetrics(
  current: PerformanceMetrics,
  todayTss: number
): PerformanceMetrics {
  const ctlDecay = 1 - Math.exp(-1 / FITNESS_TIME_CONSTANT_DAYS);
  const atlDecay = 1 - Math.exp(-1 / FATIGUE_TIME_CONSTANT_DAYS);

  const ctl = current.ctl + (todayTss - current.ctl) * ctlDecay;
  const atl = current.atl + (todayTss - current.atl) * atlDecay;
  const tsb = ctl - atl;

  return { ctl, atl, tsb };
}

/**
 * Project CTL/ATL/TSB forward through a planned week of TSS values.
 * Used to model race-day form during taper planning.
 */
export function projectPerformanceMetrics(
  current: PerformanceMetrics,
  plannedDailyTss: number[],   // one entry per day
): PerformanceMetrics[] {
  const projections: PerformanceMetrics[] = [];
  let state = { ...current };

  for (const tss of plannedDailyTss) {
    state = updatePerformanceMetrics(state, tss);
    projections.push({ ...state });
  }

  return projections;
}

// ─── Readiness Score ──────────────────────────────────────────────────────────

export interface ReadinessInput {
  tsb: number;
  sleepQuality?: "poor" | "fair" | "good" | "excellent";
  perceivedRecovery?: number;   // athlete self-report 1–10
  daysSinceLastHardSession: number;
  recentIllness: boolean;
}

export type ReadinessLevel = "low" | "moderate" | "good" | "excellent";

/**
 * Compute a 0–100 readiness score for the athlete.
 *
 * Used to gate hard session placement: if readiness is low,
 * the adaptive engine shifts quality to a later day.
 */
export function computeReadiness(input: ReadinessInput): {
  score: number;
  level: ReadinessLevel;
  recommendation: string;
} {
  if (input.recentIllness) {
    return { score: 20, level: "low", recommendation: "Do not train until 24 hours symptom-free. Even easy runs while sick suppress immunity further." };
  }

  let score = 50;

  // TSB contribution (0–30 points)
  if (input.tsb > 15) score += 30;
  else if (input.tsb > 5) score += 20;
  else if (input.tsb > -5) score += 10;
  else if (input.tsb > -20) score += 0;
  else score -= 15;

  // Recovery between hard sessions
  if (input.daysSinceLastHardSession >= 2) score += 15;
  else if (input.daysSinceLastHardSession === 1) score += 5;
  else score -= 10;

  // Sleep quality
  const sleepBonus: Record<string, number> = { poor: -15, fair: -5, good: 5, excellent: 10 };
  score += sleepBonus[input.sleepQuality ?? "good"] ?? 0;

  // Self-reported recovery
  if (input.perceivedRecovery !== undefined) {
    score += (input.perceivedRecovery - 5) * 2;
  }

  score = Math.max(0, Math.min(100, score));

  let level: ReadinessLevel;
  let recommendation: string;

  if (score >= 75) {
    level = "excellent";
    recommendation = "You're primed. Attack today's session.";
  } else if (score >= 55) {
    level = "good";
    recommendation = "Good readiness. Execute as planned.";
  } else if (score >= 35) {
    level = "moderate";
    recommendation = "Moderate readiness. If a key session is planned, consider shifting it one day. Easy runs are fine.";
  } else {
    level = "low";
    recommendation = "Low readiness. Replace any quality work with an easy or recovery run today.";
  }

  return { score, level, recommendation };
}
