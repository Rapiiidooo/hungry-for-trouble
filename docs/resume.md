# Hungry for Trouble: resume here

## Current state

The twenty-floor expansion is implemented and browser-tested. It adds a second act, four boss milestones, machinery, three enemy behaviours, two upgrades, robot portraits, clearer dash and original Overtime music. The 34 Node checks and 33-module ship check pass; detailed evidence is in `receipts/verification-act-two/README.md`. The exact-commit local phone gate is the remaining checkpoint in `tasks/act-two.md`. Atlas catalog publication is authorized **only after actual contest submission**; keep the Atlas project private until then. Its catalog download and integration remain deferred in `tasks/atlas-assets.md`. Public hosting, push and submission are not authorized yet.

Local preview: `http://localhost:3001`. Current server tool session: `98607`, command `npm run dev` / `node scripts/serve.mjs`. Identify its exact PID before restarting only this server. The abandoned coffin game and its port 3000 process remain separate. Game and repository text are English; conversation is French.

The user likes the core game and Manager boss, rejected administrative contracts, monotonous rectangular levels, generic neon and cream. Preserve the vacuum's eat-ammunition mechanic, neutral enamel palette and action-focused progression. See `docs/style-lock.md`.

## Playable behavior

- Twenty floors, with the Manager at five, Director at ten, Foreman at fifteen and SHELF CONTROL at twenty. Eighteen room footprints use seeded cover and connected corridors. Act two combines steam vents, paired transport pads, shootable mines, snipers, mine layers and frontal shield carts with ice, shutters and conveyors. Real clears save practice unlocks; existing Director clears unlock floor eleven. Practice grants starter builds from floor six.
- Four starting hearts, visible damage/heal popups and ammunition. Repair kits restore one heart and remain when full; checkout restores one heart. Upgrades have before/after SVG diagrams and numeric effects.
- Portraits identify MOP-3, BUFF-0 and SHELF CONTROL. Radio is brief and can be reread in pause. Rescues at ten and fifteen lead into the next act; twenty ends with the crew celebrating. No contracts.
- Dash is a short protected dodge, including from stationary aim, with blue feedback and 1.2-second recharge. Overtime has gold pickups, CHOMP labels, an original faster theme and a final countdown warning. Dash cannot cross walls; Overtime does not bypass boss shields.
- Shooting or dashing pushes stock carts into enemies; breakable flour displays interrupt attacks. Eight upgrade types include capped ricochet and freezing builds. Keep these deterministic for daily replay.
- Vac Cam gives 18 seconds of first-person view and faster fire. The 850 ms eased transition can reverse and honours reduced motion. V/the view button returns overhead. Body-height receipts, warnings, trails, wall sparks and directional damage support FPS combat.
- Daily Rush is a seeded 90-second, five-wave challenge per UTC date. The server validates single-use attempts by replaying bounded 60 Hz input logs, computes scores and atomically stores bests per browser identity. Current ruleset: `daily-rush-3`, changed with dash mechanics. Aliases/cookies are not authenticated accounts or bot prevention.
- Shared Shift: two players share ammo and overtime, collect 60 crumbs, defeat management and leave together within 210 seconds. No friendly fire. Stay within range of a downed colleague for two seconds to revive them. Both down ends the match.
- Snackdown: first to seven KOs, or most KOs after 180 seconds. Equal totals draw. KOs spill crumbs, with three-second respawns and two-second protection. Batteries last five seconds in multiplayer.
- Rooms have six-character codes, host start/rematch, callsigns, reload reconnect and explicit leave. Server-authoritative snapshots support keyboard/mouse and simultaneous touch. Pausing stops local input while the match continues. Brief network loss retries; missing players end the match after 15 seconds. These scores never enter campaign/daily records.

## Code and operation

`game/sim.js`, `machines.js`, `levels.js` and `floorplans.js` own solo gameplay and layouts. `main.js` owns rendering/input/UI; `campaign-fx.js`, `campaign.css`, `view-rig.js`, `combat-fx.js`, `story.js` and `upgrade-art.js` cover feedback and story. `arcade.js` owns progression and board helpers. `daily.js` is shared by browser and server. The twelve original asset modules and official loader remain intact.

`game/multiplayer-sim.js` owns room gameplay; `game/room-client.js` handles polling, session storage and reconnects. `server/rooms.mjs` validates membership/controls and advances matches at 60 Hz. A client sends five packed input values, never trusted position, health or score. Short prediction is visual only. `scripts/serve.mjs` serves both room and leaderboard APIs before static files.

Use Node 24 with `npm run dev`, no installation or runtime API key. The leaderboard uses ignored `data/leaderboard.json`; rooms are memory-only. Future hosting needs one Node process and a persistent leaderboard disk. `HOST`, `PORT` and `LEADERBOARD_FILE` are configurable. Static hosting supports solo play only. Reverse-proxy rate limits require deployment-specific trusted-proxy handling. Server restart expires rooms/attempts and preserves saved scores.

## Verification

Thirty-four Node checks pass, including 3,600 seeded maps and a separate 1,407-map transport regression. The new hazard, enemy, upgrade and stationary-dash checks join existing solo, daily and room regressions. The shipping check covers 33 modules. The selected recipe pack remains unchanged from its 12/12 verification.

`receipts/verification-act-two/` holds the latest evidence. The first real-input campaign cleared 1 through 19 but failed 20 because a transport pad occupied a narrow corridor. Pads now require open 3×3 space and leave routes around them. A corrected continuation cleared 11 through 20, both late bosses and checkout; it preloads practice unlocks only. The final floor took about 113 simulated seconds and ended with four hearts. Do not claim one uninterrupted twenty-floor run passed after the fix. Automated times are not human play-time estimates.

The latest focused probe verifies actual cart pushes, transport, flour and Overtime music on all ten new scenes (peak sampled 486 draws, 982,250 triangles). Smoke stabilizes at 210 geometries across eight retries. Touch, FPS receipt combat, a replay-accepted daily run and independent board reads pass. Both two-browser modes pass a complete match, rematch, reload reconnect, phone controls, shaped 4G and outage recovery. Portrait/landscape HUD, map and ending were visually inspected. The FPS probe ended the run before visor expiry; earlier expiry/reversal checks remain in `verification-feel/`.

The previous official phone gate in `receipts/verification-multiplayer/jam/` certifies the earlier ten-floor commit `18dfa76c2a4d5bf334dff21028d2e0ee6043c2d7`. Record a new exact-commit verdict for this expansion before marking its task complete.

Browser bindings were unavailable after the Browser skill's documented discovery. Checks use the adjacent recipe's Puppeteer and local Google Chrome. Keep `isMobile` unchanged across rotation; changing it reloads the page. Tests close their own browser processes.

Useful scripts: `npm test`, `npm run check`, `scripts/playthrough.mjs` (full campaign, `--from=11` with practice fixture, `--fps` or `--daily`), `scripts/act-two-playtest.mjs`, `scripts/feel-playtest.mjs`, `scripts/touch-playtest.mjs`, `scripts/arcade-playtest.mjs`, `scripts/smoke.mjs`, and `scripts/multiplayer-playtest.mjs` (versus, or `--coop`). Browser scripts require the local server. Do not rerun every long playthrough without a relevant change or concern.

## Remaining work

Atlas reports three generated outputs: Lyria music and Gemini portraits for MOP-3/SHELF CONTROL. They have not been downloaded, inspected or included at runtime. After the automatic review rejection, the user authorized permanent workspace-catalog publication on 21 September 2026, but only once the game has actually been submitted. Record the entry PR URL and commit before applying that permission; no further approval for that same scoped action is needed after the condition is met. See `tasks/atlas-assets.md` for file IDs, costs and integration steps. Do not make catalog publication a prerequisite for submission or automatically replace the submitted build afterward. The shared environment is documented in `../../WORKSPACE.md`; the key never belongs in browser code or commits.

The local first commit is `986b0b5`, authored 20 September 2026 at 00:37 UTC, inside the supplied jam window. No Git remote exists. `docs/contest-readiness.md` preserves deadlines, prizes, originality wording and submission requirements. Local phone emulation is not a physical-device or live-URL verdict. After an authorized deployment, run the official exact-commit gate on that URL and preserve its verdict unedited.
