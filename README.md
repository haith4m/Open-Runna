# Open Runna

> Adaptive AI-powered run training system.  
> Train like a professional. Guided by real sports science.

---

## What This Is

Open Runna is a production-grade running training application that generates and continuously adapts personalised training plans. It is not a generic fitness app. It is a **structured run training system** built on exercise physiology, progressive overload, and intelligent scheduling — the same principles used by elite running coaches.

The core philosophy: most runners fail because their plans are too generic, their pacing is wrong, their progression is unrealistic, and their plans don't adapt to real life. Open Runna solves all of that.

---

## Architecture

```
open-runna/
├── packages/
│   ├── shared/              # TypeScript types, constants, utility functions
│   ├── pace-calculator/     # VDOT engine, Jack Daniels formula, race prediction
│   └── training-engine/     # Periodization, workout generation, adaptive logic
│
├── apps/
│   ├── api/                 # Fastify backend, Prisma ORM, PostgreSQL, Redis
│   └── mobile/              # React Native (Expo), all screens
│
└── docker-compose.yml       # Postgres (TimescaleDB) + Redis
```

### Monorepo: Turborepo + pnpm workspaces

---

## Core Engine: Sports Science

### VDOT System (`packages/pace-calculator`)

VDOT (Jack Daniels, 1979) is an effective VO2max that captures both aerobic capacity **and** running economy in a single number derived from race performance.

**Formula:**
```
VO2(v)   = -4.60 + 0.182258·v + 0.000104·v²
pct(t)   = 0.8 + 0.1894393·e^(−0.012778·t) + 0.2989558·e^(−0.1932605·t)
VDOT     = VO2(v) / pct(t)
```
Where `v` = velocity in m·min⁻¹, `t` = race duration in minutes.

**Training Zones (% of VDOT):**

| Zone        | % of VDOT | Purpose                          |
|-------------|-----------|----------------------------------|
| Recovery    | 59–65%    | Active recovery                  |
| Easy        | 65–79%    | Aerobic base, 80% of all volume  |
| Marathon    | 75–84%    | Race-specific endurance          |
| Threshold   | 83–88%    | Lactate threshold development    |
| Interval    | 95–100%   | VO2max development               |
| Repetition  | 105–120%  | Speed + running economy          |

**Race prediction** uses Newton's method to invert the VDOT formula for any distance. The Riegel formula is also available as a cross-check.

**VDOT estimation without race data:** runners who don't know their race times provide their comfortable easy pace, which is mapped to an approximate VDOT with a 50% confidence score. Confidence increases as runs are logged.

---

### Training Plan Engine (`packages/training-engine`)

#### Periodization

Every plan is structured as a **macrocycle** containing three training phases plus a taper:

```
BASE → BUILD → PEAK → TAPER
```

Phase allocation by experience:
- **Beginner:**     50% Base / 30% Build / 20% Peak
- **Intermediate:** 40% Base / 35% Build / 25% Peak  
- **Advanced:**     35% Base / 35% Build / 30% Peak

**3:1 loading cycle** (Lydiard/Daniels standard): three weeks of progressive load followed by one recovery week at ~75% of the prior week. This is the most evidence-based loading pattern in endurance training.

#### Volume Progression

- Starts at the athlete's current weekly mileage
- Increases by no more than 10% or 6 km/week (whichever is smaller)
- Long run: never more than 30% of weekly mileage (injury threshold)
- Taper: volume drops to 60% of peak in race week

#### Workout Types

| Type              | Zone       | Purpose                              |
|-------------------|------------|--------------------------------------|
| Easy Run          | Easy       | Aerobic base (80% of volume)         |
| Recovery Run      | Recovery   | Active recovery post-hard session    |
| Long Run          | Easy       | Endurance cornerstone                |
| Tempo Run         | Threshold  | Lactate threshold                    |
| Cruise Intervals  | Threshold  | Same benefit as tempo, more accessible|
| VO2max Intervals  | Interval   | Raise aerobic ceiling                |
| Repetitions       | Repetition | Running economy + speed              |
| Hill Repeats      | Interval   | Strength + power, injury-safe        |
| Marathon Pace Run | Marathon   | Race specificity                     |
| Progression Run   | Mixed      | Pacing discipline + race simulation  |

#### Adaptive Engine

The plan adapts automatically on these triggers:

| Trigger                        | Response                                              |
|-------------------------------|-------------------------------------------------------|
| Missed key session            | Reschedule within 2 days, then continue               |
| Missed easy run               | No action (easy runs don't derail plans)              |
| Injury (minor)                | Cancel quality sessions for 1 week                   |
| Injury (moderate)             | Remove quality, cut volume 40% for 2 weeks           |
| Injury (severe)               | Cancel all running, replace with cross-training       |
| High fatigue (TSB < −25)      | Insert unplanned recovery, swap next hard session     |
| Illness (1–2 days)            | Resume at 80% effort                                 |
| Illness (3–5 days)            | Full recovery week, then gentle rebuild               |
| Better-than-expected perf     | Update VDOT, recalculate all training paces          |
| Schedule change               | Re-slot workouts to new available days               |

#### Fatigue Model (Banister Impulse-Response)

```
CTL(t) = CTL(t−1) + (TSS(t) − CTL(t−1)) × (1 − e^(−1/42))  # Fitness, 42-day constant
ATL(t) = ATL(t−1) + (TSS(t) − ATL(t−1)) × (1 − e^(−1/7))   # Fatigue, 7-day constant
TSB    = CTL − ATL                                             # Form
```

Race-day TSB target: **+10 to +25** (fresh but not detrained).

---

## Stack

### Backend (`apps/api`)
- **Fastify 4** — high-performance Node.js framework
- **Prisma 5** — type-safe ORM
- **PostgreSQL + TimescaleDB** — relational data + time-series GPS points
- **Redis** — session cache, week summary cache, rate limiting
- **Anthropic Claude** — AI coaching responses (`claude-sonnet-4-6`)
- **JWT** — access tokens (15 min) + refresh tokens (30 days)
- **Zod** — request validation

### Mobile (`apps/mobile`)
- **Expo SDK 51 + Expo Router 3** — file-based navigation
- **React Native** — iOS + Android
- **NativeWind 4** — Tailwind CSS for React Native
- **TanStack Query 5** — server state management
- **Zustand 4** — client state (auth, active run)
- **expo-location** — GPS tracking
- **expo-haptics** — lap vibration feedback

---

## Getting Started

### Prerequisites
- Node.js 20+
- pnpm 9+
- Docker + Docker Compose

### Setup

```bash
# Install dependencies
pnpm install

# Start infrastructure
docker-compose up -d

# Set up environment
cp apps/api/.env.example apps/api/.env
# Add ANTHROPIC_API_KEY to apps/api/.env

# Run database migrations
pnpm db:migrate

# Start everything
pnpm dev
```

### API runs on `http://localhost:3000`
### Mobile: `cd apps/mobile && pnpm start`

---

## API Reference

```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh

GET    /api/v1/profile
PUT    /api/v1/profile
POST   /api/v1/profile/recalculate-vdot

POST   /api/v1/plans/generate
GET    /api/v1/plans/active
GET    /api/v1/plans/active/current-week
POST   /api/v1/plans/:id/adapt

GET    /api/v1/workouts/today
GET    /api/v1/workouts/upcoming
GET    /api/v1/workouts/:id
PATCH  /api/v1/workouts/:id/status

POST   /api/v1/runs/start
PATCH  /api/v1/runs/:id/live
POST   /api/v1/runs/:id/finish
GET    /api/v1/runs

POST   /api/v1/coach/chat
GET    /api/v1/coach/week-summary
GET    /api/v1/coach/history

GET    /api/v1/analytics/weekly-mileage
GET    /api/v1/analytics/pace-progression
GET    /api/v1/analytics/fitness-trend
GET    /api/v1/analytics/race-predictions
GET    /api/v1/analytics/training-load
GET    /api/v1/analytics/consistency
```

---

## The Coaching Philosophy

> *"Most runners run their easy days too fast and their hard days too easy."*  
> — Every elite coach, ever.

The 80/20 principle (Seiler, 2010) is the scientific foundation: ~80% of weekly volume at low intensity (zones 1–2), ~20% at moderate-to-high intensity. This is how elite runners train globally across all disciplines.

The app enforces this:
- Easy runs have explicit pace ceilings
- Quality sessions have pace floors
- The adaptive engine flags pace deviations in real time

Beginners especially benefit: the app resists the instinct to run everything at a hard effort, which is the single biggest cause of injury and burnout in new runners.

---

## License

MIT
