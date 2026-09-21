# Campaign Continue

Gameplay commit: `83c8d535676602f26c803c192fa01c23c42b5753`.

Continue reconstructs the latest saved aisle boundary from the actual run seed, input history and earned upgrade choices. IndexedDB stores the larger replay logs. A completed aisle is also saved while its upgrade is pending. Resuming starts paused; new campaigns ask before replacing the checkpoint. Practice and Daily Rush preserve it, while a campaign loss, final victory or confirmed local reset clears it.

The server can renew a checkpoint after attempt expiry or restart. It replays the completed prefix, binds its hash and pending upgrade to the new attempt, and gives elapsed-time credit only for that validated prefix. New gameplay still observes the challenge clock. No saved score or health field is trusted.

## Verification

- All 51 Node checks pass. Added coverage proves complete equipment/state reconstruction, log isolation after saving, invalid boundaries, old rulesets, resumed history tampering, new-gameplay timing, duplicate submissions and server restart. Trusted proxy coverage rejects forged client identity headers from untrusted peers.
- The official ship checker passes 43 modules and one page. The selected recipe assets are unchanged.
- `ui/report.json` is PASS. A disposable Chrome profile and Node score store check real new-game input, menu/reload, keyboard and touch Continue, exact earned equipment, pending upgrades, new-game cancellation/replacement, practice isolation, reset and corrupt/incompatible save recovery. Four viewports cover desktop, portrait, short portrait and landscape. Visual inspection caught footer overlap and then a clipped record in landscape; the final capture and a record-bounds assertion verify the corrected layout.
- Later-aisle fixtures use input logs produced by deterministic simulation of a genuine aisle-one clear. The browser checks load those checkpoints through the real storage API. They are UI/restore evidence, not an uninterrupted combat campaign or physical-phone test.

- `remote/report.json` is PASS against the dedicated server through a private SSH tunnel. Real keyboard input resumes a saved campaign and produces a replay-verified 40-point score, visible to an independent phone browser in General and absent from Daily. Both room modes pass two-client create/join/start, shared movement, phone reload/reconnect, simultaneous touch movement/fire and explicit departure. These are short deployment checks, not complete remote multiplayer victories or public-internet latency tests.
- The accepted test score survives service restart and appears in a valid compressed backup. The test identity's single score and that temporary backup were removed afterward, and a clean backup was created. Other rows are preserved. Private operational records hold the exact commands.
- The unchanged official jam harness passes locally in `jam/` and against the remote VM via a loopback SSH tunnel in `remote-jam/`. Both use the commit above, a 390×844 phone viewport, 4G shaping and 2× CPU slowdown. Local/remote readiness is 5.7/5.9 seconds; each transfers 2.7 MB, moves 8.7 m with real touch and peaks at 262 draw calls and 568,176 triangles. Both report zero errors/404s and median 60 fps on the local Apple M5 Max. Printed verdicts are unedited. This is Chrome emulation, not a physical-phone benchmark or public DNS/TLS certification.

Deployment-specific hostnames, addresses, firewall configuration and operational scripts stay outside this public repository. The runtime archive contains only `game/`, `server/`, `scripts/serve.mjs` and `package.json`, with no credentials or host inventory. A targeted check of all 23 commits through the gameplay commit found no private infrastructure identifiers or Atlas key patterns in tracked source, docs or receipts. A public URL gate remains a separate delivery check.
