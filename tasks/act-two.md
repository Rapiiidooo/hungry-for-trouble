# Act two and combat readability

## Accepted scope

Continue the campaign beyond floor 10 to floor 20. Add distinct floorplans, telegraphing traps, paired teleporters and new enemy behaviours. Show the speaking robot in story messages. Explain dash through controls and feedback. Make Overtime pickups, vulnerable enemies and its original music unmistakable. Add interactive scenery, build-changing upgrades, department identity and a short rescue celebration.

Keep English game copy, original IP, phone controls, FPS, daily replay verification and existing multiplayer. Reuse verified recipe models for actors and scenery; functional rings, decals and sprites are interface effects. Do not publish Atlas assets before an actual contest submission, and do not publish or submit the entry during this task.

## Plan

1. Extend deterministic campaign layouts and simulation with two acts, four boss milestones, steam vents, paired transport pads, snipers, mine layers and shield carts.
2. Add ricochet and freezer builds, pushable stock carts and breakable displays using existing verified models.
3. Connect story portraits, act map, dash teaching, Overtime feedback/music, department styling and rescue animation.
4. Verify connectivity, hazards, transport safety, upgrades, replay and room regressions. Play actual browser inputs through the new mechanics and late bosses on desktop and phone.
5. Record evidence, update the canonical handoff, run the recipe ship and phone gates, and make focused local commits.

## Acceptance

- All 20 floors have reachable objectives, distinctive act-two combinations and a real final ending.
- Every damaging trap and ranged attack has a visible warning and an escape opportunity; teleporters cannot bounce indefinitely or land inside walls.
- Robot speakers, dash protection and Overtime's remaining time are clear in both camera views and phone layouts.
- New builds and scenery affect combat; daily replay and two-player rooms remain valid.
- Receipts describe actual checks and asset provenance, with Atlas publication still deferred.

## Checkpoint

Implementation is complete and verification is underway. Working tree started clean at `b3cbf3d`. Current server session is `98607`, command `npm run dev` / `node scripts/serve.mjs` on port 3001.

The first real campaign run cleared floors 1–19 and exposed a floor-20 transport pad in a narrow corridor (seed `3809365241`). Its failure report is retained in `outputs/act-two-campaign-first.json`. Pads now require open 3×3 space before supplies are placed; a regression verifies all objectives remain reachable while treating pads as blocked on 1,407 generated floors, including that seed. Do not claim that first campaign attempt passed.

The real-input act-two probe passed cart pushes, transport, flour explosions, Overtime music and all ten new scenes (486 peak draws, 982,250 triangles). Smoke/restart, simultaneous touch, FPS receipt combat, daily submission/independent board, co-op and versus matches passed. Both multiplayer runs also passed rematch, reload reconnect, phone controls, 4G and short-outage recovery.

The corrected `scripts/playthrough.mjs --from=11` passed all ten late floors, both bosses and checkout, with four hearts remaining. Phone HUD captures pass with no title/boss/radio overlap; the map and ending were inspected. The latest 34 Node checks and 33-module ship check pass. Evidence is collected in `receipts/verification-act-two/` and the canonical docs are updated.

Remaining: review and create the local gameplay commit, run the exact-commit official local phone gate, record its unedited verdict, update the gate references and delete this tracker in a receipt commit. No push, hosting, contest submission or Atlas sharing.
