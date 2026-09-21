import { LEVELS } from "./levels.js";
import { UPGRADE_LIMITS } from "./sim.js";

const drawings = {
  rapid:
    '<path d="M40 43h56v39q0 23-28 23T40 82z" fill="#f0f2f3"/><path d="M96 51h8q22 0 16 20t-24 10" fill="none" stroke="#f0f2f3" stroke-width="9"/><path d="m74 50-18 28h15l-7 23 26-31H74z" fill="#c94732"/><path d="M51 31q-9-10 3-20m18 20q-9-10 3-20m16 20q-9-10 3-20" stroke="#6c8fb8" stroke-width="5" fill="none"/>',
  spread:
    '<path d="m39 98 24-21 15 15-21 24z" fill="#f0f2f3"/><path d="M53 89 82 60" stroke="#344158" stroke-width="15"/><g fill="#efb546"><path d="m38 26 17 1 4 17-20 2z"/><path d="m91 11 18 13-7 17-18-8z"/><path d="m110 58 20 5-2 19-20-1z"/></g><path d="m63 65-11-14m28 1 13-12m-2 35 16-2" stroke="#6c8fb8" stroke-width="4"/>',
  pierce:
    '<path d="M24 106 97 29" stroke="#6c8fb8" stroke-width="8"/><path d="m46 20 17 7 14-7 15 7v72l-15-7-14 7-17-7z" fill="#f0f2f3"/><path d="m54 42 28 0m-28 10h28m-28 10h17m-17 11h28" stroke="#344158" stroke-width="4"/><path d="m31 94 76-71" stroke="#efb546" stroke-width="9"/><path d="m89 21 26-5-7 26z" fill="#efb546"/>',
  shield:
    '<path d="m70 15 44 17-6 46q-12 22-38 37-26-15-38-37l-6-46z" fill="#6c8fb8" stroke="#f0f2f3" stroke-width="6"/><path d="m70 32 27 11-5 31q-7 14-22 24z" fill="#344158"/><path d="m47 65 15 14 31-35" fill="none" stroke="#efb546" stroke-width="8"/>',
  magnet:
    '<path d="M32 30v39q0 40 38 40t38-40V30H86v39q0 17-16 17T54 69V30z" fill="#c94732"/><path d="M32 30h22v24H32zm54 0h22v24H86z" fill="#f0f2f3"/><path d="m59 13 10 15-8 13-11-15zm21-5 13 9-4 14-13-9z" fill="#efb546"/><path d="m22 69-10-6m109 9 11-7" stroke="#6c8fb8" stroke-width="5"/>',
  heart:
    '<path d="M70 105 28 65C-5 32 44 2 70 37c26-35 75-5 42 28z" fill="#c94732" stroke="#f0f2f3" stroke-width="5"/><path d="M58 57h12V45h12v12h12v12H82v12H70V69H58z" fill="#f0f2f3"/>',
  manager:
    '<path d="M25 39h93l-9 50H34z" fill="#c94732" stroke="#f0f2f3" stroke-width="5"/><path d="M40 45v37m18-37v37m18-37v37m18-37v37" stroke="#344158" stroke-width="5"/><path d="M21 23h15v16" stroke="#c94732" stroke-width="8" fill="none"/><circle cx="43" cy="103" r="12" fill="#344158"/><circle cx="100" cy="103" r="12" fill="#344158"/><circle cx="53" cy="55" r="10" fill="#f0f2f3"/><circle cx="91" cy="55" r="10" fill="#f0f2f3"/><path d="m42 41 21 7m38-7-21 7" stroke="#344158" stroke-width="7"/><path d="M66 15h15v20H66z" fill="#efb546"/>',
  director:
    '<rect x="20" y="85" width="27" height="35" rx="8" fill="#344158"/><rect x="95" y="85" width="27" height="35" rx="8" fill="#344158"/><path d="M39 23h65v80H39z" fill="#f0f2f3"/><path d="M47 31h49v31H47z" fill="#344158"/><path d="m51 40 16 7-6 8-10-4zm41 0-16 7 6 8 10-4z" fill="#6c8fb8"/><path d="M49 70h46v15H49z" fill="#c94732"/><circle cx="22" cy="67" r="19" fill="#c94732"/><circle cx="119" cy="67" r="19" fill="#c94732"/><circle cx="22" cy="67" r="10" fill="#344158"/><circle cx="119" cy="67" r="10" fill="#344158"/><path d="M61 13h20v12H61z" fill="#b98442"/>',
  visor:
    '<rect x="16" y="38" width="112" height="54" rx="21" fill="#f0f2f3"/><circle cx="44" cy="65" r="22" fill="#344158"/><circle cx="100" cy="65" r="22" fill="#344158"/><circle cx="44" cy="65" r="16" fill="#6c8fb8"/><circle cx="100" cy="65" r="16" fill="#6c8fb8"/><path d="M107 36V15" stroke="#b98442" stroke-width="6"/><circle cx="71" cy="31" r="9" fill="#c94732"/>',
};
export function art(name) {
  return `<svg viewBox="0 0 144 130" aria-hidden="true" focusable="false"><ellipse cx="72" cy="114" rx="52" ry="7" fill="#1a2232" opacity=".5"/>${drawings[name] || drawings.magnet}</svg>`;
}
export const UPGRADES = {
  rapid: {
    name: "Overcaffeinated",
    tag: "FIRE RATE",
    description: (n) => `Fire ${Math.round(25 / (1 + n * 0.25))}% faster.`,
  },
  spread: {
    name: "Crumb storm",
    tag: "MORE PELLETS",
    description: (n) => `${3 + n * 2} pellets for the price of one.`,
  },
  pierce: {
    name: "Receipt railgun",
    tag: "PENETRATION",
    description: (n) =>
      `Shoot through ${n + 1} extra ${n === 0 ? "enemy" : "enemies"}.`,
  },
  shield: {
    name: "Extended warranty",
    tag: "DAMAGE BLOCK",
    description: (n) => `Block ${n + 1} hits at the start of every aisle.`,
  },
  magnet: {
    name: "Snack magnet",
    tag: "PICKUP RANGE",
    description: (n) =>
      `Pull crumbs from ${(0.85 + (n + 1) * 0.32).toFixed(1)} metres away.`,
  },
  heart: {
    name: "Spare parts",
    tag: "EXTRA HEART",
    description: () => "One extra heart slot, plus a repair.",
  },
  ricochet: {
    name: "Bad bounce",
    tag: "BANK SHOTS",
    description: (n) =>
      `Shots bounce off ${n + 1} ${n ? "walls" : "wall"}. Hit enemies around corners.`,
  },
  frost: {
    name: "Cold shoulder",
    tag: "FREEZE SHOTS",
    description: (n) =>
      `Freeze enemies for ${(0.8 + n * 0.35).toFixed(2)}s. Interrupt shots and charges.`,
  },
};
export function upgradeChoices(game) {
  const sets = [
    ["rapid", "spread", "shield"],
    ["frost", "magnet", "rapid"],
    ["ricochet", "pierce", "heart"],
    ["spread", "frost", "shield"],
    ["ricochet", "heart", "rapid"],
  ];
  const candidates = [
    ...sets[game.levelIndex % sets.length],
    ...Object.keys(UPGRADES),
  ];
  return [...new Set(candidates)]
    .filter((key) => game.upgrades[key] < UPGRADE_LIMITS[key])
    .slice(0, 3);
}
export function readProgress() {
  try {
    const value = JSON.parse(localStorage.getItem("hft-route-v1") || "{}");
    return {
      unlocked: Math.max(
        Array.isArray(value.cleared) && value.cleared.includes(9) ? 10 : 0,
        Math.min(LEVELS.length - 1, Math.floor(Number(value.unlocked)) || 0),
      ),
      cleared: Array.isArray(value.cleared)
        ? value.cleared.filter(
            (n) => Number.isInteger(n) && n >= 0 && n < LEVELS.length,
          )
        : [],
    };
  } catch {
    return { unlocked: 0, cleared: [] };
  }
}
export function unlock(progress, index) {
  progress.unlocked = Math.max(
    progress.unlocked,
    Math.min(LEVELS.length - 1, index + 1),
  );
  if (!progress.cleared.includes(index)) progress.cleared.push(index);
  try {
    localStorage.setItem("hft-route-v1", JSON.stringify(progress));
  } catch {
    /* Optional local persistence. */
  }
}
function floorShape(level) {
  let cells = "";
  level.map.forEach((row, z) =>
    [...row].forEach((c, x) => {
      if (!["#", " "].includes(c))
        cells += `<rect x="${x}" y="${z}" width="1" height="1"/>`;
    }),
  );
  return `<svg class="floor-shape" viewBox="0 0 ${level.map[0].length} ${level.map.length}" aria-hidden="true" fill="currentColor">${cells}</svg>`;
}
export function visibleFloorCount(progress) {
  return progress.unlocked >= 10 || progress.cleared.includes(9)
    ? LEVELS.length
    : 10;
}
export function drawRoute(container, progress, current, select) {
  container.replaceChildren();
  container.style.setProperty("--route-count", visibleFloorCount(progress));
  LEVELS.slice(0, visibleFloorCount(progress)).forEach((level, index) => {
    if (select && index % 10 === 0) {
      const heading = document.createElement("div");
      heading.className = "act-heading";
      heading.textContent =
        index === 0 ? "RESCUE MOP-3" : "ACT II · NO EMPLOYEE LEFT BEHIND";
      container.append(heading);
    }
    const node = document.createElement(select ? "button" : "div");
    const boss = index % 5 === 4;
    const cleared = progress.cleared.includes(index);
    node.className = `route-node ${boss ? "boss-node" : ""} ${cleared ? "complete" : ""} ${index === current ? "current" : ""} ${index > progress.unlocked ? "locked" : ""}`;
    node.dataset.floor = index + 1;
    node.innerHTML = `<span class="node-number">${String(index + 1).padStart(2, "0")}</span>${boss ? art(index === 4 ? "manager" : "director") : floorShape(level)}<b>${level.name}</b><small>${boss ? { 4: "BOSS · ACCESS CARD", 9: "BOSS · RESCUE MOP-3", 14: "BOSS · FREE THE CREW", 19: "FINAL BOSS · ESCAPE" }[index] : cleared ? "CLEARED" : index > progress.unlocked ? "LOCKED" : "READY"}</small>`;
    if (select) {
      node.disabled = index > progress.unlocked;
      node.onclick = () => select(index);
      node.setAttribute(
        "aria-label",
        `Aisle ${index + 1}: ${level.name}, ${index > progress.unlocked ? "locked" : "practice"}`,
      );
    }
    container.append(node);
  });
}
export async function api(url, body) {
  const response = await fetch(url, {
    method: body === undefined ? "GET" : "POST",
    headers: body === undefined ? {} : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(12000),
  });
  const data = await response
    .json()
    .catch(() => ({ error: "Leaderboard unavailable on this host." }));
  if (!response.ok) throw new Error(data.error || "Leaderboard unavailable.");
  return data;
}
export function drawBoard(container, entries) {
  container.replaceChildren();
  if (!entries.length) {
    const empty = document.createElement("li");
    empty.className = "board-empty";
    empty.textContent = "No scores yet. Make the first mess.";
    container.append(empty);
  }
  for (const entry of entries) {
    const row = document.createElement("li");
    for (const [tag, value] of [
      ["span", String(entry.rank).padStart(2, "0")],
      ["b", entry.name],
      ["small", entry.survived ? "SURVIVED" : `${entry.seconds}s`],
      ["strong", entry.score.toLocaleString("en-US")],
    ]) {
      const el = document.createElement(tag);
      el.textContent = value;
      row.append(el);
    }
    container.append(row);
  }
}
