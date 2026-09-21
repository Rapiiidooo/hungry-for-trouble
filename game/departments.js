import * as THREE from "three";

const PALETTES = {
  warm: {
    name: "CRUNCH TIME",
    note: "BREAKFAST, WITH CONSEQUENCES",
    pattern: "breakfast",
    floor: [0x747c86, 0xadb4ba],
    trim: 0xb83d2b,
    body: 0xe0ddd7,
    glass: 0xc4b4a1,
    stock: 0xc38248,
    key: 0xf3f4ef,
    fill: 0xb9c7d9,
    sky: 0x302d37,
  },
  ice: {
    name: "DEEP FREEZE",
    note: "COLD FOOD. COLDER MANAGEMENT.",
    pattern: "ice",
    floor: [0x6c97b8, 0x8eacc2],
    trim: 0x315d87,
    body: 0xd2e3eb,
    glass: 0x82b5c9,
    stock: 0x6c8fb8,
    key: 0xd2ebff,
    fill: 0x95bad5,
    sky: 0x253c56,
  },
  warehouse: {
    name: "RETURN TO SENDER",
    note: "HANDLE WITH DESPAIR",
    pattern: "cargo",
    floor: [0x666d75, 0x7c8388],
    trim: 0xd29c48,
    body: 0x667485,
    glass: 0x9b805e,
    stock: 0xb79465,
    key: 0xffead2,
    fill: 0xb4c2d6,
    sky: 0x202b3b,
  },
  rush: {
    name: "PANIC BUY",
    note: "EVERYTHING MUST GO. INCLUDING YOU.",
    pattern: "sale",
    floor: [0xb39191, 0x8d737d],
    trim: 0xb83d2b,
    body: 0xebdddd,
    glass: 0xba95a5,
    stock: 0xe0a075,
    key: 0xffe0d9,
    fill: 0xc5bdd7,
    sky: 0x362b3e,
  },
  food: {
    name: "FOOD FIGHT",
    note: "PLEASE DO NOT FEED THE STAFF",
    pattern: "breakfast",
    floor: [0xad9381, 0x836d65],
    trim: 0xb83d2b,
    body: 0xe3dcd6,
    glass: 0xb9a18d,
    stock: 0xcc8a58,
    key: 0xffe1c2,
    fill: 0xc1cbd5,
    sky: 0x322b32,
  },
  dock: {
    name: "LOADING BAY",
    note: "YOUR PACKAGE IS ANGRY",
    pattern: "cargo",
    floor: [0x667280, 0x889198],
    trim: 0xd0a151,
    body: 0x677c8c,
    glass: 0x978264,
    stock: 0xb49465,
    key: 0xffe4c8,
    fill: 0xa7bfd8,
    sky: 0x222e40,
  },
  conveyor: {
    name: "EXPRESS DISTRESS",
    note: "SAME DAY. WORSE SERVICE.",
    pattern: "cargo",
    floor: [0x727d88, 0x929ba0],
    trim: 0xd4a252,
    body: 0xd2d9dd,
    glass: 0x72899a,
    stock: 0xb49a7c,
    key: 0xe2edff,
    fill: 0xabbfd9,
    sky: 0x28364b,
  },
  boss: {
    name: "COMPLAINTS",
    note: "PLEASE TAKE A NUMBER",
    pattern: "office",
    floor: [0x8a737d, 0xa59399],
    trim: 0xb83d2b,
    body: 0xdcdde0,
    glass: 0x846d7c,
    stock: 0x9d8b83,
    key: 0xffd9cc,
    fill: 0xbdc4dc,
    sky: 0x31293b,
  },
  director: {
    name: "MANAGEMENT",
    note: "OPEN DOOR. CLOSED MINDS.",
    pattern: "office",
    floor: [0x64788a, 0x8896a2],
    trim: 0xbb9350,
    body: 0xd7dce0,
    glass: 0x678097,
    stock: 0x9a8670,
    key: 0xffe8d0,
    fill: 0xb4c8e0,
    sky: 0x212c40,
  },
  boiler: {
    name: "UNDER PRESSURE",
    note: "OVERTIME IS A FIRE HAZARD",
    pattern: "cargo",
    floor: [0x886d5f, 0x657078],
    trim: 0xbd7146,
    body: 0x847867,
    glass: 0x937058,
    stock: 0xc28958,
    key: 0xffcfad,
    fill: 0xaab7d0,
    sky: 0x322b32,
  },
  transit: {
    name: "LOST & FOUND",
    note: "MOSTLY LOST",
    pattern: "office",
    floor: [0x7382a0, 0x999caf],
    trim: 0x657da8,
    body: 0xd7dce8,
    glass: 0x7d90b3,
    stock: 0x9c96b6,
    key: 0xe2e6ff,
    fill: 0xa4b5d6,
    sky: 0x293248,
  },
  packing: {
    name: "BAD PACKAGES",
    note: "NO RETURNS. NO SURVIVORS.",
    pattern: "cargo",
    floor: [0x8c7e67, 0xa39984],
    trim: 0xbf934a,
    body: 0xa18d73,
    glass: 0x927a5c,
    stock: 0xc1a173,
    key: 0xffe3bb,
    fill: 0xbac5d4,
    sky: 0x302e35,
  },
  security: {
    name: "SECURITY",
    note: "YOU ARE THE UNEXPECTED ITEM",
    pattern: "office",
    floor: [0x77839a, 0x929cab],
    trim: 0x776c91,
    body: 0xc6ccdb,
    glass: 0x78879f,
    stock: 0x9d8baf,
    key: 0xe7e3ff,
    fill: 0xadb9d6,
    sky: 0x262d43,
  },
  core: {
    name: "SHELF CONTROL",
    note: "EMPLOYEES ARE EXPENDABLE",
    pattern: "office",
    floor: [0x527387, 0x7b9aa8],
    trim: 0xb83d2b,
    body: 0xa5b6c4,
    glass: 0x658ca5,
    stock: 0x89a5b6,
    key: 0xd4e8ff,
    fill: 0x93b5d1,
    sky: 0x202f43,
  },
  vault: {
    name: "FINAL NOTICE",
    note: "KEEP THE KEYS. LOSE THE BOSS.",
    pattern: "office",
    floor: [0x877b68, 0xaaa18b],
    trim: 0xc4a65c,
    body: 0xd0c8b6,
    glass: 0x978568,
    stock: 0xb29a6b,
    key: 0xffe4b7,
    fill: 0xb2bed1,
    sky: 0x302e36,
  },
};

function artwork(width, height, draw) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  draw(canvas.getContext("2d"), width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function tileArt(pattern) {
  return artwork(256, 256, (ctx) => {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = "#c4cbd0";
    ctx.lineWidth = 2;
    if (pattern === "ice") {
      ctx.strokeStyle = "#d3e6ef";
      for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 41 - 80, 0);
        ctx.lineTo(i * 41 + 125, 256);
        ctx.stroke();
      }
      ctx.lineWidth = 4;
      ctx.strokeStyle = "#f3faff";
      ctx.strokeRect(9, 9, 238, 238);
    } else if (pattern === "cargo") {
      ctx.fillStyle = "#d1d6d8";
      for (let y = 20; y < 256; y += 32)
        for (let x = 15; x < 256; x += 36) {
          ctx.save();
          ctx.translate(x + (y % 64 ? 12 : 0), y);
          ctx.rotate(Math.PI / 4);
          ctx.fillRect(-8, -2, 16, 4);
          ctx.restore();
        }
    } else if (pattern === "breakfast") {
      ctx.fillStyle = "#ded9d5";
      for (let i = 0; i < 48; i++) {
        const x = (i * 83 + 19) % 256,
          y = (i * 47 + 11) % 256;
        ctx.fillRect(x, y, 2 + (i % 4), 2);
      }
      ctx.lineWidth = 5;
      ctx.strokeStyle = "#e4ded9";
      ctx.strokeRect(10, 10, 236, 236);
    } else if (pattern === "sale") {
      ctx.strokeStyle = "#e5d7db";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(128, 15);
      ctx.lineTo(241, 128);
      ctx.lineTo(128, 241);
      ctx.lineTo(15, 128);
      ctx.closePath();
      ctx.stroke();
    } else {
      ctx.strokeStyle = "#c8cdd5";
      for (let i = 10; i < 256; i += 12) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 256);
        ctx.stroke();
      }
    }
  });
}

function icon(ctx, pattern, x, y, r) {
  ctx.save();
  ctx.translate(x, y);
  ctx.lineWidth = r * 0.12;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  if (pattern === "ice") {
    for (let i = 0; i < 6; i++) {
      ctx.save();
      ctx.rotate((i * Math.PI) / 3);
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -r);
      ctx.moveTo(-r * 0.3, -r * 0.58);
      ctx.lineTo(0, -r * 0.35);
      ctx.lineTo(r * 0.3, -r * 0.58);
      ctx.stroke();
      ctx.restore();
      ctx.beginPath();
    }
  } else if (pattern === "breakfast") {
    ctx.arc(0, -r * 0.2, r, 0, Math.PI);
    ctx.moveTo(-r, -r * 0.2);
    ctx.lineTo(r, -r * 0.2);
    ctx.moveTo(-r * 0.45, r * 0.85);
    ctx.lineTo(r * 0.45, r * 0.85);
    ctx.moveTo(r * 0.48, -r * 0.2);
    ctx.lineTo(r * 0.92, -r);
  } else if (pattern === "cargo") {
    ctx.rect(-r * 0.8, -r * 0.7, r * 1.6, r * 1.4);
    ctx.moveTo(0, -r * 0.7);
    ctx.lineTo(0, r * 0.12);
    ctx.moveTo(-r * 0.5, r * 0.36);
    ctx.lineTo(-r * 0.15, r * 0.36);
  } else if (pattern === "sale") {
    ctx.arc(-r * 0.45, -r * 0.4, r * 0.2, 0, Math.PI * 2);
    ctx.moveTo(r * 0.65, r * 0.4);
    ctx.arc(r * 0.45, r * 0.4, r * 0.2, 0, Math.PI * 2);
    ctx.moveTo(-r * 0.65, r * 0.75);
    ctx.lineTo(r * 0.65, -r * 0.75);
  } else {
    ctx.rect(-r * 0.7, -r * 0.7, r * 1.4, r * 1.4);
    ctx.moveTo(-r * 0.45, -r * 0.25);
    ctx.lineTo(r * 0.45, -r * 0.25);
    ctx.moveTo(-r * 0.45, r * 0.2);
    ctx.lineTo(r * 0.2, r * 0.2);
  }
  ctx.stroke();
  ctx.restore();
}

export function departmentScene({ world, game, ownedGeometry }) {
  const theme = PALETTES[game.map.level.theme] || PALETTES.warm;
  const materials = new Map(),
    textures = [];
  const art = tileArt(theme.pattern);
  textures.push(art);
  const signs = [];
  const colors = new Map([
    [0xf0f2f3, theme.body],
    [0xc94732, theme.trim],
    [0x6c8fb8, theme.glass],
    [0xa6bfd7, theme.glass],
    [0xb98442, theme.stock],
    [0xefb546, theme.stock],
  ]);
  return {
    theme,
    floorColor({ col, row }) {
      if (game.map.level.map[row][col] === "#") return theme.floor[0];
      const lane =
        theme.pattern === "cargo"
          ? col % 6 === 1
          : theme.pattern === "ice"
            ? row % 5 === 0
            : (col + row) % 2 === 0;
      return theme.floor[lane ? 1 : 0];
    },
    dressFloor(batches) {
      for (const { mesh } of batches) {
        if (mesh.material.name !== "tile") continue;
        // Project flat artwork onto the selected recipe tile; no replacement mesh data.
        const geometry = mesh.geometry.clone();
        geometry.computeBoundingBox();
        const { min, max } = geometry.boundingBox;
        const positions = geometry.attributes.position;
        const uv = new Float32Array(positions.count * 2);
        for (let i = 0; i < positions.count; i++) {
          uv[i * 2] = (positions.getX(i) - min.x) / (max.x - min.x);
          uv[i * 2 + 1] = (positions.getZ(i) - min.z) / (max.z - min.z);
        }
        geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
        mesh.geometry = geometry;
        ownedGeometry.push(geometry);
        mesh.material = mesh.material.clone();
        mesh.material.map = art;
        mesh.material.roughness = theme.pattern === "ice" ? 0.25 : 0.82;
        mesh.userData.ownMaterial = true;
      }
    },
    dressFixture(object, border, wall) {
      object.traverse((node) => {
        if (!node.isMesh) return;
        const original = node.material;
        if (!materials.has(original)) {
          const material = original.clone();
          const color = colors.get(original.color.getHex());
          if (color !== undefined) material.color.setHex(color);
          material.roughness = theme.pattern === "cargo" ? 0.85 : 0.38;
          materials.set(original, material);
        }
        node.material = materials.get(original);
      });
      if (theme.pattern === "cargo") object.scale.y = border ? 1.18 : 1.55;
      if (!border && theme.pattern === "sale" && wall.col % 2)
        object.rotation.y = Math.PI / 2;
    },
    landmarks() {
      const map = game.map.level.map;
      // Back each sign with a full shelf row so it cannot cover a narrow aisle.
      const candidates = game.map.walls.filter(
        ({ col, row }) =>
          map[row][col - 1] === "#" &&
          map[row][col + 1] === "#" &&
          ![undefined, "#", " "].includes(map[row + 1]?.[col]),
      );
      const anchors = [
        game.map.start,
        game.map.exit,
        { x: game.map.width, z: game.map.height },
      ];
      const chosen = [];
      for (const anchor of anchors) {
        const site = candidates
          .filter((p) =>
            chosen.every((q) => Math.hypot(p.x - q.x, p.z - q.z) > 11),
          )
          .sort(
            (a, b) =>
              Math.hypot(a.x - anchor.x, a.z - anchor.z) -
              Math.hypot(b.x - anchor.x, b.z - anchor.z),
          )[0];
        if (!site) continue;
        chosen.push(site);
        const texture = artwork(1024, 256, (ctx, width, height) => {
          ctx.fillStyle = `#${theme.trim.toString(16).padStart(6, "0")}`;
          ctx.fillRect(0, 0, width, height);
          ctx.fillStyle = "#f0f2f3";
          ctx.fillRect(12, 12, 178, height - 24);
          ctx.strokeStyle = `#${theme.trim.toString(16).padStart(6, "0")}`;
          icon(ctx, theme.pattern, 101, 116, 52);
          ctx.fillStyle = "#f0f2f3";
          ctx.font = "900 65px sans-serif";
          ctx.fillText(theme.name, 215, 112, 775);
          ctx.font = "600 25px sans-serif";
          ctx.fillText(theme.note, 218, 164, 764);
          ctx.fillRect(215, 194, 765, 4);
          ctx.font = "700 21px monospace";
          ctx.fillText(
            `AISLE ${String(game.levelIndex + 1).padStart(2, "0")} / NIGHT SHIFT`,
            218,
            231,
          );
        });
        const sign = new THREE.Sprite(
          new THREE.SpriteMaterial({
            map: texture,
            toneMapped: false,
            depthWrite: false,
          }),
        );
        sign.scale.set(3.4, 0.85, 1);
        sign.position.set(
          site.x,
          theme.pattern === "cargo" ? 2.5 : 1.8,
          site.z,
        );
        world.add(sign);
        signs.push(sign);
      }
    },
    update() {
      for (const sign of signs)
        sign.visible =
          Math.hypot(
            sign.position.x - game.player.x,
            sign.position.z - game.player.z,
          ) < 16;
    },
    dispose() {
      for (const material of materials.values()) material.dispose();
      for (const texture of textures) texture.dispose();
    },
  };
}
