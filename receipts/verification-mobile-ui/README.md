# Phone HUD and upgrade illustrations

The owner reported oversized phone health/ammunition panels and broken upgrade illustrations. The baseline reproduces both: a 123.6 px portrait status panel, and 128 px illustrations placed absolutely over text that reserved only 100 px. Rotating/scaling diagrams on hover also pushed them outside their frames. The original failing layout report and representative screenshots remain in `before/`.

The phone status panel is now 47 px high with the starting kit, about 62% shorter in portrait and 44% shorter in landscape. Heart and ammunition counts stay prominent; eight heart slots and shield charges fit within 64.4 px even at 320 px width. Repeated health/ammunition explanations leave the combat panel on phones; the briefing, pause help, pickup feedback and checkout repair notice still explain the rules. Multiplayer repair guidance remains visible. Thumb targets keep their original sizes, and desktop HUD sizing is unchanged.

Upgrade cards use an actual responsive grid. Phones show the resulting effect diagram beside its title and description, followed by exact before/after numbers; desktop retains both diagrams. SVGs keep their aspect ratio, labels have their own space, and hover no longer rotates diagrams out of their frames. Health upgrade artwork can show all eight slots. The illustrations are the existing original code-native SVG artwork; no new Atlas generation or mesh is involved.

## Verification

`scripts/mobile-ui-playtest.mjs` passes six Chrome viewport layouts: 320×568, 360×640, 390×844, 667×375, 844×390 and 1280×800. `ui/report.json` records 54 card checks across all eight upgrade types, no art/text overlaps or horizontal overflow, and five high-health/shield HUD fixtures. Codex visually inspected the portrait effects, small loaded HUD, landscape and desktop captures.

Ordinary HUD captures use a real start. Isolated browser-only checkout fixtures invoke the production card renderer without a combat playthrough; they are explicitly presentation evidence. Real touch reaches the last card, equips the offered upgrade and enters the next aisle in every phone viewport, with a mouse selection on desktop. Disposable profiles keep saves separate, no score is posted, and Do Not Track prevents technical visits from entering analytics when run against production.

The existing touch playtest also passes simultaneous movement/fire, a third touch for dash, release, cancellation, audio, pause and rotation. `touch.json` contains its check summary. The official shipping checker passes all 44 modules and one page. There are no JavaScript runtime errors. These checks emulate phones in Chrome; they do not claim a physical-device or Safari result. Simulation, replay, saves and server behavior are unchanged, so the previously passing 51-test suite is not repeated for this presentation-only change.

## Release

The [unaltered official public phone/4G verdict](jam/verdict.txt) passes for deployed commit `30083a239c0c1c9739a50636e89a8525dfe647da`: readiness 2.5 seconds, 3.5 MB, 8.7 metres of real touch movement, peak 262 draw calls and 568,176 triangles, with zero errors or missing files. `deployment.json` confirms that public HTTPS serves all three changed runtime files byte-for-byte from that commit. The matching SHA and verdict are published in [entry PR #6](https://github.com/404-Repo/404-game-jam/pull/6); `submission.json` records the update. The owner-supplied SS58 wallet is already published in the entry and PR description; its format and checksum were verified. The initial stale commit/verdict review thread was resolved after confirming matching SHAs. All required entry fields and declarations are present; the organizers still need to rerun the gate and merge the entry.
