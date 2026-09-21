# Hungry for Trouble: resume here

## Current state

The ten-floor campaign, feel/story pass, Daily Rush leaderboard and two-player co-op/versus rooms are implemented and verified locally. The remaining active request is Atlas media integration, awaiting the user's workspace-access decision in `tasks/atlas-assets.md`. Record the final local phone gate after the multiplayer gameplay commit. Public hosting, push and submission are not authorized yet.

Local preview: `http://localhost:3001`. Current server tool session: `7123`, command `npm run dev` / `node scripts/serve.mjs`. Identify its exact PID before restarting only this server. The abandoned coffin game and its port 3000 process remain separate. Game and repository text are English; conversation is French.

The user likes the core game and Manager boss, rejected administrative contracts, monotonous rectangular levels, generic neon and cream. Preserve the vacuum's eat-ammunition mechanic, neutral enamel palette and action-focused progression. See `docs/style-lock.md`.

## Playable behavior

- Ten floors, with Manager at five and Director at ten. Eight room footprints use seeded cover and corridor routing with connected supplies and exterior void. Ice, shutters, conveyors, armour and receipt drones change later encounters. Real clears save practice unlocks on the escape route.
- Four starting hearts, visible damage/heal popups and ammunition. Repair kits restore one heart and remain when full; checkout restores one heart. Upgrades have before/after SVG diagrams and numeric effects.
- MOP-3's short radio messages introduce SHELF CONTROL and a final rescue. The story does not add contracts or interrupt play.
- Vac Cam gives 18 seconds of first-person view and faster fire. The 850 ms eased transition can reverse and honours reduced motion. V/the view button returns overhead. Body-height receipts, warnings, trails, wall sparks and directional damage support FPS combat.
- Daily Rush is a seeded 90-second, five-wave challenge per UTC date. The server validates single-use attempts by replaying bounded 60 Hz input logs, computes scores and atomically stores bests per browser identity. Current ruleset: `daily-rush-2`. Aliases/cookies are not authenticated accounts or bot prevention.
- Shared Shift: two players share ammo and overtime, collect 60 crumbs, defeat management and leave together within 210 seconds. No friendly fire. Stay within range of a downed colleague for two seconds to revive them. Both down ends the match.
- Snackdown: first to seven KOs, or most KOs after 180 seconds. Equal totals draw. KOs spill crumbs, with three-second respawns and two-second protection. Batteries last five seconds in multiplayer.
- Rooms have six-character codes, host start/rematch, callsigns, reload reconnect and explicit leave. Server-authoritative snapshots support keyboard/mouse and simultaneous touch. Pausing stops local input while the match continues. Brief network loss retries; missing players end the match after 15 seconds. These scores never enter campaign/daily records.

## Code and operation

`game/sim.js`, `levels.js` and `floorplans.js` own solo gameplay and layouts. `main.js` owns rendering/input/UI; `view-rig.js`, `combat-fx.js`, `story.js` and `upgrade-art.js` cover the feel/story pass. `arcade.js` owns progression and board helpers. `daily.js` is shared by browser and server. The original asset modules and official loader remain intact.

`game/multiplayer-sim.js` owns room gameplay; `game/room-client.js` handles polling, session storage and reconnects. `server/rooms.mjs` validates membership/controls and advances matches at 60 Hz. A client sends five packed input values, never trusted position, health or score. Short prediction is visual only. `scripts/serve.mjs` serves both room and leaderboard APIs before static files.

Use Node 24 with `npm run dev`, no installation or runtime API key. The leaderboard uses ignored `data/leaderboard.json`; rooms are memory-only. Future hosting needs one Node process and a persistent leaderboard disk. `HOST`, `PORT` and `LEADERBOARD_FILE` are configurable. Static hosting supports solo play only. Reverse-proxy rate limits require deployment-specific trusted-proxy handling. Server restart expires rooms/attempts and preserves saved scores.

## Verification

Twenty-three Node checks pass, including 1,600 seeded maps, repair rules, projectile occlusion, authoritative replays, shared ammo, no friendly fire, revives, KOs, protected respawns, session isolation, forged inputs, roster replacement, stale controls and disconnects. The latest shipping check covers 31 modules. The selected recipe pack remains 12/12.

`receipts/verification-feel/` holds the full ten-stage campaign, both bosses, death/retry, camera reversal/reduced motion/expiry, ranged FPS combat, mouse/touch checks, a server-accepted 90-second daily survival and two-client leaderboard verification. The focused visual practice test preloads only route unlocks and discloses it. Automated campaign time is not a human play-time estimate.

`receipts/verification-multiplayer/` holds real-input matches from two independent browsers, matching results, seven versus KOs, co-op checkout, rematches, reload reconnect, simultaneous phone movement/fire, simulated 4G and automatic recovery after a short outage. Portrait/landscape menus were visually inspected. A transparent touch-control wrapper initially swallowed mouse shots; its empty area now passes pointers to the canvas. Node tests cover revive semantics; an earlier real co-op run also exercised a revive. The archived latest co-op run completed without needing one.

Browser bindings were unavailable after the Browser skill's documented discovery. Checks use the adjacent recipe's Puppeteer and local Google Chrome. Keep `isMobile` unchanged across rotation; changing it reloads the page. Tests close their own browser processes.

Useful scripts: `npm test`, `npm run check`, `scripts/playthrough.mjs` (full campaign, `--fps` or `--daily`), `scripts/feel-playtest.mjs`, `scripts/touch-playtest.mjs`, `scripts/arcade-playtest.mjs`, `scripts/smoke.mjs`, and `scripts/multiplayer-playtest.mjs` (versus, or `--coop`). Browser scripts require the local server. Do not rerun every long playthrough without a relevant change or concern.

## Remaining work

Atlas reports three generated outputs: Lyria music and Gemini portraits for MOP-3/SHELF CONTROL. They have not been downloaded, inspected or included at runtime. Automatic review rejected permanent workspace-catalog publication; the exact pending approval, file IDs, costs and integration steps are in `tasks/atlas-assets.md`. Do not retry the access mutation without the user's answer. The shared environment is documented in `../../WORKSPACE.md`; the key never belongs in browser code or commits.

The local first commit is `986b0b5`, authored 20 September 2026 at 00:37 UTC, inside the supplied jam window. No Git remote exists. `docs/contest-readiness.md` preserves deadlines, prizes, originality wording and submission requirements. Local phone emulation is not a physical-device or live-URL verdict. After an authorized deployment, run the official exact-commit gate on that URL and preserve its verdict unedited.
