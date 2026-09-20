# Hungry for Trouble style lock

> A tiny enamel vacuum wages an absurd midnight war in a chunky toy supermarket, with glowing lime crumbs, tomato-red security appliances, creamy shelves and pools of warm fluorescent light against petrol-blue shadows.

## Palette

| Role     | Hex        | Use                                     |
| -------- | ---------- | --------------------------------------- |
| Petrol   | `0x102c37` | Shadows, deep walls, interface          |
| Cream    | `0xf5e9c9` | Vacuum body, shelf enamel, text         |
| Tomato   | `0xf1533f` | Security enemies and danger             |
| Lime     | `0xd5f65b` | Crumbs, overtime energy, primary action |
| Teal     | `0x52c9c1` | Cold fixtures and freezer light         |
| Ochre    | `0xd99c4b` | Brass details, cardboard and warm lamps |
| Charcoal | `0x203f49` | Tyres, hoses and appliance joints       |

## Camera and shapes

A fixed elevated view with north at the top of the screen keeps movement legible. The camera follows gently without yaw or roll. The playable area is furnished but uncluttered at floor level. Walls and shelves are low enough to see threats behind them.

Objects have rounded enamel housings, thick wheels and clear functional silhouettes. Avoid tiny ornamental detail that disappears during play. All model fronts face +Z, are centred on X/Z, and stand at Y=0 in metres.

| Asset                   | Size and form                                                                                                                                      |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vacuum hero             | 0.9 m wide, 0.85 m tall, 1.05 m deep; cream cylindrical canister, expressive lid, two broad wheels, articulated forward hose and wide floor nozzle |
| Security trolley        | 0.9 m wide, 1.1 m tall, 1.0 m deep; tomato red slatted basket, four wheels, two cream lamps as eyes, rotating beacon                               |
| Floor-polisher ambusher | 1.0 m wide, 0.9 m tall, 0.9 m deep; teal disc base, angled handle frame, hostile narrow visor and two buffing brushes                              |
| Grocery shelf           | 2 m wide, 1.35 m tall, 1.6 m deep; cream double-sided shelving with thick tomato trim and blocks of cereal boxes                                   |
| Freezer island          | 2 m wide, 1.1 m tall, 1.6 m deep; teal rounded cabinet, cream rim, inset cold blue glass, brass hinges                                             |
| Checkout                | 2 m wide, 1.25 m tall, 1.2 m deep; cream till, dark conveyor, striped exit post and broad arch                                                     |
| Overtime battery        | 0.4 m wide, 0.6 m tall; lime cylindrical canister with cream cap, chunky side grips and a lightning-shaped inset                                   |
| Crumb                   | 0.18 m wide; faceted golden snack nugget with clear volume from all sides                                                                          |

## Falsifiable visual goals

- The cream player, red pursuer and teal ambusher are distinguishable in a moving 390 px viewport.
- Shelves leave the current corridor, nearest junction and approaching threats readable.
- Lime pickups remain legible against both warm tile and blue freezer floors.
- Firing produces a brief nozzle kick, a short tracer and a clear enemy hit reaction.
- Overtime changes the player's silhouette or scale, lighting, enemy behaviour and sound immediately.
- Damage is a brief local effect; the camera never rolls and screen shake stays restrained.
- The start screen has one obvious play button and no administrative progression screen.
