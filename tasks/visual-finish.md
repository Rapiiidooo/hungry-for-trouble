# Visual finish release

Requested on 23 September 2026 after the private improvement review in `../reviews/2026-09-23-improvements/`. Entries close 25 September 23:59 UTC; target a verified local build by 25 September 12:00 UTC. Work on branch `visual-finish`.

## Scope

1. Perspective overhead camera and deeper lighting, keeping north up, no yaw or roll, and threats readable behind shelves.
2. Declutter the play field: one department sign per aisle, smaller pickup pops, one Overtime message, compact desktop status panel.
3. Unranked practice pass in Level Select that opens aisles 1 to 10 without spoiling the basement reveal.
4. Self-host the Google fonts so the gate lists no external CDN.
5. Short "How it was made" receipts summary at the top of the README.
6. New gameplay trailer from the updated build.

Owner feedback after playing the local build (23 September, evening): "really much better". Added scope:

7. Make the upgrade screen's route strip clickable so any reached aisle opens quickly.
8. Keep a single escape ending at aisle 25 (drop the aisle-20 cinematic) and roll the end credits after it.
9. Make locked-wing keys and the passages they open more visible.
10. Improve the Vac Cam transition and the first-person view, especially projectiles.
11. Answer whether the levels are procedural, from the code.

Human playtesting and any resulting balance change belong to the owner. Deployment, pushes, the entry PR update and trailer publication each need explicit owner approval.

## Status

- [x] Camera and lighting: perspective lens (27° landscape, 40° portrait, leads rebalanced after the boss-bar check), lower key light, weaker fill, stencil silhouettes for actors behind shelves (`game/actor-ghosts.js`), perspective blends in `view-rig.js` and `escape-scene.js`.
- [x] Declutter: one tilted department board, no floor-shape sprite, sparser unboxed ammo pops, repair labels by proximity, first Overtime headline only, compact desktop status panel with a bottom rule.
- [x] Practice pass: `openPracticeAisles()` in `game/arcade.js`, button in Level Select.
- [x] Self-hosted fonts in `game/fonts/` with OFL licences; `scripts/serve.mjs` serves `font/woff2`.
- [x] README "How it was made" plus camera, fonts and pass notes; truthful Claude Code credit line.
- [x] `npm test` 57/57, `npm run check` 48 modules, `scripts/visual-finish-playtest.mjs` PASS in three profiles.
- [x] Second round: clickable upgrade route, single aisle-25 escape then closing credits, key beams and lit doors, goggle transition, tracers, haze and quieter first person (`05a7d51`, `d318949`).
- [x] Full browser suite on fresh local servers, repaired stale checks, local gate at `d318949`, receipts in `receipts/verification-visual-finish/`.
- [x] New trailer recorded and edited locally from `d318949` (aisle-24 Vac Cam take); MP4 in ignored `outputs/trailer/`, previous one in `outputs/trailer-2026-09-22/`.
- [x] Handoff, style lock, README and receipts updated.
- [ ] Owner approval, then: merge to `main` and push, deploy `d318949` to the VM, public gate, trailer release, entry JSON (commit, agent, models, fonts) and PR body update. Drafts are in the session scratchpad; rebuild them from `receipts/verification-visual-finish/` if lost.
