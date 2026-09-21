# Atlas runtime integration

Three existing Atlas creations are now used at runtime: the Lyria 3 Clip soundtrack and Gemini 3.1 Flash Lite Image portraits of MOP-3 and SHELF CONTROL. Exact prompts and original generation costs remain in `../atlas/generation-assets.json`. `../atlas/runtime-assets.json` records source IDs, original/runtime hashes, dimensions, processing and byte counts. No new generation was requested.

The owner explicitly authorized immediate workspace-catalog publication on 21 September 2026, replacing the earlier after-submission condition. These three files were published and downloaded with the workspace key restricted to the returned Atlas API endpoint. The project graph was then returned to private to prevent automatic publication of future outputs. The three catalog assets remain available to workspace members. Public-link sharing was never enabled. No credential is required by the game.

## Shipped media

| File                            | Generator through Atlas     |  Runtime size |
| ------------------------------- | --------------------------- | ------------: |
| `game/media/night-shift.mp3`    | Google Lyria 3 Clip         | 744,609 bytes |
| `game/media/mop-3.webp`         | Gemini 3.1 Flash Lite Image |  14,678 bytes |
| `game/media/shelf-control.webp` | Gemini 3.1 Flash Lite Image |  12,042 bytes |

The two 1024-square originals were inspected visually and converted to 256-square WebP at quality 84. The MP3 is byte-identical to the Atlas download: stereo, 44.1 kHz, about 30.77 seconds, measured mean/peak levels of −14.3/−0.1 dB. Original files remain outside the browser build. Runtime additions total 771,329 bytes. Every world mesh remains unchanged recipe-built Three.js geometry; these portraits are flat interface art.

The soundtrack loads after a player gesture and uses a 350 ms tail/intro crossfade in its decoded loop buffer. Pause and mute fade it out, preserve its position and resume without duplicate sources. Hidden tabs stop the music immediately. Overtime keeps its distinct original synthesized cue, as do combat, damage, repairs and the ending. Failed fetch/decode falls back to the prior synthesized score. Credits name Atlas and both generators for their actual shipped work; BUFF-0 and the interface diagrams remain original code-native art.

## Verification

- All 51 simulation/server tests and the official 43-module shipping check pass after integration.
- `ui/report.json` is PASS. A disposable server/profile checks real desktop and touch briefings, actual aisle-three SHELF CONTROL radio, credit attribution, gesture-started playback, real pause/mute/resume and measured output.
- A separate Sound component fixture follows a complete real-time loop, observes nonzero output without restarting its source, switches to Overtime and back, and checks a deliberately undecodable response falling back to synthesized music. These are actual Web Audio measurements, not subjective listening: audio input is unavailable in this environment.
- The first probe used one instantaneous RMS sample and failed during a quiet frame; the next identical playback passed. The final probe samples a 400 ms window to distinguish musical rests from persistent silence. No game audio change was made to suppress that test failure. Screenshots were visually inspected at desktop and phone sizes.

The [final public-URL gate](../verification-release/README.md) passes for submitted commit `2284bd48dc7d669662c9ad3f5a28ecdbe1c498e6`, which includes these files. Earlier Continue gates remain historical evidence for their own commit.
