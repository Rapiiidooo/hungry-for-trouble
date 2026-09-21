# Hungry for Trouble style lock

> A tiny enamel vacuum wages an absurd midnight war in a chunky toy supermarket, with honey-gold crumbs, tomato-red security appliances, white enamel shelves and cool fluorescent light against ink-blue shadows.

## Palette

| Role          | Hex        | Use                                         |
| ------------- | ---------- | ------------------------------------------- |
| Ink           | `0x263650` | Dark lettering, HUD panels and shadows      |
| Enamel white  | `0xf0f2f3` | Printed menus, vacuum body and shelf enamel |
| Tomato ink    | `0xb83d2b` | Menu titles and primary buttons             |
| Tomato enamel | `0xc94732` | Security appliances and red trim            |
| Honey         | `0xefb546` | Crumbs, ammunition and overtime energy      |
| Enamel blue   | `0x6c8fb8` | Cold fixtures, lenses and ambushers         |
| Brass         | `0xb98442` | Hinges, armoured trolleys and cardboard     |
| Charcoal      | `0x344158` | Tyres, hoses and appliance joints           |

The user rejected the previous acid-green and petrol palette as generic and AI-styled. Menus should resemble printed supermarket posters and price tickets: white price tickets, red ink, blue lettering and firm offset shadows. Avoid neon green, cyan glow and glassy dashboard panels. Keep the existing typography and layout.

The employee badge uses a bottom rule, not a coloured left stripe. Campaign presentation keeps the basement secret until the Director rescue; first-time players see a ten-floor rescue mission. Story beats that explain a new objective must be readable before controls resume, rather than relying only on radio during combat.

HUD damage uses brighter salmon `#ff8065` and shield feedback uses pale blue `#a4c0e0`, both readable against the dark HUD. White text and tomato buttons retain readable contrast. Concrete blue-grey floors and blue freezer aisles give the departments distinct moods. The user also rejected the cream treatment in the later theme review; neutral enamel white supersedes it.

Verified asset modules and their original generation references retain their historical colours. `recolorEnamel()` in `game/main.js` maps their cached materials into this palette during assembly, before actor baking. Apply it to future scenery and articulated actors too; do not rewrite historical receipts. Native SVG upgrade illustrations use the same enamel colours.

## Camera and shapes

A fixed elevated view with north at the top of the screen keeps movement legible. The camera follows gently without yaw or roll. The temporary Vac Cam pickup is the explicit exception: a level first-person camera with restrained pitch, visible vacuum nozzle and a reversible eased overhead transition. It never rolls. The playable area is furnished but uncluttered at floor level. Walls and shelves are low enough to see threats behind them.

Objects have rounded enamel housings, thick wheels and clear functional silhouettes. Avoid tiny ornamental detail that disappears during play. All model fronts face +Z, are centred on X/Z, and stand at Y=0 in metres.

| Asset                   | Size and form                                                                                                                                             |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vacuum hero             | 0.9 m wide, 0.85 m tall, 1.05 m deep; white enamel cylindrical canister, expressive lid, two broad wheels, articulated forward hose and wide floor nozzle |
| Security trolley        | 0.9 m wide, 1.1 m tall, 1.0 m deep; tomato red slatted basket, four wheels, two white enamel lamps as eyes, rotating beacon                               |
| Floor-polisher ambusher | 1.0 m wide, 0.9 m tall, 0.9 m deep; blue enamel disc base, angled handle frame, hostile narrow visor and two buffing brushes                              |
| Grocery shelf           | 2 m wide, 1.35 m tall, 1.6 m deep; white enamel double-sided shelving with thick tomato trim and blocks of cereal boxes                                   |
| Freezer island          | 2 m wide, 1.1 m tall, 1.6 m deep; blue enamel rounded cabinet, white enamel rim, inset cold blue glass, brass hinges                                      |
| Checkout                | 2 m wide, 1.25 m tall, 1.2 m deep; white enamel till, dark conveyor, striped exit post and broad arch                                                     |
| Overtime battery        | 0.4 m wide, 0.6 m tall; honey-gold cylindrical canister with white enamel cap, chunky side grips and a lightning-shaped inset                             |
| Crumb                   | 0.18 m wide; faceted golden snack nugget with clear volume from all sides                                                                                 |

## Expansion objects

| Asset              | Size and form                                                                                                                            |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Audit drone        | 1.17 m wide, 1 m tall, 1.03 m deep; rounded white enamel printer, blue scanner eye, red duct fans and curling receipt cannon             |
| Surveillance visor | 0.91 m wide, 0.65 m tall, 0.67 m deep; twin blue lenses, white enamel binocular housings, red recording lamp and dark strap              |
| Director           | 2.75 m wide, 2.5 m tall, 1.79 m deep; profiled white enamel checkout kiosk, scanner face, twin receipt cannons and ink-blue tread tracks |

The final boss uses the Director at 1.35 scale. Armoured trolleys reuse the verified trolley with ochre enamel and a larger silhouette. Conveyor tiles and first-person ceiling panels reuse the verified floor asset. First-person view reuses the hero's articulated nozzle. Upgrade art and boss route portraits are original native SVG interface illustrations, not imported 3D objects.

## Falsifiable visual goals

- The white enamel player, red pursuer and blue ambusher are distinguishable in a moving 390 px viewport.
- Shelves leave the current corridor, nearest junction and approaching threats readable.
- Gold pickups remain legible against both warm tile and blue freezer floors.
- Firing produces a brief nozzle kick, a short tracer and a clear enemy hit reaction.
- Overtime changes the player's silhouette or scale, lighting, enemy behaviour and sound immediately.
- Damage is a brief local effect; the camera never rolls and screen shake stays restrained.
- The start screen has one obvious campaign play button, with optional escape-route, daily-rush and two-player buttons.
- Health loss shows a red heart beside the player; ammunition remains readable in portrait and landscape.
- Upgrade illustrations convey their effect before reading the description, and the escape route announces both bosses.
- Drone warnings precede their projectiles; late stages introduce mechanical changes, not only new floor colours.

## Store takeover pass

Eighteen later floors use shaped footprints with exterior void: rounded doglegs, rings, clover courts, crescents, connected islands, a figure eight, a spiral and distinct boss arenas. Reserve open transport landings before placing random cover so that walking around every pad stays possible. The first aisle stays familiar and the Manager keeps the original arena. Cover and supplies vary while objectives remain connected. Route cards show floor silhouettes and the minimap scales to each footprint.

Receipts use original canvas sprite artwork with a red border, white paper, ink lines and motion trails at body height. Red targeting lines announce drone fire. Damage direction appears around the FPS crosshair. These are functional combat effects, not imported meshes. Repair kits reuse the verified battery with white/red materials and a heart label; MOP-3 reuses the polisher geometry at the final checkout.

Upgrade cards diagram the actual mechanic before and after, alongside numeric changes. The radio gives brief combat advice; the mission appears before play and major discoveries wait for the player between floors. Camera changes interpolate position, orientation and projection over 850 ms, reverse continuously and honour reduced motion. Resizing does not advance a transition.

Multiplayer reuses the verified vacuum, with blue host trim and red guest trim, a name label and ground ring. A downed vacuum tips sideways and its repair ring pulses. Partner health, revival/respawn status and the shared ammunition bag remain visible. Enemy player shots are red; allied shots are blue. Empty space between touch controls must pass pointer events to the game canvas.

## Mission and payoff

Keep the title screen light: one short objective and clear play, level, daily, multiplayer and leaderboard access. MOP-3's dialogue belongs after Play, never as a permanent title-screen card. The six-second briefing freezes gameplay and can be skipped. Pause buttons use literal action labels with a short explanation; mission and controls sit in a disclosure below them. Only ten floors and two bosses appear until the Director rescue opens the service lift. Keep future floors out of initial counters, route nodes and radio hints. Preserve an existing basement unlock.

The warranty is a translucent pale-blue hemisphere with an orbiting arc and a single impact flare, tied to actual charges. Boss health follows its world position in overhead and first person. Orange landing rings fill before lobbed impacts. A shockwave's visible opening must match its safe sector. Camera transit uses a short lift and easing, with no roll and a reduced-motion alternative.

The final checkout stages a crew escape, character banter and a sunrise, then rewards the golden vacuum livery. The livery changes appearance only and retains the red trim. The favicon is an original compact vacuum silhouette. The employee badge keeps its bottom rule.
