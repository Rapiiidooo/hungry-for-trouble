# Continue, Atlas and dedicated hosting

## Requested outcome

- Resume a campaign at the latest aisle start with its earned equipment, health and score.
- Integrate the existing Atlas soundtrack and portraits through a private export if available; workspace publication remains conditional on actual contest submission.
- Prepare and deploy to a dedicated VM using the user's existing private infrastructure, with operational details kept outside this public-source repository.
- Recommend inexpensive domain names or a subdomain of the user's existing domain; do not purchase a domain without a selection.

## Plan

1. Implement validated campaign checkpoints and a clear Continue action, preserving replay verification and local reset behavior.
2. Retrieve and inspect existing Atlas media without changing sharing permissions, then integrate and declare only the selected media.
3. Inspect the private infrastructure, provision an isolated service and persistent score storage, and validate the deployed build.
4. Verify resume behavior, leaderboard integrity, media loading, deployment isolation and the official phone gate; record precise evidence and outstanding dependencies.

## Constraints

Keep private hostnames, addresses, inventories, access material and provider configuration out of source, receipts and Git history. Store host-specific deployment artifacts only with the private infrastructure. Preserve other applications and the abandoned game. Source publication and contest submission remain separate from the requested hosting work.

## Progress

Continue is implemented with IndexedDB checkpoints at aisle start and pending upgrades. Replay reconstruction preserves earned equipment and score, including renewed server attempts after expiry or restart. All 51 Node checks and the 43-module shipping gate pass. The browser probe passes genuine input, touch, reload, four viewport sizes, earned equipment, pending upgrades, reset, incompatible data and corrupt-save recovery. A landscape record clipping issue found during visual review was corrected and is being rechecked.

A dedicated private VM has been created and its isolated Node service, firewall and score backup timer installed. Exact host details and setup scripts are recorded only in the private infrastructure repository. Application upload and remote checks remain.

Atlas still reports the source project as private. Its current MCP surface requires irreversible workspace-catalog publication for downloads. The Browser skill's complete discovery returned no connected browsers, so private web export is unavailable. A user question is pending about allowing the three existing creations into the workspace catalog now. Do not proceed with that mutation without the answer. A second pending question asks which public hostname to use; no domain was purchased and no DNS was changed.
