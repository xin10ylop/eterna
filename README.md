# Eterna

A beauty & wellness ritual tracker for women, built with Expo / React Native.
Your treatments live on a 3D-style avatar: fixed body zones glow softly when
something needs attention, every session is remembered with practitioner
notes and products, and a calendar plus budget keep the months ahead
predictable.

## Preview

**Expo Snack (no install):** open
[snack.expo.dev/@git/github.com/xin10ylop/eterna](https://snack.expo.dev/@git/github.com/xin10ylop/eterna)
— run in the browser, or scan a QR below with your phone camera / the Expo Go
app ([iOS](https://apps.apple.com/app/expo-go/id982107779) ·
[Android](https://play.google.com/store/apps/details?id=host.exp.exponent)).

| `main` | design branch (`claude/eterna-ui-design-research-dgieiv`) |
| :---: | :---: |
| ![Snack QR — main](assets/qr/snack-main.png) | ![Snack QR — design branch](assets/qr/snack-branch.png) |

**Locally:**

```bash
npm install
npx expo start
```

Scan the terminal QR with Expo Go (iOS/Android).

## App map

| Area | What it does |
| --- | --- |
| Onboarding | Welcome → value slides → sign-up (joined fields, "why we ask" captions) → 6-digit verify → name → birth-year wheel + consent → height/weight wheels (metric/imperial) → routine questionnaire → "preparing your plan" checklist + personalized recap → avatar studio (live pack preview) → ritual-time reminders → confetti "ready" celebration. Patterns researched on Mobbin: Airbnb, Duolingo, Uber, Hims, Cal AI, Apple Health, Stoic. |
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

The viewer (`src/components/avatar/`) drag-rotates through an 8-view
turnaround. Three packs are live in `assets/avatar/`, generated with
Higgsfield (Nano Banana 4K turnaround sheets, sliced + background-removed by
`design/` tooling) and mapped from the avatar studio's skin-tone choice:

1. `base/` — light skin, brown hair (default)
2. `tan/` — warm tan skin, espresso hair
3. `deep/` — deep skin, black hair

Next steps: packs for the remaining swatches (hair length/color, outfit,
body shape) and optionally a true textured GLB mesh behind the same props
(image-to-3D priced at ~30 Higgsfield credits, ~35 rigged).

## Animation

Micro-animations follow the "Duolingo placement, Stoic volume" rule — only at
completion moments, never during input. Lottie files in `assets/lottie/`
(procedurally generated, brand palette): `confetti.json` plays on the
onboarding "ready" screen and booking success; `sparkles.json` on the
welcome hero and the "preparing your plan" checklist. Code-driven animation
(entrances, drawn success check, skeleton shimmer, zone auras) lives in
`src/components/anim/`.
