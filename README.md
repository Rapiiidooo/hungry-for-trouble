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

A new campaign starts with ten shots. Crumbs refill ammunition and advance the collection goal. Once the goal is met, reach the marked checkout. Batteries give eight seconds of invulnerability, free spread shots and reversed enemy pursuit. White/red repair kits restore one heart and remain available when health is full. Checkout restores one heart on departure. Pick one upgrade between aisles; the cards show before/after mechanics and exact stats. Campaign records and unlocked aisles are saved in this browser. Vac Cam goggles grant 18 seconds of first-person play, extra ammunition and faster firing. Click to lock mouse aim, or drag if pointer lock is unavailable. The right touch stick turns and fires. V returns to overhead while keeping the fire-rate bonus.

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
10. **Exit Interview:** dodge lobbed parcels, defeat the Director and rescue MOP-3. An unexpected transmission reveals a hidden service lift.
11. **Hot Under the Collar:** boiler vents warn before steam damages anything on the tile.
12. **Returns to Nowhere:** matching transport pads connect distant parts of the lost-property rooms.
13. **Expiry Date:** mine layers leave shootable mines with an arming delay and a blast warning.
14. **No Refunds:** shield carts block frontal shots; flank them or use Overtime.
15. **The Foreman:** three staggered explosive parcels force you to move between receipt volleys and shield openings.
16. **Cold Connection:** four paired transport pads connect icy islands and steam traps.
17. **Special Delivery:** conveyor lanes mix mine layers, shield carts and transport shortcuts.
18. **Dead Air:** long-range snipers lock their aim before firing fast receipts across a radio network.
19. **Final Final Notice:** shutters, vents and the new enemies guard the last detour.
20. **Shelf Destruction:** SHELF CONTROL alternates a cross of lobbed explosives with expanding shockwaves. Find the visible gap or dash through, then escape with the crew.

After the familiar first aisle, eighteen floors use seeded cover and supplies inside distinct silhouettes: rings, a clover, a crescent, joined islands, a figure eight and a spiral, with different boss arenas. Objectives remain reachable. New players see ten floors and two bosses. The first Director checkout rolls the credits, interrupted by the cleaning crew, and ends with **Made by Rapido**. **The adventure continues** then introduces the hidden service lift and a conversation that waits for the player before adding ten floors to the route. Each real clear is saved. Existing Director clears unlock floor 11. Level Select can start any reached aisle with three hearts, ten shots and no upgrades. That run keeps its three-heart baseline as you progress; heart upgrades add slots normally. Full campaign personal records remain separate from practice.

Act-two stock is interactive: dash into or shoot a yellow stock cart to launch it at enemies. Shoot a flour display to interrupt and blind nearby enemies for three seconds. Transport pads use matching A/B labels and colours; step off the destination before returning. A 720 ms camera transit and arrival pulse connect the pads visually; arrivals grant brief protection. Reduced motion uses a short dissolve.

Eight capped upgrade types support different builds: faster firing, spread, piercing, a warranty shield, crumb attraction, extra health, wall ricochets and freezing shots that interrupt attacks. Ricochet, spread, piercing and frost combine. Original robot portraits identify MOP-3, BUFF-0 and SHELF CONTROL; the current radio message can be reread in the pause menu. The title keeps one short objective. Pressing Play opens a six-second exchange with MOP-3 before the timer and enemies move; Start Now skips it. The mission remains available under Mission & Controls in pause. Rescues at floors 10 and 15 lead into the next chapter. Completing floor 20 powers down the store and stages a nine-second crew escape at sunrise, with an original musical payoff and a skippable conversation. It unlocks a saved golden vacuum livery, switchable on the title screen without affecting combat. Boss health follows the boss in both camera views. Warranty charges create a visible shield dome, with an impact flash and break effect; Vac Cam uses a matching visor indicator.

The title's Settings gear includes replayable **Credits** and **Reset local save**. Reset requires confirmation and clears this browser's route, personal record and gold livery; shared scores and the player alias remain. Credits can be paused or skipped, honour reduced motion and attribute Atlas exploration separately from the media actually used in the game. Opening them from Settings does not reveal the hidden route.

## Daily Rush and shared scores

The title's trophy opens **Daily** and **General** leaderboards. Daily Rush is a seeded 90-second survival challenge with five increasingly fast waves, replenishing crumbs and a survival bonus. Everyone gets the same layout and starting equipment for a UTC date. A new challenge starts at midnight UTC. General ranks campaign attempts beginning at aisle one, including runs that end before escaping; selected-aisle practice is excluded. It keeps the best verified score per browser identity across days. Enter an alias after a run and press **Post score**. Existing local records are not uploaded retroactively. Daily results can also be copied to challenge a friend.

Both boards are a real HTTP service shared by browsers using the same server. The server issues attempts, replays the exact quantized inputs at 60 ticks per second and calculates scores itself. Campaign verification also replays floor transitions and checks that each upgrade was actually offered. A submitted score number is never trusted. Names are aliases, not authenticated accounts; cookie resets create a new identity. Replay validation catches impossible inputs and fabricated scores, but is not bot detection or a complete anti-cheat system.

Accepted entries are written atomically to `data/leaderboard.json`, which is ignored by Git. This is a single-server design: use one Node process and a persistent writable disk. Server restarts preserve scores and expire unfinished attempts. Keep the ruleset identifiers in `game/daily.js` and `game/campaign.js` in sync with future scoring or gameplay changes.

For eventual hosting, run `npm start` with `HOST=0.0.0.0`, the host's `PORT`, and `LEADERBOARD_FILE` pointing to persistent storage. Put HTTPS in front of the service and preserve the request Host header. The built-in request limit uses the direct peer address, so a reverse proxy shares that limit unless the deployment adds trusted proxy handling. Hosting only `game/` on a static service supports solo play; both boards and multiplayer rooms require the Node server. No remote service has been deployed.

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
node scripts/presentation-playtest.mjs
node scripts/onboarding-playtest.mjs
node scripts/leaderboard-playtest.mjs
node scripts/credits-playtest.mjs
node scripts/playthrough.mjs --from=10 --credits --out=credits-director
node scripts/multiplayer-playtest.mjs
node scripts/multiplayer-playtest.mjs --coop
```

The simulation tests use Node's built-in test runner. The shipping and browser checks use the adjacent official `404-game-recipe` checkout; browser scripts expect local Google Chrome on macOS. Browser checks require the development server. `playthrough.mjs` finishes the campaign using real keyboard and pointer events with read-only telemetry. `touch-playtest.mjs` checks simultaneous movement, firing and dash, release, cancellation, pause and rotation.

The original object references, three construction candidates per object, selections and verification evidence are in [receipts/README.md](receipts/README.md). Runtime meshes are procedural Three.js through the official 404 recipe. Runtime audio currently uses original Web Audio music and effects. Three new original Atlas outputs have been generated (a Lyria soundtrack and two Gemini portraits). The owner permits their workspace-catalog publication only after actual contest submission, so that download method is deferred and they are not yet used at runtime.

The latest build passes 41 Node checks, the official 39-module shipping check and real desktop/phone navigation probes. [Leaderboard and credits evidence](receipts/verification-leaderboards/README.md) covers verified shared campaign scores, both boards, local reset, aligned menus, the staff roll and an actual Director victory followed by credits and aisle 11. [Onboarding evidence](receipts/verification-onboarding/README.md) covers briefing timing, initial ammunition and basic-gear restarts. The official local phone/4G gate passes for gameplay commit `d3cdd7a964fa2d48fc562b10248b1441d01ddba3`: 5.6-second readiness, 2.7 MB, real touch movement and no errors. Its [unedited verdict](receipts/verification-leaderboards/jam/verdict.txt) covers the opening aisle on Chrome phone emulation; a live-URL submission gate remains outstanding. Earlier campaign, finale and multiplayer evidence remains in [the preceding receipts](receipts/verification-reveal/README.md).

For the next development session, read [docs/resume.md](docs/resume.md). [Contest readiness](docs/contest-readiness.md) records the supplied rules, remaining submission work and TAO prizes. Hosting and contest submission have not been performed.
