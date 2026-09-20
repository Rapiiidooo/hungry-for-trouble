# Build receipts

## Intent

The user requested the next original maze-chase/shooter game after rejecting the previous game's contract-heavy progression and similar-feeling districts. This build prioritizes the action loop before menus and progression. The initial checkpoint is commit `986b0b5`.

## Visual references

Built-in ImageGen generated the original isolated references in `references/`. Prompts are recorded in `reference-prompts.json` and `reference-prompts-2.json`. Each exact prompt is assembled as:

```text
Original 3D game asset reference, isolated object. {asset description} Style shared across the entire game: {shared style} This is one object only. Do not create a collage, a grid, multiple candidates or a screenshot. Render a beautiful polished physical object, with clear form that can be recreated in procedural Three.js.
```

The prompts use the same style lock. Images are references only, not imported geometry. The generated images are more detailed than the deliberately lightweight runtime meshes.

## First object batch

`scripts/generate-candidates.mjs` writes three different construction approaches for each object. The original twelve candidates and official verifier output are retained in `candidates/`. All twelve passed geometry, scale and render checks. The main agent visually inspected the five-view contact sheet; this was not an independent critic.

| Object           | Selected | Reason                                                                                            |
| ---------------- | -------- | ------------------------------------------------------------------------------------------------- |
| Vacuum           | B        | The lathed body preserves a rounded canister silhouette and the separate articulated nozzle.      |
| Security trolley | A        | Vertical slats make the basket legible; B reads as a solid bin and C has noisier horizontal bars. |
| Shelf            | C        | The open top keeps cereal packages visible from the elevated gameplay camera.                     |
| Battery          | A        | The front and rear bolt stay visible; B's curved profile partially buries the rear detail.        |

## Second object batch

The second fifteen candidates are retained in `candidates-second/`. Fourteen passed; floor A was rejected by the verifier for having only 128 triangles. It was not selected. The main agent inspected the full five-view sheet and chose the following passing candidates.

| Object   | Selected | Reason                                                                                 |
| -------- | -------- | -------------------------------------------------------------------------------------- |
| Polisher | B        | Rounded shoulders and a lower red visor distinguish it from the boxy security trolley. |
| Freezer  | B        | Chamfered corners retain a readable lid and vents from every side.                     |
| Checkout | C        | Individual conveyor rollers make the exit read as a checkout from above.               |
| Snack    | C        | An irregular faceted crumb reads as dropped food instead of a cube or flower.          |
| Floor    | B        | A bevel and inset edge keep the tile readable without cluttering narrow corridors.     |

World scenery uses these selected assets through the official loader. The boss is an enlarged articulated trolley, and moving warehouse barriers reuse the freezer model. Ground rings, interface labels and particles are functional interface/effect geometry. No third-party mesh or trademarked character is included. The original soundtrack and effects are synthesized with Web Audio; no Atlas generation was needed for this first slice.

## Baseline verification

Eleven simulation checks pass, including movement and wall collisions, projectile occlusion, overtime, death, connected layouts, progression, shutters, ice inertia, stacked upgrades, out-of-bounds ambush predictions, announced charges and boss shield phases. The official shipping checker passes all 19 modules and relative paths. The selected asset pack passes 9/9.

The browser playthrough uses real keyboard and mouse events with read-only telemetry, without injecting state. All five floors were cleared, including the final boss and checkout, and loss/retry was verified. Touch verification covers simultaneous movement and aiming, a third touch for dash, release/cancellation, sound, pause and landscape rotation. Eight successive restarts retain a stable GPU geometry count (209 initially, then 208 on every retry); effect geometry/materials and finished audio voices are released. Reports and representative screenshots are retained in `verification/`.

The official phone gate was run against the local preview with a 390 × 844 viewport, 4G shaping and 2× CPU slowdown. It is an emulated-device result on an Apple M5 Max, not a physical phone or deployed-site verdict. Its full JSON records readiness, transfer size, draw calls, triangles, frame rate, actual touch movement and errors. Only Google Fonts is fetched externally; the game and Three.js come from the game folder.

Visual review led to a quieter floor pattern, brighter crumbs, closer framing and separate baking of articulated actor parts. The first campaign run also exposed a trivial boss fight; the final build has protected shield phases, capped pellet damage and a denser second attack phase. Procedural shapes are intentionally simpler than the image references. Automated checks establish correctness; enjoyment and replay value still need the user's playtest.

## Arcade expansion

The user requested stronger health/ammunition feedback, illustrated upgrades, a longer escape route with boss milestones, tougher ranged enemies, a first-person pickup, a daily challenge and a real shared leaderboard. The original five-floor slice remains the baseline above; the current campaign has ten floors.

The built-in ImageGen mode generated three new isolated references. Their exact prompts and saved paths are recorded in [reference-prompts-expansion.json](reference-prompts-expansion.json): [audit drone](references/audit_drone.png), [visor](references/visor.png), [Director](references/director.png). The main agent inspected these references before constructing the geometry. `scripts/generate-expansion.mjs` produced nine candidates using distinct shell constructions. All nine passed the official verifier; the five-view comparison is preserved in `candidates-expansion/_verify/`.

| Object      | Selected | Visual reason                                                                                                   |
| ----------- | -------- | --------------------------------------------------------------------------------------------------------------- |
| Audit drone | A        | The rounded shell matches the reference, keeps the scanner eye prominent and has readable back vents.           |
| Visor       | B        | Two rounded binocular housings match the reference more closely than the rectangular or chamfered alternatives. |
| Director    | B        | The profiled kiosk shoulders and sloped lower tray read as an appliance from all five views.                    |

The main agent made the visual choices, not an independent critic. Runtime files are byte-identical to their chosen candidate modules. The complete selected pack passes 12/12. Upgrade pictures are original native SVG, using the same palette and appliance motifs. No new Atlas key, mesh download or trademarked asset is used.

### Expansion verification

Reports and screenshots in `verification-expansion/` record:

- Seventeen Node checks, including connected maps, ranged warnings and occlusion, conveyor movement, visor duration, upgrade effects, deterministic daily input replay and server persistence.
- Server verification of two identities, a forged client score, invalid inputs, concurrent duplicate submissions, premature submissions, cross-origin requests, repeat best scores and the UTC daily reset.
- A complete ten-floor campaign through real keyboard/mouse events, both bosses, death and retry. The Director took about 51 simulated seconds and the run finished with two hearts. This is a precise automated player, not an estimate of a human's play time.
- A real 90-second Daily Rush survival (5,400 recorded ticks), accepted by server replay with 8,770 points. A separate lost run was also accepted, then read from an independent browser identity. These are test aliases and actual played scores, not prefilled sample leaderboard entries.
- Mouse look/fire and simultaneous touch movement/look/fire in first person, the overhead toggle, persisted unlocks and practice launch after reload.
- Touch controls in portrait and landscape, eight clean restarts with stable geometry counts, plus the official mobile jam gate and shipping check.

The official gate passes locally: approximately 5.2-second readiness, 2.5 MB compressed transfer, 8.7 m of real touch movement, peak 289 draw calls and 574,344 triangles, median 60 fps, zero runtime errors and missing resources. This is Chrome phone emulation on an Apple M5 Max with simulated 4G and 2× CPU slowdown, not a physical-device or deployed-site guarantee. The gate covers the opening aisle; campaign, daily and FPS behavior have separate real-input checks.

Visual inspection prompted a smaller first-person nozzle, lit ceiling panels, omission of the tile's raised directional inlay, prominent heart/ammo feedback and a connected serpentine escape route. Temporary test harness failures caused by switching Puppeteer's mobile profile mid-run were corrected by preserving the profile across viewport changes. Test results are scoped to the behavior each report actually exercises. No hosting or contest submission has been performed.

## Supermarket palette refresh

The user found the previous colour theme too generic and AI-styled. The current runtime uses cream paper menus, tomato red actions, ink blue enamel and honey gold pickups. HUD damage stays bright salmon. CSS, SVG upgrade art, minimap markers, scene lighting and assembled material colours were changed together. No geometry or scored simulation was changed; original recipe source files and their historical verification remain intact.

`verification-theme/` contains menu, route, daily board, gameplay, upgrade and first-person screenshots plus browser verification reports. Desktop, 390 × 844 portrait and 844 × 390 landscape views load without errors or horizontal overflow. The existing eight-restart smoke check retains 213 initial geometries and 208 on every retry. The existing FPS playthrough clears the first aisle with real input, equips an upgrade, collects the visor and checks mouse and simultaneous touch movement/look/fire, persisted unlocks and practice. The shipping checker passes all 24 modules and relative paths. The final UI contrast adjustment gives cream button text a 4.7:1 ratio against tomato red.

This is a local visual refresh check, not a rerun of the full ten-floor campaign, server replay suite or official throttled mobile performance gate. Those earlier results remain in `verification-expansion/`. No new generated images, Atlas calls or hosting were needed.
