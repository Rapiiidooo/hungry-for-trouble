# Hungry for Trouble: resumable build

## Current objective

Build the next original 404 Game Jam game, a satisfying maze chase crossed with an arcade shooter. The user explicitly authorized implementation on 2026-09-20 after rejecting Turbo Funeral Services. This is active implementation, not a prompt-only request. The user asked for a persistent handoff before context compaction or usage limits and expects work to resume later.

## User feedback that must shape the game

The coffin prototype looked good and was funny, but had little replay value. Its career expansion made matters worse: contract administration was complicated, finishing deliveries did not feel rewarding, and districts felt like the same level. Stop that project. Do not copy its menu-heavy progression into this game.

Prioritize what happens every second: responsive movement, pursuit, aiming, firing, enemy reactions, collecting and the rush of turning the tables. Keep the start flow to one click. A new stage must change routes, threats or interactions, not just colours and labels. All game text is English; speak French to the user.

## Direction

Working title: **Hungry for Trouble**. A tiny, overconfident industrial vacuum cleans a haunted supermarket after closing. Collect luminous crumbs while sentient security appliances chase you. An Overtime Battery turns the frightened cleaner into an absurdly overpowered hunter for eight seconds. The player should understand the joke by playing within 20 seconds.

The initial detailed brief is `../prompts/maze-shooter.md`. Treat its five-floor campaign, arsenal and daily challenge as later scope behind a convincing playable core. Do not build a large shell of menus or claim completion because there are many features.

First slice: one polished maze, screen-relative WASD/arrows, pointer aim and shooting, dash, two distinct enemy behaviours, pickups, temporary power reversal, a clear extraction goal, hit feedback, death and immediate retry. Add real touchscreen movement/aiming after desktop controls feel right. Then expand to mechanically distinct cereal, freezer and warehouse floors, upgrades chosen in seconds between rounds, and a final encounter.

## Plan and gates

1. Save this handoff and the user's feedback before expensive work.
2. Lock the visual style and obtain object references. Use the 404 pipeline for all 3D objects: references, three genuinely different candidates, verification, visual selection and honest receipts.
3. Build the smallest complete action loop. No career desk, contracts, upgrade shop or fake online leaderboard.
4. Play it through real keyboard/pointer inputs. Validate steering direction, line of sight, collisions, shots, enemy pressure, power reversal, loss and restart. Judge screenshots in motion and improve the property that most weakens the experience.
5. Expand only after the core plays well. Make each environment change tactics. Test touch controls, complete-run progression and the final goal.
6. Run the official asset and shipping tools and the mobile jam gate. Keep a local preview and incremental local commits. Publishing and contest submission require separate explicit authorization.

## Environment and access

- Workspace: `/Users/rapido/perso/bittensor/404`.
- Current project: `hungry-for-trouble/`, separate from both the recipe and coffin game.
- Recipe checkout: `../404-game-recipe/`, dependencies installed; its verifier self-tests passed during the previous game. Read `GAME.md`, `404.md`, `docs/asset-contract.md`, `docs/traps.md` and the current rules before submission.
- Use ordinary portable browser modules and a local development server. This project has no Sites project or hosting configuration. Do not create one just to build the game.
- Three.js 0.186 files are available in the existing game's `public/game/vendor/`; source them with license attribution. Use the recipe's own `assetlib.js`, `surfaces.js` and `rig.js`.
- Official Puppeteer is installed in `../404-game-recipe/node_modules`. Chrome is `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`. The Codex browser plugin had no browser binding; existing local Puppeteer is the available fallback.
- Shared Atlas secret: `../.env`, explicitly requested by the user, owner-only permissions, ignored by Git. Never inspect or print it; source it directly into the environment when needed. `../.env.example` contains only variable names and the public endpoint.
- Atlas MCP: `https://mcp.prod-market.atlas.design/mcp`, bearer token from `ATLAS_API_KEY`. The production endpoint and `whoami` were verified in the prior session. Native MCP tools were not hot-reloaded; a temporary standard MCP client may be needed. No new Atlas generation has been started for this game.
- Built-in ImageGen works. Follow its skill and inspect references before geometry creation. Store exact prompts and returned files in this project.
- Do not spawn subagents unless the user or applicable AGENTS/skill explicitly requests delegation; the current developer instruction forbids proactive delegation.
- Format changed Markdown using `../pompes-funebres-turbo/node_modules/.bin/prettier --write --no-config --prose-wrap preserve --embedded-language-formatting off`.

## Checkpoint

The next-game project currently contains this task and its thin instruction entry point. No implementation or assets have been generated yet. The immediate next action is to write a compact style lock and build the first action slice through the recipe workflow.

The prior game is preserved with uncommitted English localization, corrected steering and rejected career expansion. Its test runner `node scripts/career-playtest.mjs` (PID 14138) and dedicated headless Chrome (PID 14164) were terminated at the user's request. Its local dev server, PID 99610, remains at `http://localhost:3000/game/index.html`; leave it alone unless you deliberately stop that known process. Use a different port for this game.

No tool to force conversation compaction was available. The saved files are the durable resume mechanism. After a cut, read this file and continue from the latest checkpoint rather than restarting the brainstorm or requesting permission again.
