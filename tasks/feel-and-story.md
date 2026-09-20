# Feel, readability and store takeover

The user likes the game but still finds cream too generic. They request a smoother overhead/FPS transition, readable enemy fire in FPS, more explanatory upgrade illustrations, varied level silhouettes after aisle one, clear healing, stronger graphics and story ideas. They also asked what Atlas has actually supplied.

## Direction

Keep the vacuum hero. SHELF CONTROL, the store AI, has classified staff as rubbish. MOP-3, a captured cleaning robot, guides the player through brief radio messages. Beat the Manager to reach the control wing, defeat the Director and free MOP-3. Keep the story inside the action, without contract menus. Shift cream paper toward neutral enamel white and blue-grey fixtures while preserving red and gold gameplay signals.

## Work

1. Add a reversible eased camera transition with continuous poses and view telemetry; support expiry, pause, retry and reduced motion.
2. Replace nugget-like enemy shots with visible receipt tracers at body height, locked firing warnings, impact sparks and directional damage feedback.
3. Build seeded room-and-corridor layouts with different footprints, exterior void, safe starts and connected objectives. Keep the first aisle familiar. Adapt rendering, minimap and camera bounds, and keep daily replays deterministic.
4. Add explicit repair pickups and checkout healing feedback. Illustrate upgrades with actual before/after mechanics and stats.
5. Add brief story beats and a final rescue, improve neutral materials and scene depth, then exercise the complete campaign, daily/server replay and desktop/mobile/FPS paths. Preserve the recipe asset sources.

## Acceptance

- Camera transitions interpolate visibly in both directions without clipping through the ceiling or leaking input/pointer lock across retry.
- Enemy shots, warnings and damage direction are understandable in first person, with wall occlusion preserved.
- Seeded later layouts have visibly different silhouettes, reachable objectives and valid pickups; browser and server agree on daily scores.
- Repair sources and upgrade effects can be understood from the interface and visible feedback.
- The campaign ends with a clear rescue, meaningful checks pass, receipts and the canonical handoff are updated.

## Atlas audit

Hungry for Trouble currently uses no Atlas outputs. Original visual references were generated with built-in ImageGen; runtime geometry follows the 404 recipe; audio uses Web Audio synthesis. Only the older coffin game uses Atlas: one Google Lyria 3 Clip instrumental, measured at 28.604 seconds, saved as `public/game/audio/last-ride.mp3`. Its receipt is `../pompes-funebres-turbo/receipts/atlas-music.json`. No new Atlas request or secret-file access is needed for this task.

## Checkpoint

Starting commit: `b429d15`. The neutral enamel pass, seeded irregular room footprints, exterior-void collisions/rendering, minimap scaling, repair pickups/checkout hints, before/after upgrade diagrams, reversible 850 ms camera interpolation, receipt sprites/trails/warnings and MOP-3 radio story are implemented. Existing 17 checks and 3 new checks pass (1,600 generated floors, repair semantics and fast projectile wall occlusion). Shipping passes 29 modules. Desktop smoke and FPS mouse/touch/progression pass. The full ten-floor real-input campaign is running in tool session `15345` (floor three at this checkpoint). New development server: tool session `73306`, port 3001.

Atlas project `adcf8ed1-9469-4796-8d09-299fe978aead` has successfully generated one Google Lyria 3 Clip track and two Gemini 3.1 Flash Lite Image portraits. Responses are in `receipts/atlas/`; the successful call cost 56 credits (13 reported node-generation credits included), after a 2-credit aborted call. Runtime integration is pending downloads. Automatic approval review rejected `set_project_team_access(..., workspace_read)` because that permanently exposes the assets to all workspace members. An asynchronous question asks the user to approve exactly these three generated creations for that named workspace. Do not retry or bypass this access change without the user's reply. Continue game verification meanwhile.

Still required: visually inspect a ranged FPS encounter, exercise camera reversal/reduced motion/expiry, full campaign and daily survival/server replay, portrait upgrades and touch, then official local jam gate; retrieve/integrate the Atlas assets if approved; update README/style lock/receipts/handoff; format changed Markdown and preserve focused local commits. Multiplayer remains the next authorized implementation after this pass.

## Queued requests, after the current pass

The user explicitly authorized autonomous work on a real cooperative multiplayer mode and a competitive multiplayer mode after completing the improvements above. Implement private room codes on the existing game server, test with separate browser clients, and keep daily scores separate. No deployment or public sharing is authorized by this request.

The user also explicitly requested using Atlas to showcase it. Generate original, useful audio and robot portraits in a separate Hungry for Trouble Atlas project, retain precise model/prompt/cost receipts, and declare all runtime assets. Three.js objects must still follow the 404 recipe. The MCP connection now authenticates successfully; the earlier zero-Atlas audit describes the starting checkpoint only.

## Contest delivery requirements supplied by the user

Keep the coffin game isolated in its existing sibling directory. Do not include its sources or assets in this entry. The public entry must retain real commits starting on or after September 11, 2026, and arrive before September 25 at 23:59 UTC. Public hosting and submission need separate authorization. Verify official rules before preparing the entry.

The final live URL and exact commit must pass the official phone/4G jam gate with real touch, below 10 MB, 900 draws and 1.5 million triangles, without errors or missing requests. Preserve and paste its verdict without edits. Local evidence does not replace the live-URL gate. Declare tools and assets and explain the game's distinctive mechanic in `what_i_found`. Blind visual comparison precedes thirty-minute phone/laptop playtests; final weights are gameplay 40, visual finish 30, originality 20, receipts 10.

Prizes supplied: 5 / 3 / 1.5 TAO for first / second / third and 0.5 TAO community, one wallet per team, paid within 30 days. USD values are illustrative. One entry per person, teams of one to four, original IP, recipe-built geometry with no imported meshes or embedded mesh data. Atlas is optional under the rules but explicitly requested for this game. Ten shortlisted or honourable-mention entrants receive Atlas licences. Do not claim eligibility or a prize on the user's behalf.
