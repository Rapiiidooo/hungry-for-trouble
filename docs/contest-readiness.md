# 404 Game Jam readiness

This records the rules supplied by the user, not a submitted entry or a claim of eligibility. Recheck the official repository before preparing the final public entry. Dedicated VM hosting is authorized and the verified build is deployed over public HTTPS. The owner also authorized public source publication and direct submission after implementation and verification, and confirmed eligibility.

## Entry and receipts

- Submit before **25 September 2026, 23:59 UTC**. Teams have one to four people, with one entry per person.
- The source repository must be public, with genuine work in commits and a first commit on or after **11 September, 00:00 UTC**. Preserve the existing local history; do not squash it into an end-of-jam upload or fabricate dates.
- Every 3D object must build geometry from Three.js constructors and operations through the 404 recipe. No downloaded meshes, hand modelling, embedded vertex blobs or copied reference-game code/assets. The selected geometry and candidate receipts are retained here.
- File-based textures, sprites, skies, music and sound are allowed and must be declared, along with agents/models/generators. Atlas is optional under the supplied rules but explicitly requested by this user. The three existing Atlas creations are integrated; see `receipts/verification-atlas/README.md`.
- Keep all IP original. Hungry for Trouble uses its own appliances and names. The abandoned coffin game remains in a separate sibling repository and is excluded from this entry.

The final public URL and exact commit must pass the unmodified recipe's `harness/jam.mjs` on a phone viewport under its 4G profile. It requires readiness within the limit, less than 10 MB, a real tap to start and finger movement, fewer than 900 draw calls and 1.5 million triangles, no console errors and no missing resources. Save and paste the verdict block without editing it. The organizers rerun the same URL and commit. Existing local results do not replace this live-URL gate.

Run the Node service when hosting: a static-only deployment cannot provide the real daily leaderboard or two-player rooms. Use a persistent leaderboard disk and a single process. Verify actual phone/laptop behavior, room reconnects and shared scores against the deployed URL before submission.

## What makes this entry different

Draft `what_i_found`: a supermarket vacuum eats its ammunition, then spends the same trail of crumbs fighting the store's bureaucracy. A stolen surveillance visor moves that chase into first person. In Shared Shift, both vacuums consume one ammunition bag and repair each other; in Snackdown, defeating a colleague spills the ammunition that can fuel the next chase.

This describes the implemented mechanics; it does not claim nobody else has tried them. Judges compare originality with the other shortlisted games.

Stage one is blind visual pairing, about six pairs per entry with three judges. The top twelve progress. Stage two gives each judge thirty minutes on a phone and laptop, weighted **40 gameplay, 30 visual finish, 20 originality, 10 build receipts**. Keep discarded approaches and gate runs in the history. Automated completion times are not a claim of thirty minutes of satisfying human play.

## Prizes and dates supplied by the user

| Place     | TAO | Also                                              |
| --------- | --: | ------------------------------------------------- |
| First     |   5 | Stage announcement and a build breakdown with 404 |
| Second    |   3 | Showcase slot and a 404 channel post              |
| Third     | 1.5 | Showcase slot and a 404 channel post              |
| Community | 0.5 | Entrant vote among the shortlist                  |

Total: **10 TAO**, paid in TAO to one Bittensor wallet per team within thirty days of the announcement. Dollar figures are indicative only. Ten entrants from the shortlist and honourable mentions receive an Atlas licence. The supplied community-vote window is **27 September to 28 September, 12:00 UTC**, one entrant account and one vote, excluding one's own entry.

The user retains ownership. The supplied terms include a non-exclusive promotional licence to 404 and eligibility/rights requirements. Team membership, eligibility, rights declarations and the receiving wallet must be confirmed by the entrant when submitting. Do not invent these details.

## Remaining delivery work

The owner superseded the earlier Atlas timing condition with immediate permission for the three existing creations. They are now integrated and declared in `receipts/atlas/runtime-assets.json`, with focused evidence in `receipts/verification-atlas/`. The graph is private again; the three published catalog assets remain available without any public project link.

The dedicated VM and HTTPS address are live. DNS, TLS and a certificate-renewal dry run pass. The owner confirmed eligibility and authorized direct submission after the final checks. Publish the audited source with its real history, deploy the exact gameplay commit, run its official public-URL gate and attach the unedited verdict to the entry PR. Use the authenticated GitHub handle, its public X contact and `wallet: "later"`; no private wallet or contact details need to be guessed. Keep the submitted commit stable after opening the entry.
