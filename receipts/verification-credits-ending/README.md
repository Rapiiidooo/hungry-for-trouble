# A vacuum-delivered signature

The 60-second credits roll now ends with a 4.4-second scene. An original native SVG vacuum enters, coughs and spits a small receipt from its nozzle. The paper flies up and unfolds into Made by Rapido, with a perforated edge and CSS barcode. The optional continuation and final button fade in after the paper settles. No new 3D geometry or external assets are used.

Pause freezes the courier, cough, dust and ticket. Skip Credits starts the delivery; Skip Animation settles it immediately. The finale remains inert until its controls are ready. Reduced motion replaces physical travel with a short opacity dissolve. Manual playback still returns to Settings without revealing the basement.

## Focused verification

- `browser.json`: real Settings interactions check natural 60-second completion, the delivery duration, frozen pause poses, flight, delayed controls, both skip stages, repeated playback, Escape and reduced motion. Desktop, 390×844 portrait and 844×390 landscape use local Chrome. The report has no browser errors.
- `continuation-fixture.json`: the real credits module runs in isolation with `reveal=true` and the game module blocked. Real clicks and scrolling verify the post-Director invitation, a reachable receipt on 320×568, landscape scrolling and the `onExit(true)` callback. This is presentation evidence, not a combat clear or proof of the Director trigger.
- `ship-check.txt`: the unmodified recipe check parses all 39 modules and verifies paths. `source-sha256.txt` identifies the changed runtime sources.

Selected screenshots show the cough, flying ticket, settled receipt and continuation. These are browser viewport checks, not physical-device benchmarks. Run `node scripts/credits-playtest.mjs` against the local server to repeat the main probe. The campaign probe now waits for the delivery to finish before selecting the continuation.

## Failures retained

`initial-probe.json` records a test assertion made before the next read-only telemetry snapshot, after a reduced-motion click had already settled the DOM. Waiting for that snapshot fixed the test without changing runtime behavior.

`small-portrait-before-fix.json` records a real layout issue: centering an oversized final card clipped the top on a short phone. Safe flex centering now starts at the top when space is insufficient, preserving scrolling.

`director-first-attempt.json` and `director-second-attempt.json` retain two real-input practice losses before the credits. Neither run reports a browser error. No combat rules or state were changed to force a win. The earlier successful Director-to-aisle-11 run remains archived in `../verification-leaderboards/`; this pass does not claim a new campaign clear.

The unchanged 41 Node checks and official gate were not rerun for this credits-only change. The previous official local gate targets `d3cdd7a964fa2d48fc562b10248b1441d01ddba3`. No Atlas operation, deployment, push or submission occurred.
