# ADR-003: Modular Monolith Now, Microservices as a Documented Future Phase

## Status

Accepted

## Context

Early design material (adapted from an external video walkthrough) presented two HLD diagrams as
if both applied at once: a simple version with services sharing one Postgres + Redis, and a
fuller version with Kafka, per-service databases, and a search index. Without picking one, the
docs stayed ambiguous about what the system was actually meant to be.

## Decision

Document two explicit phases instead of one contested diagram:

- **Phase 1 (first phase)**: a modular monolith — one Node/Express process, internally organized
  into modules that mirror the eventual service boundaries (bookings, hotels, rates, payments,
  notifications). One Postgres instance. This keeps the "no double-booking" requirement easy to
  guarantee, since it's a single-database transaction rather than a cross-service one.
- **Phase 2 (future, not scheduled)**: extraction of Phase 1's modules into independently
  deployable services with their own databases, an event bus, and a search index, matching the
  fuller diagram — pursued only if/when a specific module outgrows the monolith (e.g., independent
  scaling or a compliance boundary for payments).

## Consequences

- Module boundaries chosen in Phase 1 double as the future service boundaries — worth being
  deliberate about now even though everything ships in one process.
- Cross-service consistency (the hard part of Phase 2) is deferred rather than designed
  prematurely; it needs its own decision when Phase 2 actually starts. ADR-002's temporary-
  booking approach does not by itself solve inventory consistency across separate databases.
- Search-index sync in Phase 2 is planned as event-driven (via the bus) rather than a direct
  database-to-index link, avoiding a hidden synchronous dependency between services.
