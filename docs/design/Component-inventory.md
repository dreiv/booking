# UI Component Inventory

Source: guest-flow, host-flow, and admin-flow wireframes (see `wireframes/`:
`guest-view-wireframes.excalidraw`, `host-view-wireframes.excalidraw`,
`admin-view-wireframes.excalidraw`). Guest flow is high-fidelity; host and admin flows are
low-fidelity structural sketches, so component boundaries there are provisional — expect
some renaming/splitting once real UI is designed.

Component names are proposals — align with existing naming conventions when implementing.

## Primitives

Base components reused across most feature areas.

- **Button** — primary / secondary / danger / ghost variants.
- **Input** — text input, including formatted variants for card number / expiry / CVV.
- **Textarea** — multi-line text input. Used for special requests, dispute/issue reasons,
  house rules copy. Same field chrome as Input; needs a resizable multi-line variant.
- **Select** — single-choice dropdown (room type, status, country, "who pays the difference").
  Not currently in the inventory; guest, host, and admin flows all use it.
- **Badge** — filled or outline pill. Backs status labels, filter chips, amenity tags, and
  info pills (e.g. guest/bed counts) via a `variant` prop. Host/admin add more status values
  (Active, Pending, Suspended, Flagged, Open, Resolved) — same component, wider `variant` set.
- **Skeleton** — shimmer placeholder block, used at card and thumbnail size.
- **IconButton** — circular icon-only button (bell, avatar, back, close, search). Single
  component, `icon` prop.
- **Stepper** — `– N +` counter, used for guest, adult, and child counts.
- **RangeSlider** — dual-handle min/max slider (price range).
- **Tabs** — pill-style tab group with active state. Also used for booking-status filters
  (Upcoming / Active / Past / Cancelled) and dispute/ticket status (Open / Resolved).
- **Modal** — centered overlay, tablet/desktop.
- **BottomSheet** — bottom-anchored overlay, mobile. Same content contract as Modal; container
  choice should be resolved by breakpoint rather than duplicated per screen.
- **Toast** — transient, dismissible, bottom-anchored message.
- **Popover** — lightweight anchored panel, lighter weight than Modal.
- **ProgressDots** — step-indicator row (○ ○ ● ○). Used in guest checkout and the mobile host
  onboarding wizard.
- **UploadTile** — square dashed-border tile for adding an image (ID front/back, room photos,
  "+" add-more tile). Distinct from PhotoGallery, which is display-only: this is the upload
  control itself, used in host onboarding, room photo management, and listing edits.
- **FilePreviewThumb** — small labelled photo thumbnail shown after upload, used alongside
  UploadTile in host room/photo management.

## Layout & navigation

- **AppHeader** — logo, nav links, notifications icon, account icon. Collapses to a hamburger
  trigger below tablet width. Guest-facing; host and admin use SidebarNav instead but keep
  the same notification bell + icon-button pattern in a slim top strip.
- **MobileNavDrawer** — slide-out menu (Bookings, Favorites). Guest-facing.
- **SidebarNav** — desktop left-hand nav list for Host and Admin consoles: icon + label items,
  active-item highlight, and a small alert dot on an item with unresolved work (e.g. "Issues",
  "Disputes"). Collapses to the mobile hamburger drawer pattern below tablet width — resolve
  by breakpoint the same way Modal/BottomSheet do, rather than building a second nav component.
- **PropertySwitcher** — header control showing the current property name with a dropdown affordance
  (e.g. "Riverside Inn ▾"); on multi-property accounts opens a small list ("Your properties … +
  Add another property"). Host-only.
- **NotificationsPanel** — dropdown list of notifications with a "mark all as read" action.
- **Footer** — copyright and legal links (Terms, Privacy, Support).

## Search & filters

- **SearchBar** — location input ("Where too?"). Also reused in compact icon form for the
  host/admin directory search affordance (magnifying-glass IconButton opening a text Input).
- **FilterChipGroup** — row of dismissible chips reflecting active filters, plus "Clear all".
  Built on Badge.
- **FiltersPanel** — full filter surface: date range, guest Stepper, price RangeSlider, amenity
  toggles. Renders as a full-screen panel on mobile, a dropdown panel on tablet/desktop.
- **AmenityToggle** — single amenity as a checkbox-style Badge.
- **ViewToggle** — switches list results between map and list layout.
- **ResultsCount** — result count label; also carries the loading-state text during fetch.

## Listings

- **StayCard** — photo, favorite toggle, title, location and rating, price per night. Has a
  Skeleton-backed loading variant.
- **FavoriteButton** — heart toggle on StayCard and on the Details gallery. Reverts to prior
  state if the toggle request fails.
- **LoadMoreButton** — paginated fetch trigger; shows a disabled loading label mid-fetch.

## Map

- **MapView** — pin-plotted map; sticky alongside the list on tablet/desktop.
- **MapPin** — individual marker, default and tapped states.
- **MapPinPreviewCard** — stay-preview card shown when a pin is tapped.

## Feedback states

- **EmptyState** — icon, heading, subtext, CTA, centered. Covers no-results, no-favorites,
  no-bookings, and the host "no bookings yet" screen.
- **ErrorState** — same layout as EmptyState with an error icon and a Retry action. Covers
  list-fetch failure and sign-in failure; the sign-in cancelled and dates-unavailable screens
  use the same shape with different copy and CTAs.
- **ConfirmDialog** — heading, subtext, and a destructive/cancel action pair. Used for booking
  cancellation.

## Stay details

- **PhotoGallery** — one large photo plus a thumbnail grid.
- **ExpandableText** — truncated paragraph with a "Show more" control.
- **AmenitiesList** — row of amenity Badges.
- **ReviewsSummary** — rating, review count, "See all" link.
- **ReviewItem** — avatar and reviewer text block.
- **BookingSidebarCard** — dates, guests, price per night, Book action. Sticky sidebar on
  desktop, sticky bottom bar on mobile.

## Checkout

- **CheckoutStepRow** — labelled step ("1 – Dates", "2 – Guests", "3 – Payment") with an Edit
  action; used in the desktop single-page layout.
- **GuestSelector** — adult and child counts, each a Stepper.
- **PaymentForm** — card number, expiry, CVV fields, with an error variant (field-level error
  styling plus an inline banner).
- **OrderSummaryCard** — listing name, dates, price breakdown, total, Pay action. Sticky
  sidebar on desktop, step body on mobile. Same price-breakdown shape as the host booking
  detail panel (Room rate / Fees / Total) — consider a shared PriceBreakdown sub-component.
- **InlineErrorBanner** — inline error message within a step (e.g. card declined).
- **InterstitialTakeover** — full-panel hard stop: icon, message, two CTAs. Used when selected
  dates become unavailable mid-checkout.
- **ConfirmationPanel** — success icon, booking summary, "View booking" action.

## Bookings

- **BookingListItem** — thumbnail, name, dates, price, status Badge, and contextual actions
  (View details / Book again / Cancel booking) depending on status. Guest-facing.

## Auth

- **AuthCard** — logo, heading, subtext, "Continue with Google", legal text. States: idle,
  connecting (spinner), failed, cancelled. Failed and cancelled states reuse the ErrorState
  icon/heading/subtext layout. Guest-facing social login.
- **LoginForm** — email + password Input pair, "Sign in" Button, "Forgot password?" link.
  States: idle, submitting (spinner), invalid-credentials (field error), account-suspended
  (reuses ErrorState shape with a "Contact support" CTA). Used identically by Host and Admin
  sign-in — one component, not two.

## Host & Admin console shell

Shared chrome for both back-office consoles. Both use SidebarNav (desktop) /
MobileNavDrawer-style hamburger (mobile), plus:

- **StatTile** — small metric block: bold value + label caption (e.g. "4 arrivals today",
  "1,204 active hosts", "$412K GMV — 30d"). Rendered in rows of 2–4 across host and admin
  dashboards, and again on Financials/Payments summary screens.
- **ChartPlaceholder** — labelled block standing in for a chart ("Occupancy chart placeholder",
  "Bookings trend chart"). Structural only at this fidelity — implementation will swap in a
  real chart component per the eventual charting library choice.
- **AttentionListItem** — a "needs attention" row: short label/count plus a trailing action
  button (e.g. "3 hosts pending verification — Review", "Payment failed — Booking #4021 —
  View"). Used on both host and admin dashboards.
- **MasterDetailLayout** — the recurring tablet/desktop pattern of a narrow list/table on the
  left and a detail panel on the right, both scoped to the same record. Not a visual
  component itself, but a layout contract worth naming since Bookings, Rooms, Calendar,
  host/guest directories, disputes, and content moderation all reuse it verbatim. Mobile
  collapses it to list → push-navigate → detail.

## Host — onboarding

- **OnboardingWizard** — multi-step flow (Business info → Identity verification → Property
  details → Photos → Payout details → Review). Mobile renders one step per screen with
  ProgressDots; tablet/desktop render the same steps as an **AccordionStep** list (numbered,
  collapsible, with an "Edit" action on completed steps) alongside a sticky **LivePreviewCard**
  showing the listing-in-progress. "Save & exit" appears in the header once past step 1.
- **LivePreviewCard** — sticky card mirroring the in-progress listing back to the host as they
  fill the wizard. Tablet/desktop only.
- **PendingReviewState** — "Your account is under review" screen; same icon/heading/subtext
  shape as EmptyState, spinner instead of an icon.
- **VerificationRejectedState** — "We couldn't verify your documents" with a reason and a
  re-upload CTA; reuses ErrorState shape.

## Host — dashboard

- Built from StatTile (arrivals/departures/occupancy/revenue), two ChartPlaceholders
  (occupancy, revenue), and AttentionListItem rows ("Payment failed", "Refund requested").
- **UpcomingListItem** — compact row for the "Upcoming" panel: guest name, room, date, chevron.

## Host — bookings management

- **BookingListItem (host variant)** — id, guest name, room, dates, status Badge, left
  status-colour accent bar. Filterable via Tabs (Upcoming / Active / Past / Cancelled).
- **BookingDetailPanel** — guest/room/dates header, PriceBreakdown rows (Room rate / Fees /
  Total paid), Special-requests Textarea (read-only), and action Buttons (Message guest /
  Modify booking / Cancel booking — ghost/ghost/danger).
- **ModifyBookingForm** — original vs. new check-in/out fields, room Select, a price-difference
  banner, "who pays the difference" Select, "Save & notify guest" Button.
- **ManualBookingForm** — guest name, phone/email, room Select, check-in/out date fields,
  payment method Select, "Create booking" Button. Used for host-created walk-in bookings.

## Host — calendar & availability

- **RoomTabSelector** — pill tab row for switching the calendar's active room (built on Tabs).
- **AvailabilityCalendarGrid** — single-room month grid; day cells carry state (open / booked /
  blocked) and price. Selecting a day opens a side/bottom panel (Selected date, Status, Price,
  Block date / Edit price actions).
- **AvailabilityGridTable** — multi-room spreadsheet view: rooms as rows, days as columns,
  each cell showing price or a Booked/Blocked Badge-state; click-to-edit. Desktop only,
  paired with "Bulk edit" and "Sync channels" header actions.
- **BulkEditPriceModal** — date-range field, room Select, new-price Input, Cancel/Apply.
- **ArrivalsDeparturesList** — "Today" panel split into Arrivals/Departures counts with a list
  of compact guest/room rows and a check-in-state Badge.
- **CheckInPanel** — guest + room header, "ID verified at booking" confirmation row, key/access
  code Input, "Mark as checked in" Button.

## Host — rooms & inventory

- **RoomListItem** — room name/type, guest count, price/night, status Badge (Active/Inactive).
- **RoomDetailPanel** — photo UploadTile row, room name Input, room type Select, guests/price
  Inputs, status Select. Uses the MasterDetailLayout pattern (list left, detail right on
  desktop; push-navigate on mobile).

## Host — issues & payments

- **IssueListItem** — short title + guest/room/date meta + status Badge (Open/Resolved),
  filterable via Tabs.
- **IssueDetailPanel** — id header, status Badge, guest's stated reason (read-only Textarea),
  and a contextual action set that varies by issue type: Deny/Approve + Message guest +
  Escalate to admin (refund requests); Apply suggested fix / Resolve manually (overbooking
  conflicts); Cancel booking / Retry charge / Escalate to admin (payment failures).
- **PayoutSummaryCard** — next-payout amount + date, plus StatTiles for YTD earnings and
  platform fee.
- **TransactionListItem** — date, description, type, amount row; stacks into a plain table on
  desktop (Date / Description / Type / Amount columns) — a lightweight cousin of DataTable
  worth keeping as a single "financial ledger" table style shared with Admin Financials.
- **PayoutFailedBanner** — inline warning ("Payout failed — bank details invalid") with an
  "Update bank details" CTA.

## Host — reviews & guest communication

- **ReviewListItem** — reviewer name, star rating, quote, "Reply" action/expand.
- **ThreadListItem** — inbox row: contact name, last-message snippet, timestamp/booking id.
  Pairs with MessageThread in the MasterDetailLayout pattern.
- **MessageThread** — left/right-aligned chat bubbles plus a "Type a message…" composer input
  with a send action. New primitive — not covered by anything guest-facing today.

## Host — settings

- **SettingsNavList** — simple list of settings sub-pages (Business info, House rules,
  Cancellation policy, Notification preferences, Team members, Payment details).
- **SettingsForm** — labelled Input/Select/Textarea fields plus a single "Save changes" Button;
  generic enough to back most of the above sub-pages.
- **NotificationPreferenceItem** — event name/description + relative timestamp, read variant of
  AttentionListItem.

## Admin — dashboard

Same StatTile / ChartPlaceholder ("Bookings trend chart", "GMV trend chart") /
AttentionListItem composition as the host dashboard, scoped to platform-wide metrics (Active
hosts, Active guests, GMV, Open disputes).

## Admin — review queue pattern

Host verification, dispute resolution, and content moderation all share one composite shape —
worth building once:

- **ReviewQueueList** — left-hand list of pending items (id/title + Badge), an item count
  header ("Pending (3)", "Open (7)"), active-item highlight.
- **ReviewDetailPanel** — right-hand panel with whatever evidence applies (ID-document
  UploadTile pair, dispute claim/response text, a flagged photo) plus a decision action row
  that varies by context: Reject/Approve (host verification, content moderation); Side with
  host / Split refund / Side with guest (disputes).
- **DocChecklistRow** — inline verification checklist line ("Business license: verified ✓",
  "Tax ID: pending automated check") — a status line, distinct from Badge and from a full
  form field.

## Admin — directories (hosts, guests, properties)

- **DirectoryListItem** — name, meta line (room count/rating or booking count), status Badge
  (Active/Pending/Suspended/Flagged). Header carries a search IconButton→Input.
- **DirectoryTable** _(desktop)_ — column-based version of DirectoryListItem (e.g. Property /
  Rooms / Rating / Status); a DataTable use case, paired with a detail side panel per
  MasterDetailLayout.
- **HostDetailPanel** — owner + join date, summary stats line, "View listings" / "Suspend
  host" actions.
- **GuestDetailPanel** — join date, optional **FlagReasonNote** (plain-text explanation of why
  an account was flagged), "View booking history" / "Suspend account" actions.

## Admin — financials

- StatTiles for GMV, Commission, Refunds issued, Chargebacks.
- **LedgerTable** — Date / Description / Type / Amount columns; desktop-only ("Full transaction
  table & export available on desktop" on mobile) — shares styling with Host's
  TransactionListItem table.
- **PayoutScheduleTable** — placeholder table of upcoming host payouts (structural only at
  this fidelity).

## Admin — support / CS tools

- **TicketListItem** — id, short title, status Badge (Open/Resolved), reuses the
  ReviewQueueList shape.
- **TicketDetailPanel** — reporter + "opened Xh ago" meta, quoted issue text, and three
  actions: **View as user** (support impersonation — new, no equivalent elsewhere in the
  inventory), Reply, Mark resolved.

## Implementation notes

- EmptyState and ErrorState share one layout; implement as a single component with a
  `tone`/`icon` prop rather than two components. The sign-in failed/cancelled screens, the
  checkout dates-unavailable interstitial, and the host PendingReviewState /
  VerificationRejectedState screens all fit the same contract.
- Modal and BottomSheet share content; resolve the container by breakpoint in one wrapper
  rather than duplicating screen content per container. SidebarNav vs. the mobile nav drawer
  should resolve the same way.
- Badge's `variant` prop should cover status pills, amenity tags, filter chips, and info pills
  rather than four separate components; host/admin add more status values to the same prop
  rather than new components.
- LoginForm (email/password) is used verbatim by both Host and Admin — build once, don't
  fork per console.
- ReviewQueueList + ReviewDetailPanel is used verbatim by host verification, dispute
  resolution, content moderation, and admin support tickets — build once as a composite
  pattern with swappable evidence content and a swappable action-button set, rather than
  four bespoke screens.
- MasterDetailLayout (list/table left, detail right on desktop; push-navigate on mobile)
  recurs across Bookings, Rooms, Calendar, host/guest directories, and the review-queue
  pattern above — worth a shared layout wrapper rather than per-screen recreation.
- PriceBreakdown (label/value rows ending in a total) recurs in guest OrderSummaryCard and
  host BookingDetailPanel — consider factoring out as a sub-component.
- Build order: primitives → shared console shell (SidebarNav, StatTile, ChartPlaceholder,
  AttentionListItem, MasterDetailLayout) → feature components (against mocked data) → pages.

## Open questions / not yet covered

- Host and Admin wireframes are low-fidelity structural sketches (per their own header note),
  so exact field sets and copy will shift once real UI passes happen — treat component
  _shapes_ here as reliable, exact props/variants as provisional.
- Host/admin onboarding, calendar, and financials screens reference chart and table content
  only as placeholders ("Occupancy chart placeholder", "Payout schedule / host payout table
  placeholder") — the real charting/table library choice isn't reflected yet.
- No wireframes yet for: admin Settings detail, host team-member management detail, or
  push/email notification content templates.
