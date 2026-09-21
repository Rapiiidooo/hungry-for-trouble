# Shared shifts and Snackdown

The user explicitly requested autonomous implementation of cooperative multiplayer and competitive multiplayer after the feel/story pass. This is an implementation request, not a request for a prompt. Keep the single-player campaign and Daily Rush intact. Do not deploy or publish without separate authorization.

## Intended playable scope

- Two-player private rooms with a short join code, display names, a waiting lobby, host start and rematch. Joining another player's room requires the code. Keep a clear leave action and disconnect recovery. No external messaging or friend invitations are sent by the agent.
- Cooperative Shared Shift: share the store's crumb quota and ammunition bag, fight receipt drones and an exposed-core boss, revive a disabled teammate by staying nearby, then reach the checkout together. Friendly fire is disabled. A short complete match should show the vacuum theme through shared supplies and rescue.
- Competitive Snackdown: collect crumbs for ammo, shoot the other vacuum, first to seven takedowns or highest score after three minutes. KOs drop crumbs, respawns have grace time, and both clients see the same result. Scores do not enter Daily Rush.
- Server-authoritative simulation with bounded inputs, stale-input timeout and snapshots to both clients. The browser supplies controls, never positions, health, hits or scores. Room codes are invitations, not authenticated user identities.
- Reuse recipe-verified vacuum/scenery/enemy geometry with player colours, player labels and a mode-specific HUD. Keep all controls playable on touch and keyboard. Start with overhead play in multiplayer for shared combat clarity.

## Verification

Exercise two independent browser clients creating/joining/starting a real room, seeing each other's actual movement and shots, damage/KO/respawn, a cooperative revive and a completed match/rematch. Unit/integration checks must cover wrong room code, forged inputs, non-host start, room capacity, disconnects and authoritative results. Repeat the static shipping and local phone gate after integration, and distinguish local checks from a live-host gate.

## State

Implemented and integrated. The 23 Node checks and 31-module shipping check pass. Two independent browser clients completed both modes, rematches, reconnects, real phone touch, simulated 4G and short-outage recovery. Reports are being archived in `receipts/verification-multiplayer/`. Remaining: record the exact-commit official local phone gate, then remove this completed tracker. Atlas integration is tracked separately in `tasks/atlas-assets.md`.
