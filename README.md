# Booking

A booking application built to learn the Vite+ toolchain, a modern quality
pipeline, and REST backend design end to end. Not production-ready — the
domain logic is intentionally a CRUD stub while the scaffold gets hardened.

## Prerequisites

- Node.js >= 22.12.0
- pnpm (see `packageManager` in the root `package.json` for the exact version)
- Docker (for PostgreSQL database and Jaeger observability stack)

## Setup

```bash
pnpm install

```

Start local infrastructure services (PostgreSQL + Jaeger):

```bash
pnpm services:up

```

Create `apps/server/.env` (gitignored):

```
DATABASE_URL=postgresql://<user>:<password>@localhost:5432/<db>
PORT=3000

```

Run migrations and seed data:

```bash
pnpm --filter server run db:migrate
pnpm --filter server run db:seed

```

## Running the project

Start everything (client + server) in parallel from the root:

```bash
pnpm run dev

```

Or run a single app:

```bash
pnpm --filter client run dev   # http://localhost:5173
pnpm --filter server run dev   # http://localhost:3000

```

Server API docs (Swagger UI): `http://localhost:3000/api-docs`

Server health check: `http://localhost:3000/health`

## Infrastructure & Observability

Local background services are managed via Docker Compose:

```bash
pnpm services:up     # Start Postgres and Jaeger containers
pnpm services:down   # Stop containers
pnpm services:logs   # Tail logs for background services

```

- **PostgreSQL:** Running on `localhost:5432`
- **Jaeger UI:** `http://localhost:16686` — OpenTelemetry trace dashboard (select `booking-server` service)

## Testing

```bash
pnpm --filter client run test          # all client tests
pnpm --filter client run test:unit     # unit only
pnpm --filter client run test:browser  # component tests (real Chromium)
pnpm --filter client run test:e2e      # Playwright E2E
pnpm --filter server run test          # server unit/integration/contract tests

```

## Quality checks

```bash
pnpm run ready          # type check, lint, test, and build, recursively
pnpm --filter client run check   # lint/format/types + knip (client)
pnpm --filter server run check   # lint/format/types + knip (server)

```

## Project structure

```
apps/
  client/   Vue 3 + Vite frontend
  server/   Express + Drizzle ORM + PostgreSQL backend
packages/
  utils/    Shared Zod schemas, Drizzle table definitions, generated OpenAPI types

```

## Database

- **ORM:** Drizzle
- **Schema source of truth:** `packages/utils/src/db/schema.ts`
- **Migrations:** `pnpm --filter server run db:generate` (after schema changes),
  then `db:migrate` to apply
- **Tests:** run against an in-memory PGlite instance, not your local Postgres —
  no setup needed for `pnpm --filter server run test`

## Deployment

Not yet configured — currently local-development-only.
