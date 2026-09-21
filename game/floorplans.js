// Room footprints are designed; cover, connections and supplies vary with the run seed.
export const DEFAULT_SEED = 4042026;
const plans = {
  1: {
    size: [20, 16],
    rooms: [
      [1, 10, 7, 4],
      [5, 5, 7, 7],
      [11, 1, 7, 6],
    ],
    links: [
      [0, 1],
      [1, 2],
    ],
    start: [2, 12],
    exit: [16, 2],
    enemies: "EEA",
    shape: "DOGLEG",
  },
  2: {
    size: [23, 18],
    rooms: [
      [1, 11, 7, 5],
      [1, 1, 7, 6],
      [14, 1, 7, 6],
      [14, 11, 7, 5],
    ],
    links: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
    ],
    start: [2, 14],
    exit: [19, 13],
    enemies: "EEA",
    gates: true,
    shape: "LOADING LOOP",
  },
  3: {
    size: [23, 19],
    rooms: [
      [8, 5, 7, 9],
      [1, 7, 7, 5],
      [15, 7, 6, 5],
      [9, 1, 5, 4],
      [9, 14, 5, 4],
    ],
    links: [
      [0, 1],
      [0, 2],
      [0, 3],
      [0, 4],
    ],
    start: [10, 16],
    exit: [11, 2],
    enemies: "EAEAEA",
    shape: "CROSSROADS",
  },
  5: {
    size: [23, 18],
    rooms: [
      [1, 10, 7, 6],
      [6, 4, 9, 8],
      [15, 1, 6, 7],
      [15, 11, 6, 5],
    ],
    links: [
      [0, 1],
      [1, 2],
      [1, 3],
      [2, 3],
    ],
    start: [2, 14],
    exit: [19, 2],
    enemies: "RRRE",
    shape: "FOOD COURT",
  },
  6: {
    size: [23, 19],
    rooms: [
      [1, 1, 7, 6],
      [1, 11, 7, 6],
      [8, 11, 7, 6],
      [15, 11, 6, 6],
      [15, 1, 6, 6],
    ],
    links: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
    ],
    start: [2, 2],
    exit: [19, 2],
    enemies: "RRRTT",
    gates: true,
    shape: "HORSESHOE",
  },
  7: {
    size: [23, 20],
    rooms: [
      [1, 13, 6, 5],
      [1, 2, 6, 6],
      [10, 7, 5, 6],
      [16, 1, 5, 6],
      [16, 13, 5, 5],
    ],
    links: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 0],
    ],
    start: [2, 16],
    exit: [19, 3],
    enemies: "RRRAT",
    shape: "FROZEN ISLANDS",
  },
  8: {
    size: [23, 19],
    rooms: [
      [1, 1, 20, 4],
      [1, 7, 20, 4],
      [1, 13, 20, 4],
    ],
    links: [],
    start: [2, 15],
    exit: [19, 2],
    enemies: "RRRTATA",
    belts: true,
    shape: "SWITCHBACK",
  },
  9: {
    size: [23, 20],
    rooms: [
      [6, 1, 15, 11],
      [1, 13, 7, 5],
      [9, 12, 5, 6],
    ],
    links: [
      [1, 2],
      [2, 0],
    ],
    start: [2, 16],
    exit: [13, 2],
    boss: [13, 6],
    enemies: "RRTA",
    shape: "CONTROL WING",
  },
  10: {
    size: [23, 18],
    rooms: [
      [1, 10, 7, 6],
      [8, 7, 7, 7],
      [15, 1, 6, 9],
      [2, 1, 8, 6],
    ],
    links: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
    ],
    start: [2, 14],
    exit: [19, 2],
    enemies: "NRREA",
    vents: 3,
    stock: true,
    shape: "BOILER LOOP",
  },
  11: {
    size: [24, 20],
    rooms: [
      [1, 12, 8, 6],
      [2, 1, 7, 6],
      [15, 1, 7, 6],
      [14, 12, 8, 6],
    ],
    links: [
      [0, 1],
      [1, 2],
      [2, 3],
    ],
    start: [2, 16],
    exit: [20, 16],
    enemies: "NNRTA",
    portals: 2,
    stock: true,
    shape: "LOST PROPERTY",
  },
  12: {
    size: [25, 19],
    rooms: [
      [1, 11, 7, 6],
      [9, 7, 7, 6],
      [17, 1, 6, 7],
      [1, 1, 7, 6],
    ],
    links: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
    ],
    start: [2, 15],
    exit: [21, 2],
    enemies: "LLRNE",
    vents: 4,
    stock: true,
    shape: "PACKING ZIGZAG",
  },
  13: {
    size: [23, 21],
    rooms: [
      [1, 13, 8, 6],
      [1, 1, 8, 6],
      [14, 1, 7, 6],
      [14, 13, 7, 6],
      [8, 8, 7, 5],
    ],
    links: [
      [0, 4],
      [4, 1],
      [4, 2],
      [4, 3],
    ],
    start: [2, 17],
    exit: [19, 2],
    enemies: "QQLNR",
    portals: 2,
    stock: true,
    shape: "SECURITY SPIDER",
  },
  14: {
    size: [23, 20],
    rooms: [
      [4, 1, 17, 12],
      [1, 14, 8, 4],
      [13, 14, 8, 4],
    ],
    links: [
      [0, 1],
      [0, 2],
    ],
    start: [2, 16],
    exit: [19, 16],
    boss: [12, 6],
    enemies: "NLQ",
    vents: 4,
    stock: true,
    shape: "FOREMAN'S FURNACE",
  },
  15: {
    size: [24, 21],
    rooms: [
      [1, 13, 7, 6],
      [2, 2, 6, 6],
      [10, 8, 5, 6],
      [16, 2, 6, 6],
      [16, 14, 6, 5],
    ],
    links: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 0],
    ],
    start: [2, 17],
    exit: [20, 3],
    enemies: "NQLRRA",
    portals: 4,
    vents: 3,
    stock: true,
    shape: "ICE SWITCHBOARD",
  },
  16: {
    size: [23, 19],
    rooms: [
      [1, 1, 20, 4],
      [1, 7, 20, 4],
      [1, 13, 20, 4],
    ],
    links: [],
    start: [2, 15],
    exit: [19, 2],
    enemies: "LLNQQR",
    belts: true,
    portals: 2,
    vents: 4,
    stock: true,
    shape: "SORTING SERPENT",
  },
  17: {
    size: [25, 21],
    rooms: [
      [1, 13, 7, 6],
      [1, 1, 7, 6],
      [9, 6, 7, 9],
      [17, 1, 6, 6],
      [17, 13, 6, 6],
    ],
    links: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 0],
    ],
    start: [2, 17],
    exit: [21, 2],
    enemies: "NNNQLL",
    portals: 4,
    vents: 5,
    stock: true,
    shape: "RADIO NETWORK",
  },
  18: {
    size: [25, 21],
    rooms: [
      [1, 13, 9, 6],
      [1, 1, 7, 6],
      [9, 5, 7, 8],
      [17, 1, 6, 6],
      [16, 14, 7, 5],
    ],
    links: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 0],
    ],
    start: [2, 17],
    exit: [21, 16],
    enemies: "QQLNNR",
    portals: 2,
    vents: 6,
    gates: true,
    stock: true,
    shape: "THE LAST DETOUR",
  },
  19: {
    size: [25, 22],
    rooms: [
      [5, 1, 17, 13],
      [1, 15, 8, 5],
      [15, 15, 8, 5],
    ],
    links: [
      [0, 1],
      [0, 2],
      [1, 2],
    ],
    start: [2, 18],
    exit: [13, 2],
    boss: [13, 7],
    enemies: "NQLR",
    portals: 4,
    vents: 4,
    stock: true,
    shape: "SHELF CONTROL CORE",
  },
};
const steps = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];
const key = (x, z) => `${x},${z}`;
function random(seed) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = Math.imul(state ^ (state >>> 15), state | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function distances(grid, start) {
  const found = new Map([[key(...start), 0]]),
    queue = [start];
  for (let i = 0; i < queue.length; i++) {
    const [x, z] = queue[i];
    for (const [dx, dz] of steps) {
      const a = x + dx,
        b = z + dz,
        k = key(a, b);
      if (grid[b]?.[a] !== "." || found.has(k)) continue;
      found.set(k, found.get(key(x, z)) + 1);
      queue.push([a, b]);
    }
  }
  return found;
}
export function floorplan(index, seed = DEFAULT_SEED) {
  const plan = plans[index];
  if (!plan) return null;
  const rng = random(seed ^ Math.imul(index + 1, 2654435761));
  const [width, height] = plan.size;
  const grid = Array.from({ length: height }, () => Array(width).fill(" "));
  const carve = (x, z, w, h) => {
    for (let b = z; b < z + h; b++)
      for (let a = x; a < x + w; a++) grid[b][a] = ".";
  };
  for (const room of plan.rooms) carve(...room);
  for (const [a, b] of plan.links) {
    const c = plan.rooms[a],
      d = plan.rooms[b];
    let x = c[0] + Math.floor(c[2] / 2),
      z = c[1] + Math.floor(c[3] / 2);
    const endX = d[0] + Math.floor(d[2] / 2),
      endZ = d[1] + Math.floor(d[3] / 2);
    const horizontalFirst = rng() > 0.5;
    for (const axis of horizontalFirst ? [0, 1] : [1, 0]) {
      while (axis === 0 ? x !== endX : z !== endZ) {
        carve(x, z, 1, 1);
        if (axis === 0) x += Math.sign(endX - x);
        else z += Math.sign(endZ - z);
      }
    }
  }
  if (plan.belts) {
    carve(19, 4, 2, 4);
    carve(1, 10, 2, 4);
  }
  const protectedCell = (x, z) =>
    [plan.start, plan.exit, plan.boss]
      .filter(Boolean)
      .some(
        ([a, b]) =>
          Math.hypot(x - a, z - b) <
          (plan.boss && a === plan.boss[0] && b === plan.boss[1] ? 3.8 : 2.2),
      );
  // Accept cover only when it keeps the whole floor connected, including narrow bridges.
  for (const [rx, rz, rw, rh] of plan.rooms) {
    for (let attempt = 0; attempt < Math.floor((rw * rh) / 11); attempt++) {
      const x = rx + 1 + Math.floor(rng() * Math.max(1, rw - 3));
      const z = rz + 1 + Math.floor(rng() * Math.max(1, rh - 3));
      if (
        protectedCell(x, z) ||
        grid[z][x] !== "." ||
        (plan.belts && z === rz + 1)
      )
        continue;
      grid[z][x] = "#";
      const count = grid.flat().filter((c) => c === ".").length;
      if (distances(grid, plan.start).size !== count) grid[z][x] = ".";
    }
  }
  const routes = distances(grid, plan.start);
  const cells = [...routes].map(([k, distance]) => ({
    p: k.split(",").map(Number),
    distance,
    noise: rng(),
  }));
  const reserved = [plan.start, plan.exit, plan.boss].filter(Boolean);
  const put = (p, char) => {
    grid[p[1]][p[0]] = char;
    reserved.push(p);
  };
  const choose = (char, desired, spacing = 2) => {
    const options = cells.filter(
      ({ p: [x, z] }) =>
        grid[z][x] === "." &&
        (char !== "P" ||
          [-1, 0, 1].every((dz) =>
            [-1, 0, 1].every(
              (dx) =>
                grid[z + dz]?.[x + dx] &&
                !["#", " "].includes(grid[z + dz][x + dx]),
            ),
          )) &&
        reserved.every(([a, b]) => Math.hypot(a - x, b - z) >= spacing),
    );
    options.sort(
      (a, b) =>
        Math.abs(a.distance - desired) +
        a.noise * 3 -
        Math.abs(b.distance - desired) -
        b.noise * 3,
    );
    if (options[0]) put(options[0].p, char);
  };
  put(plan.start, "S");
  put(plan.exit, "X");
  if (plan.boss) put(plan.boss, "M");
  choose("V", 3, 1);
  const longest = Math.max(...routes.values());
  // Pads belong in open rooms, with an ordinary walking route around every edge.
  for (let i = 0; i < (plan.portals || 0); i++)
    choose("P", longest * (i % 2 ? 0.88 : 0.2) + Math.floor(i / 2) * 4, 2);
  choose("B", 5);
  choose("B", longest * 0.55);
  choose("B", longest * 0.9);
  choose("H", longest * 0.3);
  choose("H", longest * 0.8);
  for (let n = 0; n < plan.enemies.length; n++)
    choose(
      plan.enemies[n],
      8 + ((longest - 8) * (n + 0.5)) / plan.enemies.length,
      3,
    );
  if (plan.gates) {
    for (const {
      p: [x, z],
      distance,
    } of cells) {
      if (distance < 6 || grid[z][x] !== ".") continue;
      if (
        (grid[z - 1]?.[x] === " " && grid[z + 1]?.[x] === " ") ||
        (grid[z]?.[x - 1] === " " && grid[z]?.[x + 1] === " ")
      ) {
        if (reserved.every(([a, b]) => Math.hypot(x - a, z - b) > 4))
          put([x, z], "G");
      }
    }
  }
  if (plan.gates && !grid.flat().includes("G")) choose("G", longest * 0.55, 2);
  if (plan.belts)
    for (let lane = 0; lane < 3; lane++) {
      const z = 2 + lane * 6;
      for (let x = 2; x < 20; x++)
        if (grid[z][x] === ".") grid[z][x] = lane === 1 ? "<" : ">";
    }
  // Hazard tiles never replace supplies, spawns or transit pads.
  for (let i = 0; i < (plan.vents || 0); i++)
    choose("!", 9 + ((longest - 9) * (i + 0.5)) / plan.vents, 2);
  if (plan.stock) {
    choose("C", 6, 2);
    choose("C", longest * 0.65, 2);
    choose("F", longest * 0.35, 2);
    choose("F", longest * 0.8, 2);
  }
  // Empty space remains empty: only the perimeter gets physical boundary fixtures.
  const wallCells = [];
  for (let z = 0; z < height; z++)
    for (let x = 0; x < width; x++)
      if (grid[z][x] === " ") {
        if (
          steps.some(
            ([dx, dz]) =>
              grid[z + dz]?.[x + dx] &&
              ![" ", "#"].includes(grid[z + dz][x + dx]),
          )
        )
          wallCells.push([x, z]);
      }
  for (const [x, z] of wallCells) grid[z][x] = "#";
  return { map: grid.map((row) => row.join("")), shape: plan.shape };
}
