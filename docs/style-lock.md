# Hungry for Trouble style lock

> A tiny enamel vacuum wages an absurd midnight war in a chunky toy supermarket, with honey-gold crumbs, tomato-red security appliances, cream shelves and warm fluorescent light against ink-blue shadows.

## Palette

| Role          | Hex        | Use                                         |
| ------------- | ---------- | ------------------------------------------- |
| Ink           | `0x263650` | Dark lettering, HUD panels and shadows      |
| Cream         | `0xf4ead6` | Printed menus, vacuum body and shelf enamel |
| Tomato ink    | `0xb83d2b` | Menu titles and primary buttons             |
| Tomato enamel | `0xc94732` | Security appliances and red trim            |
| Honey         | `0xefb546` | Crumbs, ammunition and overtime energy      |
| Enamel blue   | `0x6c8fb8` | Cold fixtures, lenses and ambushers         |
| Brass         | `0xb98442` | Hinges, armoured trolleys and cardboard     |
| Charcoal      | `0x344158` | Tyres, hoses and appliance joints           |

The user rejected the previous acid-green and petrol palette as generic and AI-styled. Menus should resemble printed supermarket posters and price tickets: cream paper, red ink, blue lettering and firm offset shadows. Avoid neon green, cyan glow and glassy dashboard panels. Keep the existing typography and layout.

HUD damage uses brighter salmon `#ff8065` and shield feedback uses pale blue `#a4c0e0`, both readable against the dark HUD. Cream text on tomato buttons has a 4.7:1 contrast ratio. Warm tiles and blue freezer aisles retain different moods without changing gameplay.

Verified asset modules and their original generation references retain their historical colours. `recolorEnamel()` in `game/main.js` maps their cached materials into this palette during assembly, before actor baking. Apply it to future scenery and articulated actors too; do not rewrite historical receipts. Native SVG upgrade illustrations use the same enamel colours.

## Camera and shapes

A fixed elevated view with north at the top of the screen keeps movement legible. The camera follows gently without yaw or roll. The temporary Vac Cam pickup is the explicit exception: a level first-person camera with restrained pitch, visible vacuum nozzle and an immediate overhead toggle. It never rolls. The playable area is furnished but uncluttered at floor level. Walls and shelves are low enough to see threats behind them.

Objects have rounded enamel housings, thick wheels and clear functional silhouettes. Avoid tiny ornamental detail that disappears during play. All model fronts face +Z, are centred on X/Z, and stand at Y=0 in metres.

| Asset                   | Size and form                                                                                                                                      |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vacuum hero             | 0.9 m wide, 0.85 m tall, 1.05 m deep; cream cylindrical canister, expressive lid, two broad wheels, articulated forward hose and wide floor nozzle |
| Security trolley        | 0.9 m wide, 1.1 m tall, 1.0 m deep; tomato red slatted basket, four wheels, two cream lamps as eyes, rotating beacon                               |
| Floor-polisher ambusher | 1.0 m wide, 0.9 m tall, 0.9 m deep; blue enamel disc base, angled handle frame, hostile narrow visor and two buffing brushes                       |
| Grocery shelf           | 2 m wide, 1.35 m tall, 1.6 m deep; cream double-sided shelving with thick tomato trim and blocks of cereal boxes                                   |
| Freezer island          | 2 m wide, 1.1 m tall, 1.6 m deep; blue enamel rounded cabinet, cream rim, inset cold blue glass, brass hinges                                      |
| Checkout                | 2 m wide, 1.25 m tall, 1.2 m deep; cream till, dark conveyor, striped exit post and broad arch                                                     |
| Overtime battery        | 0.4 m wide, 0.6 m tall; honey-gold cylindrical canister with cream cap, chunky side grips and a lightning-shaped inset                             |
| Crumb                   | 0.18 m wide; faceted golden snack nugget with clear volume from all sides                                                                          |

## Expansion objects

| Asset              | Size and form                                                                                                                     |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Audit drone        | 1.17 m wide, 1 m tall, 1.03 m deep; rounded cream printer, blue scanner eye, red duct fans and curling receipt cannon             |
| Surveillance visor | 0.91 m wide, 0.65 m tall, 0.67 m deep; twin blue lenses, cream binocular housings, red recording lamp and dark strap              |
| Director           | 2.75 m wide, 2.5 m tall, 1.79 m deep; profiled cream checkout kiosk, scanner face, twin receipt cannons and ink-blue tread tracks |

The final boss uses the Director at 1.35 scale. Armoured trolleys reuse the verified trolley with ochre enamel and a larger silhouette. Conveyor tiles and first-person ceiling panels reuse the verified floor asset. First-person view reuses the hero's articulated nozzle. Upgrade art and boss route portraits are original native SVG interface illustrations, not imported 3D objects.

## Falsifiable visual goals

- The cream player, red pursuer and blue ambusher are distinguishable in a moving 390 px viewport.
- Shelves leave the current corridor, nearest junction and approaching threats readable.
- Gold pickups remain legible against both warm tile and blue freezer floors.
- Firing produces a brief nozzle kick, a short tracer and a clear enemy hit reaction.
- Overtime changes the player's silhouette or scale, lighting, enemy behaviour and sound immediately.
- Damage is a brief local effect; the camera never rolls and screen shake stays restrained.
- The start screen has one obvious campaign play button, with optional escape-route and daily-rush buttons.
- Health loss shows a red heart beside the player; ammunition remains readable in portrait and landscape.
- Upgrade illustrations convey their effect before reading the description, and the escape route announces both bosses.
- Drone warnings precede their projectiles; late stages introduce mechanical changes, not only new floor colours.
