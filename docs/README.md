# Booking Platform — Documentation

## Overview

A hotel booking platform: search and discovery, bookings with strong inventory consistency
(no double-booking), payment processing, and admin management of hotels/room types/pricing.
Phase 1 is a modular monolith (single `apps/server` process); microservices are a planned future
phase — see [ADR-003](adrs/003-modular-monolith-then-microservices.md).

## Where to Start

| Doc                                                                    | Read this if...                                                 |
| ---------------------------------------------------------------------- | --------------------------------------------------------------- |
| [`architecture/HLD.md`](architecture/HLD.md)                           | you want the system shape, NFRs, and the booking lifecycle      |
| [`architecture/data-models.md`](architecture/data-models.md)           | you're touching schema or the inventory-consistency logic       |
| [`architecture/api-contracts.md`](architecture/api-contracts.md)       | you're adding or consuming an endpoint                          |
| [`architecture/observability.md`](architecture/observability.md)       | you're adding logging, tracing, or debugging a production issue |
| [`architecture/testing-strategy.md`](architecture/testing-strategy.md) | you're deciding where a new test belongs                        |
| [`adrs/`](adrs/)                                                       | you want the reasoning behind a specific decision               |

## ADR Index

- [001 — Vue + TypeScript SPA for the client](adrs/001-use-vue-for-spa.md)
- [002 — Temporary booking (soft lock + TTL) for inventory concurrency](adrs/002-temporary-booking-soft-lock.md)
- [003 — Modular monolith now, microservices as a future phase](adrs/003-modular-monolith-then-microservices.md)

## Glossary

- **Hold** — a time-boxed, unconfirmed booking (`status = held`) created before payment;
  expires automatically if not confirmed.
- **Room type** — a category of room (e.g. "Deluxe King") with its own rate and inventory, as
  distinct from an individual physical `room`.

## Adding a New ADR

New architectural decision → add a file under `adrs/`, numbered sequentially, following the
Status / Context / Decision / Consequences format used in 001–003.
