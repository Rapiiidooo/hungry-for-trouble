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

The locked wing stays hidden until the floor-20 escape. Its keys use muted red, green, blue and yellow enamel as functional lock codes, paired with triangle, diamond, circle and square symbols. This green is a key identifier, not a new menu theme. Keep the key ring compact below the minimap and absent on earlier floors. Keys are original 2D tokens that turn like coins inside a coloured light beam. Doors reuse the selected freezer geometry, carry the key's symbol plate on both faces and the roof, glow and raise a beam while the matching key is held, and sink smoothly when unlocked. Reduced motion opens them immediately. Seeded rooms form doglegs, frozen branches, a cross and an outer circuit around a central vault.

HUD damage uses brighter salmon `#ff8065` and shield feedback uses pale blue `#a4c0e0`, both readable against the dark HUD. White text and tomato buttons retain readable contrast. Concrete blue-grey floors and blue freezer aisles give the departments distinct moods. The user also rejected the cream treatment in the later theme review; neutral enamel white supersedes it.

Verified asset modules and their original generation references retain their historical colours. `recolorEnamel()` in `game/main.js` maps their cached materials into this palette during assembly, before actor baking. Apply it to future scenery and articulated actors too; do not rewrite historical receipts. Native SVG upgrade illustrations use the same enamel colours.

`departments.js` dresses the selected floor, shelf and freezer models without replacing their geometry. The first three departments should read immediately as breakfast shelves, cold storage and shipping: neutral terrazzo with tomato trim, blue frost lines with cold cabinets, then steel tread with ochre stock and taller shelving. Later themes extend these families with sale diamonds and office stripes. Coordinate the fixtures, floor pattern and light, instead of relying only on a floor tint. Printed department signs use original Canvas artwork and small pictograms. Each aisle has one board, standing on a full shelf row near the entrance and tilted back towards the camera, so it reads as store signage rather than a floating label. Floor-shape names stay in route cards, not in the aisle. The robot, crumbs and threats take priority.

## Camera and shapes

A fixed elevated view with north at the top of the screen keeps movement legible. The camera follows gently without yaw or roll. The overhead lens is a long perspective (27° in landscape, 40° in portrait, about 57° of pitch) so the store reads as a lit diorama. Its lead keeps roughly eight metres visible ahead and five behind outside the HUD, close to the former orthographic balance. A lower key light and weaker hemisphere fill give longer shadows and ink-blue depth. Vacuums, enemies and bosses hidden behind shelves keep a flat stencil silhouette in the overhead view only; first person never sees through walls. The temporary Vac Cam pickup is the explicit exception: a level first-person camera with restrained pitch, visible vacuum nozzle and a reversible eased overhead transition. It never rolls. Goggles close an iris over the lens change. At eye level, shots are thin tracers that appear only once they leave the lens, grazing receipts are hidden, the nozzle warms gold when firing, labels and crumbs shrink, and distance haze adds depth. The playable area is furnished but uncluttered at floor level. Walls and shelves are low enough to see threats behind them.

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

Upgrade cards illustrate the actual mechanic alongside numeric before/after changes. Desktop shows both diagrams; narrow and short screens use one larger resulting-effect diagram with the numbers below, in a grid that never overlays the title. Preserve SVG proportions and keep illustrations still on hover.

On desktop, hearts and shots share one compact panel with a tomato bottom rule and no left stripe; the repair hint moves to pause help except in rooms. The owner rejected another scaled-down HUD panel as still too bulky. Phones now use a dedicated composition: hearts, shield and shots in the top row, compact aisle/objective/timer below, and score between the thumb controls. Landscape puts status on one row. The map starts collapsed behind a 44 px button; key symbols stay visible when needed. Remove the permanent brand, floor title, radio card and large dash lesson from the playing field. Full floor/score and mission help remain in pause. Keep damage feedback and generous thumb targets. Phone FPS uses hold-to-fire with relative horizontal dragging, a level horizon and a wider portrait lens. Holding an offset thumb must not keep spinning. Gentle aim assistance only considers nearby, visible targets close to the crosshair and yields to manual turning; walls, shutters and locks obstruct it. Room opponents receive no aim assistance. Scored simulation receives the same quantized input recorded in the replay.

The radio gives brief combat advice on larger screens; the mission appears before play and major discoveries wait for the player between floors. Camera changes interpolate position, orientation and projection over 850 ms, reverse continuously and honour reduced motion. Resizing does not advance a transition.

Teach ammunition, protective dodge and Vac Cam with one short action-dependent cue at a time during the first three solo aisles. Highlight the relevant control, confirm the actual action and remember it on that browser. Cues wait behind pickup and hazard messages, hide in menus and pause, and stay away from thumb controls. Daily and rooms omit them. Settings reset also clears learned cues. Visors have a nearby Vac Cam / 18s label. Keep this teaching in presentation code; it must not alter simulation, replay rules or saved equipment.

Multiplayer reuses the verified vacuum, with blue host trim and red guest trim, a name label and ground ring. A downed vacuum tips sideways and its repair ring pulses. Partner health, revival/respawn status and the shared ammunition bag remain visible. Enemy player shots are red; allied shots are blue. Empty space between touch controls must pass pointer events to the game canvas.

## Mission and payoff

Keep the title screen light: one short objective and clear play, level, daily, multiplayer and leaderboard access. MOP-3's dialogue belongs after Play, never as a permanent title-screen card. The six-second briefing freezes gameplay and can be skipped. Pause buttons use literal action labels with a short explanation; mission and controls sit in a disclosure below them. Only ten floors and two bosses appear until the Director rescue opens the service lift. Keep future floors out of initial counters, route nodes and radio hints. Preserve an existing basement unlock.

The header uses compact trophy and Settings icons with the exact same opaque enamel background as Sound. Align the personal record and golden-livery toggle on one left edge in every layout. Keep the removed cleanup slogan off the title. Reset local save belongs in Settings, behind an explicit confirmation; it preserves shared scores.

Credits are a playful dark-blue film roll with warm gold accents and short production jokes. The user prefers a slightly slower pace: use a 60-second roll. Stage native SVG vacuums below the reading area, one at a time, with braking, a hesitant turn and backwards driving instead of identical straight crossings. Their captions, wheels, blinking eyes and dust share the paused clock. Deliver Made by Rapido as an enamel-white receipt: a vacuum enters, coughs and spits out the paper, which flies up and unfolds over 4.4 seconds. Fade the remaining controls in after it settles. Pause freezes this delivery, a second skip finishes it, and reduced motion substitutes a short dissolve. Keep the ticket reachable on short screens. The first Director checkout adds The adventure continues before the basement discovery; manual playback from Settings must not spoil it. Attribute tools truthfully, including Atlas studies that are not yet runtime assets.

For the contest build, the user chose to acknowledge inspirational mechanics only: maze chases, frantic firefights, survival arenas and power-ups. Keep the Inspirations section free of trademarked game names.

The warranty is a translucent pale-blue hemisphere with an orbiting arc and a single impact flare, tied to actual charges. Boss health follows its world position in overhead and first person. Orange landing rings fill before lobbed impacts. A shockwave's visible opening must match its safe sector. Camera transit uses a short lift and easing, with no roll and a reduced-motion alternative.

The floor-20 checkout frees the crew with a short celebration, rewards the golden vacuum livery and reveals the locked wing without a cinematic. The floor-25 checkout stages the only crew escape at sunrise, confirms that the last backup is erased and rolls the closing credits before the results. The livery changes appearance only and retains the red trim. The favicon is an original compact vacuum silhouette. The employee badge keeps its bottom rule.
