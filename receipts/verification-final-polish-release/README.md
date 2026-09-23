# Final polish: public release

After the visual finish release and a successful test on the owner's own phone, the owner approved a last polish on 24 September 2026. Runtime commit `0ac02f146f6a21e933780fad916d48f7b83321af` is live at [trouble.rapidoai.dev](https://trouble.rapidoai.dev/).

## Changes

- The Vac Cam goggles sit below the HUD, so status stays readable through the lens change.
- First-person ceiling lamps read as thin fluorescent strips instead of floating panels.
- A machine scrapped within 1.6 metres of the first-person lens no longer spins across it; its burst remains.
- While a key is held, a ground chevron beside the vacuum points at the nearest door it opens, and that door's lock label gives way to its glow and beam.

A portrait framing change was tried and reverted: following further south raised the last wall instead of lowering it, and the opposite would push the vacuum under the thumb pads near the southern edge.

## Verification

57 Node checks and the 48-module ship check pass. Smoke, visual finish, phone Vac Cam, first-person feel, locked wing, endings, presentation, act two and phone layout browser checks pass, each against a freshly started local server. [Deployment checks](deployment.json) compare eight served files with the committed bytes; all match, the endpoints respond and the score store checksum was identical before and after the restart. The unmodified recipe gate passes against the HTTPS URL and commit: [verdict](jam/verdict.txt) and [JSON](jam/verdict.json), ready in 2.1 seconds with 3.5 MB, 333 peak draws, 614,866 peak triangles and no errors, missing files or external dependency. This is Chrome phone emulation, not a physical-phone benchmark. The published trailer from [the visual finish release](../verification-visual-finish-release/README.md) remains current.
