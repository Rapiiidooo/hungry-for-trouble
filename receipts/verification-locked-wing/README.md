# The Locked Wing

The user requested another wave after floor 20, using red, green, blue and yellow keys to unlock passages. Five hidden floors now introduce the mechanic progressively, preserve the crew escape and golden vacuum reward, and end at the Locksmith's backup vault. An existing floor-20 victory unlocks aisle 21. The first route still shows ten floors, then twenty after the Director, then twenty-five after the core.

## Construction

`game/locked-wing.js` builds seeded room plans with one-cell corridors and necessary coloured locks. Key Cardio introduces red; Key Exchange adds green and reusable locks; Blue Detour uses icy branches; Four On The Floor adds yellow and an initially accessible transport shortcut; the final perimeter circuit opens a central arena. Cover and supplies vary with the seed. No key is placed behind its own lock and transport cannot skip the key order.

`locks.js` owns deterministic pickup/opening, collision lookup and the shared colour/symbol definitions. Keys stay for the whole aisle and reset on restart or progression. Pickups award 150 points once. All keys, the crumb quota and any boss defeat are required for checkout. The Locksmith waits for the last door, then combines rotating receipt fans, marked staggered parcels and gapped shockwaves. The existing warning and protection rules apply.

All twelve selected recipe asset modules remain unchanged. Doors reuse the verified freezer model with coloured enamel; key tickets are original canvas/SVG illustrations. Triangles, diamonds, circles and squares accompany colours in the world and inventory. Opening lowers the barrier over 450 ms, or immediately with reduced motion. Three original synthesized sound cues mark pickup, access granted and access denied. No external mesh, media generation or Atlas call was used in this pass. Atlas catalogue publication remains conditional on actual submission.

Campaign replay now uses `campaign-2`; the all-time board retains its existing storage identity so previous verified scores are preserved. Daily rules and its leaderboard remain unchanged.

## Rules and regression checks

`npm test` passed all 48 Node checks. The seven new checks cover:

- 1,000 layouts, necessary keys, ordering, enough crumbs, safe spawns and walking around every transport pad.
- Wrong-key collision, dash blocking, enemy routing and projectile occlusion, followed by matching-key access.
- A single pickup reward, multiple matching locks and reset between floors or restarts.
- Legacy save migration and route visibility at the two reveals.
- The core continuing into 21 with the same build, and only the final vault ending the campaign.
- Dormant boss behaviour, marked artillery/waves and power-down after defeat.
- Identical key pickup/opening under a quantized input replay.

The campaign HTTP test was then extended with a pre-existing `campaign-1:all` record. Its focused two-test rerun passed, proving that the legacy score remains visible alongside new scores, through daily pruning and a server restart. The official shipping checker passes 42 modules and one page. Previous 12/12 selected-asset verification remains applicable because those files are unchanged.

Two initial test-driver assertions were corrected: the key-necessity test had incorrectly granted every other key up front, and the deterministic walker stopped outside door-opening range. Neither required weakening the game rules. Portal rooms reserve walkable space around transport landings.

## Browser evidence

Browser bindings were unavailable after the documented Browser skill discovery. Scripts use the adjacent recipe's Puppeteer and local Google Chrome. Disposable profiles avoid changing the user's save. These are desktop and phone viewport checks, not physical-device or public-host tests.

`ui/report.json` is **PASS**. Only practice unlocks are preloaded. Real keyboard, pointer and finger events check the frozen key briefing, the three-heart/ten-shot kit, a missing key blocking entry, collecting red, the held-key indicator, walking through the opened door without consuming the key and reset on retry. It also checks 10/20/25 route visibility, migration from an old clear, and four-key HUD placement in portrait, landscape and desktop. Peak sampled use during this focused route was 355 draws and 309,740 triangles, with no browser errors.

`locked-wing-first.json` remains **FAIL**: real inputs cleared 21, 22, 23 and 24, then lost on 25 with the Locksmith at 104/360 health. The navigator repeatedly left the arena to seek distant supplies. After constraining its supply choices during that fight, `locked-wing-vault.json` cleared 24 but lost on 25 at 147/360 health. These establish actual exploration, pickup, opening, combat and inter-floor progression; they do not establish a completed five-floor or twenty-five-floor campaign. The game was not made easier to obtain a green report.

Two further real-input continuation attempts, `locked-wing-discovery.json` and `locked-wing-transition.json`, lost on the existing floor 20 and floor 19 respectively, before the new reveal. They remain **FAIL**. Earlier successful core combat evidence is historical and is not presented as a new victory.

`endings/report.json` is a separate **PASS presentation fixture**. Only that browser intercepts `main.js` and constructs practice floors 20/25 at their checkout conditions. No source file, production hook or shared score is changed. The normal simulation then triggers the UI flow. This checks the crew escape, persistent gold reward and aisle-21 unlock, discovery scrolling, continuation with an offered upgrade, the new briefing, reload persistence, the final dialogue/result and the completed route. It explicitly does **not** certify combat wins.

That fixture caught a landscape clipping bug: the discovery panel's vertical margin forced an oversized card above the scrollable area. Restoring automatic margins and safe centring fixed it; desktop, portrait, 390×640 and landscape now pass. The first failed report and screenshot are retained as `ending-clipping-failure.*`.

## Delivery

The official local phone/4G gate is **PASS** against implementation commit `2445aeb86b29f60998c52b69deacf7b63685d443`. Its [unedited printed verdict](jam/verdict.txt) records 5.7-second readiness, 2.7 MB, a real start tap and 8.7 metres of finger movement, 262 peak draws, 568,176 peak triangles, no errors and no missing files. It uses a 390×844 viewport at 3×, 4 Mbps down, 1 Mbps up, 60 ms latency and 2× CPU slowdown on the local Apple M5 Max. This covers the opening aisle; later floors have the separate checks above. It is not a physical-phone benchmark or live-URL submission gate.

No deployment, push or contest submission was performed. A live-URL gate is still required for entry.
