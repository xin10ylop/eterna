# Eterna character — 3D reference

These four images are a clean turnaround of **the main Eterna avatar** (the
ceramic-clay stylized woman used throughout the app). They exist so a Blender
session can rebuild *this exact character* in 3D — not a lookalike.

| File | View |
|------|------|
| `character_front.png` | front (0°) |
| `character_right.png` | right side (90°) |
| `character_back.png`  | back (180°) |
| `character_left.png`  | left side (270°) |

## What to do with them (Blender MCP + Hyper3D Rodin)

1. Feed all four images to Rodin's **multi-image-to-3D** so it reconstructs the
   same character from the four angles. Keep the look: smooth **matte
   ceramic-clay**, soft pastel, cream/ivory tank + leggings, long hair, calm
   neutral expression, standing straight, arms relaxed slightly away from body.
2. Import into Blender, center at origin, face -Y (front to camera), give it a
   soft matte material. Clean up any artifacts.
3. Export as `assets/models/eterna_character.glb` (glTF Binary) and push to
   branch `claude/eterna-ui-design-research-dgieiv`.

## Downstream (already built in this repo)

The app renders one front frame and recolors it into 5 skin tones × 3 hair
colors — `assets/avatar/fronts/s{0-4}_{brown,black,blonde}.webp`, driven by
`src/components/avatar/config.ts` (`FRONT_ASPECT`, `VARIANTS`). Once the `.glb`
lands, that front frame is re-rendered from the new model and run back through
the same HSL recolor pipeline; the glow markers in
`src/components/avatar/ZoneMarkers.tsx` stay untouched.
