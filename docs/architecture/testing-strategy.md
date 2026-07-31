# Testing Strategy

What each test layer is for. When adding a test, this is where it should go — not everything
needs to be an e2e test.

## Server (`apps/server`)

| Layer       | Tool                            | What it's for                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ----------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit        | Vitest                          | Pure logic — see `packages/utils/tests/**` (date validation, query-schema parsing, idempotency-key validation, problem-details schema). No DB involved.                                                                                                                                                                                                                                                                                                        |
| Integration | Vitest + `@electric-sql/pglite` | Route/DB behavior against a real, embedded Postgres (`testDb.ts` runs actual drizzle migrations against PGlite) rather than a mocked DB — covers query filtering, idempotency conflicts, rate limiting, error mapping with real SQL behavior.                                                                                                                                                                                                                  |
| Contract    | Vitest + supertest              | `bookings.contract.test.ts` asserts live HTTP responses conform to the same Zod schemas (`bookingSchema`, `problemDetailsSchema`) used to generate the OpenAPI doc — one schema serves docs generation, runtime validation, and contract testing. Add a contract test here whenever a new endpoint is added, rather than a separate contract-testing tool.                                                                                                     |
| Load        | k6 (`load-test.js`)             | Throughput/latency under concurrent load against `/health`, `GET /api/bookings`, `POST /api/bookings`, with explicit thresholds (`http_req_failed rate < 1%`, `p95 < 200ms`). Run via `pnpm test:load`, separately from the regular test suite. Add a dedicated concurrency test here for the hold/confirm flow and the inventory atomic-update path from `data-models.md`, aimed specifically at the last-unit-available race rather than general throughput. |

## Client (`apps/client`)

| Layer                            | Tool                                                             | What it's for                                                                                                                                                                                                                                            |
| -------------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit                             | Vitest (`*.unit.ts`, node environment)                           | Logic with no DOM.                                                                                                                                                                                                                                       |
| Browser/component                | Vitest browser mode (Playwright provider) + `vitest-browser-vue` | Renders real Vue components with MSW mocking the network (`mocks/handlers.ts`). Includes an inline `axe-core` accessibility check on the rendered container as part of the same test, not a separate pass.                                               |
| E2E                              | Playwright (`*.e2e.ts`)                                          | Full app against a real dev/preview server, network intercepted via `page.route` (not MSW). Covers happy path, accessibility (`@axe-core/playwright`), visual regression (`toHaveScreenshot` baseline), and error-state handling (500 response → alert). |
| Performance/accessibility budget | Lighthouse CI (`lighthouserc.json`)                              | Runs against the built `dist`, `lighthouse:recommended` preset — a budget gate, not a functional test.                                                                                                                                                   |
| Bundle size                      | `size-limit`                                                     | `250 kB` JS / `50 kB` CSS budgets on `dist/assets` — supports the mobile-first NFR directly.                                                                                                                                                             |
| Static analysis                  | `knip`                                                           | Unused files/exports/dependencies, run as part of `check` alongside type-checking.                                                                                                                                                                       |

## Shared Conventions

- `vp check --fix` plus related tests run on staged files before commit (root `vite.config.ts`'s
  `staged` config) — catches type errors and breaks fast, before CI.
- MSW is used for client-side network mocking in unit/browser tests; Playwright's own
  `page.route` is used in e2e instead, since e2e is meant to exercise the real dev server rather
  than an in-process mock.
- Add dedicated test layers for the two-step hold/confirm flow, offline queuing, and the atomic
  inventory update: contract tests for the new endpoints (server), a queuing/replay test for the
  service worker (client), and a concurrency test for the atomic update (server, likely alongside
  or replacing the k6 load test).
