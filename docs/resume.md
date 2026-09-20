# Hungry for Trouble: resume here

## Current state

The feel, procedural-floor and story pass is implemented and verified locally. Cooperative and versus multiplayer are the next active implementation in `tasks/multiplayer.md`. Read `tasks/feel-and-story.md` for the pending Atlas retrieval approval. The user loves the core game and the Manager boss; keep that feel. They requested clear health/ammunition feedback, illustrated upgrades, a meaningful escape route, harder later levels, a first-person pickup, and both a daily challenge and a real shared leaderboard. All game and repository text is English; conversation is French.

Local preview: `http://localhost:3001`. Active server tool session `73306`, command `npm run dev` / `node scripts/serve.mjs`. Use the current session or identify its exact PID before restarting only this server. Preserve the coffin project and its port 3000 process. Test browsers close themselves. No remote, hosting project, deployment or push was created; publication remains a separately authorized action.

The user rejected both the earlier acid-green/petrol treatment and its cream replacement. The latest visual pass uses supermarket colours: neutral white enamel menus, tomato red actions, blue-grey fixtures and honey gold pickups. Follow `docs/style-lock.md`; do not restore the previous neon palette. The recolour is applied at runtime so recipe geometry and historical generation receipts stay intact.

## Implemented behavior

- Ten connected, distinct maps, with the original Manager at five and the Director guarding the exit at ten. Later stages combine ranged receipt drones, armoured trolleys, shutters, ice and directional conveyors.
- A saved escape map with visible boss milestones. Completed aisles unlock practice launches. Full-run personal bests remain separate from practice and daily scores.
- Prominent health slots, a heart-loss popup beside the vacuum, an ammunition gauge, pickup popups and low-ammunition feedback. Six upgrade families have original SVG illustrations.
- Vac Cam goggles grant 18 seconds of first-person view and faster fire. Mouse lock or drag aims, the right touch stick turns and fires, and V or the view button returns overhead. The bonus stays active in either view. The nozzle and ceiling panels come from verified recipe geometry.
- Daily Rush is a deterministic 90-second survival challenge shared for each UTC date, with five waves, respawning crumbs/pickups and a survival bonus. Scores can be copied for sharing.
- A real local HTTP leaderboard. The server issues single-use attempts, validates and replays 60 Hz input logs, computes scores and atomically persists best entries per browser identity. Aliases are not authenticated identities; this does not prevent bots or cookie resets.

## Verification and receipts

Twenty Node checks and the 29-module shipping check pass for the feel/story checkpoint. The complete pack passes 12/12 selected assets. Three new references, nine different geometry candidates, prompts and visual selections are preserved in `receipts/`. Read `receipts/README.md` for precise evidence and limits.

Browser checks cover all ten campaign clears, both bosses, death/retry, 90-second daily survival and accepted server replay, a lost daily run seen by a second browser identity, first-person mouse/touch input, saved unlocks, practice, offline ranking feedback, portrait/landscape touch controls and restart resource stability. The official jam gate passes on local phone emulation with 4G/CPU shaping. It is not a physical-phone or published-URL verdict. Reports and representative screenshots are in `receipts/verification-expansion/`; earlier five-floor baseline receipts remain in `receipts/verification/`.

The Browser plugin had no available browser bindings after its documented discovery. Verification uses Puppeteer from the adjacent official recipe and local Google Chrome. Changing Puppeteer's `isMobile` during a test reloads the page; retain it when checking rotation. The automated campaign is a precise player, so its completion speed is not a human play-time estimate. The user's next playtest should judge feel and replay value.

The theme refresh was checked in desktop, portrait and landscape browser views, including the route and live daily board. Existing smoke and first-person input checks pass, and the shipping check still covers 24 modules. Screenshots and exact verification scope are saved in `receipts/verification-theme/`; the earlier mobile performance gate remains evidence for the expansion checkpoint, not a new performance measurement of this recolour.

## Source and operation

`game/sim.js` owns deterministic gameplay; `levels.js` owns maps. `main.js` owns rendering, fixed-step input, camera and UI wiring. `arcade.js` owns route persistence, SVG interface art and HTTP helpers. `daily.js` is shared by browser and server for challenge selection, input encoding and replay validation. `server/leaderboard.mjs` owns the API and persistence; `scripts/serve.mjs` serves both API and static game. `arcade.css` layers the expansion interface over the original styles. The official asset loader files remain intact.

`npm run dev` needs Node 24 and no installation. `npm test` includes a temporary local HTTP listener; `npm run check` uses the official recipe. Browser gates: `node scripts/playthrough.mjs` (full campaign), `--fps` (first-person and progression), `--daily` (full survival), `scripts/arcade-playtest.mjs` (two clients and ranking), `scripts/touch-playtest.mjs`, and `scripts/smoke.mjs`.

The leaderboard uses ignored `data/leaderboard.json`. Keep one server process and a persistent writable disk when eventually hosting; static hosting alone cannot run its APIs. `HOST`, `PORT` and `LEADERBOARD_FILE` are configurable. The direct-peer rate limiter needs deployment-specific trusted proxy handling for larger traffic behind a reverse proxy. In-progress attempts expire after 15 minutes and do not survive server restart. Bump `RULESET` when changing scored gameplay, and keep browser/server versions together.

The shared Atlas environment is documented in `../../WORKSPACE.md`. Never inspect, print, commit or upload that secret environment file. This game requires no Atlas key at runtime. Preserve focused local history and write new unfinished work under `tasks/`; delete completed trackers after recording the result here.

## Feel/story checkpoint and next work

Seeded room footprints replace eight rectangular maps, with exterior void, connected supplies, dynamic minimap/camera bounds and route silhouettes. Two repair kits appear on generated floors, one in each original arena. Kits heal one heart and remain when full; checkout restores one heart on departure. Runs start at full health. Daily Rush uses `daily-rush-2` to separate the changed gameplay from old scores.

The 850 ms camera interpolation reverses mid-flight, supports reduced motion and returns overhead on bonus expiry or run end. Enemy receipts are body-height sprites with trails and firing warnings; directional damage appears in FPS. Before/after upgrade diagrams show numeric changes. MOP-3's short radio story ends with a rescue at the Director's checkout. All original asset modules remain unchanged.

`receipts/verification-feel/` contains the complete ten-stage clear (Director defeated and checkout reached with one heart), real-input camera/touch tests, a ranged FPS encounter, pause/expiry, 90-second daily survival accepted by server replay (6,520 points, 5,400 ticks), two-client leaderboard checks and restart stability. The focused practice test preloads only route unlocks and discloses it. Twenty Node checks include 1,600 generated maps, health semantics and receipt wall collisions. The final official live-URL gate remains outstanding until deployment is authorized.

Atlas has generated a soundtrack and two portraits in project `adcf8ed1-9469-4796-8d09-299fe978aead`. Responses and costs are in `receipts/atlas/`. They are not yet downloaded or used. Auto-review rejected publishing this project's assets to the workspace catalog because it changes persistent access for all members. The user has a pending asynchronous approval question naming the workspace and all three outputs. Do not retry that access change or use an indirect workaround without their reply. The Atlas key remains in the shared environment, never browser code.

Multiplayer implementation has started after the gameplay pass: `game/multiplayer-sim.js` and `server/rooms.mjs` contain a two-player authoritative simulation and room API, with server wiring in progress. These files are not yet verified or integrated into the UI. Continue `tasks/multiplayer.md`, restart only the identified port 3001 process when needed, and preserve the coffin project and its server. No publishing is authorized.
