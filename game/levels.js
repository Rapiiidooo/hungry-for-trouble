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
];

export function layoutFor(index) {
  const level = LEVELS[index];
  const width = level.map[0].length,
    height = level.map.length;
  const walls = [],
    crumbs = [],
    batteries = [],
    enemies = [],
    gates = [];
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
        if (char === "E" || char === "A")
          enemies.push({
            ...position,
            kind: char === "E" ? "hunter" : "ambusher",
          });
        if (char === "G")
          gates.push({ ...position, col: x, row: z, phase: gates.length % 2 });
        if (char === "M") boss = position;
        if (!["S", "X", "B", "G", "M"].includes(char))
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
    start,
    exit,
    boss,
  };
}
