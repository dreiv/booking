# ADR-002: Temporary Booking (Soft Lock + TTL) for Inventory Concurrency

## Status

Accepted

## Context

Early design material drafted three different mechanisms for preventing double-booking without
settling on one: idempotency keys (handles duplicate submission, not the underlying race),
pessimistic locking (`SELECT ... FOR UPDATE`), and optimistic locking (a `version` column). None
of them addressed what should happen to inventory when payment fails after a booking is
provisionally accepted — that gap would otherwise need a saga / compensating-transaction pattern.

## Decision

Use a temporary-booking ("soft lock") pattern instead:

- Creating a booking is a single atomic conditional `UPDATE` on `room_type_inventory`
  (increment `total_reserved` only if it stays within `total_inventory`), performed in the same
  transaction as inserting a `booking` row with `status = 'held'` and a short `expires_at` TTL.
- Confirmation (on payment success) flips `status` to `confirmed` and clears `expires_at`.
- Non-confirmation (payment failure, timeout, abandonment) is handled by letting the hold expire;
  a scheduled prune releases the reserved inventory and marks the booking `expired` — see
  Pruning Mechanism below.

This replaces both `FOR UPDATE` locking and the `version` column: the conditional
`UPDATE ... WHERE total_reserved + n <= total_inventory` already gives an atomic check-and-increment
per row via Postgres's MVCC, so no separate lock statement or version-conflict retry loop is needed.

## Pruning Mechanism

Recommendation: use the `pg_cron` extension to schedule the prune query (e.g., every minute)
directly in Postgres, rather than an app-level `setInterval`/scheduled job. It keeps the pruning
logic co-located with the data it's cleaning up, and survives app restarts/redeploys without
needing its own scheduler process. Implement the prune as a plain SQL function
(`prune_expired_booking_holds_now()`) given a `pg_cron` schedule, mirroring the same
function-based shape used elsewhere for this kind of maintenance.

One caveat: not every hosting provider allows extensions — confirm `pg_cron` is available before
committing to it; if it isn't, the fallback is an app-level scheduled job calling the same function.

Hold TTL: start at 2 hours, as a configurable value (env var) rather than hardcoded, and adjust
once there's real abandonment data to tune it with.

## Consequences

- No saga / compensating-transaction logic is required for payment failure — it's just "don't
  confirm, let it expire."
- Adds a `pg_cron` dependency (see Pruning Mechanism above) — a hosting environment that doesn't
  support Postgres extensions would need the app-level scheduled-job fallback instead. The
  release-of-inventory and mark-expired steps must commit together within the pruning transaction
  — a crash between them leaves inventory stuck as reserved.
- Introduces a `held` state to the booking lifecycle that the client UI needs to represent
  (e.g., a checkout countdown).
- Does not by itself solve the Phase 2 (microservices) version of this problem, where inventory
  and payment may live in different databases — revisit when that phase is actually built.
