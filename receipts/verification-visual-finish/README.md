# Visual finish: perspective store, clearer keys and a single finale

On 23 September 2026 the owner asked to apply every recommendation from a private competitor review and to remake the gameplay trailer. The review found the deepest game in the field but a flat in-game image: an orthographic overhead camera, a strong fill light, floating labels and a large status panel. After playing the first local build the owner found it "really much better" and asked for a second round: a clickable route on the upgrade screen, one escape ending instead of two, clearer locked-wing keys, and a cleaner Vac Cam transition and first-person view.

Runtime commits: `0f58563` (first round), `05a7d51` (second round) and `d3189497996019ce2f836779f614096589b9d5c3` (radio and muzzle-flash polish, the release candidate). Commits `cc9bc12` and `1368cd3` repair browser checks only. Deployment, the public gate, the entry update and trailer publication are separate owner-approved steps.

## What changed

- **Camera and light:** a long perspective overhead lens (27° landscape, 40° portrait, about 57° of pitch) with a lower key light and weaker fill, so aisles read as a lit diorama. North stays up, without yaw or roll. Leads keep roughly eight metres visible ahead and five behind outside the HUD, close to the former orthographic balance.
- **Silhouettes:** vacuums, enemies and bosses mark their visible pixels in the stencil buffer; parts hidden behind shelves appear as a flat silhouette in the overhead view only (`game/actor-ghosts.js`).
- **Quieter play field:** one tilted department board per aisle, no floating floor-shape name, sparser unboxed `+2 AMMO` pops, nearby-only repair labels, one Overtime headline per session, and a compact desktop status panel with a bottom rule instead of a left stripe.
- **Practice pass and route:** Level Select can open aisles 1 to 10 for unranked practice without clearing anything. After each aisle, the upgrade screen's route opens any reached aisle in Level Select; the next aisle points at the upgrade cards.
- **Endings:** aisle 20 frees the crew with a short celebration and opens the locked wing without a cinematic. The only escape closes aisle 25, then the closing credits end on "Store closed. For real." before the results. The first Director clear keeps its "adventure continues" credits.
- **Keys and doors:** keys turn like coins inside coloured light beams. Doors carry the key's symbol on both faces and the roof, and glow with a beam while the matching key is held.
- **Vac Cam:** goggles close an iris over the lens change. At eye level, shots are thin gold tracers that appear once they leave the lens, grazing receipts are hidden, the nozzle warms when firing, labels and crumbs shrink, distance haze adds depth and the radio card waits for the overhead view.
- **Fonts and credits:** Barlow Condensed and DM Sans are self-hosted with their OFL licences, so the game requests nothing outside its folder. The roll names Claude Code for this pass, and the README opens with "How it was made".

Simulation, scoring, replay validation, saves and the twelve recipe models are unchanged.

## Before and after

Each pair shows the previous commit on the left and this release on the right, from disposable profiles with the same practice aisle, viewport and short real input. Layout seeds differ between runs.

| Overhead, desktop                                      | Overhead, phone                                    | Second round                                                      |
| ------------------------------------------------------ | -------------------------------------------------- | ----------------------------------------------------------------- |
| [Aisle 1](before-after/desktop-01.png)                 | [Aisle 1](before-after/phone-01.png)               | [Vac Cam firing](second-round/vac-cam-firing.png)                 |
| [Aisle 3, shipping](before-after/desktop-03.png)       | [Aisle 12, transport](before-after/phone-12.png)   | [Vac Cam transition](second-round/vac-cam-transition.png)         |
| [Aisle 12, transport](before-after/desktop-12.png)     | [Aisle 21, locked wing](before-after/phone-21.png) | [Key beam and lit door](second-round/key-beam-and-ready-door.png) |
| [Aisle 20, SHELF CONTROL](before-after/desktop-20.png) |                                                    |                                                                   |

The new browser check also saved a [silhouette behind a shelf](visual-finish/desktop-behind-shelf.png), [Vac Cam](visual-finish/desktop-vac-cam.png) and the [practice pass before](visual-finish/desktop-route-before.png) and [after](visual-finish/desktop-route-after.png).

## Verification

- `npm test`: 57 of 57 Node checks, including a new practice-pass test (it opens aisles 1 to 10 without clears or the basement). `npm run check`: 48 modules, with the new silhouette module.
- `scripts/visual-finish-playtest.mjs` passes in desktop, portrait and landscape: local fonts only, practice pass, lens angles, mouse aim along the perspective ray, a silhouette behind a real shelf, the goggle transition, first-person haze and tracers, no silhouettes in Vac Cam, and restored overhead state. Its [report](visual-finish/report.json) is saved.
- The full browser suite ran on `05a7d51`, each script against a freshly started local server: 22 of 23 scripts passed, including real-keyboard clears of aisles 1 to 3 and the Director run with its credits and basement reveal. `locked-wing-ending-playtest.mjs` now checks the aisle-20 discovery without a cinematic, the clickable upgrade route, and the aisle-25 escape, closing credits and results.
- After the final polish, smoke, presentation, phone Vac Cam, first-person feel, visual finish and ending checks passed again on `d318949`.

Retained failures:

- [Baseline failures](baseline-failures.json): onboarding, credits, leaderboard and presentation checks failed identically on the previous commit (stale expectations or races), and were repaired in `cc9bc12`.
- The first perspective framing placed the Director above the boss bar's clamp; the presentation check caught it and the lens lead was rebalanced before `0f58563`.
- When about forty scripts shared one local server, onboarding tripped the score API's limit of 30 attempts per minute per address after all its checks had passed. The runner now restarts the local server before each script.
- The locked-wing check once read the key ring before the 80 ms HUD refresh, and the presentation probe once lost to the Director before pausing. Both scripts now wait for the actual state.

These are Chrome emulation checks on an Apple M5 Max, not physical phones or a load test.

## Local gate

The unmodified recipe gate passes against the local preview at `d318949`: [verdict](jam-local/verdict.txt) and [JSON](jam-local/verdict.json). Readiness is 5.9 seconds because the local server does not compress; earlier local gates also measured 5.8 seconds before public HTTPS reported 2.2. Transfer stays at 3.5 MB. Peak draws rise from 263 to 333 and triangles from 568,178 to 614,866, mostly from silhouette draws, well inside 900 and 1.5 million. External dependencies are now none. The public gate belongs to the approved deployment.

## Trailer

A new 43.7-second trailer (1280×720, 30 fps, AAC stereo, the unchanged Atlas soundtrack) was recorded from the local build of `d318949` with real keyboard and mouse input, then edited with the existing beat grid, captions and end card. [Capture markers](trailer/trailer-capture.json), [edit decisions and music provenance](trailer/trailer-edit.json), [quality review](trailer/trailer-quality.json) and a [contact sheet](trailer/trailer-contact-sheet.png) are saved. Three aisle-2 takes walked into walls, a repair kit or an enemy at point-blank range in first person, so the Vac Cam shot uses the aisle-24 take, which shows the goggle change and a clean first-person kill. The MP4 stays in ignored `outputs/trailer/` until its publication is approved; the previous trailer is archived locally.
