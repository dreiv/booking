# API Contracts

Request/response shapes live in `apps/server/src/bookings/bookings.openapi.ts` — that file is the
source of truth for endpoint schemas. This doc covers conventions and flow that don't fit cleanly
into an OpenAPI spec.

## Conventions

- **Idempotency**: `Idempotency-Key` header, required on `POST /v1/bookings/hold`. A repeated key
  with the same payload replays the original response (`Idempotency-Replayed: true` header); the
  same key with a different payload is a `409`. Keys are held for 24h in the `idempotency_keys`
  table, cleaned up by `prune_expired_idempotency_keys_now()` — see ADR-002's Pruning Mechanism
  section for how that gets scheduled.
- **Errors**: RFC 7807 Problem Details, per `problemDetails.ts`.
- **Rate limiting**: enforced per `rateLimiter.ts` — 100 requests/min on reads, 10 requests/min on
  writes, both returning `429` with standard `RateLimit-*` headers.

## Booking Flow

Booking is a two-step hold → confirm, not a single call (see `HLD.md`'s booking lifecycle
diagram and `data-models.md`'s atomic update pattern):

1. `POST /v1/bookings/hold` — creates a time-boxed hold, returns `expires_at`.
2. Payment is submitted against the held booking.
3. `POST /v1/bookings/{id}/confirm` (server-triggered on payment success) — flips status to
   `confirmed`.
4. An unconfirmed hold expires and releases its inventory automatically — no explicit client call
   needed for abandonment. `DELETE /v1/bookings/{id}` remains available for user-initiated
   cancellation, gated by the cancellation-policy check.

## Schema Registration

New endpoint schemas belong in `bookings.openapi.ts`. For example, the hold endpoint follows this
shape:

```ts
registry.registerPath({
  method: 'post',
  path: '/v1/bookings/hold',
  summary: 'Create a time-boxed hold on a room type for a date range',
  request: {
    headers: z.object({ 'idempotency-key': z.string() }),
    body: { content: { 'application/json': { schema: createHoldSchema } } },
  },
  responses: {
    201: { description: 'Held', content: { 'application/json': { schema: heldBookingSchema } } },
    409: problemResponse('One or more dates are unavailable'),
  },
});
```

`createHoldSchema` and `heldBookingSchema` live in `packages/utils/src/booking/schema.ts` next to
`bookingSchema`. This doc links to those schema sections directly rather than duplicating them
here.
