import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { authenticate } from "../middleware/auth.js";
import {
  StravaService,
  GarminService,
  AppleHealthService,
  ActivityIngestionService,
} from "../services/integrations.js";

const strava = new StravaService();
const garmin = new GarminService();
const appleHealth = new AppleHealthService();

export async function integrationRoutes(app: FastifyInstance) {
  // ─── Strava ───────────────────────────────────────────────────────────────

  /** Redirect user to Strava OAuth consent screen. */
  app.get("/strava/connect", { preHandler: authenticate }, async (request, reply) => {
    const { userId } = request.user;
    const redirectUri = `${process.env["API_BASE_URL"]}/api/v1/integrations/strava/callback`;
    const scope = "read,activity:read_all";
    const url =
      `https://www.strava.com/oauth/authorize` +
      `?client_id=${process.env["STRAVA_CLIENT_ID"]}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&scope=${scope}` +
      `&state=${userId}`;
    return reply.redirect(url);
  });

  /** OAuth callback — exchange code, persist tokens. */
  app.get("/strava/callback", async (request, reply) => {
    const { code, state: userId, error } = request.query as Record<string, string>;

    if (error || !code || !userId) {
      return reply.status(400).send({ error: error ?? "Missing OAuth params" });
    }

    const tokens = await strava.exchangeCode(code);

    await app.prisma.wearableConnection.upsert({
      where: { userId_source: { userId, source: "strava" } },
      create: {
        userId,
        source: "strava",
        externalUserId: String(tokens.athleteId),
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tokenExpiresAt: new Date(tokens.expiresAt * 1000),
        connected: true,
      },
      update: {
        externalUserId: String(tokens.athleteId),
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tokenExpiresAt: new Date(tokens.expiresAt * 1000),
        connected: true,
      },
    });

    // Deep-link back to mobile app
    const deepLink = `openrunna://strava-connected`;
    return reply.redirect(deepLink);
  });

  /** Strava webhook subscription verification (GET). */
  app.get("/strava/webhook", async (request, reply) => {
    const params = request.query as {
      "hub.mode": string;
      "hub.verify_token": string;
      "hub.challenge": string;
    };
    const challenge = strava.verifyWebhook(params);
    if (!challenge) return reply.status(403).send({ error: "Invalid verify token" });
    return reply.send({ "hub.challenge": challenge });
  });

  /** Strava webhook event (POST) — new activity, deauthorise, etc. */
  app.post("/strava/webhook", async (request, reply) => {
    const body = request.body as any;

    // Acknowledge immediately — Strava expects 200 within 2s
    reply.status(200).send({});

    if (body?.object_type !== "activity" || body?.aspect_type !== "create") return;

    const athleteId = String(body.owner_id);
    const conn = await app.prisma.wearableConnection.findFirst({
      where: { source: "strava", externalUserId: athleteId, connected: true },
    });
    if (!conn) return;

    // Refresh token if expired
    let accessToken = conn.accessToken;
    if (conn.tokenExpiresAt && conn.tokenExpiresAt <= new Date()) {
      const refreshed = await strava.refreshTokens(conn.refreshToken!);
      await app.prisma.wearableConnection.update({
        where: { id: conn.id },
        data: {
          accessToken: refreshed.accessToken,
          refreshToken: refreshed.refreshToken,
          tokenExpiresAt: new Date(refreshed.expiresAt * 1000),
        },
      });
      accessToken = refreshed.accessToken;
    }

    // Fetch the full activity from Strava API
    const actRes = await fetch(
      `https://www.strava.com/api/v3/activities/${body.object_id}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!actRes.ok) return;

    const stravaActivity = await actRes.json();

    // Only process runs/trail runs
    if (!["Run", "TrailRun", "VirtualRun"].includes(stravaActivity.type)) return;

    const activity = strava.normaliseWebhookActivity(stravaActivity);
    const ingestion = new ActivityIngestionService(app.prisma);
    await ingestion.ingest(conn.userId, activity);
  });

  /** Disconnect Strava. */
  app.delete("/strava/disconnect", { preHandler: authenticate }, async (request, reply) => {
    const { userId } = request.user;
    await app.prisma.wearableConnection.updateMany({
      where: { userId, source: "strava" },
      data: { connected: false, accessToken: null, refreshToken: null },
    });
    return reply.send({ disconnected: true });
  });

  // ─── Garmin ────────────────────────────────────────────────────────────────

  /** Garmin activity push — Garmin Health API pushes a batch of summaries. */
  app.post("/garmin/webhook", async (request, reply) => {
    const body = request.body as any;
    reply.status(200).send({});

    const summaries: any[] = body?.activityDetails ?? body?.activities ?? [];
    if (!summaries.length) return;

    for (const summary of summaries) {
      const externalUserId = String(summary.userId ?? summary.userAccessToken);
      if (!externalUserId) continue;

      const conn = await app.prisma.wearableConnection.findFirst({
        where: { source: "garmin", externalUserId, connected: true },
      });
      if (!conn) continue;

      // Only process running activities
      const actType: string = summary.activityType ?? "";
      if (!actType.toLowerCase().includes("running")) continue;

      const activity = garmin.normaliseActivity(summary);
      const ingestion = new ActivityIngestionService(app.prisma);
      await ingestion.ingest(conn.userId, activity);
    }
  });

  // ─── Apple Health ──────────────────────────────────────────────────────────

  /** Mobile app uploads a batch of HealthKit workout objects. */
  app.post("/apple-health/upload", { preHandler: authenticate }, async (request, reply) => {
    const { userId } = request.user;

    const Schema = z.object({
      workouts: z.array(z.object({
        uuid: z.string(),
        startDate: z.string(),
        endDate: z.string(),
        totalDistance: z.number(),
        averageHeartRate: z.number().optional(),
        totalFlightsClimbed: z.number().optional(),
      })).max(50),
    });

    const parsed = Schema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });

    const ingestion = new ActivityIngestionService(app.prisma);
    const results: Array<{ uuid: string; created: boolean; runId?: string }> = [];

    for (const workout of parsed.data.workouts) {
      const activity = appleHealth.normaliseWorkout(workout);
      const result = await ingestion.ingest(userId, activity);
      results.push({ uuid: workout.uuid, ...result });
    }

    const created = results.filter((r) => r.created).length;
    return reply.send({ processed: results.length, created, results });
  });

  // ─── Connection status ─────────────────────────────────────────────────────

  app.get("/status", { preHandler: authenticate }, async (request, reply) => {
    const { userId } = request.user;

    const connections = await app.prisma.wearableConnection.findMany({
      where: { userId },
      select: { source: true, connected: true, tokenExpiresAt: true, createdAt: true },
    });

    const bySource = Object.fromEntries(
      connections.map((c) => [c.source, { connected: c.connected, since: c.createdAt }])
    );

    return reply.send({ connections: bySource });
  });
}
