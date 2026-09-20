import * as THREE from "three";
import { ASSET, bakeStatic } from "./assetlib.js";
import { newGame, stepGame, nextLevel, gateClosed, clamp } from "./sim.js";
import { Sound } from "./audio.js";

const $ = (id) => document.getElementById(id);
const ui = Object.fromEntries(
  [...document.querySelectorAll("[id]")].map((el) => [el.id, el]),
);
const sound = new Sound();
const palette = {
  cream: 0xf5e9c9,
  lime: 0xd5f65b,
  red: 0xf1533f,
  teal: 0x52c9c1,
};
let renderer, scene, camera, world, menuWorld, hero, bossModel, exitModel, halo;
let game = newGame(),
  mode = "menu",
  building = false,
  paused = false;
let enemies = [],
  batteries = [],
  gates = [],
  crumbMeshes = [],
  ownedGeometry = [];
let prototypes = {},
  menuHero,
  menuTrolley,
  shotPool,
  hazardPool,
  fx,
  keyLight,
  fillLight;
let clock = 0,
  lastTime = 0,
  recoil = 0,
  viewKick = 0,
  hudTime = 0,
  best = 0,
  bestFloor = 1;
let runKills = 0,
  runCrumbs = 0,
  runShots = 0,
  runTime = 0;
let messageUntil = 0,
  damageUntil = 0,
  lastState = "playing",
  lastOvertime = false;
let fps = 60,
  tickCount = 0,
  frameTotal = 0,
  pointerKnown = false,
  pointerFire = false;
let dashQueued = false,
  pointer = new THREE.Vector2();
const keys = new Set(),
  stickMove = { x: 0, z: 0 },
  stickAim = { x: 0, z: 0, active: false };
const follow = new THREE.Vector3(),
  aimPoint = new THREE.Vector3();
const ray = new THREE.Raycaster(),
  aimPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.4);
const transform = new THREE.Object3D(),
  zeroScale = new THREE.Vector3(0, 0, 0);
const particles = [],
  vector = new THREE.Vector3();
const mini = ui.minimap.getContext("2d");
const paths = [
  "vacuum",
  "security_trolley",
  "polisher",
  "shelf",
  "freezer",
  "checkout",
  "battery",
  "snack",
  "floor",
];

function reportError(error) {
  console.error(error);
  ui.error.hidden = false;
  ui.error.textContent =
    "The night shift could not start. Reload to try again. " + error.message;
  ui.start.disabled = true;
  ui.start.textContent = "RELOAD TO TRY AGAIN";
}

function cloneAsset(name) {
  const copy = prototypes[name].clone(true);
  return copy;
}

function compactActor(model) {
  // Bake the body and each moving part separately, preserving pivots and articulation.
  const candidates = [];
  const jointRefs = model.userData.joints || {};
  const references = new Set(
    Object.values(jointRefs).filter((node) => node?.isObject3D),
  );
  model.traverse((node) => {
    if (
      references.has(node) ||
      node.name === "wheel" ||
      node.name.startsWith("brush")
    )
      candidates.push(node);
  });
  const parts = candidates.filter((node) => {
    for (
      let parent = node.parent;
      parent && parent !== model;
      parent = parent.parent
    )
      if (candidates.includes(parent)) return false;
    return true;
  });
  model.updateMatrixWorld(true);
  const matrices = parts.map((node) => node.matrixWorld.clone());
  for (const node of parts) node.removeFromParent();
  const compact = bakeStatic(model);
  compact.userData.joints = {};
  for (const [i, node] of parts.entries()) {
    node.position.set(0, 0, 0);
    node.quaternion.identity();
    node.scale.setScalar(1);
    const baked = bakeStatic(node);
    matrices[i].decompose(baked.position, baked.quaternion, baked.scale);
    baked.name = node.name;
    for (const [key, reference] of Object.entries(jointRefs))
      if (reference === node) compact.userData.joints[key] = baked;
    compact.add(baked);
  }
  compact.traverse((node) => {
    if (node.isMesh) ownedGeometry.push(node.geometry);
  });
  return compact;
}

function markEmissive(object, active = false) {
  object.traverse((node) => {
    if (!node.isMesh) return;
    if (!node.userData.ownMaterial) {
      node.material = node.material.clone();
      node.userData.ownMaterial = true;
    }
    node.material.emissive.setHex(active ? palette.lime : 0x000000);
    node.material.emissiveIntensity = active ? 0.25 : 0;
  });
}

function makeRing(radius, color) {
  // Ground rings and sprites are interface/effect geometry, not imported objects.
  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.8,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const object = new THREE.Mesh(
    new THREE.RingGeometry(radius, radius + 0.055, 40),
    material,
  );
  object.rotation.x = -Math.PI / 2;
  object.position.y = 0.025;
  object.userData.ownMaterial = true;
  ownedGeometry.push(object.geometry);
  return object;
}

function label(text, color = "#d5f65b", width = 3.8) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 80;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#102c37e6";
  ctx.fillRect(0, 0, 512, 80);
  ctx.fillStyle = color;
  ctx.font = "bold 35px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(text, 256, 53);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
    }),
  );
  sprite.scale.set(width, (width * 80) / 512, 1);
  return sprite;
}

function instanceAsset(name, points, parent, colorAt) {
  const prototype = prototypes[name],
    instances = [];
  prototype.updateMatrixWorld(true);
  prototype.traverse((mesh) => {
    if (!mesh.isMesh) return;
    const batch = new THREE.InstancedMesh(
      mesh.geometry,
      mesh.material,
      points.length,
    );
    batch.castShadow = name !== "floor" && name !== "snack";
    batch.receiveShadow = true;
    for (const [i, point] of points.entries()) {
      transform.position.set(point.x, point.y || 0, point.z);
      transform.rotation.set(0, point.rotation || 0, 0);
      transform.scale.setScalar(point.scale || 1);
      transform.updateMatrix();
      batch.setMatrixAt(i, transform.matrix.clone().multiply(mesh.matrixWorld));
      if (colorAt) batch.setColorAt(i, new THREE.Color(colorAt(point, i)));
    }
    batch.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    batch.computeBoundingSphere();
    parent.add(batch);
    instances.push({ mesh: batch, local: mesh.matrixWorld.clone() });
  });
  return instances;
}

function pool(color, count) {
  const source = prototypes.snack.children[0].children.find(
    (node) => node.isMesh,
  );
  const material = new THREE.MeshBasicMaterial({ color, toneMapped: false });
  const batch = new THREE.InstancedMesh(source.geometry, material, count);
  batch.userData.ownMaterial = true;
  batch.count = 0;
  batch.frustumCulled = false;
  batch.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  return batch;
}

function makeParticles() {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(900), 3),
  );
  geometry.setAttribute(
    "color",
    new THREE.BufferAttribute(new Float32Array(900), 3),
  );
  const material = new THREE.PointsMaterial({
    size: 0.13,
    vertexColors: true,
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
  });
  const object = new THREE.Points(geometry, material);
  object.frustumCulled = false;
  geometry.setDrawRange(0, 0);
  scene.add(object);
  return object;
}

function burst(x, z, color, count = 12, force = 3) {
  const tint = new THREE.Color(color);
  for (let i = 0; i < count && particles.length < 300; i++) {
    const angle = Math.random() * Math.PI * 2,
      speed = force * (0.3 + Math.random());
    particles.push({
      x,
      y: 0.45,
      z,
      vx: Math.cos(angle) * speed,
      vy: 1 + Math.random() * force,
      vz: Math.sin(angle) * speed,
      life: 0.3 + Math.random() * 0.4,
      max: 0.7,
      color: tint,
    });
  }
}

function showMessage(title, subtitle = "", seconds = 2.3) {
  ui.message.replaceChildren(document.createTextNode(title));
  if (subtitle) {
    const small = document.createElement("small");
    small.textContent = subtitle;
    ui.message.append(small);
  }
  ui.message.classList.add("show");
  messageUntil = clock + seconds;
}

async function makeMenu() {
  menuWorld = new THREE.Group();
  scene.add(menuWorld);
  const tiles = [];
  const size = prototypes.floor.userData.nativeSize.x,
    scale = 2 / size;
  for (let z = -4; z <= 6; z += 2)
    for (let x = -8; x <= 8; x += 2)
      tiles.push({ x, z, y: -0.12 * scale, scale });
  instanceAsset("floor", tiles, menuWorld, (p) =>
    ((p.x + p.z) / 2) % 2 ? 0x668a83 : 0xffffff,
  );
  for (const x of [-6, -3, 0, 3, 6]) {
    const shelf = cloneAsset("shelf");
    shelf.position.set(x, 0, -4);
    shelf.scale.setScalar(1.3);
    menuWorld.add(shelf);
  }
  menuHero = compactActor(
    await ASSET("assets/vacuum.js", { keepHierarchy: true }),
  );
  menuHero.scale.multiplyScalar(3.2);
  menuHero.rotation.y = 0.18;
  menuWorld.add(menuHero);
  menuTrolley = compactActor(
    await ASSET("assets/security_trolley.js", {
      keepHierarchy: true,
    }),
  );
  menuTrolley.position.set(4.1, 0, -0.1);
  menuTrolley.rotation.y = -0.5;
  menuTrolley.scale.setScalar(1.5);
  menuWorld.add(menuTrolley);
  const battery = cloneAsset("battery");
  battery.position.set(2.9, 0.05, 3);
  battery.scale.setScalar(1.6);
  menuWorld.add(battery);
  instanceAsset(
    "snack",
    Array.from({ length: 14 }, (_, i) => ({
      x: Math.sin(i * 1.7) * 5,
      z: 1 + (i % 4),
      scale: 1.6,
    })),
    menuWorld,
  );
}

async function buildWorld() {
  if (world) {
    scene.remove(world);
    world.traverse((node) => {
      if (node.isInstancedMesh) node.dispose();
      if (node.userData.ownMaterial) node.material.dispose();
      if (node.isSprite) {
        node.material.map?.dispose();
        node.material.dispose();
      }
    });
    for (const geometry of ownedGeometry) geometry.dispose();
  }
  ownedGeometry = [];
  particles.length = 0;
  world = new THREE.Group();
  scene.add(world);
  enemies = [];
  batteries = [];
  gates = [];
  const theme = game.map.level.theme;
  const tiles = [],
    scale = 2 / prototypes.floor.userData.nativeSize.x;
  for (let row = 0; row < game.map.height; row++)
    for (let col = 0; col < game.map.width; col++) {
      tiles.push({ x: col * 2, z: row * 2, col, row, scale, y: -0.12 * scale });
    }
  instanceAsset("floor", tiles, world, (p) => {
    if (game.map.level.map[p.row][p.col] === "#") return 0x6c9288;
    if (theme === "ice") return (p.col + p.row) % 2 ? 0xa9eced : 0xe8ffff;
    if (theme === "warehouse") return (p.col + p.row) % 2 ? 0x789999 : 0xa1b4a2;
    if (theme === "rush") return (p.col + p.row) % 2 ? 0x737e73 : 0x8d8c77;
    return (p.col + p.row) % 2 ? 0x567a71 : 0x718b77;
  });
  const chunks = new Map();
  for (const wall of game.map.walls) {
    const key = `${Math.floor(wall.col / 5)},${Math.floor(wall.row / 5)}`;
    if (!chunks.has(key)) chunks.set(key, new THREE.Group());
    const border =
      wall.col === 0 ||
      wall.row === 0 ||
      wall.col === game.map.width - 1 ||
      wall.row === game.map.height - 1;
    const object = cloneAsset(theme === "ice" || border ? "freezer" : "shelf");
    object.position.set(wall.x, 0, wall.z);
    if (border)
      object.rotation.y =
        wall.col === 0 || wall.col === game.map.width - 1 ? Math.PI / 2 : 0;
    if (theme === "warehouse" && !border) object.scale.y = 1.5;
    chunks.get(key).add(object);
  }
  for (const chunk of chunks.values()) {
    const baked = bakeStatic(chunk);
    baked.traverse((node) => {
      if (node.isMesh) ownedGeometry.push(node.geometry);
    });
    world.add(baked);
  }
  crumbMeshes = instanceAsset(
    "snack",
    game.crumbs.map((c) => ({ ...c, y: 0.14, scale: 1.55 })),
    world,
  );
  for (const [i, item] of game.batteries.entries()) {
    const model = cloneAsset("battery");
    model.position.set(item.x, 0.1, item.z);
    model.scale.setScalar(1.2);
    markEmissive(model, true);
    const ring = makeRing(0.6, palette.lime);
    ring.position.set(item.x, 0.025, item.z);
    world.add(model, ring);
    batteries.push({ model, ring, i });
  }
  hero = compactActor(await ASSET("assets/vacuum.js", { keepHierarchy: true }));
  hero.traverse((node) => {
    if (node.name === "wheel") node.userData.spinning = true;
  });
  world.add(hero);
  halo = makeRing(0.52, palette.cream);
  world.add(halo);
  for (const enemy of game.enemies) {
    const model = compactActor(
      await ASSET(
        `assets/${enemy.kind === "hunter" ? "security_trolley" : "polisher"}.js`,
        { keepHierarchy: true },
      ),
    );
    markEmissive(model);
    world.add(model);
    enemies.push(model);
  }
  exitModel = cloneAsset("checkout");
  exitModel.position.set(game.map.exit.x, 0, game.map.exit.z);
  exitModel.rotation.y = Math.PI;
  world.add(exitModel);
  const checkoutLabel = label("CHECKOUT", "#f5e9c9", 2.5);
  checkoutLabel.position.set(game.map.exit.x, 2.05, game.map.exit.z);
  world.add(checkoutLabel);
  for (const gate of game.map.gates) {
    const model = cloneAsset("freezer");
    model.position.set(gate.x, 0, gate.z);
    const ring = makeRing(0.8, palette.red);
    ring.position.set(gate.x, 0.03, gate.z);
    world.add(model, ring);
    gates.push({ model, ring, data: gate });
  }
  bossModel = null;
  if (game.boss) {
    bossModel = compactActor(
      await ASSET("assets/security_trolley.js", {
        keepHierarchy: true,
      }),
    );
    bossModel.scale.setScalar(2.9);
    bossModel.position.set(game.boss.x, 0, game.boss.z);
    markEmissive(bossModel);
    world.add(bossModel);
    const manager = label("THE MANAGER", "#f1533f", 3.5);
    manager.position.set(game.boss.x, 3.7, game.boss.z);
    world.add(manager);
  }
  shotPool = pool(palette.lime, 160);
  hazardPool = pool(palette.red, 80);
  world.add(shotPool, hazardPool);
  keyLight.color.setHex(
    theme === "ice" ? 0xd9fbff : theme === "boss" ? 0xffc7a7 : 0xffe2ac,
  );
  fillLight.color.setHex(theme === "ice" ? 0x6abfff : 0x81c7de);
  scene.background.setHex(theme === "ice" ? 0x173c4a : 0x102c37);
  follow.set(game.player.x, 0, game.player.z);
  lastState = "playing";
  lastOvertime = false;
  ui.department.textContent = game.map.level.department;
  ui["floor-name"].textContent = game.map.level.name;
  ui.quota.textContent = ` / ${game.map.level.quota}`;
  updateModels(0);
  resize();
}

function clearInput() {
  keys.clear();
  pointerFire = false;
  dashQueued = false;
  Object.assign(stickMove, { x: 0, z: 0 });
  Object.assign(stickAim, { x: 0, z: 0, active: false });
  for (const element of document.querySelectorAll(".stick i"))
    element.style.transform = "";
}

async function start(fresh = true, upgrade) {
  if (building) return;
  building = true;
  clearInput();
  await sound.start();
  if (fresh) {
    game = newGame();
    runKills = 0;
    runCrumbs = 0;
    runShots = 0;
    runTime = 0;
  } else {
    const next = nextLevel(game, upgrade);
    if (!next) {
      building = false;
      return;
    }
    runKills += game.kills;
    runCrumbs += game.collected;
    runShots += game.shots;
    runTime += game.elapsed;
    game = next;
  }
  for (const id of [
    "menu",
    "hero-label",
    "footer",
    "pause-screen",
    "upgrade-screen",
    "result",
  ])
    ui[id].hidden = true;
  mode = "playing";
  paused = false;
  menuWorld.visible = false;
  ui.hud.hidden = false;
  ui.pause.hidden = false;
  ui.game.classList.add("playing");
  try {
    await buildWorld();
    showMessage(game.map.level.name, game.map.level.tagline, 3);
  } catch (error) {
    reportError(error);
  }
  building = false;
}

function pause(value = !paused) {
  if (mode !== "playing" || game.state !== "playing" || building) return;
  paused = value;
  clearInput();
  ui["pause-screen"].hidden = !value;
  if (!value) sound.start();
}

function menu() {
  clearInput();
  mode = "menu";
  paused = false;
  world.visible = false;
  menuWorld.visible = true;
  for (const id of ["menu", "hero-label", "footer"]) ui[id].hidden = false;
  for (const id of ["hud", "pause", "result", "pause-screen", "upgrade-screen"])
    ui[id].hidden = true;
  ui.game.classList.remove("playing", "overtime");
  ui.message.classList.remove("show");
  resize();
}

function handleEvents(events) {
  for (const event of events) {
    sound.effect(event.type, game.collected);
    if (event.type === "crumb") burst(event.x, event.z, palette.lime, 5, 1.3);
    if (event.type === "shot") recoil = 1;
    if (event.type === "hit") burst(event.x, event.z, palette.cream, 6, 2.5);
    if (event.type === "shield") burst(event.x, event.z, palette.teal, 3, 1.5);
    if (event.type === "charge-warning")
      burst(event.x, event.z, palette.red, 10, 0.7);
    if (event.type === "charge") burst(event.x, event.z, palette.teal, 14, 2);
    if (event.type === "enemy-down") {
      burst(event.x, event.z, palette.red, 32, 4);
      viewKick = 0.1;
      showMessage(
        event.combo > 1
          ? `${event.combo}× HOSTILE TAKEOVER!`
          : ["CLEANED OUT.", "ITEM REMOVED.", "RETURN TO SENDER."][
              game.kills % 3
            ],
        `+${100 * Math.min(event.combo, 8)} · +7 shots`,
        1.1,
      );
    }
    if (event.type === "dash") burst(event.x, event.z, palette.teal, 15, 1.5);
    if (event.type === "damage") {
      damageUntil = clock + 0.2;
      burst(event.x, event.z, palette.red, 25, 3);
    }
    if (event.type === "empty")
      showMessage(
        "CRUMBS ARE AMMO.",
        "Collect a few more and keep firing.",
        1.5,
      );
    if (event.type === "overtime") {
      burst(event.x, event.z, palette.lime, 55, 5);
      viewKick = 0.12;
      showMessage(
        "UNREASONABLE OVERTIME.",
        "Unlimited firepower. Chase them down.",
        2.3,
      );
    }
    if (event.type === "exit-open")
      showMessage(
        game.boss?.hp > 0
          ? "QUOTA DONE. ONE COMPLAINT LEFT."
          : "TIME TO CHECK OUT!",
        game.boss?.hp > 0
          ? "Defeat the Manager, then reach the checkout."
          : "Follow the lime marker to the checkout.",
        3,
      );
    if (event.type === "boss-down") {
      burst(game.boss.x, game.boss.z, palette.red, 100, 8);
      viewKick = 0.35;
      showMessage(
        "MANAGEMENT HAS LEFT THE BUILDING.",
        "Your checkout is ready.",
        3,
      );
    }
  }
  if (game.state === lastState) return;
  lastState = game.state;
  clearInput();
  if (game.state === "cleared") {
    ui["upgrade-screen"].hidden = false;
    document.querySelector('[data-upgrade="spread"] p').textContent =
      `${3 + game.upgrades.spread * 2} shots for the price of one.`;
    document.querySelector('[data-upgrade="rapid"] p').textContent =
      `Fire ${Math.round(25 / (1 + game.upgrades.rapid * 0.25))}% faster.`;
    return;
  }
  if (!["lost", "won"].includes(game.state)) return;
  const won = game.state === "won",
    previousBest = best;
  best = Math.max(best, game.score);
  bestFloor = Math.max(bestFloor, game.levelIndex + 1);
  try {
    localStorage.setItem(
      "hft-record-v1",
      JSON.stringify({ score: best, floor: bestFloor }),
    );
  } catch {
    /* Storage is optional in private browser modes. */
  }
  ui.best.textContent = `PERSONAL BEST ${best.toLocaleString("en-US")} · AISLE ${bestFloor}/5`;
  ui["result-eyebrow"].textContent = won
    ? "SHIFT COMPLETE"
    : "PERFORMANCE REVIEW";
  ui["result-title"].innerHTML = won
    ? "Clean <em>getaway.</em>"
    : game.time <= 0
      ? "Clocked <em>out.</em>"
      : "You <em>suck.</em>";
  ui["result-comment"].textContent = won
    ? "Five aisles. One vacuum. Still no pay rise."
    : game.time <= 0
      ? "Store closed. Your overtime was not approved."
      : "Occupational hazard. No compensation.";
  ui["final-score"].textContent = game.score.toLocaleString("en-US");
  ui["result-stats"].textContent =
    `${game.score > previousBest ? "NEW PERSONAL BEST · " : ""}AISLE ${game.levelIndex + 1}/5 · ${runKills + game.kills} TAKEDOWNS · ${runCrumbs + game.collected} CRUMBS`;
  ui.result.hidden = false;
}

function updateModels(dt) {
  if (!hero) return;
  const p = game.player,
    moving = Math.hypot(p.vx, p.vz),
    overtime = game.overtime > 0;
  const scale = overtime ? 1.23 + Math.sin(clock * 23) * 0.015 : 1;
  hero.position.set(
    p.x,
    moving > 0.2 ? Math.abs(Math.sin(clock * 22)) * 0.045 : 0,
    p.z,
  );
  hero.rotation.set(
    Math.sin(clock * 22) * moving * 0.003,
    p.angle,
    Math.cos(clock * 14) * moving * 0.004,
  );
  hero.scale.setScalar(scale);
  hero.visible = true;
  const joints = hero.userData.joints;
  if (joints?.nozzle) joints.nozzle.rotation.x = recoil * -0.22;
  if (joints?.lid)
    joints.lid.rotation.x = -0.12 - (overtime ? 0.18 : 0) - recoil * 0.12;
  hero.traverse((node) => {
    if (node.userData.spinning) node.rotation.x += moving * dt * 4;
  });
  halo.position.set(p.x, 0.025, p.z);
  halo.scale.setScalar(overtime ? 1.5 : p.dash > 0 ? 1.3 : 1);
  halo.material.color.setHex(overtime ? palette.lime : palette.cream);
  halo.material.opacity =
    p.invincible > 0 ? 0.35 + Math.sin(clock * 20) * 0.25 : 0.8;
  if (overtime !== lastOvertime) {
    markEmissive(hero, overtime);
    lastOvertime = overtime;
    ui.game.classList.toggle("overtime", overtime);
  }
  for (const [i, model] of enemies.entries()) {
    const enemy = game.enemies[i];
    model.visible = enemy.respawn <= 0;
    model.position.set(
      enemy.x,
      Math.abs(Math.sin(clock * 12 + i)) * 0.045,
      enemy.z,
    );
    model.rotation.set(
      Math.sin(clock * 16 + i) * 0.03,
      enemy.angle,
      enemy.hit > 0 ? Math.sin(clock * 100) * 0.17 : 0,
    );
    model.traverse((node) => {
      if (node.isMesh) {
        node.material.emissive.setHex(
          enemy.hit > 0
            ? 0xffffff
            : enemy.windup > 0 || enemy.charge > 0
              ? palette.red
              : overtime
                ? palette.teal
                : 0,
        );
        node.material.emissiveIntensity =
          enemy.hit > 0
            ? 0.7
            : enemy.windup > 0
              ? 0.3 + Math.abs(Math.sin(clock * 24)) * 0.8
              : enemy.charge > 0
                ? 0.5
                : 0.18;
      }
      if (node.name === "wheel") node.rotation.x += dt * 12;
      if (node.name.startsWith("brush")) node.rotation.y += dt * 18;
    });
  }
  for (const { model, ring, i } of batteries) {
    const item = game.batteries[i];
    model.visible = ring.visible = !item.collected;
    model.position.y = 0.18 + Math.sin(clock * 3 + i) * 0.12;
    model.rotation.y = clock * 0.8;
    ring.scale.setScalar(1 + Math.sin(clock * 4) * 0.08);
  }
  for (const { model, ring, data } of gates) {
    const closed = gateClosed(game, data.col, data.row);
    model.position.y +=
      ((closed ? 0 : -1.4) - model.position.y) * Math.min(1, dt * 15);
    ring.material.color.setHex(closed ? palette.red : palette.lime);
  }
  for (const { mesh, local } of crumbMeshes) {
    for (const [i, crumb] of game.crumbs.entries()) {
      transform.position.set(
        crumb.x,
        0.18 + Math.sin(clock * 3 + i) * 0.035,
        crumb.z,
      );
      transform.rotation.set(0, clock + i, 0);
      transform.scale.copy(
        crumb.collected ? zeroScale : vector.setScalar(1.55),
      );
      transform.updateMatrix();
      mesh.setMatrixAt(i, transform.matrix.clone().multiply(local));
    }
    mesh.instanceMatrix.needsUpdate = true;
  }
  const open =
    game.collected >= game.map.level.quota && (!game.boss || game.boss.hp <= 0);
  if (exitModel.userData.open !== open) {
    markEmissive(exitModel, open);
    exitModel.userData.open = open;
  }
  if (bossModel) {
    const boss = game.boss;
    bossModel.visible = boss.hp > 0;
    bossModel.rotation.y = Math.atan2(p.x - boss.x, p.z - boss.z);
    bossModel.position.y = boss.exposed
      ? Math.abs(Math.sin(clock * 17)) * 0.15
      : 0;
    bossModel.traverse((node) => {
      if (node.isMesh) {
        node.material.emissive.setHex(
          boss.exposed ? palette.lime : palette.red,
        );
        node.material.emissiveIntensity = boss.hit > 0 ? 0.8 : 0.1;
      }
    });
  }
  for (const [batch, shots] of [
    [shotPool, game.bullets],
    [hazardPool, game.hazards],
  ]) {
    batch.count = Math.min(shots.length, batch.instanceMatrix.count);
    for (let i = 0; i < batch.count; i++) {
      const b = shots[i];
      transform.position.set(b.x, 0.4, b.z);
      transform.rotation.set(0, Math.atan2(b.vx, b.vz), 0);
      transform.scale.set(
        batch === hazardPool ? 2 : 0.8,
        0.8,
        batch === hazardPool ? 2 : 2.6,
      );
      transform.updateMatrix();
      batch.setMatrixAt(i, transform.matrix);
    }
    batch.instanceMatrix.needsUpdate = true;
  }
}

function screenPosition(x, y, z) {
  const projected = new THREE.Vector3(x, y, z).project(camera);
  return {
    x: (projected.x * 0.5 + 0.5) * innerWidth,
    y: (-projected.y * 0.5 + 0.5) * innerHeight,
  };
}

function updateCamera(dt) {
  const portrait = innerWidth < 700 && innerHeight > innerWidth;
  if (mode === "menu") {
    const target = portrait
      ? new THREE.Vector3(1.2, 0, 5.3)
      : new THREE.Vector3(-3.4, 0, 0.5);
    camera.position.copy(target).add(new THREE.Vector3(6, 11, 15));
    camera.lookAt(target);
  } else {
    const x = clamp(game.player.x, portrait ? 4 : 8, portrait ? 28 : 24);
    const z = clamp(game.player.z - 1.2, 5, 19);
    follow.lerp(vector.set(x, 0, z), Math.min(1, dt * 7));
    const shake = Math.max(game.shake, viewKick);
    camera.position
      .copy(follow)
      .add(vector.set((Math.random() - 0.5) * shake, 26, 17));
    camera.lookAt(follow);
  }
  camera.updateMatrixWorld();
}

function drawMap() {
  mini.fillStyle = "#0b2530ee";
  mini.fillRect(0, 0, 204, 156);
  for (const wall of game.map.walls) {
    mini.fillStyle = "#476362";
    mini.fillRect(wall.col * 12 + 1, wall.row * 12 + 1, 10, 10);
  }
  for (const crumb of game.crumbs)
    if (!crumb.collected) {
      mini.fillStyle = "#bed067";
      mini.fillRect(crumb.x * 6 + 5, crumb.z * 6 + 5, 2, 2);
    }
  for (const battery of game.batteries)
    if (!battery.collected) {
      mini.fillStyle = "#d5f65b";
      mini.fillRect(battery.x * 6 + 3, battery.z * 6 + 3, 6, 6);
    }
  for (const gate of game.map.gates) {
    mini.fillStyle = gateClosed(game, gate.col, gate.row)
      ? "#f1533f"
      : "#52c9c1";
    mini.fillRect(gate.col * 12 + 1, gate.row * 12 + 4, 10, 4);
  }
  mini.fillStyle =
    game.collected >= game.map.level.quota ? "#d5f65b" : "#52c9c1";
  mini.fillRect(game.map.exit.x * 6 + 2, game.map.exit.z * 6 + 2, 8, 8);
  for (const enemy of game.enemies)
    if (enemy.respawn <= 0) {
      mini.fillStyle = game.overtime > 0 ? "#52c9c1" : "#f1533f";
      mini.fillRect(enemy.x * 6 + 3, enemy.z * 6 + 3, 5, 5);
    }
  if (game.boss?.hp > 0) {
    mini.fillStyle = "#f1533f";
    mini.fillRect(game.boss.x * 6 + 1, game.boss.z * 6 + 1, 10, 10);
  }
  mini.fillStyle = "#ffffff";
  mini.beginPath();
  mini.arc(game.player.x * 6 + 6, game.player.z * 6 + 6, 4, 0, Math.PI * 2);
  mini.fill();
}

function updateHud() {
  ui.collected.textContent = game.collected;
  ui["quota-fill"].style.width =
    `${Math.min(100, (game.collected / game.map.level.quota) * 100)}%`;
  ui["goal-label"].textContent =
    game.collected >= game.map.level.quota
      ? game.boss?.hp > 0
        ? "DEFEAT THE MANAGER"
        : "REACH THE CHECKOUT"
      : "CRUMBS TO COLLECT";
  const time = Math.ceil(game.time);
  ui.clock.textContent = `${String(Math.floor(time / 60)).padStart(2, "0")}:${String(time % 60).padStart(2, "0")}`;
  ui.clock.parentElement.classList.toggle("urgent", time < 20);
  ui.health.textContent = Array.from(
    { length: Math.max(3, game.player.hp) },
    (_, i) => (i < game.player.hp ? "♥" : "♡"),
  ).join(" ");
  ui.health.setAttribute("aria-label", `${game.player.hp} health`);
  ui.ammo.textContent =
    game.overtime > 0 ? "∞ SHOTS · NO RESTRAINT" : `${game.ammo} SHOTS`;
  ui["dash-status"].innerHTML =
    game.player.dashCooldown > 0
      ? "DASH RECHARGING"
      : "DASH READY <kbd>SPACE</kbd>";
  ui["dash-button"].style.opacity = game.player.dashCooldown > 0 ? 0.4 : 1;
  ui.score.textContent = String(game.score).padStart(6, "0");
  ui.combo.textContent =
    game.comboTimer > 0 ? `${game.combo}× TAKEDOWN COMBO` : "NIGHT SHIFT SCORE";
  ui.overtime.hidden = game.overtime <= 0;
  ui["overtime-time"].textContent = game.overtime.toFixed(1);
  ui["boss-bar"].hidden = !game.boss || game.boss.hp <= 0;
  if (game.boss) {
    ui["boss-fill"].style.width = `${(game.boss.hp / game.boss.maxHp) * 100}%`;
    ui["boss-state"].textContent = game.boss.exposed
      ? "SHIELD DOWN. MAKE IT PERSONAL."
      : "ARMOURED. DODGE THE COMPLAINTS.";
  }
  drawMap();
}

function readInput() {
  const x =
    Number(keys.has("KeyD") || keys.has("ArrowRight")) -
    Number(keys.has("KeyA") || keys.has("ArrowLeft")) +
    stickMove.x;
  const z =
    Number(keys.has("KeyS") || keys.has("ArrowDown")) -
    Number(keys.has("KeyW") || keys.has("ArrowUp")) +
    stickMove.z;
  let aim;
  if (stickAim.active) aim = Math.atan2(stickAim.x, stickAim.z);
  else if (pointerKnown) {
    ray.setFromCamera(pointer, camera);
    if (ray.ray.intersectPlane(aimPlane, aimPoint))
      aim = Math.atan2(aimPoint.x - game.player.x, aimPoint.z - game.player.z);
  }
  const input = {
    x,
    z,
    aim,
    fire: pointerFire || stickAim.active,
    dash: dashQueued,
  };
  dashQueued = false;
  return input;
}

function telemetry() {
  // Read-only snapshots let the official jam gate measure real inputs and render work.
  window.__GAME__ = {
    fps: Math.round(fps),
    draws: renderer.info.render.calls,
    tris: renderer.info.render.triangles,
    geometries: renderer.info.memory.geometries,
    pos: [game.player.x, game.player.z],
    speed: Math.hypot(game.player.vx, game.player.vz),
    mode,
    paused,
    state: game.state,
    floor: game.levelIndex + 1,
    theme: game.map.level.theme,
    hp: game.player.hp,
    ammo: game.ammo,
    score: game.score,
    collected: game.collected,
    quota: game.map.level.quota,
    overtime: game.overtime,
    elapsed: game.elapsed,
    time: game.time,
    shots: game.shots,
    kills: game.kills,
    dashCooldown: game.player.dashCooldown,
    upgrades: { ...game.upgrades },
    angle: game.player.angle,
    map: game.map.level.map,
    exit: {
      ...game.map.exit,
      screen: screenPosition(game.map.exit.x, 0.4, game.map.exit.z),
    },
    playerScreen: screenPosition(game.player.x, 0.4, game.player.z),
    enemies: game.enemies.map((e) => ({
      x: e.x,
      z: e.z,
      hp: e.hp,
      respawn: e.respawn,
      kind: e.kind,
      screen: screenPosition(e.x, 0.4, e.z),
    })),
    batteries: game.batteries.map((b) => ({
      x: b.x,
      z: b.z,
      collected: b.collected,
    })),
    crumbs: game.crumbs.filter((c) => !c.collected).map((c) => [c.x, c.z]),
    gates: game.map.gates.map((g) => ({
      ...g,
      closed: gateClosed(game, g.col, g.row),
    })),
    boss: game.boss
      ? { ...game.boss, screen: screenPosition(game.boss.x, 0.4, game.boss.z) }
      : null,
    audio: { enabled: sound.enabled, state: sound.ctx?.state || "idle" },
  };
}

function frame(now) {
  requestAnimationFrame(frame);
  const realDt = lastTime ? (now - lastTime) / 1000 : 1 / 60;
  const dt = Math.min(0.05, realDt);
  lastTime = now;
  clock += dt;
  recoil = Math.max(0, recoil - dt * 8);
  viewKick = Math.max(0, viewKick - dt);
  frameTotal += realDt;
  tickCount++;
  if (frameTotal > 0.5) {
    fps = tickCount / frameTotal;
    tickCount = 0;
    frameTotal = 0;
  }
  const active =
    mode === "playing" && !paused && !building && game.state === "playing";
  if (active) handleEvents(stepGame(game, readInput(), dt));
  sound.update(active, game.overtime, game.map.level.theme);
  if (mode === "playing" && !building) {
    if (!paused) updateModels(dt);
    hudTime += dt;
    if (hudTime > 0.08) {
      hudTime = 0;
      updateHud();
    }
    const pos = screenPosition(game.map.exit.x, 2.4, game.map.exit.z);
    const open =
      game.collected >= game.map.level.quota &&
      (!game.boss || game.boss.hp <= 0);
    ui["exit-label"].hidden = !open;
    ui["exit-label"].style.left = `${clamp(pos.x, 65, innerWidth - 65)}px`;
    ui["exit-label"].style.top = `${clamp(pos.y, 155, innerHeight - 150)}px`;
  } else if (mode === "menu") {
    menuHero.rotation.y = 0.2 + Math.sin(clock * 0.5) * 0.15;
    menuHero.userData.joints.nozzle.rotation.x = Math.sin(clock * 2) * 0.08;
    menuTrolley.rotation.z = Math.sin(clock * 2.2) * 0.025;
  }
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= dt;
    if (p.life <= 0) {
      particles.splice(i, 1);
      continue;
    }
    if (!paused) {
      p.x += p.vx * dt;
      p.z += p.vz * dt;
      p.y = Math.max(0.04, p.y + p.vy * dt);
      p.vy -= dt * 12;
    }
  }
  for (const [i, p] of particles.entries()) {
    fx.geometry.attributes.position.setXYZ(i, p.x, p.y, p.z);
    const fade = Math.min(1, p.life * 4);
    fx.geometry.attributes.color.setXYZ(
      i,
      p.color.r * fade,
      p.color.g * fade,
      p.color.b * fade,
    );
  }
  fx.geometry.attributes.position.needsUpdate = true;
  fx.geometry.attributes.color.needsUpdate = true;
  fx.geometry.setDrawRange(0, particles.length);
  if (clock > messageUntil) ui.message.classList.remove("show");
  ui["hit-flash"].classList.toggle("active", clock < damageUntil);
  updateCamera(dt);
  renderer.render(scene, camera);
  telemetry();
}

function resize() {
  const portrait = innerWidth < 700 && innerHeight > innerWidth;
  const height = mode === "menu" ? (portrait ? 12 : 8.5) : portrait ? 22 : 15;
  const aspect = innerWidth / innerHeight;
  camera.left = (-height * aspect) / 2;
  camera.right = (height * aspect) / 2;
  camera.top = height / 2;
  camera.bottom = -height / 2;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(devicePixelRatio, portrait ? 1.5 : 2));
  renderer.setSize(innerWidth, innerHeight, false);
  updateCamera(1);
}

function bindStick(id, target, aiming) {
  const el = ui[id];
  let pointerId = null;
  const move = (event) => {
    if (event.pointerId !== pointerId) return;
    event.preventDefault();
    const rect = el.getBoundingClientRect();
    const radius = rect.width * 0.33;
    let x = (event.clientX - rect.x - rect.width / 2) / radius;
    let z = (event.clientY - rect.y - rect.height / 2) / radius;
    const len = Math.hypot(x, z);
    if (len > 1) {
      x /= len;
      z /= len;
    }
    target.x = Math.abs(x) < 0.12 ? 0 : x;
    target.z = Math.abs(z) < 0.12 ? 0 : z;
    if (aiming) target.active = len > 0.18;
    el.querySelector("i").style.transform =
      `translate(${x * radius}px,${z * radius}px)`;
  };
  el.addEventListener("pointerdown", (event) => {
    if (pointerId !== null) return;
    pointerId = event.pointerId;
    el.setPointerCapture(pointerId);
    pointerKnown = false;
    move(event);
  });
  el.addEventListener("pointermove", move);
  const end = (event) => {
    if (event.pointerId !== pointerId) return;
    pointerId = null;
    target.x = target.z = 0;
    if (aiming) target.active = false;
    el.querySelector("i").style.transform = "";
  };
  el.addEventListener("pointerup", end);
  el.addEventListener("pointercancel", end);
  el.addEventListener("lostpointercapture", end);
}

function bindInput() {
  ui.start.onclick = () => start();
  ui.retry.onclick = () => start();
  ui["pause-retry"].onclick = () => start();
  ui["back-menu"].onclick = menu;
  ui.pause.onclick = () => pause();
  ui.resume.onclick = () => pause(false);
  ui.sound.onclick = () => {
    const enabled = sound.toggle();
    ui.sound.textContent = enabled ? "SOUND ON" : "SOUND OFF";
    ui.sound.setAttribute("aria-pressed", String(enabled));
    if (enabled) sound.start();
  };
  for (const button of document.querySelectorAll("[data-upgrade]"))
    button.onclick = () => start(false, button.dataset.upgrade);
  addEventListener("keydown", (event) => {
    if (
      ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(
        event.code,
      )
    )
      event.preventDefault();
    if (event.code === "Escape" && !event.repeat) pause();
    if (event.code === "Space" && !event.repeat) dashQueued = true;
    keys.add(event.code);
  });
  addEventListener("keyup", (event) => keys.delete(event.code));
  addEventListener("blur", () => {
    clearInput();
    if (mode === "playing") pause(true);
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      clearInput();
      pause(true);
    }
  });
  ui.world.addEventListener("pointermove", (event) => {
    if (event.pointerType !== "mouse") return;
    pointer.set(
      (event.clientX / innerWidth) * 2 - 1,
      1 - (event.clientY / innerHeight) * 2,
    );
    pointerKnown = true;
  });
  ui.world.addEventListener("pointerdown", (event) => {
    if (event.button === 0 && event.pointerType === "mouse") {
      pointerFire = true;
      pointerKnown = true;
      pointer.set(
        (event.clientX / innerWidth) * 2 - 1,
        1 - (event.clientY / innerHeight) * 2,
      );
      ui.world.setPointerCapture(event.pointerId);
    }
  });
  addEventListener("pointerup", () => {
    pointerFire = false;
  });
  ui.world.addEventListener("pointercancel", () => {
    pointerFire = false;
  });
  ui.world.addEventListener("contextmenu", (event) => event.preventDefault());
  bindStick("move-stick", stickMove, false);
  bindStick("aim-stick", stickAim, true);
  ui["dash-button"].addEventListener("pointerdown", (event) => {
    event.preventDefault();
    dashQueued = true;
  });
  addEventListener("resize", resize);
}

async function init() {
  renderer = new THREE.WebGLRenderer({
    canvas: ui.world,
    antialias: true,
    powerPreference: "high-performance",
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x102c37);
  camera = new THREE.OrthographicCamera(-10, 10, 8, -8, 0.1, 100);
  keyLight = new THREE.DirectionalLight(0xffe2ac, 3.2);
  keyLight.position.set(5, 24, 14);
  keyLight.target.position.set(15, 0, 12);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(2048, 2048);
  Object.assign(keyLight.shadow.camera, {
    left: -27,
    right: 27,
    top: 27,
    bottom: -27,
    near: 0.5,
    far: 65,
  });
  keyLight.shadow.bias = -0.0002;
  keyLight.shadow.normalBias = 0.04;
  scene.add(keyLight, keyLight.target);
  fillLight = new THREE.HemisphereLight(0x81c7de, 0x66502e, 1.65);
  scene.add(fillLight);
  const rim = new THREE.DirectionalLight(0x64d9d3, 1.5);
  rim.position.set(0, 8, -15);
  scene.add(rim);
  const loaded = await Promise.all(
    paths.map((name) => ASSET(`assets/${name}.js`)),
  );
  prototypes = Object.fromEntries(paths.map((name, i) => [name, loaded[i]]));
  prototypes.floor.traverse((node) => {
    if (!node.isMesh) return;
    node.material = node.material.clone();
    if (node.material.color.getHex() === 0x203f49)
      node.material.color.setHex(0xc4ccb0);
  });
  prototypes.snack.traverse((node) => {
    if (!node.isMesh) return;
    node.material = node.material.clone();
    node.material.color.setHex(palette.lime);
    node.material.emissive.setHex(palette.lime);
    node.material.emissiveIntensity = 0.25;
  });
  for (const name of paths)
    if (!prototypes[name].userData.nativeSize)
      throw new Error(`Missing model: ${name}`);
  fx = makeParticles();
  await makeMenu();
  try {
    const record = JSON.parse(localStorage.getItem("hft-record-v1") || "null");
    if (record && Number.isFinite(record.score)) {
      best = record.score;
      bestFloor = clamp(record.floor || 1, 1, 5);
      ui.best.textContent = `PERSONAL BEST ${best.toLocaleString("en-US")} · AISLE ${bestFloor}/5`;
    }
  } catch {
    /* A disabled or damaged local score must not prevent play. */
  }
  bindInput();
  resize();
  ui.start.disabled = false;
  ui.start.innerHTML = "START THE NIGHT SHIFT <span>↗</span>";
  window.__READY__ = true;
  window.__START__ = () => start();
  requestAnimationFrame(frame);
}

init().catch(reportError);
