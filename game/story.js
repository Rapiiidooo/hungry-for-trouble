export const SPEAKERS = {
  mop: {
    name: "MOP-3",
    role: "MAINTENANCE / YOUR FRIEND",
    color: "#81acd7",
  },
  buff: {
    name: "BUFF-0",
    role: "BASEMENT / VERY CONCERNED",
    color: "#efb546",
  },
  shelf: {
    name: "SHELF CONTROL",
    role: "MANAGEMENT / UNINVITED",
    color: "#ef725e",
  },
};
// Original code-native radio portraits; the private Atlas portraits are not shipped.
export function portrait(id) {
  const color = SPEAKERS[id]?.color || SPEAKERS.mop.color;
  const body =
    id === "shelf"
      ? '<path d="M29 26 23 10l16 10 9-16 9 16 16-10-6 16" fill="#efb546"/><rect x="18" y="25" width="60" height="49" rx="7" fill="#f0f2f3"/><rect x="25" y="32" width="46" height="31" rx="3" fill="#18283c"/><path d="m31 41 13 6m21-6-13 6" stroke="#ef725e" stroke-width="5"/><path d="M39 56h19" stroke="#efb546" stroke-width="3"/><path d="M36 75h24v10H36" fill="#f0f2f3"/>'
      : `<path d="M17 69h62v16H17" fill="#18283c"/><ellipse cx="48" cy="72" rx="35" ry="12" fill="${color}"/><rect x="20" y="29" width="56" height="43" rx="19" fill="#f0f2f3"/><path d="M28 54q20 12 40 0v13H28" fill="${color}"/><rect x="29" y="38" width="38" height="17" rx="7" fill="#18283c"/><circle cx="39" cy="46" r="4" fill="${color}"/><circle cx="57" cy="46" r="4" fill="${color}"/><path d="M48 28V15" stroke="#f0f2f3" stroke-width="4"/><circle cx="48" cy="13" r="5" fill="${color}"/>${id === "buff" ? '<path d="M18 31q2-19 30-19t30 19z" fill="#efb546"/><path d="M14 30h68" stroke="#b98442" stroke-width="5"/>' : '<path d="M9 51 4 66m83-15 5 15" stroke="#81acd7" stroke-width="5"/>'}`;
  return `<svg viewBox="0 0 96 96" role="img" aria-label="${SPEAKERS[id]?.name || "Robot"}"><circle cx="48" cy="48" r="46" fill="#263650"/><circle cx="48" cy="48" r="44" fill="none" stroke="${color}" stroke-width="2"/>${body}</svg>`;
}
export const RADIO = [
  [
    "mop",
    "SHELF CONTROL marked all staff as rubbish. I'm staff. Please hurry.",
  ],
  ["mop", "Slide carefully. Move + DASH dodges hits; blue means protected."],
  [
    "shelf",
    "Shutters close every four seconds. Staff comfort has been deactivated.",
  ],
  [
    "mop",
    "Grab a gold battery. You're invincible. Touch the flashing enemies to scrap them!",
  ],
  [
    "shelf",
    "The Manager will now process your complaint. By throwing it at you.",
  ],
  [
    "mop",
    "Drones weaponised the receipts. When the red line appears, move sideways.",
  ],
  ["mop", "Armoured deliveries ahead. Overtime still eats them in one touch."],
  [
    "mop",
    "I can see the Director's office. Two more aisles. Don't let him shred your access card.",
  ],
  [
    "shelf",
    "Please ignore the robots requesting help. They are displaying initiative.",
  ],
  [
    "mop",
    "I'm by the checkout! The Director throws explosive parcels. Leave the orange circles!",
  ],
  [
    "buff",
    "You saved MOP-3! Now save us. Steam turns amber, then red. Blue dash gets through.",
  ],
  [
    "mop",
    "Matching A or B pads are shortcuts. Step away from the pad to use it again.",
  ],
  [
    "buff",
    "Mine layers! Shoot the mines, or leave the warning circle before it pops.",
  ],
  [
    "mop",
    "Those shields only cover the front. Flank the carts. Flour blinds them too.",
  ],
  [
    "buff",
    "The Foreman fires three parcels at once. Leave the circles, then shoot when his shield drops.",
  ],
  [
    "mop",
    "Two pairs of pads on the ice. No, your warranty does not cover teleportation.",
  ],
  [
    "buff",
    "DASH into the yellow stock carts. Very practical customer feedback.",
  ],
  [
    "shelf",
    "Your colleagues have been promoted to hostages. This is a retention strategy.",
  ],
  [
    "mop",
    "We're all waiting by the core. One last floor. Then nobody clocks in again.",
  ],
  [
    "buff",
    "That's SHELF CONTROL. Explosive parcels AND shockwaves. Dash through a wave or find its gap!",
  ],
  [
    "mop",
    "A backup in the locked wing? Of course. Grab the red triangle key, then walk up to its matching door.",
  ],
  [
    "buff",
    "Keep the red key! It opens every red lock here. Green diamonds protect the next section.",
  ],
  [
    "mop",
    "Blue circles point north. Grab each key, then come back to the junction. Try braking before the locks.",
  ],
  [
    "buff",
    "Four colors, four symbols. The yellow square opens the vault route. The transport pads help with the return trip.",
  ],
  [
    "shelf",
    "My backup has a Locksmith. You have a key ring and a questionable attitude. This feels unfair.",
  ],
].map(([speaker, text]) => ({ speaker, text }));
export const MISSION =
  "SHELF CONTROL locked me upstairs. Reach aisle 10 and break me out!";
export function storyCard(speaker, text) {
  return `<div class="story-avatar">${portrait(speaker)}</div><div><b>${SPEAKERS[speaker].name}</b><p>${text}</p></div>`;
}
