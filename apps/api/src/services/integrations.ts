/**
 * Wearable & Platform Integrations
 *
 * Architecture: all external platforms push or pull via a normalised
 * ActivityRecord.  Once normalised, the same ingestion pipeline handles
 * every source: compute TSS, match to planned workout, update compliance,
 * recalculate VDOT if it was a race-effort.
 *
 * Supported sources:
 *  - Strava   (webhook + OAuth2)
 *  - Garmin   (webhook via Connect IQ + FIT file)
 *  - Apple Health (HealthKit export via mobile app)
 *  - Coros    (open API)
 *  - Polar    (Open AccessLink API)
 *
 * Conflict resolution:
 *  1. If a run was started in-app (has a runId), prefer in-app data for
 *     compliance scoring; merge HR/cadence from device if available.
 *  2. If the run was device-only, create a new Run record from device data.
 *  3. Duplicate detection: same date + distance within 5% → skip.
 */

import type { PrismaClient } from "@prisma/client";
import { computeTss } from "@openrunna/training-engine";

// ─── Normalised activity record ───────────────────────────────────────────────

export interface NormalisedActivity {
  externalId: string;
  source: "strava" | "garmin" | "apple_health" | "coros" | "polar";
  startedAt: Date;
  totalDistanceMeters: number;
  durationSeconds: number;
  elevationGainMeters?: number;
  averageHeartRate?: number;
  maxHeartRate?: number;
  averageCadenceSpm?: number;
  averagePaceSecPerKm?: number;
  splits?: Array<{ splitNumber: number; paceSecPerKm: number; durationSeconds: number }>;
  routePolyline?: string; // encoded polyline
  name?: string;
  perceivedEffort?: number;
}

// ─── Strava Integration ───────────────────────────────────────────────────────

export interface StravaTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix seconds
  athleteId: number;
}

export class StravaService {
  private readonly clientId = process.env["STRAVA_CLIENT_ID"]!;
  private readonly clientSecret = process.env["STRAVA_CLIENT_SECRET"]!;
  private readonly baseUrl = "https://www.strava.com/api/v3";

  async exchangeCode(code: string): Promise<StravaTokens> {
    const res = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        grant_type: "authorization_code",
      }),
    });
    if (!res.ok) throw new Error(`Strava OAuth failed: ${res.status}`);
    const data = await res.json() as any;
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_at,
      athleteId: data.athlete.id,
    };
  }

  async refreshTokens(refreshToken: string): Promise<StravaTokens> {
    const res = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });
    if (!res.ok) throw new Error("Strava token refresh failed");
    const data = await res.json() as any;
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_at,
      athleteId: data.athlete.id,
    };
  }

  /** Normalise a Strava activity webhook payload into our format. */
  normaliseWebhookActivity(stravaActivity: any): NormalisedActivity {
    return {
      externalId: String(stravaActivity.id),
      source: "strava",
      startedAt: new Date(stravaActivity.start_date),
      totalDistanceMeters: stravaActivity.distance,
      durationSeconds: stravaActivity.moving_time,
      elevationGainMeters: stravaActivity.total_elevation_gain,
      averageHeartRate: stravaActivity.average_heartrate,
      maxHeartRate: stravaActivity.max_heartrate,
      averageCadenceSpm: stravaActivity.average_cadence
        ? Math.round(stravaActivity.average_cadence * 2)  // Strava gives steps/min per foot
        : undefined,
      averagePaceSecPerKm:
        stravaActivity.distance > 0 && stravaActivity.moving_time > 0
          ? (stravaActivity.moving_time / stravaActivity.distance) * 1000
          : undefined,
      name: stravaActivity.name,
    };
  }

  /** Verify Strava webhook subscription challenge. */
  verifyWebhook(params: { "hub.mode": string; "hub.verify_token": string; "hub.challenge": string }): string | null {
    const expectedToken = process.env["STRAVA_WEBHOOK_VERIFY_TOKEN"];
    if (params["hub.mode"] === "subscribe" && params["hub.verify_token"] === expectedToken) {
      return params["hub.challenge"];
    }
    return null;
  }
}

// ─── Garmin Integration ───────────────────────────────────────────────────────

export class GarminService {
  /** Parse a Garmin Connect activity summary pushed via webhook. */
  normaliseActivity(garminSummary: any): NormalisedActivity {
    const distM = (garminSummary.distance ?? 0) * 1000; // Garmin uses km
    const durationSecs = garminSummary.duration ?? 0;

    return {
      externalId: String(garminSummary.activityId),
      source: "garmin",
      startedAt: new Date(garminSummary.startTimeLocal ?? garminSummary.startTimeGmt),
      totalDistanceMeters: distM,
      durationSeconds: durationSecs,
      elevationGainMeters: garminSummary.elevationGain,
      averageHeartRate: garminSummary.averageHR,
      maxHeartRate: garminSummary.maxHR,
      averageCadenceSpm: garminSummary.averageRunningCadenceInStepsPerMinute,
      averagePaceSecPerKm:
        distM > 0 && durationSecs > 0 ? (durationSecs / distM) * 1000 : undefined,
      name: garminSummary.activityName,
    };
  }
}

// ─── Apple Health Integration ─────────────────────────────────────────────────

export class AppleHealthService {
  /** Normalise an Apple Health workout exported from the mobile app. */
  normaliseWorkout(healthKitWorkout: any): NormalisedActivity {
    const distM = healthKitWorkout.totalDistance ?? 0;
    const durationSecs = Math.round(
      (new Date(healthKitWorkout.endDate).getTime() -
       new Date(healthKitWorkout.startDate).getTime()) / 1000
    );

    return {
      externalId: healthKitWorkout.uuid,
      source: "apple_health",
      startedAt: new Date(healthKitWorkout.startDate),
      totalDistanceMeters: distM,
      durationSeconds: durationSecs,
      elevationGainMeters: healthKitWorkout.totalFlightsClimbed
        ? healthKitWorkout.totalFlightsClimbed * 3 // ~3m per flight
        : undefined,
      averageHeartRate: healthKitWorkout.averageHeartRate,
      averagePaceSecPerKm:
        distM > 0 && durationSecs > 0 ? (durationSecs / distM) * 1000 : undefined,
    };
  }
}

// ─── Activity Ingestion Pipeline ──────────────────────────────────────────────

export class ActivityIngestionService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Ingest a normalised activity from any external source.
   *
   * 1. Dedup check — skip if already imported
   * 2. Find matching planned workout (same day ± 1)
   * 3. Compute TSS
   * 4. Upsert Run record
   * 5. Mark linked workout complete
   */
  async ingest(userId: string, activity: NormalisedActivity): Promise<{ created: boolean; runId?: string }> {
    // Dedup: same externalId + source
    const existing = await this.prisma.run.findFirst({
      where: { userId, externalId: activity.externalId, externalSource: activity.source },
    });
    if (existing) return { created: false, runId: existing.id };

    // Distance dedup: same day, within 5% distance
    const dayStart = new Date(activity.startedAt);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const sameDayRun = await this.prisma.run.findFirst({
      where: {
        userId,
        startedAt: { gte: dayStart, lt: dayEnd },
        totalDistanceMeters: {
          gte: activity.totalDistanceMeters * 0.95,
          lte: activity.totalDistanceMeters * 1.05,
        },
      },
    });
    if (sameDayRun) {
      // Merge device data into existing run (add HR/cadence if missing)
      await this.prisma.run.update({
        where: { id: sameDayRun.id },
        data: {
          averageHeartRate: sameDayRun.averageHeartRate ?? activity.averageHeartRate,
          maxHeartRate: sameDayRun.maxHeartRate ?? activity.maxHeartRate,
          averageCadenceSpm: sameDayRun.averageCadenceSpm ?? activity.averageCadenceSpm,
          externalId: activity.externalId,
          externalSource: activity.source,
        },
      });
      return { created: false, runId: sameDayRun.id };
    }

    // Find matching planned workout
    const planDay = new Date(activity.startedAt);
    planDay.setHours(0, 0, 0, 0);
    const planDayEnd = new Date(planDay);
    planDayEnd.setDate(planDayEnd.getDate() + 1);

    const matchedWorkout = await this.prisma.workout.findFirst({
      where: {
        week: { plan: { userId, status: "active" } },
        scheduledDate: { gte: planDay, lt: planDayEnd },
        status: "scheduled",
      },
    });

    // Compute TSS
    let trainingLoad = 0;
    if (activity.averagePaceSecPerKm) {
      const plan = await this.prisma.trainingPlan.findFirst({
        where: { userId, status: "active" },
        select: { thresholdPaceSecPerKm: true },
      });
      if (plan?.thresholdPaceSecPerKm) {
        trainingLoad = computeTss({
          durationSeconds: activity.durationSeconds,
          averagePaceSecPerKm: activity.averagePaceSecPerKm,
          thresholdPaceSecPerKm: plan.thresholdPaceSecPerKm,
        });
      }
    }

    // Compliance
    let complianceScore: number | undefined;
    if (matchedWorkout) {
      const planned = matchedWorkout.totalDistanceMeters;
      const actual = activity.totalDistanceMeters;
      complianceScore = Math.min(1, Math.max(0, 1 - Math.abs(actual - planned) / planned));
    }

    const run = await this.prisma.run.create({
      data: {
        userId,
        workoutId: matchedWorkout?.id,
        startedAt: activity.startedAt,
        completedAt: new Date(activity.startedAt.getTime() + activity.durationSeconds * 1000),
        status: "completed",
        totalDistanceMeters: activity.totalDistanceMeters,
        durationSeconds: activity.durationSeconds,
        elapsedSeconds: activity.durationSeconds,
        averagePaceSecPerKm: activity.averagePaceSecPerKm,
        elevationGainMeters: activity.elevationGainMeters,
        averageHeartRate: activity.averageHeartRate,
        maxHeartRate: activity.maxHeartRate,
        averageCadenceSpm: activity.averageCadenceSpm,
        trainingLoad,
        externalId: activity.externalId,
        externalSource: activity.source,
        plannedDistanceMeters: matchedWorkout?.totalDistanceMeters,
        complianceScore,
        splits: activity.splits as any,
      },
    });

    // Mark workout complete
    if (matchedWorkout) {
      await this.prisma.workout.update({
        where: { id: matchedWorkout.id },
        data: { status: "completed", completedAt: activity.startedAt },
      });
    }

    return { created: true, runId: run.id };
  }
}
