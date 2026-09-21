# Mission, discovery and finale

MOP-3 now explains the rescue before play. Fresh progress shows ten floors and two bosses; the Director rescue opens a service lift and a conversation that waits for the player, then reveals ten basement floors. Existing progress is preserved. Distinct masks produce rounded rooms, rings, a clover, a crescent, a figure eight and a spiral. Portal landings are reserved before random cover.

Teleportation uses a separate 720 ms eased camera transit with a protected arrival and reduced-motion alternative. Warranty charges have a visible dome, impact flash and break effect, plus an FPS indicator. Boss health follows its projected position. The Director lobs a warned parcel, the Foreman fires staggered volleys and the core alternates a cross of parcels with a shockwave whose opening is safe. Final checkout powers down the store, stages a nine-second crew escape and unlocks a saved cosmetic gold livery. The employee badge uses a bottom border; the favicon is original SVG.

## Provenance

Codex implemented this pass in the existing 404 recipe game. The twelve selected procedural asset modules and official loader are unchanged. Ending scenery and characters reuse those models. The shield hemisphere, rings and labels are functional combat/interface effects made with Three.js constructors. Floor masks are grid rules, not literal mesh geometry. The favicon and interface pictures are original SVG. Audio uses original Web Audio synthesis, including the new victory phrase. No downloaded meshes, trademarked music or reference-game assets were added.

Atlas's previously generated track and two portraits remain private and absent from runtime. Their workspace-catalog publication is authorized only after actual contest submission. No publication, deployment, push or submission occurred here. See `../../tasks/atlas-assets.md` and `../../docs/contest-readiness.md`.

## Simulation and structure

`unit-tests.txt` records **38 passing checks**. These include 3,600 seeded maps, 1,407 portal-bypass layouts, safe spawns, healing, protected dash, delayed lob damage, single impacts, shield absorption, the core's alternating patterns, progression migration, daily replay and room rules. A raycast test uses the actual rendered shockwave ring and checks several directions on both sides of its opening; its safe sector matches the damage rule.

`ship-check.txt` records the unmodified recipe checker: **37 modules**, one page, valid syntax and contained paths. `source-hashes.json` records the runtime files. Prior 12/12 selected-asset verification remains applicable because the asset modules are unchanged.

## Real browser evidence

The local Chrome checks use real keyboard, mouse and touch input, with read-only gameplay snapshots. Focused late-floor runs preload only practice unlocks; the build comes from the game's own practice mode. Health, position, damage, scores and completion state are not injected. Viewport resizing is preserved as emulation, not presented as a physical-phone test.

| Report                        | Observed result                                                                                                                                                                                                                                                                                           |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `campaign-first-attempt.json` | Floors 1–18 clear, including both rescues and the deliberate Director discovery. The report remains FAIL: on 19, the test navigator kept switching detours as shutters alternated and eventually lost.                                                                                                    |
| `campaign-19-20.json`         | The corrected navigator commits to its route, waits for shutters and prioritizes an open checkout. Real input clears 19 and 20, the final boss and checkout, then verifies the escape, reward and saved livery preference after reload. Floor 20 ends with three hearts after about 64 simulated seconds. |
| `finale-phone.json`           | A separate real-input floor 20 clear ends with three hearts after about 85 simulated seconds. Portrait captures show the centered crew escape, complete reward card and saved gold preference on the title screen after reload.                                                                           |
| `presentation.json`           | Mission, initial ten-node route and primary button in desktop/portrait/landscape; original favicon; a real lob consumes the visible shield without health loss; real pad entry interpolates the camera; boss health follows the overhead boss and is visible in FPS.                                      |
| `fps.json`                    | Real visor pickup, interpolation, reversal during a transition, reduced motion, mouse look/fire, simultaneous touch movement/look/fire and persisted practice unlocks.                                                                                                                                    |
| `touch.json`                  | Two-thumb movement/fire, a third touch for dash, release/cancellation, sound, pause and rotation.                                                                                                                                                                                                         |
| `daily-board.json`            | A real run under `daily-rush-4` is accepted by server replay and visible to an independent browser identity; an offline board is explicit.                                                                                                                                                                |
| `coop.json`                   | Two browsers complete the new shaped arena together, then verify rematch, reconnect, phone controls, simulated 4G, outage recovery and explicit leave.                                                                                                                                                    |
| `smoke.json`                  | Start and controls produce no errors; eight retries stabilize at 210 GPU geometries, after 215 on the first run.                                                                                                                                                                                          |

The first campaign and corrected continuation cover all twenty floors, but are **not one uninterrupted successful campaign**. Automated completion times are not human play-time estimates. Versus rules pass the Node regressions; the previous two-browser versus receipt is historical and was not repeated in this pass.

Visual inspection corrected a landscape menu that clipped its secondary buttons, a long sign in the finale and its portrait camera framing. Review also corrected the shockwave opening's angular orientation and added the raycast regression. An initial presentation probe asserted that the bar was above an offscreen boss; the corrected probe approaches the visible encounter before measuring its placement. No failed check is represented as a pass.

## Official gate

The exact-commit local phone/4G gate is the last archival step. Its eventual original verdict belongs in `jam/verdict.txt`, with JSON and screenshots. The prior act-two verdict certifies its historical SHA only. The final live-URL gate and physical-device playtest remain delivery work after hosting is authorized.
