# UI Component Inventory

Source: guest-flow wireframes (List/Search, Filters, Map, Stay Details, Checkout, Bookings,
Favorites, Login). Host/admin flows are not covered yet and will extend this document when
their wireframes exist.

Component names are proposals — align with existing naming conventions when implementing.

## Primitives

Base components reused across most feature areas.

- **Button** — primary / secondary / danger / ghost variants.
- **Input** — text input, including formatted variants for card number / expiry / CVV.
- **Badge** — filled or outline pill. Backs status labels, filter chips, amenity tags, and
  info pills (e.g. guest/bed counts) via a `variant` prop.
- **Skeleton** — shimmer placeholder block, used at card and thumbnail size.
- **IconButton** — circular icon-only button (bell, avatar, back, close). Single component,
  `icon` prop.
- **Stepper** — `– N +` counter, used for guest, adult, and child counts.
- **RangeSlider** — dual-handle min/max slider (price range).
- **Tabs** — pill-style tab group with active state.
- **Modal** — centered overlay, tablet/desktop.
- **BottomSheet** — bottom-anchored overlay, mobile. Same content contract as Modal; container
  choice should be resolved by breakpoint rather than duplicated per screen.
- **Toast** — transient, dismissible, bottom-anchored message.
- **Popover** — lightweight anchored panel, lighter weight than Modal.
- **ProgressDots** — step-indicator row (○ ○ ● ○).

## Layout & navigation

- **AppHeader** — logo, nav links, notifications icon, account icon. Collapses to a hamburger
  trigger below tablet width.
- **MobileNavDrawer** — slide-out menu (Bookings, Favorites).
- **NotificationsPanel** — dropdown list of notifications with a "mark all as read" action.
- **Footer** — copyright and legal links (Terms, Privacy, Support).

## Search & filters

- **SearchBar** — location input ("Where too?").
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
  and no-bookings.
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
  sidebar on desktop, step body on mobile.
- **InlineErrorBanner** — inline error message within a step (e.g. card declined).
- **InterstitialTakeover** — full-panel hard stop: icon, message, two CTAs. Used when selected
  dates become unavailable mid-checkout.
- **ConfirmationPanel** — success icon, booking summary, "View booking" action.

## Bookings

- **BookingListItem** — thumbnail, name, dates, price, status Badge, and contextual actions
  (View details / Book again / Cancel booking) depending on status.

## Auth

- **AuthCard** — logo, heading, subtext, "Continue with Google", legal text. States: idle,
  connecting (spinner), failed, cancelled. Failed and cancelled states reuse the ErrorState
  icon/heading/subtext layout.

## Implementation notes

- EmptyState and ErrorState share one layout; implement as a single component with a
  `tone`/`icon` prop rather than two components. The sign-in failed/cancelled screens and the
  checkout dates-unavailable interstitial fit the same contract.
- Modal and BottomSheet share content; resolve the container by breakpoint in one wrapper
  rather than duplicating screen content per container.
- Badge's `variant` prop should cover status pills, amenity tags, filter chips, and info pills
  rather than four separate components.
- Build order: primitives → feature components (against mocked data) → pages.
