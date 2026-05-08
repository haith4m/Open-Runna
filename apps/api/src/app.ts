import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import jwt from "@fastify/jwt";
import rateLimit from "@fastify/rate-limit";
import websocket from "@fastify/websocket";

import { prismaPlugin } from "./plugins/prisma.js";
import { redisPlugin } from "./plugins/redis.js";

import { authRoutes } from "./routes/auth.js";
import { profileRoutes } from "./routes/profile.js";
import { planRoutes } from "./routes/plans.js";
import { workoutRoutes } from "./routes/workouts.js";
import { runRoutes } from "./routes/runs.js";
import { coachRoutes } from "./routes/coach.js";
import { analyticsRoutes } from "./routes/analytics.js";

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: process.env["LOG_LEVEL"] ?? "info",
      transport: process.env["NODE_ENV"] !== "production"
        ? { target: "pino-pretty" }
        : undefined,
    },
    trustProxy: true,
  });

  // ─── Security ───────────────────────────────────────────────────────────
  await app.register(helmet, {
    contentSecurityPolicy: false, // API-only, no HTML
  });

  await app.register(cors, {
    origin: process.env["CORS_ORIGIN"] ?? "*",
    credentials: true,
  });

  await app.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
    redis: undefined, // will be hooked up via redis plugin
  });

  // ─── Auth ────────────────────────────────────────────────────────────────
  await app.register(jwt, {
    secret: process.env["JWT_SECRET"] ?? "dev_secret_change_in_production",
    sign: { expiresIn: "15m" },
  });

  // ─── WebSocket ───────────────────────────────────────────────────────────
  await app.register(websocket);

  // ─── Plugins (DB, Cache) ──────────────────────────────────────────────────
  await app.register(prismaPlugin);
  await app.register(redisPlugin);

  // ─── Routes ──────────────────────────────────────────────────────────────
  await app.register(authRoutes,      { prefix: "/api/v1/auth"      });
  await app.register(profileRoutes,   { prefix: "/api/v1/profile"   });
  await app.register(planRoutes,      { prefix: "/api/v1/plans"     });
  await app.register(workoutRoutes,   { prefix: "/api/v1/workouts"  });
  await app.register(runRoutes,       { prefix: "/api/v1/runs"      });
  await app.register(coachRoutes,     { prefix: "/api/v1/coach"     });
  await app.register(analyticsRoutes, { prefix: "/api/v1/analytics" });

  // ─── Health Check ─────────────────────────────────────────────────────────
  app.get("/health", async () => ({ status: "ok", timestamp: new Date().toISOString() }));

  return app;
}
