# Eterna

An interactive iOS prototype for a beauty & wellness tracker. Your treatments —
hair, face, lips, nails, body — are mapped onto a 3D avatar. Each area shows a
delicate ring marker; a pulsing ring means something needs attention. Tap a
marker to see history and book.

## Preview

Open **`index.html`** in any modern browser — it's fully self-contained
(no build step, no network needed). Or enable GitHub Pages (Settings → Pages →
Deploy from branch → `main` / root) and it serves at your Pages URL.

## What's inside

| File | Purpose |
| --- | --- |
| `index.html` | Standalone, self-contained app (React inlined). Just open it. |
| `Eterna v2.dc.html` | Canonical source: a Claude Design Component (`.dc.html`) — plain HTML template with `{{ }}` holes and `<sc-for>` / `<sc-if>`, classic-JS logic (`class Component extends DCLogic`), and a `data-props` tweaks panel. |
| `assets/avatar.png` | The transparent avatar cutout used on-screen. |

## Screens

- **Onboarding** — welcome, then a routine picker.
- **Home** — greeting, the avatar body-map, and a swipeable row of everything that
  needs attention (overdue first), each with a Book action.
- **Detail** — per-area status, reminder toggle, clinic, and history timeline.
- **Discover** — find and save new salons/clinics/spas; live search + filters.
- **Rituals** — the full list grouped by urgency, with an on-schedule meter.
- **Profile** — avatar, notifications, saved clinics.
- **Add a ritual** — pick a treatment, cadence, and where you get it done
  (choose a saved clinic or add your own).

## Tweaks (in the Design Component)

- **Name** — personalizes the greeting.
- **Background** — Porcelain white (default), Warm sand, Rosé mist, Sage.
- **Accent** — Terracotta (default), Rosé, Mauve, Sage green, Plum, Ocean.

Status is shown monochrome in the chosen accent, so the palette stays cohesive.
