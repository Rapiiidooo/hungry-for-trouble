# Department polish: public release and trailer

The owner authorized publication of the visual and onboarding improvements, removal of the abandoned game's dependency directory, and a revised gameplay trailer. Runtime commit `53def44f599b46edf8722b58b954896a6187b0dc` is live at [trouble.rapidoai.dev](https://trouble.rapidoai.dev/). The repository now owns its pinned Prettier installation; it does not borrow tools from another game.

## Public verification

The unmodified recipe gate passes against that HTTPS URL and commit. The [exact verdict block](jam/verdict.txt) records readiness in 2.2 seconds, 3.5 MB decoded transfer, a real tap, 8.7 metres of touch movement, 263 peak draws, 568,178 peak triangles, zero console errors and zero missing files. This is a 390×844 Chrome phone viewport under the harness's 4G and CPU profile, not a physical-phone benchmark. The JSON receipt changes only the three screenshot paths to relative filenames; verdict values and the pasted text are unchanged.

[Deployment checks](deployment.json) compare the five changed runtime files and the Atlas music file with the committed bytes fetched through public HTTPS. Health, distinct Daily and General leaderboard contracts, and the existing analytics script respond successfully. The score store checksum is unchanged across the dedicated service restart. No test score was submitted. Private operational details remain outside this repository.

[Submission verification](submission.json) confirms that PR #6 retains the supplied wallet and five declarations, names the deployed commit, includes the unedited verdict and links the trailer. The PR is open and mergeable; organizer review and their own gate rerun remain pending. [Video publication verification](video-publication.json) confirms that an unauthenticated MP4 download matches the local export checksum.

[Earlier polish verification](../verification-departments/README.md) covers all fifteen department themes, four coaching layouts, three touch FPS runs, five repeated rebuild cycles, 56 passing Node checks and the 47-module ship check. The shipping check was repeated after the formatter was moved; no runtime code changed during publishing. The selected recipe models, simulation rules, scoring, saves and three Atlas assets are unchanged.

## Gameplay trailer

[Watch or download the release](https://github.com/Rapiiidooo/hungry-for-trouble/releases/tag/jam-polish-2026-09-22), or [download the MP4 directly](https://github.com/Rapiiidooo/hungry-for-trouble/releases/download/jam-polish-2026-09-22/hungry-for-trouble-trailer.mp4).

The replacement trailer is 43.73 seconds, 1280×720 at 30 fps, with stereo AAC audio. Eight practice aisles show moving combat, Overtime, the real visor pickup and first-person firing, transport, the Foreman and SHELF CONTROL, a red key and matching door, the green-key route, and an earned Crumb Storm upgrade. Gameplay excerpts play at their captured speed. Short crossfades, two dips to black, original caption overlays and an end card form the edit.

The soundtrack is the existing original Atlas creation made with Google Lyria 3 Clip. Its generation prompt requested 132 BPM; this grid guides the cuts. The audio repeats with the same 350 ms crossfade used by the game, then receives loudness normalization and opening/ending fades. No new generation or catalog publication occurred. The end card credits Rapido, the 404 recipe and Atlas.

The capture preloads route unlocks and learned presentation tips in a disposable browser profile. Health, ammo, position, upgrades and combat are not injected. Input and pickups are real; this edited demonstration does not claim one continuous campaign clear. The public game was the capture source and no score was posted. The earlier silent demonstration remains documented in the previous receipts, but this is the published video.

- [Capture and event markers](trailer-capture.json)
- [Edit decisions, music provenance and MP4 checksum](trailer-edit.json)
- [Decode, sound and visual review](trailer-quality.json)
- [One checked frame per shot](trailer-contact-sheet.png)

Reproduction uses `scripts/record-trailer.mjs` followed by `scripts/edit-trailer.mjs`, with local Chrome, the recipe's Puppeteer and FFmpeg. Raw captures and the MP4 remain in ignored `outputs/trailer/`; the public MP4 is a separate GitHub release asset and is never fetched by the game. The video does not increase the game's loading weight.
