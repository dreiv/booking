# Data Model

## ERD

```mermaid
erDiagram
    hotel {
        int hotel_id PK
        string name
        string address
        string location
        string description
    }

    room_type {
        int room_type_id PK
        string name
        string description
        int max_occupancy
        string amenities
        int hotel_id FK
    }

    room {
        int room_id PK
        int floor
        string number
        int room_type_id FK
        int hotel_id FK
    }

    room_type_rate {
        date date PK
        decimal rate
        int room_type_id PK, FK
        int hotel_id PK, FK
    }

    room_type_inventory {
        int room_type_id PK, FK
        int hotel_id PK, FK
        date date PK
        int total_inventory
        int total_reserved
    }

    guest {
        int guest_id PK
        string first_name
        string last_name
        string email
    }

    booking {
        int booking_id PK
        int room_type_id FK
        int hotel_id FK
        int guest_id FK
        date start_date
        date end_date
        string status "held | confirmed | cancelled | expired"
        int room_count
        timestamp expires_at "set while held, null otherwise"
        timestamp createdAt
    }

    transaction {
        int transaction_id PK
        int booking_id FK
        string transaction_type
        decimal amount
        timestamp transaction_date
        string notes
    }

    hotel ||--o{ room_type : "has"
    hotel ||--o{ room : "has"
    room_type ||--o{ room : "has"

    hotel ||--o{ room_type_rate : "has"
    room_type ||--o{ room_type_rate : "has"

    hotel ||--o{ room_type_inventory : "has"
    room_type ||--o{ room_type_inventory : "has"

    hotel ||--o{ booking : "has"
    room_type ||--o{ booking : "has"
    guest ||--o{ booking : "makes"

    booking ||--o{ transaction : "has"
```

## Booking Lifecycle Fields

- `status`: `held` → `confirmed` → (`cancelled` | `expired`)
- `expires_at`: set when `status = held`, to `now() + <hold window>`; cleared once confirmed,
  cancelled, or expired. Hold window is a tuning parameter — start at 10 minutes and adjust from
  real abandonment data once there is any.

## Inventory Consistency — Atomic Conditional Update

Rather than a separate read → check → write (either `SELECT ... FOR UPDATE` or a `version`
column), reserving inventory is a single conditional `UPDATE` that only succeeds if the row's
current state satisfies the capacity constraint:

```sql
UPDATE room_type_inventory
SET total_reserved = total_reserved + :room_count
WHERE hotel_id = :hotel_id
  AND room_type_id = :room_type_id
  AND date BETWEEN :start_date AND :end_date
  AND total_reserved + :room_count <= total_inventory
RETURNING date;
```

Run this inside a transaction. If the number of rows `RETURNING` is less than the number of dates
in the range, at least one date failed the check — `ROLLBACK` the whole transaction (nothing ends
up partially reserved) and return `409`. If every date succeeded, insert the `held` booking row
in the same transaction and `COMMIT`. Postgres's row-level MVCC makes each row's check-and-increment
atomic on its own, so no explicit lock statement or version-conflict retry loop is required.

## Releasing Expired Holds

Scheduled via `pg_cron` rather than app-side polling — see [ADR-002](../adrs/002-temporary-booking-soft-lock.md#pruning-mechanism):

```sql
UPDATE booking
SET status = 'expired'
WHERE status = 'held' AND expires_at < now()
RETURNING booking_id, hotel_id, room_type_id, start_date, end_date, room_count;

-- for each returned booking, in the same transaction:
UPDATE room_type_inventory
SET total_reserved = total_reserved - :room_count
WHERE hotel_id = :hotel_id AND room_type_id = :room_type_id
  AND date BETWEEN :start_date AND :end_date;
```

Both statements must commit together per booking — if a crash happens between them, inventory
stays stuck as reserved for a hold that no longer exists.

## Example Inventory Data

| hotel_id | room_type_id | date       | total_inventory | total_reserved |
| :------- | :----------- | :--------- | :-------------- | :------------- |
| 211      | 1001         | 2024-12-15 | 100             | 87             |
| 211      | 1001         | 2024-12-16 | 100             | 89             |
| 211      | 1001         | 2024-12-17 | 100             | 92             |
