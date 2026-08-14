# Design docs

Wireframes and the derived component inventory for the booking app, covering all three
surfaces: guest, host, and admin.

## Contents

```
docs/design
├── Component-inventory.md      # proposed component list, derived from the wireframes below
└── wireframes
    ├── guest-view-wireframes.excalidraw    # high-fidelity — List/Search, Filters, Map,
    │                                       # Stay Details, Checkout, Bookings, Favorites, Login
    ├── host-view-wireframes.excalidraw     # low-fidelity structural — Onboarding, Dashboard,
    │                                       # Bookings, Calendar & Availability, Rooms &
    │                                       # Inventory, Issue Handling, Payments & Payouts,
    │                                       # Reviews, Guest Communication, Settings, Login
    └── admin-view-wireframes.excalidraw    # low-fidelity structural — Dashboard, Host
                                            # Verification, Dispute Resolution, Content
                                            # Moderation, Financials, Support/CS Tools, Login
```

## How these fit together

`Component-inventory.md` is derived from the wireframes, not the other way around — when a
screen changes, update the wireframe first, then re-check the inventory for drift. It's
organized by feature area within each surface, plus a few cross-cutting sections
(`Primitives`, host/admin `console shell`, the `review queue pattern` shared by host
verification / disputes / content moderation / support tickets) that call out shapes reused
across more than one screen.

Component names in the inventory are proposals for planning and estimation — align with
actual naming conventions once implementation starts.

## Fidelity note

Guest-flow wireframes are high-fidelity. Host and admin wireframes are low-fidelity
structural sketches (breakpoints are only shown where layout materially changes), so their
section of the inventory is provisional — expect components to get renamed or split once a
real design pass happens. Chart and large-table content on host/admin screens (occupancy
chart, revenue chart, payout schedule, etc.) is placeholder-only; no charting/table library
choice is reflected yet.

## Updating this doc

When new wireframes are added or existing ones change materially:

1. Walk the changed flow end to end and note any new component shapes or states.
2. Check whether the shape already exists elsewhere in the inventory (host and admin share a
   lot of structure — see the `review queue pattern` and `console shell` sections) before
   proposing a new component.
3. Update `Component-inventory.md` in the same PR as the wireframe change so the two never
   drift apart.
