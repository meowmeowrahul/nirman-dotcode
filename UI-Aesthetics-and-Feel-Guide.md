# SecureLPG UI Aesthetics and Feel Guide

**Scope:** Visual language and interaction feel only.  
**Design intent:** sleek, minimal, easy to navigate, high-feedback UI.  
**Primary theme direction:** major white + orangish palette.

---

## 1) Visual Direction

- Overall personality: calm, trustworthy, utility-first government-tech product
- Density: compact but breathable (clear hierarchy, low clutter)
- Layout principle: one primary action per screen, secondary actions de-emphasized
- Navigation principle: shallow navigation depth, consistent top-level destinations by role
- Feedback principle: every critical action gives immediate visible response (loading, success, failure)

---

## 2) Color System (White + Orangish)

## 2.1 Core palette

- `bg/base`: `#FFFFFF` (primary surface)
- `bg/subtle`: `#FFF8F2` (secondary backgrounds/strips)
- `brand/orange-600`: `#F97316` (primary CTAs)
- `brand/orange-500`: `#FB923C` (hover/highlight)
- `brand/orange-100`: `#FFEDD5` (soft chips/selected row background)
- `text/primary`: `#1F2937`
- `text/secondary`: `#6B7280`
- `border/default`: `#E5E7EB`
- `success`: `#16A34A`
- `warning`: `#EA580C`
- `error`: `#DC2626`
- `info`: `#2563EB`

## 2.2 Contrast and accessibility

- Primary button text: white on orange (`#FFFFFF` on `#F97316`)
- Small text never on orange-100 unless using dark text
- Error/warning badges use strong text contrast and icon pairing
- Focus ring uses orange with 2px visible ring on keyboard focus

---

## 3) Component-Level Color Mapping (for modules from MD-1)

## 3.1 Auth (Login + Register)

- Page background: `bg/base`
- Auth card: white with `border/default`
- Primary submit button: `brand/orange-600`
- Secondary actions (switch login/register): text link in `brand/orange-600`
- Field border default: `border/default`; on focus: orange ring + subtle orange border
- Field error: border `error`, helper text `error`

## 3.2 Profile + KYC module

- Profile section headers: dark text with subtle divider
- KYC status chips:
  - `PENDING`: orange-100 background + orange-700 text
  - `VERIFIED`: green-100 feel using `success` theme
  - `REJECTED`: red-100 feel using `error` theme
- Save/update CTA: orange primary button
- Read-only reviewed fields: subtle background (`bg/subtle`)

## 3.3 Beneficiary Emergency Request

- Location permission banner/card: subtle orange tint (`brand/orange-100`)
- Contributor cards: white cards, thin gray border, orange accent on selected state
- Distance/value highlight: orange text for key nearest metric
- Empty state panel: white surface + orange icon/accent + neutral explanatory text

## 3.4 Technician Verification + Handover

- Evidence form card: white + clean section blocks
- Safety toggle:
  - Pass state accent: green
  - Fail state accent: red
- Overweight flag response block: warning color (orange deep) with clear action text
- Handover CTA: orange primary

## 3.5 Escrow Closure / Return

- Payout summary card: white with key totals in dark text
- Positive refund values: success color
- Serial mismatch alert: error color with strong border and icon
- Completion state badge: success theme

## 3.6 Warden KYC Governance

- User list/table: white rows, light separators, selected row subtle orange tint
- Action controls: orange primary for approve flows, neutral/outlined for non-destructive actions
- Status changes: in-place chip updates with toast confirmation

---

## 4) Button and Interaction Tokens

## 4.1 Buttons

- Primary button:
  - Background: `#F97316`
  - Hover: `#EA580C`
  - Active: `#C2410C`
  - Disabled: `#FDBA74` with reduced opacity
  - Text: `#FFFFFF`
- Secondary button:
  - Background: `#FFFFFF`
  - Border: `#E5E7EB`
  - Text: `#1F2937`
  - Hover: `#FFF8F2`
- Danger button:
  - Background: `#DC2626`
  - Text: `#FFFFFF`

## 4.2 Inputs

- Default border: `#E5E7EB`
- Focus: orange border + ring
- Error: red border + red helper
- Disabled: muted background, muted text

---

## 5) Motion and Animation (Minimal but useful)

- Motion goal: communicate state change, not decoration
- Default timing: `140ms` to `220ms` ease-out
- Allowed animations:
  - Fade-in for page sections/cards
  - Micro-scale (`0.98 -> 1`) on modal/card appear
  - Subtle slide-up for toasts
  - Spinner/progress on API submissions
- Avoid:
  - Long transitions (>300ms)
  - Bouncy or playful motion in critical flows
  - Multiple simultaneous animated elements on form-heavy pages

---

## 6) High-Feedback UX Rules

- Button click feedback appears instantly (pressed state + spinner if API call starts)
- All API outcomes provide explicit message:
  - Success toast/snackbar
  - Actionable error toast/snackbar + inline field hints where applicable
- Long calls show progress text (e.g., “Verifying cylinder…”, “Locking escrow…”)
- Critical transitions (verify/handover/release) show confirmation state before route change
- Permission-required flows (browser location) show persistent guidance until permission granted

---

## 7) Recommended UI Libraries for This Aesthetic

- Core styling: Tailwind CSS
- Component primitives: `@radix-ui/react-*`
- Prebuilt system: `shadcn/ui`
- Animation: `framer-motion`
- Icons: `lucide-react`
- Toast feedback: `sonner` (or `react-hot-toast`)

---

## 8) Screen-by-Screen Feel Summary

- Auth screens: clean, focused, single-card, no distraction
- Profile/KYC: structured, trust-oriented, explicit status visibility
- Emergency request: urgency communicated through hierarchy, not loud color noise
- Technician flow: operational clarity, high form legibility, strong error guidance
- Escrow closure: financial clarity and completion confidence
- Warden screens: administrative efficiency with clear decision states

---

## 9) Non-Negotiables for Final UI Feel

- White-first surfaces with orange used for emphasis and primary actions
- Minimal visual noise, consistent spacing, and clear typography hierarchy
- Strong feedback loops for every backend action
- Easy navigation with role-appropriate actions surfaced prominently
