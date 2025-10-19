# Repository Guidelines

## Project Structure & Module Organization
Gameplay source lives in `src/` with `engine/` (loop + systems), `scenes/` (level scripts), `ui/` (HUD components), `systems/` (shared logic), and `data/` (JSON configs). `public/` hosts the HTML shell and service worker. Pack art, audio, and texture atlases under `assets/`. Tooling scripts reside in `scripts/` for build hooks and asset exporters. Tests mirror the code layout inside `tests/` to keep imports predictable.

## Build, Test, and Development Commands
- `npm install`: install dependencies after cloning or branch switches.
- `npm run dev`: launch the Vite dev server with hot reload at `http://localhost:5173`.
- `npm run build`: generate the production bundle in `dist/`.
- `npm run preview`: serve the `dist/` bundle locally for release checks.
- `npm run lint`: run ESLint + Prettier; fix issues before committing.
- `npm run test`: execute Vitest suites with coverage reporting.

## Coding Style & Naming Conventions
Write TypeScript with 2-space indentation, single quotes, and trailing commas. Filenames stay kebab-case (`player-controller.ts`); scene classes end with `Scene` (`MenuScene.ts`). Exported classes/components use PascalCase, functions use camelCase, and shared constants use SCREAMING_SNAKE_CASE. Keep game state mutations inside systems and prefer declarative scene setup. Run `npm run lint -- --fix` before opening a PR.

## Testing Guidelines
Vitest covers unit and integration paths; snapshot fixtures live in `tests/ui`. Name unit specs `*.spec.ts` and gameplay flows `*.test.ts`. Prefer deterministic mocks over timers and wrap animation ticks with `nextTick`. Maintain >=80% line coverage and add a Playwright smoke test per major scene under `tests/e2e`. Always run `npm run test -- --runInBand` prior to pushing to avoid flake.

## Commit & Pull Request Guidelines
Use Conventional Commits (`feat:`, `fix:`, `refactor:`). Keep each commit focused and reference issue IDs in the footer when relevant. Pull requests need a concise summary, testing checklist, and before/after media for visual changes. Request a gameplay or UI maintainer review, wait for CI to pass, and rebase onto `main` before merging.

## Deployment & Configuration Tips
Mirror environment keys in `.env.example`; client-readable values must start with `VITE_`. Store production secrets in the hosting provider or CI, never in the repo. Run `npm run build && npm run preview` as the final smoke test before tagging a release.
