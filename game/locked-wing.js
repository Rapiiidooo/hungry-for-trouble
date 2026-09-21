import { carveRoom } from "./floor-shapes.js";
import { KEY_TYPES } from "./locks.js";

// Each locked edge is the sole crossing between its two rooms; spare edges use the same key.
const PLANS = [
  {
    shape: "RED TAPE",
    rooms: [
      [5, 15],
      [5, 5],
      [15, 15],
      [25, 15],
    ],
    links: [
      [0, 1],
      [0, 2, 0],
      [2, 3],
    ],
    keys: [1],
    start: 0,
    exit: 3,
    guards: [
      [1, "R"],
      [2, "Q"],
      [3, "R"],
    ],
  },
  {
    shape: "DOUBLE DOGLEG",
    rooms: [
      [5, 15],
      [5, 5],
      [15, 15],
      [15, 5],
      [25, 5],
      [25, 15],
    ],
    links: [
      [0, 1],
      [0, 2, 0],
      [1, 3, 0],
      [2, 3],
      [3, 4, 1],
      [4, 5],
      [2, 5, 1],
    ],
    keys: [1, 3],
    start: 0,
    exit: 5,
    guards: [
      [1, "R"],
      [2, "Q"],
      [3, "L"],
      [4, "N"],
      [5, "E"],
    ],
    vents: [2, 4],
  },
  {
    shape: "FROZEN FORK",
    rooms: [
      [15, 25],
      [5, 25],
      [5, 15],
      [15, 15],
      [25, 15],
      [25, 5],
      [15, 5],
    ],
    links: [
      [0, 1],
      [0, 3, 0],
      [3, 2],
      [3, 4, 1],
      [4, 5],
      [3, 6, 2],
      [5, 6, 2],
    ],
    keys: [1, 2, 5],
    start: 0,
    exit: 6,
    guards: [
      [1, "A"],
      [2, "R"],
      [3, "Q"],
      [4, "N"],
      [5, "L"],
      [6, "R"],
    ],
  },
  {
    shape: "CROSS VAULT",
    rooms: [
      [15, 15],
      [15, 5],
      [5, 15],
      [25, 15],
      [15, 25],
      [25, 5],
      [5, 25],
    ],
    links: [
      [0, 1],
      [0, 2, 0],
      [0, 3, 1],
      [0, 4, 2],
      [1, 5, 3],
      [3, 5, 3],
      [2, 6],
      [6, 4, 2],
    ],
    keys: [1, 2, 3, 4],
    start: 0,
    exit: 5,
    pads: [0, 1],
    guards: [
      [1, "N"],
      [2, "L"],
      [3, "Q"],
      [4, "R"],
      [5, "N"],
      [6, "A"],
    ],
    vents: [2, 3, 4, 6],
  },
  {
    shape: "THE MASTER VAULT",
    rooms: [
      [5, 25],
      [5, 15],
      [5, 5],
      [15, 5],
      [25, 5],
      [25, 15],
      [25, 25],
      [15, 25],
      [15, 15],
    ],
    links: [
      [0, 1],
      [1, 2, 0],
      [2, 3],
      [3, 4, 1],
      [4, 5],
      [5, 6, 2],
      [6, 7],
      [7, 8, 3],
    ],
    keys: [1, 3, 5, 7],
    start: 0,
    exit: 8,
    boss: 8,
    guards: [
      [1, "Q"],
      [2, "N"],
      [3, "R"],
      [4, "L"],
      [5, "Q"],
      [6, "N"],
      [7, "R"],
    ],
    vents: [2, 4, 6],
  },
];
const directions = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

export function lockedFloorplan(index, seed) {
  const plan = PLANS[index - 20];
  if (!plan) return null;
  let value = (seed ^ Math.imul(index + 1, 2654435761)) >>> 0;
  const random = () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    return value / 4294967296;
  };
  const width = Math.max(...plan.rooms.map(([x]) => x)) + 6;
  const height = Math.max(...plan.rooms.map(([, z]) => z)) + 6;
  const grid = Array.from({ length: height }, () => Array(width).fill(" "));
  const carve = (x, z) => {
    grid[z][x] = ".";
  };
  plan.rooms.forEach(([x, z], i) => {
    const radius = i === plan.boss ? 4 : 3;
    const shapes = ["round", "octagon", "diamond"];
    carveRoom(
      carve,
      [x - radius, z - radius, radius * 2 + 1, radius * 2 + 1],
      i === plan.boss ? "octagon" : shapes[(index + i) % shapes.length],
    );
  });
  const doors = [];
  for (const [a, b, color] of plan.links) {
    const [ax, az] = plan.rooms[a],
      [bx, bz] = plan.rooms[b];
    const dx = Math.sign(bx - ax),
      dz = Math.sign(bz - az);
    for (let x = ax, z = az; x !== bx || z !== bz; x += dx, z += dz)
      carve(x, z);
    if (color !== undefined)
      doors.push({ x: (ax + bx) / 2, z: (az + bz) / 2, color });
  }
  const connected = () => {
    const queue = [plan.rooms[plan.start]],
      seen = new Set();
    for (let i = 0; i < queue.length; i++) {
      const [x, z] = queue[i],
        id = `${x},${z}`;
      if (seen.has(id) || grid[z]?.[x] !== ".") continue;
      seen.add(id);
      for (const [dx, dz] of directions) queue.push([x + dx, z + dz]);
    }
    return seen.size === grid.flat().filter((c) => c === ".").length;
  };
  // Keep the central cross clear, and reject cover that strands even one floor tile.
  for (const [i, [cx, cz]] of plan.rooms.entries()) {
    if (i === plan.boss || plan.pads?.includes(i)) continue;
    for (let n = 0; n < 3; n++) {
      const x = cx + Math.floor(random() * 5) - 2,
        z = cz + Math.floor(random() * 5) - 2;
      if (x === cx || z === cz || grid[z][x] !== ".") continue;
      grid[z][x] = "#";
      if (!connected()) grid[z][x] = ".";
    }
  }
  const put = ([x, z], char) => {
    grid[z][x] = char;
  };
  put(plan.rooms[plan.start], "S");
  const end = plan.rooms[plan.exit];
  put(plan.boss === undefined ? end : [end[0], end[1] - 3], "X");
  if (plan.boss !== undefined) put([end[0], end[1] - 1], "M");
  for (const door of doors) put([door.x, door.z], KEY_TYPES[door.color].door);
  const supply = (room, char, distant = false) => {
    const [cx, cz] = plan.rooms[room],
      cells = [];
    for (let z = cz - 2; z <= cz + 2; z++)
      for (let x = cx - 2; x <= cx + 2; x++)
        if (
          grid[z][x] === "." &&
          (x !== cx || z !== cz) &&
          (char !== "P" ||
            [-1, 0, 1].every((dz) =>
              [-1, 0, 1].every(
                (dx) => !["#", " ", undefined].includes(grid[z + dz]?.[x + dx]),
              ),
            ))
        )
          cells.push({
            p: [x, z],
            rank: random() + (distant ? Math.hypot(x - cx, z - cz) : 0),
          });
    cells.sort((a, b) => b.rank - a.rank);
    if (!cells.length)
      throw new Error("Locked wing supply room has no free cell");
    put(cells[0].p, char);
  };
  for (const [color, room] of plan.keys.entries())
    supply(room, KEY_TYPES[color].tile, true);
  for (const [room, char] of plan.guards) supply(room, char, true);
  for (const room of [plan.start, plan.keys.at(-1), plan.exit])
    supply(room, "B");
  for (const room of [
    plan.start,
    ...plan.keys.filter((_, i) => i % 2 === 0),
    plan.exit,
  ])
    supply(room, "H");
  supply(plan.start, "V");
  supply(plan.keys.at(-1), "V");
  for (const room of [plan.start, plan.exit]) supply(room, "C");
  for (const room of plan.keys) supply(room, "F");
  for (const room of plan.pads || []) supply(room, "P");
  for (const room of plan.vents || []) supply(room, "!");
  const perimeter = [];
  for (let z = 0; z < height; z++)
    for (let x = 0; x < width; x++)
      if (
        grid[z][x] === " " &&
        directions.some(([dx, dz]) => {
          const char = grid[z + dz]?.[x + dx];
          return char && char !== " " && char !== "#";
        })
      )
        perimeter.push([x, z]);
  for (const point of perimeter) put(point, "#");
  return { map: grid.map((row) => row.join("")), shape: plan.shape };
}
