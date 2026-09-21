# Twenty-floor campaign and combat readability

The campaign now continues after the Director rescue into ten basement floors, ending with SHELF CONTROL and a crew escape. Four boss milestones, eighteen seeded footprints, paired transport pads, warning steam vents, shootable mines, snipers and shield carts change the route. Stock carts can hit enemies; flour displays interrupt nearby attacks. Ricochet and freezing upgrades combine with the existing arsenal.

Robot portraits distinguish MOP-3, BUFF-0 and SHELF CONTROL. The current radio line remains in the pause menu. Dash is a short invulnerable dodge, including from stationary aim, with blue trails and recharge feedback. Overtime uses prominent gold batteries, flashing edible enemies, CHOMP labels, remaining-time warnings and an original faster musical phrase. Rescues at floors 10 and 15 lead into the next chapter; floor 20 ends with the crew celebrating.

## Provenance

Codex implemented this pass using the existing original Three.js recipe modules. The twelve selected asset modules and official loader are unchanged. New machinery and enemy variants reuse those assets with material changes and articulation. Rings, labels, trails and receipt sprites communicate gameplay state. The new portraits and upgrade diagrams are original code SVG; music and effects are original Web Audio synthesis. No trademarked melody, downloaded mesh or new image generation is included.

The previously generated Atlas track and two portraits remain private and absent from the runtime. The user's permission to add them to the workspace catalogue applies only after an actual contest submission. See `../../tasks/atlas-assets.md`. No deployment, push, catalogue publication or contest submission occurred in this pass.

## Simulation and structural checks

`unit-tests.txt` records 34 passing Node checks. The generated-layout check covers 200 seeds across eighteen footprints (3,600 maps), including connected supplies and safe spawns. A separate transport regression checks 201 seeds across seven transport floors (1,407 maps), including the seed that failed the first browser attempt. Treating every transport pad as blocked must leave objectives reachable, so no pad is compulsory in a narrow corridor.

Other checks cover stationary and moving dash, walls and grace periods, paired transport and arrival protection, vent warnings, mine escape/defusing, sniper aim locks, mine layers, directional shields, ricochet, freezing interruptions, stock impacts, flour, boss patterns, upgrade caps and migration of existing Director clears. Daily replay, server persistence, room membership, revives, shared ammo, KOs and protected respawns also pass. The changed dash simulation advances daily scoring to `daily-rush-3`, isolating the older boards.

`ship-check.txt` records the unmodified recipe shipping check: 33 modules parse and every path stays within the game folder. Previous selected-asset verification remains applicable because those modules are unchanged.

## Real browser evidence

Browser runs use Chrome and the adjacent recipe's Puppeteer on the local Mac. Movement, aiming, shooting, pickups and room actions use keyboard, pointer or touch events. Telemetry is read only. The focused late-floor tests preload only practice unlocks; practice supplies the same starter build offered to a player through the menu. No health, boss damage, score, position or combat state is injected.

| Evidence                      | Observed result                                                                                                                                                                                                                                       |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `campaign-first-attempt.json` | Floors 1 through 19 cleared with real input; floor 20 failed when a transport pad occupied a narrow route. This report intentionally remains FAIL.                                                                                                    |
| `campaign-11-20.json`         | After correcting pad placement, floors 11 through 20 cleared in one continuation, including the Foreman, final boss and real checkout. The final floor lasted about 113 simulated seconds and ended with four hearts.                                 |
| `mechanics.json`              | All ten new scenes accept controls. Real shots/dashes move a cart, real movement uses a transport pair, shots release flour, and collecting a battery switches the audio score to Overtime. Peak sampled scene cost: 486 draws and 982,250 triangles. |
| `phone-hud.json`              | Real taps start floor 20, dodge and open the radio log. The portrait title, boss bar and radio no longer overlap; the desktop map's Back control fits inside the viewport.                                                                            |
| `smoke.json`                  | No runtime errors; GPU geometry counts settle at 210 across eight retries, after 215 on the initial run.                                                                                                                                              |
| `touch.json`                  | Simultaneous movement/aiming, a third touch for dodge, release, cancellation, sound, pause and landscape rotation pass.                                                                                                                               |
| `fps-feel.json`               | A real visor pickup and enemy receipt volley are observed in first person; pause freezes the timer and a run ending blends back overhead. This run did not survive until visor expiry.                                                                |
| `daily-board.json`            | An actual lost Daily Rush run is replayed and accepted by the server, then visible from an independent browser identity. Offline ranking is explicit.                                                                                                 |
| `coop.json`, `versus.json`    | Two independent browsers complete co-op checkout and a seven-KO versus match. Both modes also pass rematch, reload reconnect, phone controls, shaped 4G, a short outage and explicit leave.                                                           |

These reports cover all twenty floors across the initial campaign and corrected continuation; they are not a claim that one uninterrupted twenty-floor run passed after the fix. Automated play times are not estimates of human campaign length. Frame rate and phone layouts are local emulation evidence, not physical-device or public-service measurements.

## Review and fixes

The first full campaign found a real placement fault on seed `3809365241`: a mandatory narrow passage could contain a teleport pad, sending the player back along the route. Pads now require open 3×3 space and are reserved before other supplies. The regression and corrected late-floor completion verify the fix. The automated navigator also routes around optional pads instead of accidentally entering them.

Visual review led to compact boss/radio placement on portrait phones, readable wrapped hearts, a two-act map that fits desktop height and full-range sniper warning lines. An ad hoc capture initially wrote its unlock fixture into an inaccessible blank document; moving that fixture to the loaded local game removed the harness-only SecurityError. The successful phone report has no console errors.

Representative captures include the two-act map, portrait boss, landscape controls, pause radio portrait, Overtime/transport, late combat, first-person receipts and final ending. No screenshots of failed harness setup are presented as successful evidence.

## Official gate

The unmodified phone/4G gate will be run against the local URL after creating the gameplay commit. Its exact commit, unedited verdict, JSON and screenshots will be stored in `jam/`. The final deployed URL will need its own gate run before entry submission.
