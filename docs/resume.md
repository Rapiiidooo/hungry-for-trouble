# Hungry for Trouble: resume here

## Current state

The mission, discovery and finale pass is complete and locally verified at gameplay commit `8fda68d020d4a1e95e5134a7a9e2418b5ff5b34d`. The 38 Node checks, 37-module ship check and exact-commit local phone gate pass. Evidence is archived in `receipts/verification-reveal/`. Atlas catalogue publication remains authorized **only after actual contest submission**. Keep the generated Atlas project private; its deferred integration is tracked in `tasks/atlas-assets.md`. No deployment, push or contest entry is authorized in this pass.

Local preview: `http://localhost:3001`. Current server tool session: `1848`, command `npm run dev` / `node scripts/serve.mjs`. Identify the exact PID before restarting only this server. The abandoned coffin game and its port 3000 process remain separate. Game and repository text are English; conversation is French.

The user likes the vacuum action loop and dislikes administrative contracts, similar rectangular levels, generic neon, cream menus and decorative left borders. Preserve the enamel white/red/navy palette, clear combat feedback and action-focused progression. See `docs/style-lock.md`.

## Playable behavior

- Twenty floors, with the Manager at five, Director at ten, Foreman at fifteen and SHELF CONTROL at twenty. New players see **ten** route nodes and two bosses. The Director rescue reveals an animated service lift and a conversation that waits for the player, then unlocks the basement. Existing saves retain their unlocks. Practice grants starter builds from floor six.
- Eighteen shaped footprints vary cover and supplies by run seed. Rings, a clover, a crescent, connected islands, a figure eight and a spiral change the silhouettes. Transport landings are reserved before random cover, with walkable routes around every pad. Steam, paired transport, shootable mines, snipers, mine layers and frontal shield carts combine with ice, shutters and conveyors.
- MOP-3 explains the rescue on the title screen before the first tap. Portraits identify radio speakers; the current message remains in pause. Floor twenty powers down threats and ends with a nine-second crew escape and original victory phrase. Completion unlocks a golden vacuum livery; the title-screen preference persists and affects appearance only.
- Boss health follows the boss in overhead and FPS. The Director lobs a marked parcel, the Foreman fires staggered explosive volleys, and the core alternates a cross of parcels with a shockwave that has a visible safe gap. Warnings lock their targets and precede damage. Dash and Overtime protect against these hits.
- Four starting hearts, visible damage/heal popups and ammunition. Repair kits restore one heart and remain when full; checkout restores one heart. A warranty shield creates a pale-blue dome, flashes on impact and disappears when its charges are spent. FPS uses a matching visor indicator. Upgrade cards diagram before/after mechanics and numeric effects.
- Dash is a short protected burst, including from stationary aim, with blue feedback and 1.2-second recharge. It cannot cross walls. Overtime has gold pickups, CHOMP labels, an original faster theme and a final countdown warning. Boss shields still require their attack window.
- Shoot or dash into stock carts to hit enemies; flour displays interrupt nearby attacks. Eight capped upgrade types include ricochet and freezing builds. Daily replay shares deterministic simulation.
- Vac Cam grants 18 seconds of FPS and faster firing. The reversible 850 ms transition honours reduced motion. V/the view button returns overhead. Body-height receipt sprites, warning lines, trails, sparks and directional damage support FPS. Transport uses a separate 720 ms eased camera flight and protected arrival, or a short dissolve with reduced motion.
- Daily Rush is a seeded 90-second, five-wave challenge per UTC date. The server replays bounded 60 Hz input logs to validate single-use attempts, computes scores and atomically stores bests per browser identity. Current ruleset: `daily-rush-4`, changed with the shaped layouts. Aliases/cookies are not authenticated accounts or bot prevention.
- Shared Shift: two players share ammo and Overtime, collect 60 crumbs, defeat management and leave together within 210 seconds. No friendly fire. Stay beside a downed colleague for two seconds to revive them. Both down ends the match.
- Snackdown: first to seven KOs, or most KOs after 180 seconds. Equal totals draw. KOs spill crumbs; respawns take three seconds with two seconds of protection. Batteries last five seconds in multiplayer.
- Six-character room codes, host start/rematch, callsigns, reload reconnect and explicit leave. Server-authoritative snapshots support mouse/keyboard and dual touch sticks. Pausing stops local input while the match continues. Brief outages retry; a missing player ends the match after 15 seconds. Room scores never enter campaign/daily records.

## Code and operation

`sim.js`, `boss-attacks.js`, `machines.js`, `levels.js`, `floorplans.js` and `floor-shapes.js` own solo rules and layouts. `main.js` owns assembly/input/UI. `view-rig.js`, `presentation-fx.js`, `campaign-fx.js`, `combat-fx.js`, `escape-scene.js`, `story.js` and `upgrade-art.js` implement presentation. `presentation.css` is the final responsive layer. `arcade.js` owns unlocks and board helpers; `visibleFloorCount()` hides act two. The twelve selected recipe asset modules and loader remain unchanged.

`multiplayer-sim.js` owns room rules; `room-client.js` handles polling/reconnect. `server/rooms.mjs` validates membership and advances matches at 60 Hz. Clients send five packed controls, never trusted position, health or score. Prediction is visual only. `scripts/serve.mjs` serves the APIs before static files.

Use Node 24 with `npm run dev`, no install or runtime API key. Ignored `data/leaderboard.json` persists scores; rooms are memory-only. Future hosting needs one Node process and a persistent leaderboard disk. `HOST`, `PORT` and `LEADERBOARD_FILE` are configurable. Static hosting supports solo only. Reverse-proxy rate limits require deployment-specific trusted-proxy handling. Server restart expires rooms/attempts and keeps scores.

## Verification

The current pass has 38 passing Node checks and the official 37-module ship check. Coverage includes 3,600 seeded layouts, 1,407 transport bypass cases, delayed lob damage, the shockwave gap, and raycasts against the actual rendered ring to prove that its opening matches the safe sector. Solo, daily replay, score persistence and room rules also pass. Selected-asset verification remains 12/12 because those modules are unchanged.

Evidence is in `receipts/verification-reveal/README.md`. The first real-input campaign cleared floors 1–18 and the Director discovery, then lost on 19 because the test navigator repeatedly changed routes as shutters alternated. Its report remains FAIL. The corrected navigator waits for shutters and prioritizes an open checkout; its continuation clears 19 and 20, ending with three hearts after about 64 simulated seconds on floor 20. A separate real final-boss run ends with three hearts after about 85 seconds and verifies the portrait finale, reward and saved livery preference after reload. These reports cover every floor, not one uninterrupted twenty-floor completion.

Focused browser checks cover the pre-play mission in desktop/portrait/landscape, ten initially visible nodes, real shield absorption, transport camera interpolation and boss health in both views. Touch, FPS reversal/reduced motion, simultaneous FPS touch, a server-accepted daily run read by another browser, and a full co-op match with rematch/reconnect/4G/outage pass. Smoke stabilizes at 210 geometries after 215 on the initial run. Browser fixtures preload practice unlocks only; combat uses real inputs and read-only telemetry. The local tests do not certify a physical phone or public deployment.

The official local gate passes against gameplay SHA `8fda68d020d4a1e95e5134a7a9e2418b5ff5b34d`: ready in 5.5 seconds, 2.6 MB, 8.7 metres of real-touch movement, 296 peak draw calls, 574,668 peak triangles and no errors or 404s. Its printed verdict is unchanged in `receipts/verification-reveal/jam/verdict.txt`. This is a 390×844 Chrome phone viewport under the harness's 4G profile, rendered on the local Apple M5 Max, not a physical-phone benchmark or a live-URL submission gate.

Browser bindings were unavailable after the Browser skill's documented discovery. Checks use the adjacent recipe's Puppeteer and local Google Chrome. Keep `isMobile` unchanged across a running scene; changing it reloads the page. Tests close only their own browsers.

Useful commands: `npm test`, `npm run check`, `scripts/playthrough.mjs` (campaign, `--from=19`, `--fps`, `--daily`, optional `--out=name`), `scripts/presentation-playtest.mjs`, `scripts/act-two-playtest.mjs`, `scripts/feel-playtest.mjs`, `scripts/touch-playtest.mjs`, `scripts/arcade-playtest.mjs`, `scripts/smoke.mjs`, `scripts/multiplayer-playtest.mjs` (versus or `--coop`). Browser checks need the local server. Avoid repeating long checks without a relevant change or unresolved concern.

## Deferred delivery

Atlas generated a Lyria music track and Gemini portraits for MOP-3/SHELF CONTROL. They have not been downloaded, inspected or included at runtime. After the earlier automatic review rejection, the user authorized workspace-catalog publication on 21 September 2026 **only once the project has actually been submitted**. Record that entry PR URL and commit before using the permission; it does not need to be requested again once its condition is met. See `tasks/atlas-assets.md` for identifiers, costs and integration steps. Do not make publication a prerequisite for submission or silently replace a submitted build afterward. Never inspect, print or commit the environment key.

The first local commit is `986b0b5`, authored 20 September 2026 at 00:37 UTC, within the supplied jam window. There is no Git remote. `docs/contest-readiness.md` preserves deadlines, TAO prizes, ownership and entry requirements. Hosting, push, source publication, a PR and a demo post remain separate authorized delivery steps. After deployment, run the official gate against its live URL and exact commit and retain the untouched verdict.
