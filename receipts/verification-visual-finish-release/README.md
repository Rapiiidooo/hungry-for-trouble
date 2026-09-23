# Visual finish: public release and trailer

The owner approved publishing the visual finish release, its trailer and the matching entry update on 24 September 2026. Runtime commit `d3189497996019ce2f836779f614096589b9d5c3` is live at [trouble.rapidoai.dev](https://trouble.rapidoai.dev/). Local verification, before/after frames and retained failures are in [the visual finish receipts](../verification-visual-finish/README.md).

## Deployment

A whitelisted archive of the runtime commit (`game/`, `server/`, `scripts/serve.mjs` and `package.json`) was installed by the existing atomic release script, which restarted only the game service and passed its health check. [Deployment checks](deployment.json) compare fifteen served files, including the new fonts and silhouette module, with the committed bytes through public HTTPS; all match. Health, Daily and General leaderboard endpoints and the analytics script respond. The score store checksum was identical before and after the restart, and no score was submitted. Private operational details stay outside this repository.

## Public gate

The unmodified recipe gate passes against the HTTPS URL and runtime commit. The [exact verdict block](jam/verdict.txt) records readiness in 2.0 seconds, 3.5 MB, a real tap, 8.7 metres of touch movement, 333 peak draws, 614,866 peak triangles, zero console errors, zero missing files and no external dependencies. The [JSON receipt](jam/verdict.json) changes only the three screenshot paths to relative filenames. This is Chrome phone emulation under the harness's 4G and CPU profile on an Apple M5 Max, not a physical-phone benchmark.

## Trailer

[Watch or download the release](https://github.com/Rapiiidooo/hungry-for-trouble/releases/tag/jam-visual-finish-2026-09-24), or [download the MP4 directly](https://github.com/Rapiiidooo/hungry-for-trouble/releases/download/jam-visual-finish-2026-09-24/hungry-for-trouble-trailer.mp4). [Video publication verification](video-publication.json) confirms that an unauthenticated download matches the local export checksum. Capture, edit and quality receipts are in [the visual finish receipts](../verification-visual-finish/README.md#trailer). The earlier department-polish trailer remains on its own release.

## Entry

[Submission verification](submission.json) confirms that PR #6 names the runtime commit, pastes this exact verdict, keeps the supplied wallet, contact and five declarations, declares OpenAI Codex and Claude Code with their models and the self-hosted OFL typefaces, and links the new trailer. The PR body was refreshed before the matching entry commit was pushed. Cursor Bugbot completed successfully on that commit with no unresolved review thread. Organizer review and their own gate rerun remain pending; submission does not mean acceptance or a prize.
