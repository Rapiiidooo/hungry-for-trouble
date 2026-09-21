# Department identity and first-minute coaching

Local candidate: `a26485367a1b4525e31c337b4f180b8e34f29fea`, prepared on 22 September 2026. The published entry remains on `c2cf443402a7e5e91207d92809aae00e5d59be21`. These receipts describe local verification, not a public deployment or an organizer verdict.

## What changed

Fifteen department themes now coordinate floor artwork, fixture colours, shelf proportions, signs and lighting. Breakfast shelves use neutral terrazzo and tomato enamel; cold storage uses blue frost lines and icy cabinets; shipping uses steel tread, ochre stock and taller shelving. Later floors use these families plus sale diamonds and office stripes. Department signs add original pictograms and short store jokes. The first version placed a large sign over the player; smaller signs backed by full shelf rows keep the passages readable.

One short cue at a time explains crumb ammunition, protected dodge and Vac Cam during the first three solo aisles. Actual shots followed by crumbs, a dodge and firing after a real visor pickup complete the lessons. Learned actions persist on the browser; Settings reset clears them. Cues stop in menus and pause, wait behind urgent messages and avoid the thumb controls. Visors now have a nearby label naming their 18-second effect. Simulation, replay validation, equipment and score rules are unchanged.

## Asset provenance

All twelve selected 404 recipe modules are byte-identical to the submitted version. Scenery reuses their geometry through the existing loader and baker. `game/departments.js` clones materials, derives UVs from the selected floor geometry and draws original Canvas floor patterns and sign sprites. It imports no meshes, literal vertex data or external artwork. Atlas's existing music and two portraits remain unchanged; this pass makes no new Atlas call and claims no additional Atlas output.

## Verification

| Check               | Result and scope                                                                                                                                                                                                                                                                                           |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Node suite          | 56/56 pass. The first sandboxed attempt could not bind four local HTTP test servers; rerunning with local server permission passed.                                                                                                                                                                        |
| Recipe ship         | 47 modules, one page; every module parses and every path remains inside the folder.                                                                                                                                                                                                                        |
| Local jam gate      | `jam/verdict.json` and the unedited `jam/verdict.txt`: PASS at the candidate commit. Phone 390×844 @3x, 4G and CPU 2x slowdown; ready 5.8 seconds, 3.5 MB, 8.7 metres from a real touch, 263 peak draws, 568,178 triangles, zero errors and 404s.                                                          |
| Department scenes   | `departments.json`: 36 actual-input samples across all 15 theme families on desktop and phone. Peak sampled draws 404; triangles 939,914. No page errors or failed HTTP responses.                                                                                                                         |
| Rebuild disposal    | `disposal.json`: five cycles through aisles 1–3 on both profiles. After warm-up, aisle-one geometry count stays at 222; texture counts stay at 7 desktop and 6 phone. Other aisle counts vary with procedural cover without monotonically accumulating.                                                    |
| Contextual learning | `coach.json`: desktop, portrait, landscape with reduced motion, and 320 px width. Real firing, crumb refill and dodge, visible confirmation, controls unobstructed, pause, persistence and confirmed reset pass.                                                                                           |
| Touch FPS           | `touch-fps.json`: three real visor pickups, hold fire, relative swipes, simultaneous movement/fire/dodge, cancellation, pause and view reversal pass. Visor firing completes its lesson.                                                                                                                   |
| Comparison images   | `before/` and `after/` show the first three aisles. The baseline used `8058373`, whose runtime matches the submitted commit. Only `main.js` and `index.html` were intercepted in disposable browsers; other runtime files are unchanged. Procedural cover and movement timing can differ between captures. |
| Demo                | `demo.json`: real keyboard/mouse clips on practice aisles 1, 2, 3 and 5, including a visor transition and Manager combat. All four retained clips end alive. This is not a campaign completion.                                                                                                            |

The first department probe failed because its phone tap missed a button below the scrolled route map. Scrolling the element into view before its actual tap fixed the probe. Early recording attempts failed on mouse-state tracking and a shadowed helper name. A later automated FPS attempt lost the game; the final recorder handles result screens and uses a shorter stationary FPS demonstration. None of these fixes changes game balance or injects combat state.

Final cross-checking found that landscape coaching could overlap the FPS switch and its timer. The cue now sits above the complete visor control, with an actual visible-cue overlap assertion in all three touch layouts. The first extended control probe drove into a patrol and lost; `attempts/fps-controls-loss.json` and its screenshot preserve that FAIL. The probe now retreats for its dodge check, still using ordinary controls. Its final three-layout result is PASS. `jam-initial/` retains the first implementation's passing gate; `jam/` checks the final layout correction. The desktop video and department scenery were unaffected by this CSS adjustment.

Browser bindings were unavailable after the documented discovery procedure. Tests used the adjacent recipe's Puppeteer and Google Chrome. Phone results are emulated viewports; they are not physical-device measurements or unfamiliar-human playtests. No shared score was submitted, and no user save was reset. Fresh contexts and practice unlock fixtures isolate the checks.

## Reproduce and review

Run the local preview on port 3001, then use these commands from this repository:

```bash
npm test
npm run check
node scripts/departments-playtest.mjs --all
node scripts/departments-playtest.mjs --baseline
node scripts/departments-playtest.mjs --repeat
node scripts/field-coach-playtest.mjs
node scripts/mobile-fps-playtest.mjs
node scripts/record-departments.mjs
```

The recording script also requires local FFmpeg. It creates the ignored file `outputs/department-demo/hungry-for-trouble-departments.mp4`, a silent 28.13-second H.264 demonstration at 1360×900 and 30 fps (11,232,562 bytes). Cuts remove only the menus between practice aisles. The video is outside the shipped `game/` directory and does not add to the play-link transfer budget. Its hash and source hashes are retained in `checks.json`. The video itself stays local; selected screenshots and these receipts are prepared for source history.

The gate used the unmodified adjacent recipe harness against `http://localhost:3001/`, with `--start='#start' --hold='#move-stick' --commit=a26485367a1b4525e31c337b4f180b8e34f29fea`. The renderer was Apple M5 Max through ANGLE Metal. A deployment would need a fresh gate against its public URL and an explicit entry revision update; these local results do not replace the published verdict.
