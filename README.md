# Hex Maze TD

A modular, hex-first tower defense prototype focused on mazing gameplay, extensibility, and rapid balancing workflows.

## Getting Started
- `npm install`
- `npm run dev`
- Visit http://localhost:5173

## Key Features
- Abstracted grid engine supporting hex and square topologies.
- Five launch towers (Wall, Lightning, Fire, Ice, Earth) with upgrade paths.
- Wave scheduler with boss rounds and configurable progression curves.
- Responsive widescreen UI with 8-bit inspired styling.
- Simulation scripts (`npm run simulate`) for quick balance sweeps.

## Repo Layout
- `src/core` – grid, topology, and pathfinding primitives.
- `src/game` – gameplay systems, configs, and engine.
- `src/render` – canvas renderer.
- `src/ui` – React UI overlay and controls.
- `assets/` – art/audio placeholders and production guide.
- `simulations/` – headless balance utilities.
- `docs/` – planning notes and contributor guides.

## Next Steps
- Flesh out animation timelines + sprite atlas loading.
- Layer in audio cues tied to tower fire events.
- Expand simulation harness with Monte Carlo upgrade budgeting.
- Integrate save/load of board layouts for playtest comparisons.
