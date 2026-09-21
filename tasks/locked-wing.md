# The locked wing after aisle twenty

Add five hidden campaign floors, 21 through 25, unlocked after defeating SHELF CONTROL and checking out on floor 20. Preserve the crew escape and golden vacuum reward. Existing completed saves should gain access to floor 21; new saves still reveal ten floors, then twenty, then twenty-five.

## Implementation plan

1. Build five distinct seeded floorplans around colored keys and locked passages. Introduce red, then green, blue and yellow; use matching symbols as well as color. Keys stay on the ring for the current floor and open matching doors automatically at close range. Keep every key reachable before its own lock, including transport shortcuts.
2. Integrate collision, enemy navigation, projectiles, pickup feedback, a compact key ring, minimap symbols and opening animations. Reuse verified recipe geometry for doors and original 2D key illustrations. Keep earlier floors, Daily Rush and multiplayer behavior intact.
3. Add the post-20 discovery, route visibility, save migration, dialogue and a floor-25 boss/payoff. Extend campaign replay verification to the new progression and preserve restart/practice rules.
4. Verify seeded solvability, wrong-key blocking, key retention/reset, doors and shots, progression and replays. Play with real browser inputs on desktop and a phone viewport, archive honest receipts and update the handoff.

No hosting, source push or submission is part of this task. Atlas catalog publication remains conditional on actual contest submission.

## Checkpoint

Implementation is complete. The 48-test Node suite, focused legacy-board HTTP rerun, 42-module shipping check and phone/key UI probe pass. Real inputs cleared 21–24, with two losses on the final boss; existing-floor transition attempts also lost before the reveal. A separate disclosed presentation fixture verifies both endings and continuation into 21. See `receipts/verification-locked-wing/README.md` for exact evidence. Remaining delivery work: commit the implementation, run the official local phone/4G gate against that SHA, record the verdict and remove this tracker.
