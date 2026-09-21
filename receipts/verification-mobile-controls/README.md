# A phone layout and touch FPS

The owner found the previous smaller panel still too bulky, and first-person play too difficult on a phone. This pass changes the composition instead of scaling the same desktop panels again.

Essential status now occupies the top 72 px in the tested portraits and 48 px in landscape, before any device safe-area inset. All eight heart slots, shield charges and ammunition fit in the top row. Aisle, crumb goal and timer share the next row, or the same row in landscape. The map opens on demand, score stays small between the thumb controls, and the playing field loses its permanent brand, large floor name, radio card and dash poster. Pause keeps the full floor name, score and instructions. Keys remain visible; boss health clears the top strip. Buttons stay at least 44 px and thumb pads are 96 px. Desktop composition and the repaired upgrade illustrations remain.

The former right joystick continuously rotated and pitched the camera while firing. Touch FPS now uses relative horizontal swipes, a level horizon, and a wider portrait lens (94 degrees vertically instead of 76). Holding the right pad or right half of the scene fires; dragging turns; holding still stops manual rotation. The larger gesture area allows longer turns in either direction. Releasing, cancelling, pausing, rotating the screen or changing view clears captured input. Top View remains one tap away.

Aim assistance gradually nudges towards a live target within 12 metres and about 13 degrees of the crosshair. It yields to manual turns and rejects occluded targets, inactive enemies, protected bosses and multiplayer opponents. Shelves, timed shutters and locked doors use the simulation collision map. It changes only the ordinary aiming input, which is quantized before both local simulation and replay recording. Damage, ammunition, enemy rules, score validation and save formats are unchanged. No new Atlas generation or 3D asset is involved.

## Verification

- `ui/report.json`: six viewports (320×568, 360×640, 390×844, 667×375, 844×390, 1280×800), five eight-heart/shield fixtures and 54 upgrade-card checks. Every diagram fits and the last card can be selected to enter the next aisle. Checkout fixtures are presentation evidence, not combat wins.
- `fps/report.json`: actual floor-two movement and visor pickup in three phone viewports, hold-to-fire, pad and right-half swipes, fixed pitch, simultaneous movement/fire/dash, release/cancel, map, pause and view reversal. Only practice unlocks are preloaded; no combat state is injected or score posted.
- `fps-regression.json`: real mouse look/fire, continuous entry and reversal, reduced motion, simultaneous touch and persisted practice selection. Its practice-unlock fixture is declared.
- `touch.json`: ordinary overhead two-thumb movement/fire, third-touch dash, release/cancel, audio, pause/resume and rotation.
- 56 Node checks and the official 45-module shipping check pass. Five focused tests cover aim convergence, wall/shutter/door occlusion, target exclusions, angle wrapping and the existing server replay verifier accepting the resulting quantized controls.

The first FPS probe assumed immediate braking on the icy second floor; the retained failure correctly shows remaining momentum. The probe now waits for normal drift to settle. The older mouse regression reached every gameplay checkpoint but its preload accessed storage in an opaque document; it now checks the test origin before storage. Both failed reports remain in `attempts/`, followed by passing runs. The UI runner printed PASS and wrote its report, then stayed alive after its browser exited; only that identified runner was stopped. All test browsers are disposable and no user save is changed.

Codex inspected the compact HUD and FPS captures. These are Chrome phone emulations on the development machine, not physical-phone or Safari certification, a complete campaign victory, or a measure of subjective difficulty. The public gate below covers the opening aisle separately.

## Public release

The official, unchanged [phone/4G gate](jam/verdict.txt) passes against deployed commit `c2cf443402a7e5e91207d92809aae00e5d59be21`: readiness 2.1 seconds, 3.5 MB, 8.7 metres of real touch movement, 262 peak draws and 568,176 triangles, with no console errors or missing files. `deployment.json` confirms the four changed runtime files match that commit byte for byte over public HTTPS. The existing contest entry is being refreshed with this exact SHA and unedited verdict; its wallet and declarations stay unchanged.
