import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { nanoid } from "nanoid";
import { createHash, timingSafeEqual } from "crypto";

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

function hashPassword(password: string): string {
  // In production: use bcrypt or argon2. Using SHA-256 + salt here for simplicity.
  const salt = process.env["PASSWORD_SALT"] ?? "openrunna_salt";
  return createHash("sha256").update(salt + password).digest("hex");
}

function verifyPassword(password: string, hash: string): boolean {
  const computed = Buffer.from(hashPassword(password));
  const stored = Buffer.from(hash);
  if (computed.length !== stored.length) return false;
  return timingSafeEqual(computed, stored);
}

export async function authRoutes(app: FastifyInstance) {
  // ─── Register ─────────────────────────────────────────────────────────────
  app.post("/register", async (request, reply) => {
    const body = RegisterSchema.safeParse(request.body);
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() });

    const { email, password } = body.data;

    const existing = await app.prisma.user.findUnique({ where: { email } });
    if (existing) return reply.status(409).send({ error: "Email already registered" });

    const user = await app.prisma.user.create({
      data: {
        email,
        passwordHash: hashPassword(password),
        profile: {
          create: {
            experienceLevel: "beginner",
            weeklyMileageKm: 0,
            longestRecentRunKm: 0,
            yearsRunning: 0,
          },
        },
      },
      include: { profile: true },
    });

    const accessToken = await reply.jwtSign({ userId: user.id, email: user.email });
    const refreshToken = nanoid(64);

    await app.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    return reply.status(201).send({
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, hasProfile: !!user.profile },
    });
  });

  // ─── Login ────────────────────────────────────────────────────────────────
  app.post("/login", async (request, reply) => {
    const body = LoginSchema.safeParse(request.body);
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() });

    const { email, password } = body.data;

    const user = await app.prisma.user.findUnique({ where: { email } });
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return reply.status(401).send({ error: "Invalid credentials" });
    }

    const accessToken = await reply.jwtSign({ userId: user.id, email: user.email });
    const refreshToken = nanoid(64);

    await app.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    return { accessToken, refreshToken, user: { id: user.id, email: user.email } };
  });

  // ─── Refresh ──────────────────────────────────────────────────────────────
  app.post("/refresh", async (request, reply) => {
    const body = z.object({ refreshToken: z.string() }).safeParse(request.body);
    if (!body.success) return reply.status(400).send({ error: "Missing token" });

    const record = await app.prisma.refreshToken.findUnique({
      where: { token: body.data.refreshToken },
      include: { user: true },
    });

    if (!record || record.expiresAt < new Date()) {
      return reply.status(401).send({ error: "Invalid or expired refresh token" });
    }

    const accessToken = await reply.jwtSign({
      userId: record.user.id,
      email: record.user.email,
    });

    return { accessToken };
  });

  // ─── Logout ───────────────────────────────────────────────────────────────
  app.post("/logout", async (request, reply) => {
    const body = z.object({ refreshToken: z.string() }).safeParse(request.body);
    if (body.success) {
      await app.prisma.refreshToken.deleteMany({
        where: { token: body.data.refreshToken },
      });
    }
    return reply.status(204).send();
  });
}
