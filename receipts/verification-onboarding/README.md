# Title, briefing and restart flow

The title now has one short objective. Play opens a six-second MOP-3 exchange before the timer, player or enemies advance; Start Now skips it. Retries and selected aisles begin directly. The pause menu uses explicit action labels, names the restart destination and folds its mission/control help away. View Leaderboard opens the actual daily scores directly, with a button to start that challenge.

A fresh campaign begins with ten shots instead of twenty-four. Level Select starts a reached aisle with three hearts, ten shots and no upgrades. The three-heart baseline survives subsequent clears, while heart upgrades increase it normally. Their numeric descriptions and diagrams use the same baseline. Daily and multiplayer retain their existing starting supplies.

## Verification

`npm test` passes **39 checks**, including the new three-heart progression case. `ship-check.txt` records the unmodified recipe's **37-module** shipping check. `source-hashes.json` records the runtime files.

`onboarding.json` records real desktop clicks, keyboard input and phone touches. It checks all three menu layouts, frozen combat during the briefing, skipping and automatic continuation, exhausting ten real shots and refilling through movement, pause destinations, server-backed score display, and fresh basic kits plus restarts on aisles 6, 10 and 20. The only preloaded fixture is saved route unlocks; it never injects combat state. Seven screenshots retain the resulting UI.

`presentation.json` also passes with the new basic kit: initial ten-floor map, favicon, actual lob damage, camera transit through a real pad, and boss health in overhead and FPS. The old free-shield assumption was removed from that probe because selected aisles no longer grant upgrades. The earlier shield proof remains historical in `../verification-reveal/`; no earlier receipt was rewritten.

This pass does not claim another complete campaign or multiplayer browser run. The Node daily replay and room regressions pass. Screenshots emulate phone layouts in Chrome; they are not physical-device tests. No Atlas outputs, geometry assets, external publication or deployment changed.

## Official gate

The unmodified official harness passes on gameplay commit `df414d1621fb164e49a1e9a09ba846304623afc7` at `http://localhost:3001/`. The [original verdict](jam/verdict.txt) is copied byte for byte from `jam-console.txt`; its JSON and screenshots are in `jam/`. The first real tap opens the briefing, then the real held finger moves the robot after it finishes.

Phone viewport 390×844 at 3×, 4G profile: **5.6 seconds** ready, **2.7 MB**, **8.7 metres** moved, **262** peak draw calls and **568,176** peak triangles. No errors or 404s. The 60 FPS median uses Chrome on the local Apple M5 Max, not a physical phone. A gate against the deployed URL remains submission work.
