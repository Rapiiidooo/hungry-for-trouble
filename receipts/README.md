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

## Verification state

Eleven simulation checks pass, including movement and wall collisions, projectile occlusion, overtime, death, connected layouts, progression, shutters, ice inertia, stacked upgrades, out-of-bounds ambush predictions, announced charges and boss shield phases. The official shipping checker passes all 19 modules and relative paths. The selected asset pack passes 9/9.

The browser playthrough uses real keyboard and mouse events with read-only telemetry, without injecting state. All five floors were cleared, including the final boss and checkout, and loss/retry was verified. Touch verification covers simultaneous movement and aiming, a third touch for dash, release/cancellation, sound, pause and landscape rotation. Eight successive restarts retain a stable GPU geometry count (209 initially, then 208 on every retry); effect geometry/materials and finished audio voices are released. Reports and representative screenshots are retained in `verification/`.

The official phone gate was run against the local preview with a 390 × 844 viewport, 4G shaping and 2× CPU slowdown. It is an emulated-device result on an Apple M5 Max, not a physical phone or deployed-site verdict. Its full JSON records readiness, transfer size, draw calls, triangles, frame rate, actual touch movement and errors. Only Google Fonts is fetched externally; the game and Three.js come from the game folder.

Visual review led to a quieter floor pattern, brighter crumbs, closer framing and separate baking of articulated actor parts. The first campaign run also exposed a trivial boss fight; the final build has protected shield phases, capped pellet damage and a denser second attack phase. Procedural shapes are intentionally simpler than the image references. Automated checks establish correctness; enjoyment and replay value still need the user's playtest.
