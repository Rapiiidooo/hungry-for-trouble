import { floorplan, DEFAULT_SEED } from "./floorplans.js";

export const CELL = 2;

const first = [
  "#################",
  "#B....#...E....B#",
  "#.##..#.###.##..#",
  "#...E....H......#",
  "#.###.#####.###.#",
  "#.....#...#.....#",
  "###.#.#.#.#.#.###",
  "#...#...#...#...#",
  "#.###.#####.###.#",
  "#...............#",
  "#.##..#.###.##..#",
  "#S....#..X...A.B#",
  "#################",
];
const freezer = [
  "#################",
  "#B....E.#......B#",
  "#.###...#.###...#",
  "#...#.......#...#",
  "#...###...###...#",
  "#E......#.......#",
  "#.#####.#.#####.#",
  "#.......#......A#",
  "#...###...###...#",
  "#...#.......#...#",
  "#.###...#.###...#",
  "#S.....B#...X..B#",
  "#################",
];
const warehouse = [
  "#################",
  "#B....E.........#",
  "#.###.#####.###.#",
  "#...#...G...#...#",
  "#.#.###.#.###.#.#",
  "#.#.....#.....#B#",
  "#.G.###.#.###.G.#",
  "#.#.....#.....#.#",
  "#.#.###.#.###.#.#",
  "#...#...G...#...#",
  "#.###.#####.###.#",
  "#S....A..X....EB#",
  "#################",
];
const rush = [
  "#################",
  "#B....A...E....B#",
  "#..##..###..##..#",
  "#..##.......##..#",
  "#E.....#.#.....A#",
  "#.####.#.#.####.#",
  "#......B.B......#",
  "#.####.#.#.####.#",
  "#A.....#.#.....E#",
  "#..##.......##..#",
  "#..##..###..##..#",
  "#S......X......B#",
  "#################",
];
const finale = [
  "#################",
  "#B.............B#",
  "#..###.....###..#",
  "#..#.........#..#",
  "#..#.........#..#",
  "#.......M.......#",
  "#...............#",
  "#..#.........#..#",
  "#..#.........#..#",
  "#..###.....###..#",
  "#.....E...A.....#",
  "#S.....BX......B#",
  "#################",
];

const foodCourt = [
  "#################",
  "#B.....R.......B#",
  "#..##.....##....#",
  "#..##..V..##..R.#",
  "#...............#",
  "#.##..###..##...#",
  "#.....#.#.......#",
  "#...##...##..##.#",
  "#R..............#",
  "#..##.....##....#",
  "#..##..E..##....#",
  "#S.....B.....X.B#",
  "#################",
];
const dock = [
  "#################",
  "#B..R..#...T...B#",
  "#..##..#..##....#",
  "#..##..G..##..R.#",
  "#......#........#",
  "#.###..#..###...#",
  "#...G..V..G.....#",
  "#.###..#..###...#",
  "#......#......T.#",
  "#..##..G..##....#",
  "#..##..#..##....#",
  "#S.....#B.....X.#",
  "#################",
];
const deepFreeze = [
  "#################",
  "#B....#..R.....B#",
  "#..#..#..###....#",
  "#..#.....#...#..#",
  "#..###...#...#..#",
  "#R.....V...#....#",
  "#..###...###....#",
  "#....#.......R..#",
  "#..#...###...#..#",
  "#..#.....#...#..#",
  "#..###...#......#",
  "#S....A..X..T..B#",
  "#################",
];
const express = [
  "#################",
  "#B...R....R....B#",
  "#..##..##..##...#",
  "#>>>>>>>>>>>>>>>#",
  "#..##..##..##...#",
  "#T.............A#",
  "#..##..V...##...#",
  "#A.............T#",
  "#..##..##..##...#",
  "#<<<<<<<<<<<<<<<#",
  "#..##..##..##...#",
  "#S.....B...R..XB#",
  "#################",
];
const director = [
  "#################",
  "#B.....X.......B#",
  "#..##.......##..#",
  "#..##.......##..#",
  "#...............#",
  "#.......M.......#",
  "#...............#",
  "#..##.......##..#",
  "#..##..V.B..##..#",
  "#R.............R#",
  "#.....T...A.....#",
  "#S.....B.......B#",
  "#################",
];

export const LEVELS = [
  {
    name: "Cereal Situation",
    department: "AISLE 01 · BREAKFAST & REGRETS",
    theme: "warm",
    map: first,
    quota: 38,
    time: 110,
    speed: 2.65,
    tagline: "Clean the aisles. Avoid becoming a cleaning product.",
  },
  {
    name: "Cold Storage",
    department: "AISLE 02 · FROZEN ASSETS",
    theme: "ice",
    map: freezer,
    quota: 46,
    time: 120,
    speed: 3.1,
    tagline: "Slippery floors. Very frosty colleagues.",
  },
  {
    name: "Return to Sender",
    department: "AISLE 03 · DISPATCH & DESPAIR",
    theme: "warehouse",
    map: warehouse,
    quota: 48,
    time: 130,
    speed: 3.2,
    tagline: "Watch the shutters. They do not watch you.",
  },
  {
    name: "Snack Attack",
    department: "AISLE 04 · UNEXPECTED ITEMS",
    theme: "rush",
    map: rush,
    quota: 60,
    time: 140,
    speed: 3.5,
    tagline: "Six angry colleagues. Batteries in the middle. Go get them.",
  },
  {
    name: "The Manager",
    department: "AISLE 05 · CUSTOMER DISSERVICE",
    theme: "boss",
    map: finale,
    quota: 30,
    time: 150,
    speed: 3.1,
    tagline: "Someone would like to speak to you.",
  },
  {
    name: "Food Fight",
    department: "AISLE 06 · RECEIPTS WILL FLY",
    theme: "food",
    map: foodCourt,
    quota: 62,
    time: 150,
    speed: 3.5,
    tagline: "Drones print complaints. Duck behind the shelves.",
  },
  {
    name: "Heavy Delivery",
    department: "AISLE 07 · FRAGILE EGOS",
    theme: "dock",
    map: dock,
    quota: 58,
    time: 165,
    speed: 3.65,
    tagline: "Armoured trolleys. Moving shutters. No fragile stickers.",
  },
  {
    name: "Brain Freeze",
    department: "AISLE 08 · COLD CALLING",
    theme: "ice",
    map: deepFreeze,
    quota: 64,
    time: 165,
    speed: 3.7,
    tagline: "Brake before the corners. The drones certainly won't.",
  },
  {
    name: "Express Distress",
    department: "AISLE 09 · KEEP IT MOVING",
    theme: "conveyor",
    map: express,
    quota: 70,
    time: 170,
    speed: 3.85,
    tagline: "Ride the belts. Dodge the receipts. Almost free.",
  },
  {
    name: "Exit Interview",
    department: "AISLE 10 · THE DIRECTOR",
    theme: "director",
    map: director,
    quota: 40,
    time: 210,
    speed: 3.6,
    tagline: "Beat the Director. Get MOP-3 to the checkout.",
  },
  {
    name: "Hot Under the Collar",
    department: "AISLE 11 · BOILER ROOM",
    theme: "boiler",
    quota: 64,
    time: 170,
    speed: 3.7,
    tagline:
      "Steam flashes amber before it burns. Dash when the floor turns red.",
  },
  {
    name: "Returns to Nowhere",
    department: "AISLE 12 · LOST PROPERTY",
    theme: "transit",
    quota: 68,
    time: 170,
    speed: 3.75,
    tagline:
      "Matching transport pads connect. Step off before using one again.",
  },
  {
    name: "Expiry Date",
    department: "AISLE 13 · EXPLOSIVE OFFERS",
    theme: "packing",
    quota: 70,
    time: 180,
    speed: 3.8,
    tagline: "Mine layers leave bad surprises. Shoot a mine before it arms.",
  },
  {
    name: "No Refunds",
    department: "AISLE 14 · SECURITY DESK",
    theme: "security",
    quota: 70,
    time: 185,
    speed: 3.8,
    tagline:
      "Shield carts block frontal shots. Flank them or chase them in Overtime.",
  },
  {
    name: "The Foreman",
    department: "AISLE 15 · FIRE THE BOSS",
    theme: "boiler",
    quota: 36,
    time: 230,
    speed: 3.6,
    bossKind: "foreman",
    tagline: "Leave the marked floor. Attack while the Foreman cools down.",
  },
  {
    name: "Cold Connection",
    department: "AISLE 16 · BELOW ZERO",
    theme: "ice",
    quota: 72,
    time: 190,
    speed: 3.85,
    tagline:
      "Two pairs of transport pads. Slippery bridges. Take the shortcut.",
  },
  {
    name: "Special Delivery",
    department: "AISLE 17 · SORTING OFFICE",
    theme: "conveyor",
    quota: 74,
    time: 190,
    speed: 3.9,
    tagline: "Ride the belts, push stock carts and leave the mines behind.",
  },
  {
    name: "Dead Air",
    department: "AISLE 18 · RADIO SILENCE",
    theme: "transit",
    quota: 76,
    time: 195,
    speed: 3.9,
    tagline: "Snipers lock a red line. Break their sight or dodge sideways.",
  },
  {
    name: "Final Final Notice",
    department: "AISLE 19 · NO WAY BACK",
    theme: "packing",
    quota: 78,
    time: 200,
    speed: 3.95,
    tagline: "The whole store is against you. Make the stock fight back.",
  },
  {
    name: "Shelf Destruction",
    department: "AISLE 20 · SHELF CONTROL",
    theme: "core",
    quota: 42,
    time: 250,
    speed: 3.8,
    bossKind: "core",
    tagline:
      "Unplug the real boss. Get every robot out. No employee left behind.",
  },
];

for (let index = 0; index < LEVELS.length; index++) {
  const generated = floorplan(index);
  if (generated) LEVELS[index] = { ...LEVELS[index], ...generated };
}
LEVELS[4].map = finale.map((row, z) =>
  z === 9 ? row.slice(0, 8) + "H" + row.slice(9) : row,
);
LEVELS[0].shape = "FIRST SHIFT";
LEVELS[4].shape = "MANAGER'S OFFICE";

export function layoutFor(index, seed = DEFAULT_SEED) {
  const generated = floorplan(index, seed);
  const level = { ...LEVELS[index], ...generated };
  const width = level.map[0].length,
    height = level.map.length;
  const walls = [],
    crumbs = [],
    batteries = [],
    enemies = [],
    gates = [],
    visors = [],
    belts = [],
    repairs = [],
    portals = [],
    vents = [],
    stock = [];
  let start, exit, boss;
  for (let z = 0; z < height; z++)
    for (let x = 0; x < width; x++) {
      const char = level.map[z][x];
      const position = { x: x * CELL, z: z * CELL };
      if (char === "#") walls.push({ ...position, col: x, row: z });
      else if (char !== " ") {
        if (char === "S") start = position;
        if (char === "X") exit = position;
        if (char === "B")
          batteries.push({ ...position, collected: false, respawn: 0 });
        if (["E", "A", "R", "T", "N", "L", "Q"].includes(char))
          enemies.push({
            ...position,
            kind: {
              E: "hunter",
              A: "ambusher",
              R: "shooter",
              T: "armoured",
              N: "sniper",
              L: "layer",
              Q: "shieldcart",
            }[char],
          });
        if (char === "H")
          repairs.push({ ...position, collected: false, respawn: 0 });
        if (char === "V")
          visors.push({ ...position, collected: false, respawn: 0 });
        if (char === ">" || char === "<")
          belts.push({ ...position, direction: char === ">" ? 1 : -1 });
        if (char === "G")
          gates.push({ ...position, col: x, row: z, phase: gates.length % 2 });
        if (char === "M") boss = position;
        if (char === "P") portals.push({ ...position });
        if (char === "!")
          vents.push({ ...position, phase: vents.length * 1.35 });
        if (char === "C" || char === "F")
          stock.push({
            ...position,
            kind: char === "C" ? "cart" : "flour",
            hp: 2,
            vx: 0,
            vz: 0,
            cooldown: 0,
            cloud: 0,
            broken: false,
            hits: [],
          });
        if (
          !["S", "X", "B", "G", "M", "V", "H", "P", "!", "C", "F"].includes(
            char,
          )
        )
          crumbs.push({ ...position, collected: false });
      }
    }
  return {
    level,
    width,
    height,
    walls,
    crumbs,
    batteries,
    enemies,
    gates,
    visors,
    repairs,
    belts,
    portals: portals.map((p, i) => ({
      ...p,
      pair: Math.floor(i / 2),
      target: i ^ 1,
    })),
    vents,
    stock,
    start,
    exit,
    boss,
  };
}
