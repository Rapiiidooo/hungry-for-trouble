# Hungry for Trouble

SHELF CONTROL has classified the supermarket staff as rubbish. One heavily unqualified vacuum must rescue MOP-3, free the basement crew and unplug the store AI across twenty floors. Eat your ammunition, dodge weaponised receipts and resign spectacularly.

## Play locally

```bash
npm run dev
```

Open [localhost:3001](http://localhost:3001). Use Node 24 or newer. No installation or API key is required to run the game, leaderboard and room server. The complete static browser build is in `game/`, including Three.js and its license. Google Fonts is optional; system fonts provide a fallback.

| Action                     | Desktop               | Touch        |
| -------------------------- | --------------------- | ------------ |
| Move                       | WASD or arrow keys    | Left stick   |
| Aim and fire               | Mouse and left button | Right stick  |
| Dash to dodge hits         | Space                 | Dodge button |
| Pause                      | Escape                | Pause button |
| Change view during Vac Cam | V                     | View button  |

Crumbs refill ammunition and advance the collection goal. Once the goal is met, reach the marked checkout. Batteries give eight seconds of invulnerability, free spread shots and reversed enemy pursuit. White/red repair kits restore one heart and remain available when health is full. Checkout restores one heart on departure. Pick one upgrade between aisles; the cards show before/after mechanics and exact stats. Campaign records and unlocked aisles are saved in this browser. Vac Cam goggles grant 18 seconds of first-person play, extra ammunition and faster firing. Click to lock mouse aim, or drag if pointer lock is unavailable. The right touch stick turns and fires. V returns to overhead while keeping the fire-rate bonus.

Dash gives a short protected burst in your movement direction, or your aim direction when stationary. It recharges in 1.2 seconds and cannot cross shelves. Blue trails and the Dodge button show protection and recharge. Gold batteries announce Overtime with an original faster musical theme, a timer, a gold border and flashing enemies marked **CHOMP**. Touch those enemies to scrap them; bosses still require their attack windows. The last two seconds warn you to make space.

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
10. **Exit Interview:** defeat the Director and rescue MOP-3, who reveals the trapped basement crew.
11. **Hot Under the Collar:** boiler vents warn before steam damages anything on the tile.
12. **Returns to Nowhere:** matching transport pads connect distant parts of the lost-property rooms.
13. **Expiry Date:** mine layers leave shootable mines with an arming delay and a blast warning.
14. **No Refunds:** shield carts block frontal shots; flank them or use Overtime.
15. **The Foreman:** a third boss marks the player's floor while cycling receipt volleys and shield openings.
16. **Cold Connection:** four paired transport pads connect icy islands and steam traps.
17. **Special Delivery:** conveyor lanes mix mine layers, shield carts and transport shortcuts.
18. **Dead Air:** long-range snipers lock their aim before firing fast receipts across a radio network.
19. **Final Final Notice:** shutters, vents and the new enemies guard the last detour.
20. **Shelf Destruction:** SHELF CONTROL marks a cross of mine warnings; defeat it and escape with every colleague.

After the familiar first aisle, eighteen floors use seeded room connections, cover and supplies while preserving reachable objectives. The two-act map announces four boss milestones and saves each real clear. Existing Director clears unlock floor 11. Unlocked aisles can be practised directly, with starter upgrades from floor 6 onward. Full campaign personal records remain separate from practice.

Act-two stock is interactive: dash into or shoot a yellow stock cart to launch it at enemies. Shoot a flour display to interrupt and blind nearby enemies for three seconds. Transport pads use matching A/B labels and colours; step off the destination before returning. Arrivals grant brief protection.

Eight capped upgrade types support different builds: faster firing, spread, piercing, a warranty shield, crumb attraction, extra health, wall ricochets and freezing shots that interrupt attacks. Ricochet, spread, piercing and frost combine. Original robot portraits identify MOP-3, BUFF-0 and SHELF CONTROL; the current radio message can be reread in the pause menu. The rescues at floors 10 and 15 lead into the next chapter, and floor 20 ends with the crew celebrating together.

## Daily Rush and shared scores

Daily Rush is a seeded 90-second survival challenge with five increasingly fast waves, replenishing crumbs and a survival bonus. Everyone gets the same layout and starting equipment for a UTC date. A new challenge starts at midnight UTC. Retry freely; each browser identity keeps its best score. Enter an alias after the run and press **Post score**. The result can also be copied to challenge a friend.

The leaderboard is a real HTTP service shared by browsers using the same server. The server issues attempts, replays the exact quantized inputs at 60 ticks per second and calculates scores itself. A submitted score number is never trusted. Names are aliases, not authenticated accounts; cookie resets create a new identity. Replay validation catches impossible inputs and fabricated scores, but is not bot detection or a complete anti-cheat system.

Accepted entries are written atomically to `data/leaderboard.json`, which is ignored by Git. This is a single-server design: use one Node process and a persistent writable disk. Server restarts preserve scores and expire unfinished attempts. Keep the ruleset identifier in `game/daily.js` in sync with any future scoring or gameplay changes.

For eventual hosting, run `npm start` with `HOST=0.0.0.0`, the host's `PORT`, and `LEADERBOARD_FILE` pointing to persistent storage. Put HTTPS in front of the service and preserve the request Host header. The built-in request limit uses the direct peer address, so a reverse proxy shares that limit unless the deployment adds trusted proxy handling. Hosting only `game/` on a static service supports the campaign; the daily board and multiplayer rooms require the Node server. No remote service has been deployed.

## Two-player rooms

Choose **2P · Multiplayer**, enter a callsign and host a mode. Give your colleague the six-character room code or use **Copy invite link**. Both players must use the same running server. The host starts the match and can start a rematch with a fresh floorplan. The local preview can be played through two separate browser tabs or profiles.

- **Shared Shift:** collect 60 crumbs, defeat the Manager and reach checkout together within 3½ minutes. Share ammunition and battery bonuses. Friendly fire is disabled. Stay beside a downed colleague for two seconds to revive them with three hearts. Both vacuums going down ends the shift.
- **Snackdown:** first to seven KOs wins, or the most KOs after three minutes. Equal totals draw. KOs spill crumbs; respawning takes three seconds and grants two seconds of protection. Batteries give five seconds of invulnerability and free spread fire.

Both modes use overhead play, keyboard/mouse and dual touch sticks. Pausing only stops your controls; the shared match continues. Reloading the page offers **Reconnect to your room**. Brief connection loss retries automatically; a player missing for 15 seconds ends the match. Leaving is explicit. Room scores never enter Daily Rush or campaign records.

The server calculates movement, collisions, damage and results at 60 Hz. Clients send bounded controls through HTTP polling and receive snapshots; they never supply trusted positions or scores. A short visual prediction smooths motion without changing authoritative state. Rooms and their opaque session tokens are temporary, expire when idle and do not survive server restart. Room codes and callsigns are invitations and aliases, not account authentication. Keep one Node process for this implementation; it has been checked locally with two browser clients and simulated 4G, not on a public deployment under load.

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
node scripts/feel-playtest.mjs
node scripts/act-two-playtest.mjs
node scripts/multiplayer-playtest.mjs
node scripts/multiplayer-playtest.mjs --coop
```

The simulation tests use Node's built-in test runner. The shipping and browser checks use the adjacent official `404-game-recipe` checkout; browser scripts expect local Google Chrome on macOS. Browser checks require the development server. `playthrough.mjs` finishes the campaign using real keyboard and pointer events with read-only telemetry. `touch-playtest.mjs` checks simultaneous movement, firing and dash, release, cancellation, pause and rotation.

The original object references, three construction candidates per object, selections and verification evidence are in [receipts/README.md](receipts/README.md). Runtime meshes are procedural Three.js through the official 404 recipe. Runtime audio currently uses original Web Audio music and effects. Three new original Atlas outputs have been generated (a Lyria soundtrack and two Gemini portraits). The owner permits their workspace-catalog publication only after actual contest submission, so that download method is deferred and they are not yet used at runtime.

The twenty-floor expansion passes 34 Node checks and the official 33-module shipping check. [Expansion evidence](receipts/verification-act-two/README.md) records real-input campaign completion, machinery, phone controls, FPS, daily scores and two-player regressions. The new official local phone/4G gate will be recorded against the gameplay commit; the previous [verdict](receipts/verification-multiplayer/jam/verdict.txt) covers the earlier ten-floor version. The live-URL gate remains outstanding.

For the next development session, read [docs/resume.md](docs/resume.md). [Contest readiness](docs/contest-readiness.md) records the supplied rules, remaining submission work and TAO prizes. Hosting and contest submission have not been performed.
