# Hungry for Trouble

A haunted supermarket. One heavily unqualified vacuum. Collect crumbs, dodge security, grab an Overtime Battery and become the problem.

## Play locally

```bash
npm run dev
```

Open [localhost:3001](http://localhost:3001). No installation or API key is required to run the game. The complete static browser build is in `game/`, including Three.js and its license. Google Fonts is optional; system fonts provide a fallback.

| Action       | Desktop               | Touch                    |
| ------------ | --------------------- | ------------------------ |
| Move         | WASD or arrow keys    | Left stick               |
| Aim and fire | Mouse and left button | Right stick              |
| Dash         | Space while moving    | Dash button while moving |
| Pause        | Escape                | Pause button             |

Crumbs refill ammunition and advance the collection goal. Once the goal is met, reach the marked checkout. Batteries give eight seconds of invulnerability, free spread shots and reversed enemy pursuit. Pick one upgrade between aisles. Scores and personal bests are stored in this browser.

## The five aisles

1. **Cereal Situation:** learn the maze, chase and combat loop.
2. **Cold Storage:** manage momentum on slippery floors and watch for charging polishers.
3. **Return to Sender:** moving stock barriers alter the available routes.
4. **Snack Attack:** six pursuing appliances converge on a new layout with central batteries.
5. **The Manager:** use cover, fire during shield openings and survive a denser second attack phase before checking out.

The campaign rewards clean movement, fast exits and chained takedowns. There is no account, contract desk or online leaderboard.

## Development and verification

```bash
npm test
npm run check
node scripts/smoke.mjs
node scripts/playthrough.mjs
node scripts/touch-playtest.mjs
```

The simulation tests use Node's built-in test runner. The shipping and browser checks use the adjacent official `404-game-recipe` checkout; browser scripts expect local Google Chrome on macOS. Browser checks require the development server. `playthrough.mjs` finishes the campaign using real keyboard and pointer events with read-only telemetry. `touch-playtest.mjs` checks simultaneous movement, firing and dash, release, cancellation, pause and rotation.

The original object references, three construction candidates per object, selections and verification evidence are in [receipts/README.md](receipts/README.md). Runtime meshes are procedural Three.js through the official 404 recipe. Audio is an original Web Audio composition and synthesised effects.

For the next development session, read [docs/resume.md](docs/resume.md). Hosting and contest submission have not been performed.
