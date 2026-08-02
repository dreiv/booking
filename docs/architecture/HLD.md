# High-Level Design — Booking Platform

## Status

Phase 1 (modular monolith) is the initial build target. Phase 2 (microservices) is the intended
future evolution. See [ADR-002](../adrs/002-temporary-booking-soft-lock.md) and
[ADR-003](../adrs/003-modular-monolith-then-microservices.md) for the decisions behind this doc.

## Design Requirements

- Pay-at-platform and check-in.
- Mobile-first UI.
- Support for cancellation and overbooking — overbooking is a per-`room_type` percentage
  (`overbooking_rate`), applied as a multiplier against `total_inventory` in the atomic
  reservation check. See `data-models.md`'s Overbooking section.
- Dynamic pricing support: rates vary by date (e.g., a holiday date costs more) — the per-date
  `room_type_rate` table structurally supports this now; no demand-based repricing algorithm is
  required.

## Non-Functional Requirements

| Requirement  | Target                                                                          |
| ------------ | ------------------------------------------------------------------------------- |
| Consistency  | Two users can never book the same room-type/date past capacity — non-negotiable |
| Concurrency  | Thousands of users booking the same hotel simultaneously                        |
| Latency      | Search < 500ms; booking confirmation 2–3s                                       |
| Availability | 99.9%+                                                                          |
| Scalability  | Horizontal scale without redesign                                               |

## Capacity Estimate

~200 QPS read traffic, ~5 TPS write (booking) traffic, based on a 100% view → 10% room-detail →
10% reserve funnel. The architecture is optimized for reads (caching, eventually read replicas)
while keeping the write path — inventory + booking — on a single consistent transaction.

## Phase 1 — Modular Monolith

```mermaid
flowchart LR
    subgraph Clients
        WebApp["Vue Web App"]
        MobileApp["Mobile (future)"]
    end

    CDN["CDN"]
    Gateway["API Gateway / Reverse Proxy"]

    subgraph Server["apps/server — single Node/Express process"]
        direction TB
        BookingsModule["Bookings Module"]
        HotelsModule["Hotels Module"]
        RatesModule["Rates Module"]
        PaymentsModule["Payments Module"]
        NotificationsModule["Notifications Module"]
        Idempotency["Idempotency Middleware"]
    end

    Postgres[("PostgreSQL")]
    PaymentGateway["Payment Gateway (external)"]

    WebApp --> CDN --> Gateway --> Server
    MobileApp --> CDN
    Server --> Postgres
    PaymentsModule --> PaymentGateway
```

One deployable, modules organized by domain so a future extraction (Phase 2) is a lift-and-shift
rather than a rewrite. A single Postgres instance is the source of truth — no distributed
transaction is needed, which is what makes the "no double-booking" requirement tractable.

Postgres runs as a plain container in `docker-compose`, alongside the other services (e.g.
Jaeger). Redis is not provisioned initially; introduce it later for read caching if search
latency needs it, not for booking holds — see ADR-002.

## Phase 2 — Target Microservices (future, not scheduled)

```mermaid
flowchart LR
    subgraph Clients
        WebApp["Vue Web App"]
        MobileApp["Mobile App"]
    end
    CDN["CDN"]
    APIGateway["API Gateway"]

    subgraph Messaging
        Bus["Kafka / RabbitMQ"]
    end

    subgraph Services
        HotelService["Hotel Service"]
        BookingService["Booking Service"]
        RateService["Rate Service"]
        PaymentService["Payment Service"]
        SearchService["Search Service"]
        NotificationService["Notification Service"]
    end

    subgraph Stores
        HotelDB[("Hotel DB — Postgres")]
        BookingDB[("Booking DB — Postgres")]
        PaymentDB[("Payment DB — Postgres")]
        SearchIndex[("Search Index — Elasticsearch")]
    end

    PaymentGateway["Payment Gateway"]

    WebApp --> CDN --> APIGateway
    MobileApp --> CDN

    APIGateway --> SearchService
    APIGateway --> BookingService
    APIGateway --> PaymentService
    APIGateway --> HotelService

    BookingService --> BookingDB
    HotelService --> HotelDB
    PaymentService --> PaymentDB
    SearchService --> SearchIndex

    BookingService -- "BookingHeld / Confirmed / Expired" --> Bus
    PaymentService -- "PaymentSucceeded / Failed" --> Bus
    HotelService -- "InventoryChanged" --> Bus

    Bus --> NotificationService
    Bus --> SearchService

    PaymentService --> PaymentGateway
```

Extraction follows the Phase 1 module boundaries. Search sync becomes event-driven
(`InventoryChanged` → bus → Search Service) rather than a direct database link, since a
synchronous cross-database dependency between services would defeat the purpose of splitting them.
This phase is pursued only if/when a specific module outgrows the monolith — see ADR-003.

## Booking Lifecycle (applies to both phases)

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant API as Booking API
    participant DB as Postgres
    participant Payment as Payment Gateway

    User->>API: POST /v1/bookings/hold (Idempotency-Key)
    API->>DB: BEGIN
    API->>DB: UPDATE room_type_inventory SET total_reserved += n WHERE total_reserved + n <= total_inventory RETURNING date
    DB-->>API: rows returned
    alt all dates satisfied
        API->>DB: INSERT booking (status='held', expires_at=now()+10m)
        API->>DB: COMMIT
        API-->>User: 201 Held (expires_at)
    else some date unavailable
        API->>DB: ROLLBACK
        API-->>User: 409 Conflict (unavailable dates)
    end

    User->>Payment: Submit payment for held booking

    alt Payment succeeds
        Payment-->>API: Payment confirmed
        API->>DB: UPDATE booking SET status='confirmed', expires_at=NULL
        API-->>User: Booking confirmed
    else Payment fails or hold expires unconfirmed
        Note over DB: pg_cron-scheduled prune finds expired holds
        DB->>DB: UPDATE booking SET status='expired' WHERE status='held' AND expires_at < now()
        DB->>DB: UPDATE room_type_inventory SET total_reserved -= n for matched booking
        API-->>User: Hold expired / payment failed
    end
```

Details of the atomic update and pruning statements are in `data-models.md`. This is the piece
that replaces the pessimistic/optimistic locking approaches from the original draft, and it also
answers what happens to inventory on payment failure without needing a saga.

## Open Questions

- Redis: introduce now for read caching, or defer until search latency requires it?
- Notification delivery guarantees (retry/backoff, dead-letter) — deferred; not designed yet, and
  intentionally not blocking Phase 1.
- Whether `pg_cron` is available in the eventual hosting environment — see
  [ADR-002](../adrs/002-temporary-booking-soft-lock.md) for the fallback if not.
- How are failed/retried payment attempts represented? `booking.status` has no state for
  "payment declined, still held" — `transaction` only records settled outcomes.
