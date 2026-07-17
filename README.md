# Eterna

A beauty & wellness ritual tracker for women, built with Expo / React Native.
Your treatments live on a 3D-style avatar: fixed body zones glow softly when
something needs attention, every session is remembered with practitioner
notes and products, and a calendar plus budget keep the months ahead
predictable.

## Preview

**Expo Snack (no install):** open
[snack.expo.dev/@git/github.com/xin10ylop/eterna](https://snack.expo.dev/@git/github.com/xin10ylop/eterna)
— run in the browser, or scan the QR with the Expo Go app for a real phone.

**Locally:**

```bash
npm install
npx expo start
```

Scan the QR with Expo Go (iOS/Android).

## App map

| Area | What it does |
| --- | --- |
| Onboarding | Welcome → value slides → email sign-up (validated) → 6-digit verify → name → birth year + consent → height/weight (metric/imperial) → routine questionnaire → avatar studio → notifications → ready. Adapted from top-app patterns (Tonal, Equinox+, MacroFactor) researched on Mobbin. |
| Home | Rotatable avatar with **fixed zone markers** (hair, face, lips, body, hands, hips, legs). A zone with due items breathes with a soft aura and shows a count; calm zones show a faint glass ring. Swipeable attention cards. Profile lives top-right. |
| Planning | Calendar-first tab: Month / Week / Day (iOS-style grid + day agenda) with booked appointments, plus a Rituals segment grouping everything by urgency. |
| Treatment detail | Status, cadence, clinic, reminder toggle, and the full session history: date, exact procedure detail (e.g. "0.5 ml Restylane Kysse — mid-lip"), practitioner **with role** (nurse injector, colorist, laser technician…), products, price, and practitioner notes when they exist. |
| Discover | Search + category filters over salons/clinics/spas, save to My clinics, expand for open slots. |
| Budget | Spent this month, still-booked amount, expected next month (booked + projected due treatments), 6-month bars, per-zone breakdown, upcoming appointment costs. |
| Profile | Account, avatar studio (skin tone, body shape, hair color/length, outfit), notifications, accent color, sign out. |

## Architecture

```
App.tsx                 entry: SafeArea + navigation + toast host
src/
  theme/                design tokens; accent-aware getTheme()
  types/                domain model (the future Supabase contract)
  lib/                  dates, money, validation — pure functions
  data/seed.ts          demo dataset, derived from "today"
  services/
    auth.ts             AuthService interface + mock (swap for Supabase)
    logic.ts            status, attention, budget derivations
  store/                zustand store (session, data, ui slices)
  components/
    ui/                 buttons, cards, chips, fields, segmented, switch, toast
    avatar/             AvatarViewer (turntable-ready) + ZoneMarkers (aura)
  navigation/           stack + tabs (center “+” action button)
  screens/              onboarding / home / planning / discover / budget / profile / modals
design/prototype.dc.html  original Claude Design prototype (reference)
```

**No database yet — by design.** All state is in-memory; the repository and
auth interfaces are the seams where Supabase drops in. Validation runs
client-side, passwords are never stored or logged, and health-adjacent data
stays on device.

## Avatar pipeline

The viewer (`src/components/avatar/`) is turntable-ready: it takes N frames
and drag-rotates through them (with a graceful tilt fallback for a single
frame). Planned packs, generated with Higgsfield:

1. 8-view turnaround of the base figure (image generation)
2. Variant packs per skin tone / body shape / hair / outfit chosen in the
   avatar studio
3. Optionally a true textured GLB mesh (image-to-3D) behind the same props

Marker coordinates are measured per frame, so zone glows stay pinned to the
body at every angle.
