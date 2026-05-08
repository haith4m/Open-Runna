# Open Runna

Production-grade AI-powered adaptive running coach platform.

## Architecture Overview

### Tech Stack

**Frontend (Mobile):**
- React Native Expo
- TypeScript
- Expo Router (file-based routing)
- TanStack Query (React Query)
- Zustand (state management)
- React Native Reanimated (animations)
- React Native Skia (advanced graphics)
- NativeWind (Tailwind CSS)

**Backend:**
- Node.js + NestJS
- TypeScript
- PostgreSQL + TimescaleDB (time-series data)
- Prisma ORM
- Redis (caching & real-time)
- BullMQ (job processing)

**AI & ML:**
- OpenAI API (GPT-4)
- Vector embeddings
- RAG (Retrieval-Augmented Generation)
- Faiss/Pinecone (vector DB)

**Infrastructure:**
- Docker + Docker Compose
- Railway/AWS
- Cloudflare CDN
- GitHub Actions CI/CD
- Sentry (error tracking)
- PostHog (analytics)

## Directory Structure

```
open-runna/
├── apps/
│   ├── mobile/              # React Native Expo app
│   │   ├── src/
│   │   │   ├── screens/    # Tab-based screens
│   │   │   ├── components/ # Reusable components
│   │   │   ├── hooks/      # Custom React hooks
│   │   │   ├── stores/     # Zustand stores
│   │   │   ├── services/   # API & tracking services
│   │   │   ├── utils/      # Utilities
│   │   │   └── app.json    # Expo config
│   │   └── package.json
│   │
│   └── api/                 # NestJS backend
│       ├── src/
│       │   ├── modules/    # Feature modules
│       │   ├── common/     # Shared code
│       │   ├── database/   # Prisma schemas
│       │   └── main.ts
│       └── package.json
│
├── packages/
│   ├── shared-types/        # Shared TypeScript types
│   ├── shared-utils/        # Shared utilities
│   ├── design-system/       # Component library
│   └── api-client/          # Generated API client
│
├── infrastructure/
│   ├── docker/
│   ├── k8s/
│   ├── ci-cd/              # GitHub Actions
│   └── monitoring/
│
└── docs/
    ├── architecture.md
    ├── api.md
    ├── training-algorithms.md
    ├── database-schema.md
    └── deployment.md
```

## Quick Start

### Prerequisites
- Node.js 20+
- pnpm 8+
- PostgreSQL 15+
- Redis 7+

### Installation

```bash
# Install dependencies
pnpm install

# Copy environment files
cp apps/api/.env.example apps/api/.env.local
cp apps/mobile/.env.example apps/mobile/.env.local

# Setup database
cd apps/api
prisma migrate dev
prisma db seed

# Start development
pnpm dev
```

### Development

```bash
# All services
pnpm dev

# Mobile only
pnpm dev:mobile

# API only
pnpm dev:api
```

## Key Features

✅ **Intelligent Training Plans**
- VDOT-based pace calculations
- Adaptive progression algorithms
- Race-specific periodization
- Fatigue detection & recovery weeks

✅ **Live GPS Tracking**
- Real-time pace & distance tracking
- Kalman filtering for smooth data
- Interval detection
- Audio cues during workouts

✅ **AI Coach Assistant**
- OpenAI-powered workout explanations
- Personalized coaching advice
- RAG-based knowledge retrieval
- Context-aware responses

✅ **Wearable Integrations**
- Garmin Connect API
- Apple Health / HealthKit
- Strava API
- Coros Integration

✅ **Advanced Analytics**
- Fitness trends (CTL/ATL)
- Training load calculations
- Race predictions
- Injury risk assessment

✅ **Premium Features**
- Adaptive plan modifications
- Advanced analytics dashboard
- Priority AI coaching
- Wearable sync

## Architecture Decisions

### Why Monorepo?
- Shared types across mobile & backend
- Unified development experience
- Consistent versioning
- Shared utilities & constants
- Easier refactoring

### Why Expo?
- Fast iteration cycle
- Native modules when needed
- Over-the-air updates
- Cross-platform (iOS/Android)
- Built-in development tools

### Why NestJS?
- Enterprise-grade architecture
- Strong TypeScript support
- Middleware & guards
- Built-in validation
- Microservice-ready
- Testing utilities

### Why PostgreSQL + TimescaleDB?
- Time-series data optimization
- Automatic data compression
- Hypertables for GPS points
- Efficient queries on large datasets
- Integrated with PostgreSQL

### Why Prisma?
- Type-safe database access
- Auto-generated types from schema
- Built-in migrations
- Developer experience

## Performance Targets

- **Mobile:** < 100ms initial load, < 50ms screen transitions
- **API:** < 100ms p99 latency
- **Database:** < 50ms queries (with proper indexing)
- **GPS:** 10 updates/sec with < 5m accuracy
- **Analytics:** < 1s dashboard load

## Scaling Strategy

### Phase 1 (MVP - 10k users)
- Single PostgreSQL instance
- Redis for caching
- BullMQ for job processing
- Cloudflare CDN for static assets

### Phase 2 (Growth - 100k users)
- PostgreSQL replication
- Read replicas for analytics
- Redis cluster
- Kubernetes for API scaling

### Phase 3 (Scale - 1M+ users)
- TimescaleDB data retention policies
- Sharding by user_id
- Separate analytics database
- Event streaming (Kafka)
- Microservices architecture

## Testing

```bash
pnpm test              # Run all tests
pnpm test:watch        # Watch mode
pnpm test -- --coverage # With coverage
```

Test structure:
- **Unit tests:** Services, utils, algorithms
- **Integration tests:** API routes, database operations
- **E2E tests:** Critical user flows
- **Performance tests:** GPS tracking, analytics

## Deployment

### Local
```bash
docker-compose up
```

### Staging
```bash
git push origin develop
# GitHub Actions triggers automated deployment
```

### Production
```bash
git push origin main
# GitHub Actions triggers automated deployment with manual approval
```

## Monitoring

- **Error Tracking:** Sentry
- **Analytics:** PostHog
- **Performance:** Datadog (APM)
- **Uptime:** UptimeRobot
- **Logs:** CloudWatch / ELK

## Contributing

See CONTRIBUTING.md

## License

MIT - See LICENSE.md
