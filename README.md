# Hungry for Trouble

A haunted supermarket. One heavily unqualified vacuum. Collect crumbs, dodge security, grab an Overtime Battery and become the problem.

## Play locally

```bash
npm run dev
```

Open [localhost:3001](http://localhost:3001). Use Node 24 or newer. No installation or API key is required to run the game and its leaderboard server. The complete static browser build is in `game/`, including Three.js and its license. Google Fonts is optional; system fonts provide a fallback.

| Action                     | Desktop               | Touch                    |
| -------------------------- | --------------------- | ------------------------ |
| Move                       | WASD or arrow keys    | Left stick               |
| Aim and fire               | Mouse and left button | Right stick              |
| Dash                       | Space while moving    | Dash button while moving |
| Pause                      | Escape                | Pause button             |
| Change view during Vac Cam | V                     | View button              |

Crumbs refill ammunition and advance the collection goal. Once the goal is met, reach the marked checkout. Batteries give eight seconds of invulnerability, free spread shots and reversed enemy pursuit. Pick one upgrade between aisles. Campaign records and unlocked aisles are saved in this browser. Vac Cam goggles grant 18 seconds of first-person play, extra ammunition and faster firing. Click to lock mouse aim, or drag if pointer lock is unavailable. The right touch stick turns and fires. V returns to overhead while keeping the fire-rate bonus.

## The escape route

1. **Cereal Situation:** learn the maze, chase and combat loop.
2. **Cold Storage:** manage momentum on slippery floors and watch for charging polishers.
3. **Return to Sender:** moving stock barriers alter the available routes.
4. **Snack Attack:** six pursuing appliances converge on a new layout with central batteries.
5. **The Manager:** use cover, fire during shield openings and survive a denser second attack phase.
6. **Food Fight:** receipt-firing drones hold sightlines around open islands of cover.
7. **Heavy Delivery:** tougher armoured trolleys and drones patrol moving shutters.
8. **Brain Freeze:** sliding movement, ranged crossfire and armoured enemies.
9. **Express Distress:** opposing conveyor lanes push players through a crowded layout.
10. **Exit Interview:** the Director guards the street with rotating receipt volleys and shield windows.

The route announces both bosses and saves each real clear. Unlocked aisles can be practised directly. Full campaign personal records remain separate from practice. Upgrade cards illustrate faster firing, spread, piercing, a rechargeable warranty shield, crumb attraction and extra health.

## Daily Rush and shared scores

Daily Rush is a seeded 90-second survival challenge with five increasingly fast waves, replenishing crumbs and a survival bonus. Everyone gets the same layout and starting equipment for a UTC date. A new challenge starts at midnight UTC. Retry freely; each browser identity keeps its best score. Enter an alias after the run and press **Post score**. The result can also be copied to challenge a friend.

The leaderboard is a real HTTP service shared by browsers using the same server. The server issues attempts, replays the exact quantized inputs at 60 ticks per second and calculates scores itself. A submitted score number is never trusted. Names are aliases, not authenticated accounts; cookie resets create a new identity. Replay validation catches impossible inputs and fabricated scores, but is not bot detection or a complete anti-cheat system.

Accepted entries are written atomically to `data/leaderboard.json`, which is ignored by Git. This is a single-server design: use one Node process and a persistent writable disk. Server restarts preserve scores and expire unfinished attempts. Keep the ruleset identifier in `game/daily.js` in sync with any future scoring or gameplay changes.

For eventual hosting, run `npm start` with `HOST=0.0.0.0`, the host's `PORT`, and `LEADERBOARD_FILE` pointing to persistent storage. Put HTTPS in front of the service and preserve the request Host header. The built-in request limit uses the direct peer address, so a reverse proxy shares that limit unless the deployment adds trusted proxy handling. Hosting only `game/` on a static service supports the campaign; Daily Rush clearly reports that its server is unavailable. No remote service has been deployed.

## Development and verification

```bash
npm test
npm run check
node scripts/smoke.mjs
node scripts/playthrough.mjs
node scripts/touch-playtest.mjs
node scripts/playthrough.mjs --fps
node scripts/playthrough.mjs --daily
node scripts/arcade-playtest.mjs
```

The simulation tests use Node's built-in test runner. The shipping and browser checks use the adjacent official `404-game-recipe` checkout; browser scripts expect local Google Chrome on macOS. Browser checks require the development server. `playthrough.mjs` finishes the campaign using real keyboard and pointer events with read-only telemetry. `touch-playtest.mjs` checks simultaneous movement, firing and dash, release, cancellation, pause and rotation.

The original object references, three construction candidates per object, selections and verification evidence are in [receipts/README.md](receipts/README.md). Runtime meshes are procedural Three.js through the official 404 recipe. Audio is an original Web Audio composition and synthesised effects.

For the next development session, read [docs/resume.md](docs/resume.md). Hosting and contest submission have not been performed.
