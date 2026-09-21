# Traffic analytics verification

The owner requested traffic statistics after the initial submission. The public game now loads an asynchronous Umami 3.2 tracker through same-origin `/analytics/` endpoints. This is pageview measurement only: visits, estimated visitors, referring sites, browser/device and approximate location. The private dashboard and hosting configuration stay outside this repository. The public collection identifier does not grant dashboard access.

The integration runs only on `trouble.rapidoai.dev`. Do Not Track, Global Privacy Control and the standard `umami.disabled` local opt-out are respected. URL query strings and hashes are excluded, including room invitations; referrers are reduced to their origin. The payload permits no score, callsign, room code, custom event or distinct identifier. Collection omits cookies; session recording and performance capture are not enabled. The shared service's private owner retains dashboard access.

## Focused browser checks

`scripts/analytics-playtest.mjs` uses disposable Chrome contexts and the actual deployed tracker, with collection requests intercepted rather than counted as visitors. `ui/report.json` is PASS. It verifies the real payload after navigation with a deliberately sensitive referrer/query/hash fixture, confirms cookies are omitted even when one exists, and rejects custom data/identification. DNT, GPC, local opt-out and local preview send no analytics. Actual Play and keyboard movement work when the tracker is blocked or collection returns 503. The expected network failures in those fixtures are deliberate; there are no JavaScript runtime exceptions.

The tracker response is 4,655 bytes before compression. The official shipping checker passes 44 modules and one page. Gameplay rules, score replay, save formats and asset geometry are unchanged, so the unchanged 51-test simulation/server suite was not rerun for this browser-only addition.

## Release checks

The production proxy serves only the tracker and collection endpoint. Its dashboard/API administration paths return 404 from the game domain, while the game's health endpoint remains healthy. Client credential headers are stripped before forwarding; direct client addressing is supplied by the trusted proxy. Exact routes and operational checks are retained privately.

`live.json` records one real public HTTPS visit, successful collection and actual Play/keyboard movement without runtime errors. The corresponding database event was checked for its sanitized URL/referrer, device, browser and country, then only that identified verification event and its unused session were removed. This is a technical probe, not organic visitor traffic. The private dashboard opens its login screen, and its website API rejects unauthenticated access. Existing analytics credentials and other sites were not changed.

The [official public phone/4G verdict](jam/verdict.txt) passes for deployed commit `be00e56e4e73ccbbd27891e6efa1fb93bad00614`: 2.1-second readiness, 3.5 MB, 8.7 metres of real touch movement, 262 peak draw calls, 568,176 peak triangles, no errors and no missing files. The unchanged harness uses Chrome phone emulation at 390×844, not a physical phone. Its unedited verdict and the matching commit replace the previous release in [entry PR #6](https://github.com/404-Repo/404-game-jam/pull/6). `submission.json` records this update; the initial submission remains in `../verification-release/`.

Only this browser analytics module and its script tag change the deployed game. Later commits retain receipts and documentation without changing its runtime. Traffic begins with this deployment; earlier visitors cannot be recovered, and browser privacy controls or blocked tracking can reduce the count.
