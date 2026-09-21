# Continue, Atlas and dedicated hosting

## Requested outcome

- Resume a campaign at the latest aisle start with its earned equipment, health and score.
- Integrate the existing Atlas soundtrack and portraits through a private export if available; immediate workspace publication was subsequently authorized for these three creations.
- Prepare and deploy to a dedicated VM using the user's existing private infrastructure, with operational details kept outside this public-source repository.
- Recommend inexpensive domain names or a subdomain of the user's existing domain; do not purchase a domain without a selection.

## Plan

1. Implement validated campaign checkpoints and a clear Continue action, preserving replay verification and local reset behavior.
2. Retrieve and inspect existing Atlas media without changing sharing permissions, then integrate and declare only the selected media.
3. Inspect the private infrastructure, provision an isolated service and persistent score storage, and validate the deployed build.
4. Verify resume behavior, leaderboard integrity, media loading, deployment isolation and the official phone gate; record precise evidence and outstanding dependencies.

## Constraints

Keep private hostnames, addresses, inventories, access material and provider configuration out of source, receipts and Git history. Store host-specific deployment artifacts only with the private infrastructure. Preserve other applications and the abandoned game. The owner subsequently authorized source publication and contest submission once implementation and verification are complete.

## Progress

Continue is implemented in gameplay commit `83c8d535676602f26c803c192fa01c23c42b5753`, with IndexedDB checkpoints at aisle start and pending upgrades. Replay reconstruction preserves earned equipment and score, including renewed server attempts after expiry or restart. All 51 Node checks and the 43-module shipping gate pass. The browser probe passes genuine input, touch, reload, four viewport sizes, earned equipment, pending upgrades, reset, incompatible data and corrupt-save recovery. The corrected landscape layout has been visually checked and passes a record-bounds assertion.

A dedicated private VM now runs that exact gameplay commit with an isolated Node service, firewall and score backup timer. Remote browser checks pass Continue, server-verified scoring, separate-client board visibility and touch/reconnect in both room modes. The score survives service restart and a compressed backup; only the test entry and its test backup were removed afterward. The official phone/4G gate passes both locally and against the VM through a private tunnel. DNS and HTTPS are now active, including a successful certificate-renewal dry run. The final public-URL gate remains. Evidence is in `receipts/verification-continue/`; exact host details and operational scripts remain exclusively in the private infrastructure repository.

The owner selected `trouble.rapidoai.dev`, authorized immediate catalog publication of the three Atlas creations, confirmed contest eligibility and requested direct submission after completion. Atlas runtime integration and its browser checks now pass; the three assets are in the workspace catalog, while the project graph is private again and public-link sharing remains off. The owner added the DNS record. HTTPS and its renewal dry run pass. GitHub is authenticated as `Rapiiidooo`, and the official jam fork is cloned next to this repository. Use public contact `@Rapido_ai` and wallet `later`.

Next: commit the verified Atlas build, deploy that exact commit, publish only the audited game source with its real history, run the final public-URL gate and two-client browser checks, then open the official entry PR. No further permission or eligibility answer is pending. Keep all private operational details outside the public repository and remove this tracker after submission and receipt updates are complete.
