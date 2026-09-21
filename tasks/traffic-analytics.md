# Traffic analytics

The owner requested traffic statistics for the public game. Reuse their existing private analytics service; keep operational addresses and configuration outside this public repository.

1. Register the game as a private website under the existing analytics owner, with no public dashboard or session replay.
2. Add a small asynchronous Umami pageview tracker through same-origin endpoints. Exclude local previews, search/hash values, room invites and sensitive referrer details; respect browser privacy signals.
3. Verify real collection, opt-out behavior, unavailable tracking and unchanged gameplay. Deploy the exact new commit, rerun the official public phone gate and update the existing contest entry to the matching SHA and unedited verdict.
4. Give the owner the private dashboard link, record the release evidence and remove this completed tracker.

No gameplay, scoring or save format change is planned. No analytics login, server address or key belongs in the game source. The website's public collection identifier is not an access credential.
