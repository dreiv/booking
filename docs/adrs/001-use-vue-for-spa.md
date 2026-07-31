# ADR-001: Vue 3 + TypeScript SPA for the Client

## Status

Accepted

## Context

The client needs to serve both the guest-facing booking flow and the admin view (hotel/room-type/
inventory management from `Design.md`'s functional requirements), be mobile-first, and tolerate
intermittent connectivity by queuing operations for later sync. It also shares TypeScript schemas
with the server via `packages/utils` in the same pnpm workspace.

## Decision

- **Framework**: Vue 3 with TypeScript, built via Vite (`vite-plus`).
- **Styling**: Tailwind CSS, mobile-first utility classes.
- **State**: Pinia for client-side state. Evaluate Pinia Colada specifically for server-state/query
  caching — that's a distinct concern from local UI state, not a replacement for Pinia; the two
  would be used together if Pinia Colada is adopted.
- **Routing**: Vue Router. The admin view is served from the same app under role-gated routes,
  rather than a separate application.
- **Composition utilities**: VueUse.
- **Offline support**: a service worker caches assets and queues mutating operations in IndexedDB
  (via [`idb`](https://github.com/jakearchibald/idb)) while offline, replaying them once
  connectivity returns.
- **i18n**: none for now — single locale, hard-coded strings.
- **Testing/quality**: Vitest (unit + browser projects), Playwright for e2e (with
  `@axe-core/playwright` for accessibility checks), MSW for API mocking, `size-limit` for bundle
  budgets, and Lighthouse CI for performance/accessibility scoring. These directly support the
  mobile-first and latency/availability targets in `HLD.md`.

## Consequences

- One SPA serving two audiences (guests + admins) is simpler to ship than a separate admin app,
  but role-based access control has to be handled in the router/UI. The server remains the actual
  authority — client-side route gating is a UX convenience, not a security boundary.
- Offline queuing creates real tension with the "no double-booking" requirement from `HLD.md`: an
  operation queued while offline (e.g., creating a booking hold) can't be guaranteed to
  succeed until it actually reaches the server and passes the atomic inventory check in
  `data-models.md`. The client has to treat any offline-queued booking action as optimistic/
  pending, not confirmed, until sync completes — see Open Question below.
- No i18n now means retrofitting multi-locale support later touches every user-facing string.
  Acceptable for current scope; worth knowing upfront if that changes.
- IndexedDB access goes through `idb` rather than the raw API — a thin Promise wrapper, not a
  full ORM, so the queued-operation records still need their own shape/versioning as the schema
  evolves.

## Which Operations Are Safe to Queue Offline

Resolved: only actions that don't touch inventory or payment are safe to queue — for example,
guest-submitted content like reviews. Booking-hold creation, confirmation, and cancellation are
never queued offline; the UI disables those actions while offline instead, since none of them can
be verified against inventory until the request actually reaches the server (see `data-models.md`'s
atomic update). Read-only views (past bookings, admin dashboards) are always safe, queue or not,
since they don't write anything.
