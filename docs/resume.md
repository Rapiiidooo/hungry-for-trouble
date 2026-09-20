# Hungry for Trouble: resume here

## Current state

The first playable campaign is implemented and verified locally. The user explicitly asked to abandon the previous coffin game's complicated contract career and build the next game with more care. Keep the original game intact. All product and repository text is English; speak French to the user.

This game is an original maze-chase/shooter about a tiny vacuum in a haunted supermarket. The user wants funny, unexpected action and meaningful variety. Preserve the one-click start and the focus on movement, shooting, reactions and temporary power reversal. Do not add administrative progression or cosmetically different copies of the same level.

Local preview: `http://localhost:3001`. Server tool session `31787`, command `npm run dev` / `node scripts/serve.mjs`. Restart with `npm run dev` from this directory if the preview is no longer running. The old coffin preview used port 3000; leave it alone. Browser test processes have exited and closed their own Chrome instances.

The repository has local checkpoints; inspect `git log -3 --oneline` for the latest. No remote or external deployment was created. This game contains no Sites hosting configuration. Do not push or publish without explicit authorization.

## What is implemented

- Five distinct layouts: warm cereal aisles, ice with inertia, moving stock barriers, a six-enemy rush and the Manager arena.
- Screen-relative WASD/arrows, mouse aiming/firing, dash and simultaneous touch movement/aiming/dash.
- Crumb collection and ammunition, eight-second Overtime, pursuing trolleys, ambushing polishers with a visible and audible charge warning, combos and fast-exit bonuses.
- One upgrade choice between floors, three upgrade families that stack, shield openings and an enraged boss attack pattern.
- Pause/resume, loss and immediate retry, a minimap, locally saved personal best, original procedural music and effects.
- Nine recipe assets, each with an original reference and three genuinely different candidates. All nine selected modules pass the official verifier. The first candidate batch passed 12/12; the second passed 14/15, with unselected floor A rejected for too few triangles.

## Verification and limits

Eleven simulation tests and the official shipping check pass. A complete browser campaign passed after the balancing changes, with all five exits, stacked upgrades, the boss, death and retry exercised through real keyboard and pointer events. Seven touch checks pass, including simultaneous two-stick input and a third touch for dash. Eight successive restarts also pass, with stable GPU geometry counts after fixing effect disposal; finished audio voices disconnect from the graph. Read the exact reports in `receipts/verification/`.

The official jam gate passes against the local preview with a phone viewport, real touch events, simulated 4G and CPU slowdown. This is Chrome device emulation on an Apple M5 Max, not a physical-phone measurement or a deployed-site verdict. Frame rate is reported as evidence for that environment, not as a universal guarantee. The Browser plugin reported no available browsers after its documented setup; the official recipe's Puppeteer and local Chrome were used.

The first automated run found that Overtime bypassed the Manager's shield and ended the boss fight almost instantly. The shield now blocks damage when closed, damage per pellet is capped and the second phase fires radial volleys. The final browser run defeated it across several shield cycles. Automated completion confirms the game works; human feedback is still needed to judge how enjoyable and replayable it feels. No daily challenge, online ranking or multiplayer is implemented.

## Where to change things

`game/sim.js` owns gameplay independently of rendering. `game/levels.js` owns layouts and tuning. `game/main.js` owns scene assembly, input, camera, HUD and read-only test telemetry. `game/audio.js` owns the original Web Audio soundtrack and cues. `game/style.css` and `index.html` own the English interface. The official `assetlib.js` is kept intact; scenery and actor parts are baked separately to preserve articulated pivots while reducing draw calls.

Run the appropriate checks after actual changes, then update the receipts and this handoff. Do not repeat all tests merely because a new session starts. The immediate next useful step is the user's playtest feedback, especially pacing, shooting feel and difficulty. If new work is requested, record unfinished work in `tasks/`.

Shared Atlas access and workspace preferences are documented in `../../WORKSPACE.md`. The user explicitly requested the workspace `.env`; never inspect, print, commit or expose it to the browser. Load it directly into a process environment if future asset generation needs it. This playable requires no Atlas key at runtime.
