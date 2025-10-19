# Asset Production Guide

## Visual Style
- **Palette:** 8-bit saturated hues inspired by Pico-8; keep outlines dark navy (#1d2330) and highlights near #f6f7ff.
- **Resolution:** Base tile size 64x72 for hex cells; towers and enemies should fit within this footprint with transparent backgrounds.
- **Perspective:** Orthographic top-down with slight tilt; maintain consistent light source from top-left.

## Required Sprite Sets
- `sprites/towers/`
  - Wall: chunky barricade variants (level 1-3).
  - Lightning: coil with animated spark core.
  - Fire: brazier with flickering flames.
  - Ice: crystalline totem emitting glow.
  - Earth: stone thrower with spinning boulder dish.
- `sprites/enemies/`
  - Crawler, Runner, Brute, Swarm, Colossus boss (idle + 4-frame walk cycle).
- `sprites/projectiles/`
  - Lightning flash, fireball, ice shard, earth stone, splash overlays.

## UI & FX
- `ui/`
  - HUD icons for credits, core health, and wave state.
  - Button sprites with pressed/idle states matching ControlPanel layout.
- `tiles/`
  - Hex floor variants (neutral, path highlight, spawn, goal).
  - Debris overlays for damage feedback.

## Audio Targets
- `audio/`
  - Short chiptune loop for build phase (90 BPM).
  - High-energy loop for combat phase (120 BPM).
  - SFX: placement click, lightning zap, fireball launch/explosion, ice shatter, rock impact, enemy defeat, core damage.

## Prompt Template (Generative AI)
```
Create a retro 8-bit style sprite of a {subject} for a hex-based tower defense game. Use a limited 16-color palette with dark navy outlines (#1d2330) and bright highlights (#f6f7ff). The sprite should fit inside a 64x72 canvas with transparent background and depict the subject from a top-down perspective with a slight forward tilt. Include a two-frame animation hint where possible.
```

## Workflow Notes
- Store source layered files (`.aseprite`, `.psd`) in versioned archives under `assets/raw/` (ignored in Git).
- Export optimized PNG sequences into the above folders; keep naming consistent (`tower-lightning-level1.png`).
- Document palette choices and animation timings in `assets/manifest.json` (to be created once production starts).
