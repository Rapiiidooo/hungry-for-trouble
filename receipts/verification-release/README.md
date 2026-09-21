# Public release verification

Playable URL: [trouble.rapidoai.dev](https://trouble.rapidoai.dev/). Gameplay commit: `2284bd48dc7d669662c9ad3f5a28ecdbe1c498e6`. The public source is [Rapiiidooo/hungry-for-trouble](https://github.com/Rapiiidooo/hungry-for-trouble). Later receipts-only commits do not change the deployed game.

## Official phone gate

The unmodified official recipe harness passes against the public HTTPS address. `jam/verdict.txt` preserves its exact output, including the verdict block used in the entry PR. `jam/verdict.json` and three screenshots preserve the measured run.

```bash
PUPPETEER_EXECUTABLE_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' node ../404-game-recipe/harness/jam.mjs https://trouble.rapidoai.dev/ --commit=2284bd48dc7d669662c9ad3f5a28ecdbe1c498e6 --start='#start' --hold='#move-stick' --out=receipts/verification-release/jam
```

Readiness is 2.1 seconds, decoded transfer 3.5 MB (1.5 MB on the wire), movement 8.7 metres from real touch input, peak 262 draw calls and 568,176 triangles, with no console errors or 404s. Median frame rate is 60 on an Apple M5 Max using Chrome phone emulation, 390×844 at 3×, the harness's 4G profile and 2× CPU slowdown. This covers the opening aisle, not a physical phone benchmark or a full campaign.

## Public browser and persistence checks

`ui/report.json` is PASS. Independent disposable desktop and phone browser contexts use real controls against the public HTTPS site. Continue restores the saved campaign seed and kit after reload and renews a replay-verified attempt. A real 40-point run is accepted and appears in General for a separate browser, while remaining absent from Daily. Both co-op and versus pass create/join/start, propagated keyboard movement, phone reload/reconnect, simultaneous touch movement/fire and explicit departure. These are short room checks, not complete remote victories or a load test. Representative screenshots were inspected visually.

`persistence.json` records that the accepted test score survives a service restart and a valid compressed backup. Only that test identity's one row and its temporary backup were removed afterward; a clean backup was created and the service recovered. Host-specific operations and test cleanup scripts remain in private infrastructure records.

The public audio, entrypoint, story code and all three Atlas media files were fetched over HTTPS and matched their committed SHA-256 content. The runtime archive contains exactly `game/`, `server/`, `scripts/serve.mjs` and `package.json`, totalling 62 files and 3,478,519 uncompressed bytes. It excludes credentials, repository history and operational configuration. HTTPS, HTTP redirection and a certificate-renewal dry run pass.

All 51 simulation/server checks and the official 43-module shipping check passed after the Atlas runtime changes. Focused sound/portrait evidence and generator provenance are in [the Atlas receipt](../verification-atlas/README.md). Continue's detailed storage/replay checks are in [its receipt](../verification-continue/README.md). No additional combat or physical-device result is implied by this release.

Before publication, a targeted audit covered 417 historical text blobs across the first 23 commits, the staged Atlas release and commit messages. It found no private infrastructure identifiers or credential literals. Original development history is preserved; the first commit is dated 20 September 2026, 00:37 UTC.
