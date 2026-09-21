# Atlas asset integration

The user explicitly wants Atlas showcased in Hungry for Trouble. The feel/story pass and multiplayer implementation are complete locally. This remaining task is downloading, inspecting and integrating three already-generated original Atlas outputs. Do not regenerate them unnecessarily.

## Current assets

Project: `adcf8ed1-9469-4796-8d09-299fe978aead`, **Hungry for Trouble · Radio, portraits and soundtrack**, in **Vincent Le Jeune's 404 Game Jam Workspace**.

| Asset                  | Model reported by Atlas     | File ID                                |
| ---------------------- | --------------------------- | -------------------------------------- |
| Arcade soundtrack      | Google Lyria 3 Clip         | `33a924d2-b8a7-43ba-8716-b765c99ec0b8` |
| MOP-3 portrait         | Gemini 3.1 Flash Lite Image | `06e7c09d-6dfc-4ad7-8427-44e046209e6b` |
| SHELF CONTROL portrait | Gemini 3.1 Flash Lite Image | `15d2d769-e152-4a85-82c8-b067b4a9ee02` |

Exact prompts, graph identifiers and generation status are in `receipts/atlas/generation-assets.json`. The successful turn cost 56 Atlas credits, including 13 reported node-generation credits. The earlier aborted turn cost 2 credits. Audio is reported as a 30-second MP3; image nodes used 1K square output despite the prompts asking for 512 px. Actual media dimensions, duration and appearance remain unverified because the files are not downloaded. None is used by the game yet.

## Pending permission

Automatic approval review rejected `set_project_team_access` with `access_level: "workspace_read"`. The operation permanently publishes the project's generated files to all members of the named workspace, even if the project is later made private or deleted. Public-link sharing is separate. No access change was executed.

An asynchronous question already asks the user to approve exactly this project and its three creations for that workspace catalog. There is no answer yet. Do not retry, infer consent from elapsed time or use an indirect route to make the same access change. The standard MCP download method requires that publication. The private web editor also has a queued ZIP card, download ID `8005f076-7e6c-46b3-929f-85c4c0f7f150`; no available signed-in browser binding was found.

## Resume after approval

1. Confirm the actual reply covers permanent workspace access, then call `set_project_team_access` for the exact project above. Do not enable public-link sharing.
2. Resolve each known file with `get_workspace_asset`, then download through the returned authenticated Atlas URL. Load the existing shared environment directly into Node; never inspect or print the environment file or key. `scripts/atlas.mjs` implements the MCP bridge.
3. Inspect both portraits, measure and audition the music, and compress the images for phone delivery. Keep originals and exact receipts outside the browser build. Store only selected runtime media under `game/media/`.
4. Use MOP-3 in the radio, SHELF CONTROL on the final-boss story/route, and the music through the existing sound toggle with a clean fallback. Credit Atlas and its reported generators only for files actually used.
5. Verify sound gestures, mute/pause, image readability and missing requests. Rerun the official local phone/4G gate against the resulting gameplay commit, update asset declarations and `docs/resume.md`, then remove this completed tracker.

Every world object must remain recipe-generated Three.js geometry. Atlas files are audio or flat interface illustrations, never downloaded meshes. The old coffin game's music and files stay separate.
