export const CELL = 2;

const first = [
  "#################",
  "#B....#...E....B#",
  "#.##..#.###.##..#",
  "#...E...........#",
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
    tagline: "Your resignation has been violently declined.",
  },
];

// Put the first visor on the route out of the starting corridor, before combat escalates.
LEVELS[1] = {
  ...LEVELS[1],
  map: freezer.map((row, i) => (i === 9 ? "#V..#.......#...#" : row)),
};
LEVELS[3] = {
  ...LEVELS[3],
  map: rush.map((row, i) => (i === 6 ? "#.....VB.B......#" : row)),
};

export function layoutFor(index) {
  const level = LEVELS[index];
  const width = level.map[0].length,
    height = level.map.length;
  const walls = [],
    crumbs = [],
    batteries = [],
    enemies = [],
    gates = [],
    visors = [],
    belts = [];
  let start, exit, boss;
  for (let z = 0; z < height; z++)
    for (let x = 0; x < width; x++) {
      const char = level.map[z][x];
      const position = { x: x * CELL, z: z * CELL };
      if (char === "#") walls.push({ ...position, col: x, row: z });
      else {
        if (char === "S") start = position;
        if (char === "X") exit = position;
        if (char === "B")
          batteries.push({ ...position, collected: false, respawn: 0 });
        if (["E", "A", "R", "T"].includes(char))
          enemies.push({
            ...position,
            kind: { E: "hunter", A: "ambusher", R: "shooter", T: "armoured" }[
              char
            ],
          });
        if (char === "V")
          visors.push({ ...position, collected: false, respawn: 0 });
        if (char === ">" || char === "<")
          belts.push({ ...position, direction: char === ">" ? 1 : -1 });
        if (char === "G")
          gates.push({ ...position, col: x, row: z, phase: gates.length % 2 });
        if (char === "M") boss = position;
        if (!["S", "X", "B", "G", "M", "V"].includes(char))
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
    belts,
    start,
    exit,
    boss,
  };
}
