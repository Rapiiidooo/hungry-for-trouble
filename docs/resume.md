# Hungry for Trouble: resume here

## Current state

The arcade expansion is implemented and verified locally. The user loves the core game and the Manager boss; keep that feel. They requested clear health/ammunition feedback, illustrated upgrades, a meaningful escape route, harder later levels, a first-person pickup, and both a daily challenge and a real shared leaderboard. All game and repository text is English; conversation is French.

Local preview: `http://localhost:3001`. Active server tool session `82435`, command `npm run dev` / `node scripts/serve.mjs`. Use the current session or identify its exact PID before restarting only this server. Preserve the coffin project and its port 3000 process. Test browsers close themselves. No remote, hosting project, deployment or push was created; publication remains a separately authorized action.

## Implemented behavior

- Ten connected, distinct maps, with the original Manager at five and the Director guarding the exit at ten. Later stages combine ranged receipt drones, armoured trolleys, shutters, ice and directional conveyors.
- A saved escape map with visible boss milestones. Completed aisles unlock practice launches. Full-run personal bests remain separate from practice and daily scores.
- Prominent health slots, a heart-loss popup beside the vacuum, an ammunition gauge, pickup popups and low-ammunition feedback. Six upgrade families have original SVG illustrations.
- Vac Cam goggles grant 18 seconds of first-person view and faster fire. Mouse lock or drag aims, the right touch stick turns and fires, and V or the view button returns overhead. The bonus stays active in either view. The nozzle and ceiling panels come from verified recipe geometry.
- Daily Rush is a deterministic 90-second survival challenge shared for each UTC date, with five waves, respawning crumbs/pickups and a survival bonus. Scores can be copied for sharing.
- A real local HTTP leaderboard. The server issues single-use attempts, validates and replays 60 Hz input logs, computes scores and atomically persists best entries per browser identity. Aliases are not authenticated identities; this does not prevent bots or cookie resets.

## Verification and receipts

Seventeen Node checks and the 24-module shipping check pass. The complete pack passes 12/12 selected assets. Three new references, nine different geometry candidates, prompts and visual selections are preserved in `receipts/`. Read `receipts/README.md` for precise evidence and limits.

Browser checks cover all ten campaign clears, both bosses, death/retry, 90-second daily survival and accepted server replay, a lost daily run seen by a second browser identity, first-person mouse/touch input, saved unlocks, practice, offline ranking feedback, portrait/landscape touch controls and restart resource stability. The official jam gate passes on local phone emulation with 4G/CPU shaping. It is not a physical-phone or published-URL verdict. Reports and representative screenshots are in `receipts/verification-expansion/`; earlier five-floor baseline receipts remain in `receipts/verification/`.

The Browser plugin had no available browser bindings after its documented discovery. Verification uses Puppeteer from the adjacent official recipe and local Google Chrome. Changing Puppeteer's `isMobile` during a test reloads the page; retain it when checking rotation. The automated campaign is a precise player, so its completion speed is not a human play-time estimate. The user's next playtest should judge feel and replay value.

## Source and operation

`game/sim.js` owns deterministic gameplay; `levels.js` owns maps. `main.js` owns rendering, fixed-step input, camera and UI wiring. `arcade.js` owns route persistence, SVG interface art and HTTP helpers. `daily.js` is shared by browser and server for challenge selection, input encoding and replay validation. `server/leaderboard.mjs` owns the API and persistence; `scripts/serve.mjs` serves both API and static game. `arcade.css` layers the expansion interface over the original styles. The official asset loader files remain intact.

`npm run dev` needs Node 24 and no installation. `npm test` includes a temporary local HTTP listener; `npm run check` uses the official recipe. Browser gates: `node scripts/playthrough.mjs` (full campaign), `--fps` (first-person and progression), `--daily` (full survival), `scripts/arcade-playtest.mjs` (two clients and ranking), `scripts/touch-playtest.mjs`, and `scripts/smoke.mjs`.

The leaderboard uses ignored `data/leaderboard.json`. Keep one server process and a persistent writable disk when eventually hosting; static hosting alone cannot run its APIs. `HOST`, `PORT` and `LEADERBOARD_FILE` are configurable. The direct-peer rate limiter needs deployment-specific trusted proxy handling for larger traffic behind a reverse proxy. In-progress attempts expire after 15 minutes and do not survive server restart. Bump `RULESET` when changing scored gameplay, and keep browser/server versions together.

The shared Atlas environment is documented in `../../WORKSPACE.md`. Never inspect, print, commit or upload that secret environment file. This game requires no Atlas key at runtime. Preserve focused local history and write new unfinished work under `tasks/`; delete completed trackers after recording the result here.
