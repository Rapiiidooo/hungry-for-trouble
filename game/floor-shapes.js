// Tile masks shape the playable floor; scenery still uses the selected recipe assets.
export function carveRoom(carve, room, kind = "box") {
  const [x, z, w, h] = room;
  for (let b = 0; b < h; b++)
    for (let a = 0; a < w; a++) {
      const u = Math.abs((a + 0.5 - w / 2) / (w / 2));
      const v = Math.abs((b + 0.5 - h / 2) / (h / 2));
      const inside =
        kind === "round"
          ? u * u + v * v < 1
          : kind === "diamond"
            ? u + v < 1.3
            : kind === "cross"
              ? u < 0.46 || v < 0.46
              : kind === "octagon"
                ? u + v < 1.52
                : true;
      if (inside) carve(x + a, z + b, 1, 1);
    }
}

export function carveSpecial(index, grid, carve) {
  const oval = (x, z, cx, cz, rx, rz) =>
    ((x - cx) / rx) ** 2 + ((z - cz) / rz) ** 2;
  const masks = {
    2: (x, z) => {
      const d = oval(x, z, 11, 8.5, 10, 7.3);
      return d < 1 && d > 0.23;
    },
    5: (x, z) =>
      [
        [7, 5],
        [15, 5],
        [7, 12],
        [15, 12],
      ].some(([a, b]) => oval(x, z, a, b, 5.8, 4.7) < 1),
    6: (x, z) => {
      const d = oval(x, z, 11, 9, 10, 8);
      return d < 1 && d > 0.28 && !(z < 9 && x > 8 && x < 14);
    },
    11: (x, z) =>
      [6.5, 16.5].some((a) => {
        const d = oval(x, z, a, 9.5, 5.8, 8);
        return d < 1 && d > 0.16;
      }),
  };
  if (masks[index]) {
    for (let z = 1; z < grid.length - 1; z++)
      for (let x = 1; x < grid[0].length - 1; x++)
        if (masks[index](x, z)) carve(x, z, 1, 1);
    return true;
  }
  if (index === 12) {
    const corners = [
      [2, 16],
      [22, 16],
      [22, 2],
      [2, 2],
      [2, 11],
      [17, 11],
      [17, 6],
      [7, 6],
    ];
    for (let i = 1; i < corners.length; i++) {
      const [a, b] = corners[i - 1],
        [c, d] = corners[i];
      carve(
        Math.min(a, c) - 1,
        Math.min(b, d) - 1,
        Math.abs(c - a) + 3,
        Math.abs(d - b) + 3,
      );
    }
    return true;
  }
  return false;
}

export const ROOM_SHAPES = {
  1: ["octagon", "diamond", "round"],
  3: ["diamond", "round", "round", "octagon", "octagon"],
  7: ["diamond", "round", "diamond", "round", "diamond"],
  9: ["octagon", "round", "octagon"],
  10: ["round", "cross", "octagon", "round"],
  13: ["diamond", "diamond", "diamond", "diamond", "round"],
  14: ["round", "octagon", "octagon"],
  15: ["round", "diamond", "cross", "diamond", "round"],
  17: ["round", "round", "diamond", "round", "round"],
  18: ["octagon", "diamond", "cross", "round", "octagon"],
  19: ["diamond", "round", "round"],
};
