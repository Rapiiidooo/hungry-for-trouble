import * as THREE from "three";
import { ASSET, bakeStatic } from "./assetlib.js";
import {
  newGame,
  stepGame,
  nextLevel,
  gateClosed,
  clamp,
  canStand,
  checkoutReady,
} from "./sim.js";
import { Sound } from "./audio.js";
import { LEVELS } from "./levels.js";
import { ViewRig } from "./view-rig.js";
import { receiptEffects } from "./combat-fx.js";
import { RADIO, SPEAKERS, MISSION, portrait, storyCard } from "./story.js";
import { campaignEffects } from "./campaign-fx.js";
import { presentationEffects } from "./presentation-fx.js";
import {
  escapeScene,
  ESCAPE_SECONDS,
  ESCAPE_LINES,
  VAULT_ESCAPE_LINES,
} from "./escape-scene.js";
import { KEY_TYPES, keyType, keyIcon } from "./locks.js";
import { lockEffects } from "./lock-effects.js";
import { createCredits } from "./credits.js";
import { restoreCampaign, CAMPAIGN_RULESET } from "./campaign.js";
import {
  checkpointStore,
  checkpointCompatible,
  makeCheckpoint,
} from "./checkpoint.js";
import { ventPhase } from "./machines.js";
import { RoomClient } from "./room-client.js";
import { newMatch } from "./multiplayer-sim.js";
import { upgradeArt, upgradeStats } from "./upgrade-art.js";
import {
  TICK,
  newDaily,
  packInput,
  unpackInput,
  recordInput,
} from "./daily.js";
import {
  UPGRADES,
  upgradeChoices,
  readProgress,
  visibleFloorCount,
  unlock,
  drawRoute,
  api,
  drawBoard,
} from "./arcade.js";

const $ = (id) => document.getElementById(id);
const ui = Object.fromEntries(
  [...document.querySelectorAll("[id]")].map((el) => [el.id, el]),
);
const sound = new Sound();
let networkSeen = 0;
let peerModels = [],
  roomViewKey = "",
  roomBusy = false;
const rooms = new RoomClient({
  lobby: drawLobby,
  round: (room, snapshot, selfId) =>
    start(true, null, { kind: room.kind, room, snapshot, selfId }),
  snapshot: applyRoomSnapshot,
  connection: (message) => {
    ui["room-status"].textContent = message;
    ui["room-connection"].textContent = message
      ? "Connection interrupted. Retrying…"
      : "";
    ui["room-connection"].hidden = !message;
  },
  disconnected: (message) => {
    menu();
    ui["room-screen"].hidden = false;
    ui["room-setup"].hidden = false;
    ui["room-lobby"].hidden = true;
    ui["room-status"].textContent = message;
  },
});
const palette = {
  ink: 0x263650,
  cream: 0xf0f2f3,
  gold: 0xefb546,
  red: 0xc94732,
  blue: 0x6c8fb8,
  brass: 0xb98442,
};
const enamelColors = new Map([
  [0xf5e9c9, palette.cream],
  [0xd5f65b, palette.gold],
  [0xf1533f, palette.red],
  [0x52c9c1, palette.blue],
  [0xd99c4b, palette.brass],
  [0x203f49, 0x344158],
  [0x10202a, 0x1a2232],
  [0x86cbd9, 0xa6bfd7],
]);
let renderer, scene, camera, world, menuWorld, hero, bossModel, exitModel, halo;
let viewRig,
  receiptFX,
  friend,
  repairModels = [];
let damageBearing = 0,
  radioUntil = 0;
let presentationFX,
  lockFX,
  ending = null,
  endingDestination = "result",
  endingAt = 0,
  endingFinished = false,
  endingLine = -1;
let goldEnabled = false;
let briefingRemaining = 0;
let floorEffects,
  rescueUntil = 0,
  pendingOverlay = "",
  crew = [];
let dashTaught = false;
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const credits = createCredits(ui["credits-screen"], {
  reducedMotion,
  onExit: (reveal) => {
    if (reveal) {
      ui["discovery-screen"].hidden = false;
      ui["discovery-continue"].focus({ preventScroll: true });
    } else {
      ui["settings-screen"].hidden = false;
      ui["open-credits"].focus();
    }
  },
});
let fpsCamera,
  weapon,
  ceiling,
  visorModels = [],
  beltMeshes = [];
let fpsYaw = Math.PI,
  fpsPitch = 0,
  viewOverhead = false,
  wasFPS = false;
let accumulator = 0,
  runKind = "campaign",
  practiceLevel = 0,
  dailyAttempt = null,
  dailyLog = [];
let campaignRun = null,
  boardScope = "daily",
  boardRequest = 0;
const saves = checkpointStore();
let savedCampaign = null,
  saveWrites = Promise.resolve(),
  saveError = "",
  restoring = false;
let selectedStage = 0,
  dailyConfig = null,
  submitting = false,
  requestingDaily = false;
const progress = readProgress(),
  floating = [];
let lastAmmoPop = -1;
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
  "audit_drone",
  "visor",
  "director",
];

const isFPS = () =>
  mode === "playing" &&
  game.state === "playing" &&
  game.fpsTime > 0 &&
  !viewOverhead;
const activeCamera = () => ending?.camera || viewRig?.camera || camera;

function drawLobby(room, selfId) {
  const key = JSON.stringify([room.code, room.phase, room.players, room.host]);
  if (key === roomViewKey) return;
  roomViewKey = key;
  ui["room-setup"].hidden = true;
  ui["room-lobby"].hidden = false;
  ui["room-code"].textContent = room.code;
  ui["room-description"].textContent =
    room.kind === "coop"
      ? "Shared Shift: one ammo bag, two vacuums, no friendly fire."
      : "Snackdown: first to 7 KOs, or the most KOs after three minutes.";
  ui["room-roster"].replaceChildren();
  for (let i = 0; i < 2; i++) {
    const member = room.players[i],
      li = document.createElement("li"),
      small = document.createElement("small");
    li.append(document.createTextNode(member ? member.name : "VACANCY"));
    small.textContent = !member
      ? "WAITING FOR A COLLEAGUE"
      : `${member.id === selfId ? "YOU · " : ""}${member.connected ? "CONNECTED" : "RECONNECTING"}`;
    li.append(small);
    ui["room-roster"].append(li);
  }
  const host = selfId === room.host,
    ready = room.players.length === 2 && room.players.every((p) => p.connected);
  ui["room-start"].disabled = !host || !ready;
  ui["room-start"].textContent = !ready
    ? "WAITING FOR A COLLEAGUE"
    : !host
      ? "WAITING FOR THE HOST"
      : "START THE MATCH";
  ui["room-close"].textContent = "Leave room";
  ui["room-rematch"].disabled = !host || !ready;
  ui["room-rematch-note"].textContent = !ready
    ? "Your colleague left. Return to the menu to create another room."
    : host
      ? "Same colleagues. Fresh floorplan."
      : "Waiting for the host to start a rematch.";
}

async function joinRoom(kind, code) {
  if (roomBusy) return;
  roomBusy = true;
  ui["room-status"].textContent = "Connecting…";
  for (const id of ["create-coop", "create-versus", "join-room"])
    ui[id].disabled = true;
  try {
    await sound.start();
    await rooms.connect(kind, ui["room-name"].value.trim(), code);
  } catch (error) {
    ui["room-status"].textContent = error.message;
  } finally {
    roomBusy = false;
    for (const id of ["create-coop", "create-versus", "join-room"])
      ui[id].disabled = false;
  }
}

function applyRoomSnapshot(snapshot) {
  if (!game.multiplayer || building || mode !== "playing") return;
  const selfId = game.selfId;
  Object.assign(game, snapshot);
  networkSeen = clock;
  const localEvents = snapshot.events.filter(
    (event) =>
      !["damage", "heal", "overtime", "shot", "crumb", "dash"].includes(
        event.type,
      ) || event.playerId === selfId,
  );
  for (const event of localEvents) {
    if (event.type === "revive")
      showMessage(
        "BACK ON THE CLOCK",
        event.playerId === selfId
          ? "Your colleague repaired you."
          : "Your partner is back in the fight.",
        2,
      );
    if (event.type === "knockout")
      showMessage(
        `${event.victim} CLEANED OUT`,
        "Dropped crumbs refill your ammo.",
        2,
      );
  }
  handleEvents(localEvents);
}

function finishRoom() {
  const coop = game.multiplayer.kind === "coop",
    won = coop ? game.state === "won" : game.multiplayer.winner === game.selfId;
  ui["result-eyebrow"].textContent = coop ? "SHARED SHIFT" : "SNACKDOWN";
  ui["result-title"].innerHTML =
    game.multiplayer.reason === "draw"
      ? "Dirty <em>draw.</em>"
      : won
        ? "Clean <em>victory.</em>"
        : "Cleaned <em>out.</em>";
  ui["result-comment"].textContent =
    game.multiplayer.reason === "disconnect"
      ? "A colleague disconnected. Return for another shift."
      : coop
        ? won
          ? "Management removed. Both vacuums checked out together."
          : "The store won this shift. Keep your colleague close for a repair."
        : "Every KO spills ammo. Leave nothing for your colleague.";
  ui["final-score"].textContent = coop
    ? game.score.toLocaleString("en-US")
    : `${game.player.kills} KOs`;
  ui["result-stats"].textContent = game.players
    .map((p) => `${p.name}: ${p.kills} KOs · ${p.deaths} DOWN`)
    .join(" / ");
  ui["score-form"].hidden =
    ui["share-score"].hidden =
    ui["score-status"].hidden =
    ui["share-output"].hidden =
      true;
  ui["room-result"].hidden = false;
  ui.retry.hidden = true;
  ui.result.hidden = false;
}

function releaseLook() {
  if (document.pointerLockElement === ui.world) document.exitPointerLock();
}

function toggleView() {
  if (game.fpsTime <= 0) return;
  viewOverhead = !viewOverhead;
  if (viewOverhead) releaseLook();
  else fpsYaw = game.player.angle;
  pointerFire = false;
}

function floatText(text, x, z, kind = "ammo") {
  const el = document.createElement("span");
  el.className = `world-pop ${kind}`;
  el.textContent = text;
  ui["floating-fx"].append(el);
  floating.push({ el, x, z, start: clock, kind });
}

function applyLivery(model) {
  if (!model) return;
  markEmissive(model);
  model.traverse((node) => {
    if (!node.isMesh) return;
    node.userData.liveryColor ??= node.material.color.getHex();
    if (node.userData.liveryColor === palette.cream)
      node.material.color.setHex(goldEnabled ? 0xd9aa4d : palette.cream);
  });
}

function refreshProgressUI() {
  const count = visibleFloorCount(progress),
    discovered = count > 10;
  ui["route-count"].textContent = `${count} AISLES · ${count / 5} BOSSES`;
  ui["route-floors"].textContent = `${count} FLOORS`;
  ui["route-bosses"].textContent = `${count / 5} BOSS SHOWDOWNS`;
  ui["route-mission"].textContent = discovered
    ? count > 20
      ? "The crew is free. Find the keys and erase SHELF CONTROL's last backup."
      : "MOP-3 is free. Rescue the basement crew and shut down SHELF CONTROL."
    : "Reach the Director's checkout and rescue MOP-3.";
  ui.best.textContent = best
    ? `PERSONAL BEST ${best.toLocaleString("en-US")} · AISLE ${Math.min(bestFloor, count)}/${count}`
    : count > 20
      ? "THE LOCKED WING IS OPEN. FIND THE FOUR KEYS."
      : discovered
        ? "THE BASEMENT IS OPEN. NOBODY LEFT BEHIND."
        : "TEN AISLES. ONE FRIEND TO RESCUE.";
  ui["gold-toggle"].hidden = !progress.cleared.includes(19);
  ui["gold-toggle"].textContent = `GOLD VACUUM: ${goldEnabled ? "ON" : "OFF"}`;
  ui["gold-toggle"].setAttribute("aria-pressed", String(goldEnabled));
  refreshContinue();
}

function refreshContinue() {
  ui.start.innerHTML = savedCampaign
    ? "CONTINUE <span>▶</span>"
    : "PLAY <span>▶</span>";
  ui["new-campaign"].hidden = !savedCampaign;
  ui["save-summary"].hidden = !savedCampaign && !saveError;
  ui["save-summary"].textContent =
    saveError ||
    (savedCampaign
      ? `AISLE ${String(savedCampaign.floor).padStart(2, "0")} · ${savedCampaign.phase === "cleared" ? "UPGRADE READY" : LEVELS[savedCampaign.floor - 1].name.toUpperCase()}`
      : "");
  ui["pause-save-note"].textContent =
    runKind === "campaign"
      ? saveError ||
        `Continue returns to the start of aisle ${game.levelIndex + 1} with your saved kit.`
      : "Unlocked aisles stay saved. Your campaign save is kept.";
  ui["pause-menu-label"].textContent =
    runKind === "campaign" ? "SAVE & MAIN MENU" : "MAIN MENU";
}

function saveCampaign() {
  if (runKind !== "campaign" || !campaignRun) return;
  const value = makeCheckpoint(campaignRun.id, game, campaignRun.stages);
  saveWrites = saveWrites
    .then(() => saves.write(value))
    .then(() => {
      savedCampaign = value;
      saveError = "";
      refreshContinue();
    })
    .catch(() => {
      saveError =
        "Autosave unavailable. Keep this tab open to finish your shift.";
      refreshContinue();
    });
}

function clearCampaign() {
  saveWrites = saveWrites
    .then(() => saves.clear())
    .then(() => {
      savedCampaign = null;
      saveError = "";
      refreshContinue();
    })
    .catch(() => {
      saveError = "Your browser could not clear the saved shift.";
      refreshContinue();
    });
  return saveWrites;
}

async function continueCampaign() {
  if (building || restoring || !savedCampaign) return;
  restoring = true;
  ui.start.disabled = true;
  ui["new-campaign"].disabled = true;
  ui.start.textContent = "RESTORING SHIFT…";
  const checkpoint = savedCampaign;
  await sound.start();
  try {
    const restored = await restoreCampaign(
      checkpoint,
      checkpoint.stages,
      () => new Promise((resolve) => setTimeout(resolve, 0)),
    );
    await start(true, null, { checkpoint, restored });
    if (game.state === "playing") pause(true);
  } catch {
    saveError =
      "This saved shift could not be restored. You can start a new campaign.";
  } finally {
    restoring = false;
    ui.start.disabled = false;
    ui["new-campaign"].disabled = false;
    refreshContinue();
  }
}

function requestCampaign() {
  if (building || restoring) return;
  if (savedCampaign) {
    menu();
    ui["new-run-confirmation"].hidden = false;
    ui["keep-campaign"].focus();
  } else start(true, null, { briefing: true });
}

function finishEnding() {
  if (!ending || endingFinished) return;
  endingFinished = true;
  ending.update(ESCAPE_SECONDS, reducedMotion.matches);
  ui.cinema.hidden = true;
  ui[endingDestination].hidden = false;
  if (endingDestination === "vault-discovery")
    ui["vault-continue"].focus({ preventScroll: true });
}

function beginEscape(destination = "result") {
  endingDestination = destination;
  ending = escapeScene({
    world,
    game,
    cloneAsset,
    markEmissive,
    instanceAsset,
    label,
    fromCamera: activeCamera(),
    scene,
    keyLight,
    fillLight,
  });
  endingAt = clock;
  ending.update(0, reducedMotion.matches);
  ui.result.hidden =
    ui["upgrade-screen"].hidden =
    ui.hud.hidden =
    ui.pause.hidden =
      true;
  ui.cinema.hidden = false;
  ui["skip-ending"].textContent =
    destination === "vault-discovery"
      ? "CONTINUE THE STORY"
      : "SKIP TO RESULTS";
  ui.message.classList.remove("show");
  particles.length = 0;
  weapon.visible = false;
  sound.effect("escape");
}

function updateBossBar() {
  const boss = game.boss;
  if (!boss || boss.hp <= 0 || ending || paused) {
    ui["boss-bar"].hidden = true;
    return;
  }
  const point = new THREE.Vector3(boss.x, 3.7, boss.z).project(activeCamera());
  const visible =
    point.z > -1 && point.z < 1 && Math.abs(point.x) < 1.15 && point.y > -1.2;
  ui["boss-bar"].hidden = !visible;
  if (!visible) return;
  const half = ui["boss-bar"].offsetWidth / 2;
  const minY = innerHeight < 560 ? 115 : innerWidth < 700 ? 205 : 155;
  ui["boss-bar"].style.left =
    `${clamp((point.x * 0.5 + 0.5) * innerWidth, half + 8, innerWidth - half - 8)}px`;
  ui["boss-bar"].style.top =
    `${clamp((-point.y * 0.5 + 0.5) * innerHeight, minY, innerHeight - 145)}px`;
}

function chooseStage(index) {
  index = Math.min(index, visibleFloorCount(progress) - 1);
  selectedStage = index;
  ui["stage-title"].textContent =
    `AISLE ${String(index + 1).padStart(2, "0")} · ${LEVELS[index].name}`;
  ui["stage-description"].textContent = LEVELS[index].tagline;
  ui["practice-start"].textContent =
    `START FROM AISLE ${String(index + 1).padStart(2, "0")}`;
  ui["practice-start"].disabled = index > progress.unlocked;
  drawRoute(ui["route-map"], progress, index, chooseStage);
}

function openRoute() {
  if (mode === "playing") pause(true);
  ui["route-close"].textContent =
    mode === "playing" ? "BACK TO PAUSE" : "MAIN MENU";
  refreshProgressUI();
  ui["route-screen"].hidden = false;
  chooseStage(mode === "playing" ? game.levelIndex : progress.unlocked);
}

function openDaily(board = false, scope = "daily") {
  boardScope = scope;
  const general = scope === "general";
  ui["daily-screen"].classList.toggle("board-view", board);
  ui["board-tabs"].hidden = !board;
  ui["board-eyebrow"].textContent = board
    ? "EMPLOYEE RECORDS"
    : "ONE DAY. SAME MESS. EVERYBODY.";
  ui["daily-title"].innerHTML = board
    ? "High <em>scores.</em>"
    : "Daily <em>rush.</em>";
  ui["daily-intro"].textContent = board
    ? general
      ? "Your best campaign run, starting from aisle one."
      : "Today's best runs. Same challenge for everyone."
    : "Survive 90 seconds. Chain takedowns. Climb the shared board.";
  ui["daily-start"].hidden = general;
  ui["board-campaign-start"].hidden = !general;
  ui["board-heading-title"].textContent = general
    ? "CAMPAIGN TOP 30"
    : "TODAY'S TOP 30";
  ui["board-note"].textContent = general
    ? "Your best campaign score. No daily reset. Level Select runs do not count."
    : "Your best daily score. Resets at 00:00 UTC.";
  ui["board-results"].setAttribute("aria-labelledby", `board-${scope}`);
  for (const kind of ["daily", "general"]) {
    ui[`board-${kind}`].setAttribute("aria-selected", String(kind === scope));
    ui[`board-${kind}`].tabIndex = kind === scope ? 0 : -1;
  }
  ui["daily-screen"].hidden = false;
  refreshBoard();
}

async function refreshBoard() {
  const request = ++boardRequest,
    scope = boardScope;
  ui["daily-start"].disabled = true;
  ui["daily-status"].textContent = "Loading scores…";
  ui.leaderboard.replaceChildren();
  ui["board-results"].setAttribute("aria-busy", "true");
  try {
    const config = scope === "daily" ? await api("/api/daily") : null;
    const board = await api(
      config
        ? `/api/leaderboard?day=${config.day}`
        : "/api/leaderboard?scope=general",
    );
    if (request !== boardRequest) return;
    const count = `${board.players} player${board.players === 1 ? "" : "s"}`;
    if (config) {
      dailyConfig = config;
      ui["daily-date"].textContent = config.day;
      ui["daily-status"].textContent = `${config.day} UTC · ${count}`;
      ui["daily-start"].disabled = false;
    } else ui["daily-status"].textContent = `ALL TIME · ${count}`;
    drawBoard(ui.leaderboard, board.entries);
  } catch (error) {
    if (request !== boardRequest) return;
    if (scope === "daily") dailyConfig = null;
    ui["daily-status"].textContent =
      `${error.message} Campaign and practice are still available.`;
  } finally {
    if (request === boardRequest)
      ui["board-results"].setAttribute("aria-busy", "false");
  }
}

async function startDaily() {
  if (building || requestingDaily) return;
  requestingDaily = true;
  ui["daily-start"].disabled = true;
  try {
    const attempt = await api("/api/runs", {});
    await start(true, null, { kind: "daily", attempt });
  } catch (error) {
    ui["daily-screen"].hidden = false;
    ui["daily-status"].textContent = error.message;
  } finally {
    requestingDaily = false;
    ui["daily-start"].disabled = false;
  }
}

async function submitScore(event) {
  event.preventDefault();
  const campaign = runKind === "campaign",
    context = campaign ? campaignRun : dailyAttempt;
  if (!context || submitting || !["lost", "won"].includes(game.state)) return;
  const payload = campaign ? { stages: context.stages } : { inputs: dailyLog };
  const current = () => (campaign ? campaignRun : dailyAttempt) === context;
  submitting = true;
  ui["submit-score"].disabled = true;
  ui["score-status"].hidden = false;
  ui["score-status"].textContent = "Verifying your run…";
  try {
    const name = ui["score-name"].value.trim();
    const attempt = campaign ? await context.ready : context;
    if (!attempt)
      throw new Error(
        context.error || "This run could not connect to the leaderboard.",
      );
    if (!current()) return;
    const result = await api(
      `/api/${campaign ? "campaign/" : ""}runs/${attempt.id}/score`,
      { name, ...payload },
      campaign ? 120000 : 12000,
    );
    if (!current()) return;
    ui["score-status"].textContent =
      `VERIFIED · ${campaign ? "General" : "Daily"} rank: #${result.rank} · ${result.score.toLocaleString("en-US")} points`;
    ui["score-form"].hidden = true;
    try {
      localStorage.setItem("hft-alias", name);
    } catch {
      /* Optional local alias. */
    }
    if (campaign) campaignRun = null;
    else dailyAttempt = null;
  } catch (error) {
    if (current()) ui["score-status"].textContent = error.message;
  } finally {
    submitting = false;
    ui["submit-score"].disabled = false;
  }
}

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

function recolorEnamel(model) {
  // Repaint cached materials at assembly time, keeping verified recipe sources intact.
  model.traverse((node) => {
    if (!node.isMesh) return;
    const materials = Array.isArray(node.material)
      ? node.material
      : [node.material];
    for (const material of materials) {
      const color = enamelColors.get(material.color?.getHex());
      if (color !== undefined) material.color.setHex(color);
    }
  });
}

function compactActor(model) {
  recolorEnamel(model);
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
    node.material.emissive.setHex(active ? palette.gold : 0x000000);
    node.material.emissiveIntensity = active ? 0.25 : 0;
  });
}

function makeRing(radius, color, arc = Math.PI * 2) {
  // Ground rings and sprites are interface/effect geometry, not imported objects.
  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.8,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const object = new THREE.Mesh(
    new THREE.RingGeometry(radius, radius + 0.055, 40, 1, 0, arc),
    material,
  );
  object.rotation.x = -Math.PI / 2;
  object.position.y = 0.025;
  object.userData.ownMaterial = true;
  ownedGeometry.push(object.geometry);
  return object;
}

function label(text, color = "#efb546", width = 3.8) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 80;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#263650e6";
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
  const material = new THREE.MeshBasicMaterial({
    color,
    toneMapped: false,
  });
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

function speak(speaker, text, seconds = 9) {
  const person = SPEAKERS[speaker];
  ui["radio-portrait"].innerHTML = portrait(speaker);
  ui["radio-speaker"].textContent = `${person.name} / ${person.role}`;
  ui["radio-line"].textContent = text;
  ui.radio.style.borderColor = person.color;
  ui["radio-log"].innerHTML = storyCard(speaker, text);
  radioUntil = clock + seconds;
  ui.radio.hidden = false;
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
    ((p.x + p.z) / 2) % 2 ? 0xaab6c4 : 0xffffff,
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
      node.userData.ownTexture?.dispose();
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
  visorModels = [];
  repairModels = [];
  friend = null;
  crew = [];
  peerModels = [];
  beltMeshes = [];
  floating.splice(0).forEach((f) => f.el.remove());
  const theme = game.map.level.theme;
  const accent = {
    boiler: 0xd98652,
    transit: 0x87a9d5,
    packing: 0xc6a052,
    security: 0xa49cbd,
    core: 0x7ea8c1,
    vault: 0xb49b70,
  }[theme];
  const tiles = [],
    scale = 2 / prototypes.floor.userData.nativeSize.x;
  for (let row = 0; row < game.map.height; row++)
    for (let col = 0; col < game.map.width; col++) {
      if (game.map.level.map[row][col] === " ") continue;
      tiles.push({
        x: col * 2,
        z: row * 2,
        col,
        row,
        scale,
        y: -0.12 * scale,
      });
    }
  instanceAsset("floor", tiles, world, (p) => {
    if (game.map.level.map[p.row][p.col] === "#") return 0x8a8490;
    if (theme === "ice") return (p.col + p.row) % 2 ? 0x94adca : 0xd2dfec;
    if (theme === "warehouse") return (p.col + p.row) % 2 ? 0x778694 : 0xa4b0ba;
    if (theme === "rush") return (p.col + p.row) % 2 ? 0x7a7270 : 0x999088;
    if (theme === "food") return (p.col + p.row) % 2 ? 0xb1b7b8 : 0x7e94aa;
    if (theme === "dock") return (p.col + p.row) % 2 ? 0x8491a4 : 0x6a7388;
    if (theme === "conveyor") return (p.col + p.row) % 2 ? 0xabb5bb : 0x738099;
    if (theme === "director") return (p.col + p.row) % 2 ? 0x75839a : 0xb2b7be;
    if (accent) return (p.col + p.row) % 2 ? accent : 0x5d6b7b;
    return (p.col + p.row) % 2 ? 0x738092 : 0x98a3b0;
  });
  const chunks = new Map();
  for (const wall of game.map.walls) {
    const key = `${Math.floor(wall.col / 5)},${Math.floor(wall.row / 5)}`;
    if (!chunks.has(key)) chunks.set(key, new THREE.Group());
    const border =
      wall.col === 0 ||
      wall.row === 0 ||
      wall.col === game.map.width - 1 ||
      wall.row === game.map.height - 1 ||
      [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ].some(
        ([dx, dz]) =>
          game.map.level.map[wall.row + dz]?.[wall.col + dx] === " ",
      );
    const object = cloneAsset(theme === "ice" || border ? "freezer" : "shelf");
    object.position.set(wall.x, 0, wall.z);
    if (border)
      object.rotation.y =
        wall.col === 0 || wall.col === game.map.width - 1 ? Math.PI / 2 : 0;
    if (border) {
      const faces = [
        [0, 1, 0],
        [1, 0, Math.PI / 2],
        [0, -1, Math.PI],
        [-1, 0, -Math.PI / 2],
      ];
      const front = faces.find(([dx, dz]) => {
        const c = game.map.level.map[wall.row + dz]?.[wall.col + dx];
        return c && !["#", " "].includes(c);
      });
      if (front) object.rotation.y = front[2];
    }
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
    const ring = makeRing(0.6, palette.gold);
    ring.position.set(item.x, 0.025, item.z);
    world.add(model, ring);
    batteries.push({ model, ring, i });
    const sign = label("★ OVERTIME", "#ffe094", 2.1);
    sign.position.set(item.x, 1.35, item.z);
    world.add(sign);
    batteries.at(-1).sign = sign;
  }
  for (const [i, item] of game.repairs.entries()) {
    const model = cloneAsset("battery"),
      ring = makeRing(0.65, palette.red);
    markEmissive(model);
    model.traverse((node) => {
      if (!node.isMesh) return;
      node.material.color.setHex(palette.cream);
      node.material.emissive.setHex(palette.red);
      node.material.emissiveIntensity = 0.12;
    });
    model.position.set(item.x, 0.12, item.z);
    const sign = label("♥ +1 REPAIR", "#ff8065", 2.1);
    sign.position.set(item.x, 1.2, item.z);
    ring.position.set(item.x, 0.035, item.z);
    world.add(model, ring, sign);
    repairModels.push({ model, ring, sign, i });
  }
  for (const [i, item] of game.visors.entries()) {
    const model = cloneAsset("visor"),
      ring = makeRing(0.65, palette.blue);
    model.position.set(item.x, 0.35, item.z);
    ring.position.set(item.x, 0.03, item.z);
    world.add(model, ring);
    visorModels.push({ model, ring, i });
  }
  if (game.map.belts.length) {
    // The conveyor reuses the verified floor module and moving crumb lights.
    const beltTiles = instanceAsset(
      "floor",
      game.map.belts.map((b) => ({ ...b, y: -0.08, scale })),
      world,
    );
    for (const { mesh } of beltTiles) {
      mesh.material = mesh.material.clone();
      mesh.userData.ownMaterial = true;
      mesh.material.color.setHex(0x344158);
    }
    beltMeshes = instanceAsset(
      "snack",
      game.map.belts.flatMap((b) =>
        [-0.6, 0, 0.6].map((offset) => ({
          x: b.x + offset,
          z: b.z,
          y: 0.18,
          scale: 0.7,
          direction: b.direction,
          origin: b.x + offset,
        })),
      ),
      world,
    );
  }
  ceiling = new THREE.Group();
  const ceilingTiles = instanceAsset(
    "floor",
    tiles.map((t) => ({ ...t, y: 3.1 })),
    ceiling,
    () => 0x454c62,
  );
  const lamps = instanceAsset(
    "floor",
    tiles
      .filter(
        (t) =>
          t.col % 4 === 2 &&
          t.row % 4 === 2 &&
          game.map.level.map[t.row][t.col] !== "#",
      )
      .map((t) => ({ x: t.x, z: t.z, y: 3.03, scale: 0.55 })),
    ceiling,
  );
  for (const { mesh } of [...ceilingTiles, ...lamps]) {
    mesh.material = mesh.material.clone();
    mesh.userData.ownMaterial = true;
    mesh.material.emissive.setHex(
      lamps.some((l) => l.mesh === mesh) ? 0xe7f1ff : 0x33394d,
    );
    mesh.material.emissiveIntensity = lamps.some((l) => l.mesh === mesh)
      ? 1.1
      : 0.65;
  }
  ceiling.visible = false;
  world.add(ceiling);
  hero = compactActor(await ASSET("assets/vacuum.js", { keepHierarchy: true }));
  hero.traverse((node) => {
    if (node.name === "wheel") node.userData.spinning = true;
  });
  world.add(hero);
  if (!game.multiplayer) applyLivery(hero);
  if (game.multiplayer) {
    markEmissive(hero);
    const tint =
      game.players[0].id === game.selfId ? palette.blue : palette.red;
    hero.traverse((n) => {
      if (n.isMesh && n.material.color.getHex() === palette.red)
        n.material.color.setHex(tint);
    });
    for (const peer of game.players.filter((p) => p.id !== game.selfId)) {
      const model = compactActor(
        await ASSET("assets/vacuum.js", { keepHierarchy: true }),
      );
      markEmissive(model);
      const color = game.players[0].id === peer.id ? palette.blue : palette.red;
      model.traverse((n) => {
        if (n.isMesh && n.material.color.getHex() === palette.red)
          n.material.color.setHex(color);
      });
      model.position.set(peer.x, 0, peer.z);
      const ring = makeRing(0.65, color),
        name = label(peer.name, "#f0f2f3", 2.3);
      world.add(model, ring, name);
      peerModels.push({ id: peer.id, model, ring, name });
    }
  }
  weapon?.removeFromParent();
  const gunSource = compactActor(
    await ASSET("assets/vacuum.js", { keepHierarchy: true }),
  );
  const nozzle = gunSource.userData.joints.nozzle;
  nozzle.removeFromParent();
  nozzle.position.set(0, 0, 0);
  nozzle.rotation.set(0, Math.PI, 0);
  weapon = new THREE.Group();
  weapon.add(nozzle);
  weapon.scale.setScalar(0.38);
  fpsCamera.add(weapon);
  halo = makeRing(0.52, palette.cream);
  world.add(halo);
  for (const enemy of game.enemies) {
    const model = compactActor(
      await ASSET(
        `assets/${["shooter", "sniper"].includes(enemy.kind) ? "audit_drone" : ["ambusher", "layer"].includes(enemy.kind) ? "polisher" : "security_trolley"}.js`,
        { keepHierarchy: true },
      ),
    );
    markEmissive(model);
    if (["armoured", "shieldcart", "sniper", "layer"].includes(enemy.kind)) {
      model.scale.setScalar(enemy.kind === "sniper" ? 1.1 : 1.25);
      model.traverse((n) => {
        if (n.isMesh && n.material.color.getHex() === palette.red)
          n.material.color.setHex(
            { sniper: 0x5d88bd, layer: 0xa879ab, shieldcart: 0x738697 }[
              enemy.kind
            ] || palette.brass,
          );
      });
      if (enemy.kind !== "armoured") {
        const tag = label(
          {
            sniper: "SNIPER",
            layer: "MINE LAYER",
            shieldcart: "FRONT SHIELD",
          }[enemy.kind],
          "#f0f2f3",
          2,
        );
        tag.position.y = 1.4;
        tag.userData.enemyLabel = true;
        model.add(tag);
      }
    }
    world.add(model);
    enemies.push(model);
  }
  exitModel = cloneAsset("checkout");
  exitModel.position.set(game.map.exit.x, 0, game.map.exit.z);
  exitModel.rotation.y = Math.PI;
  world.add(exitModel);
  if ([9, 14, 19].includes(game.levelIndex) && !game.daily) {
    friend = compactActor(
      await ASSET("assets/polisher.js", { keepHierarchy: true }),
    );
    friend.position.set(game.map.exit.x - 0.7, 0, game.map.exit.z);
    friend.scale.setScalar(0.65);
    markEmissive(friend, true);
    world.add(friend);
    const name = label(
      game.levelIndex === 9 ? "MOP-3 · RESCUE" : "BASEMENT CREW",
      "#f0f2f3",
      2.6,
    );
    name.position.set(game.map.exit.x, 1.65, game.map.exit.z);
    world.add(name);
    crew.push(friend);
    if (game.levelIndex === 19)
      for (let i = 0; i < 2; i++) {
        const robot = cloneAsset("vacuum");
        robot.scale.setScalar(0.8);
        robot.position.set(game.map.exit.x + 0.7 + i * 0.7, 0, game.map.exit.z);
        world.add(robot);
        crew.push(robot);
      }
  }
  exitModel.visible = !game.daily && game.multiplayer?.kind !== "versus";
  const checkoutLabel = label("CHECKOUT", "#f0f2f3", 2.5);
  checkoutLabel.position.set(game.map.exit.x, 2.05, game.map.exit.z);
  world.add(checkoutLabel);
  checkoutLabel.visible = !game.daily && game.multiplayer?.kind !== "versus";
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
      await ASSET(
        `assets/${game.boss.director ? "director" : "security_trolley"}.js`,
        {
          keepHierarchy: true,
        },
      ),
    );
    bossModel.scale.setScalar(game.boss.director ? 1.35 : 2.9);
    bossModel.position.set(game.boss.x, 0, game.boss.z);
    markEmissive(bossModel);
    const bossTint =
      game.boss.kind === "locksmith"
        ? palette.gold
        : game.boss.kind === "foreman"
          ? palette.brass
          : game.boss.kind === "core"
            ? palette.blue
            : null;
    if (bossTint)
      bossModel.traverse((node) => {
        if (node.isMesh && node.material.color.getHex() === palette.red)
          node.material.color.setHex(bossTint);
      });
    world.add(bossModel);
  }
  shotPool = pool(
    game.multiplayer ? 0xffffff : game.upgrades.frost ? 0xa4ddff : palette.gold,
    160,
  );
  receiptFX = receiptEffects(world, ownedGeometry);
  world.add(shotPool);
  floorEffects = campaignEffects({
    world,
    game,
    cloneAsset,
    makeRing,
    label,
    markEmissive,
  });
  lockFX = lockEffects({
    world,
    game,
    cloneAsset,
    markEmissive,
    makeRing,
    label,
  });
  ui["key-ring"].hidden = !game.keycards.length;
  ui["key-ring"].innerHTML = KEY_TYPES.filter((key) =>
    game.keycards.some((card) => card.color === key.id),
  )
    .map(
      (key) =>
        `<span class="key-slot" data-key="${key.id}" style="--key-color:${key.color}" aria-label="${key.label} key missing">${keyIcon(key.id)}<b>${key.label}</b></span>`,
    )
    .join("");
  presentationFX = presentationEffects({
    world,
    game,
    cloneAsset,
    makeRing,
    label,
    markEmissive,
    ownedGeometry,
  });
  if (game.levelIndex >= 10) {
    const sign = label(game.map.level.shape, "#e3eaf4", 5.5);
    sign.position.set(game.map.start.x + 2, 2.3, game.map.start.z - 3);
    world.add(sign);
  }
  keyLight.color.setHex(
    theme === "ice" ? 0xd9e9ff : theme === "boss" ? 0xffd7d0 : 0xf2f6ff,
  );
  fillLight.color.setHex(theme === "ice" ? 0xadc7e7 : 0xc2cbdf);
  scene.background.setHex(theme === "ice" ? 0x344766 : palette.ink);
  follow.set(game.player.x, 0, game.player.z);
  const radio = game.daily
    ? {
        speaker: "mop",
        text: "Keep moving. Repairs restore one heart; batteries grant invincibility.",
      }
    : RADIO[game.levelIndex];
  speak(radio.speaker, radio.text);
  lastState = "playing";
  lastOvertime = false;
  ui.department.textContent = game.daily
    ? `DAILY RUSH · ${game.daily.day}`
    : game.map.level.department;
  ui["floor-name"].textContent = game.map.level.name;
  ui.quota.textContent = game.daily ? " CRUMBS" : ` / ${game.map.level.quota}`;
  ui["clock-label"].textContent = game.daily
    ? "SURVIVE THE RUSH"
    : "STORE CLOSES";
  ui["run-badge"].textContent = game.daily
    ? "DAILY · SAME CHALLENGE FOR EVERYONE"
    : runKind === "practice"
      ? "PRACTICE · UNLOCKED AISLE"
      : `ESCAPE ROUTE · ${game.levelIndex + 1} / ${visibleFloorCount(progress)}`;
  ui["boss-name"].textContent = game.boss?.name || "THE MANAGER";
  ui.game.classList.toggle("boss-encounter", !!game.boss);
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

async function start(fresh = true, upgrade, options = {}) {
  if (building) return;
  building = true;
  credits.hide();
  clearInput();
  releaseLook();
  accumulator = 0;
  viewOverhead = false;
  viewRig.reset();
  damageUntil = 0;
  rescueUntil = 0;
  pendingOverlay = "";
  ending = null;
  endingFinished = false;
  endingLine = -1;
  briefingRemaining = 0;
  ui.game.classList.remove("briefing");
  wasFPS = false;
  fpsPitch = 0;
  await sound.start();
  if (fresh) {
    runKind = options.kind || "campaign";
    practiceLevel = options.level || 0;
    dailyAttempt = options.attempt || null;
    dailyLog = [];
    campaignRun = null;
    game =
      options.restored?.game ||
      (options.room
        ? Object.assign(
            newMatch(
              options.room.kind,
              options.room.seed,
              options.room.players,
            ),
            options.snapshot,
            { selfId: options.selfId },
          )
        : dailyAttempt
          ? newDaily(dailyAttempt.config)
          : newGame(practiceLevel, {
              seed: crypto.getRandomValues(new Uint32Array(1))[0],
              ...(runKind === "practice" ? { baseHp: 3, ammo: 10 } : {}),
            }));
    if (runKind === "campaign") {
      const run = {
        id:
          options.checkpoint?.id ||
          Array.from(crypto.getRandomValues(new Uint32Array(4)), (n) =>
            n.toString(16).padStart(8, "0"),
          ).join(""),
        stages: structuredClone(options.checkpoint?.stages || [{ inputs: [] }]),
        error: null,
      };
      campaignRun = run;
      // Register without delaying Play; record from the very first simulation tick.
      run.ready = api(
        options.checkpoint ? "/api/campaign/resume" : "/api/campaign/runs",
        options.checkpoint
          ? {
              seed: game.seed,
              ruleset: CAMPAIGN_RULESET,
              stages: options.checkpoint.stages,
            }
          : { seed: game.seed },
        options.checkpoint ? 120000 : 12000,
      ).catch((error) => {
        run.error = error.message;
        return null;
      });
    }
    runKills = options.restored?.kills || 0;
    runCrumbs = options.restored?.crumbs || 0;
    runShots = options.restored?.shots || 0;
    runTime = options.restored?.time || 0;
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
    if (campaignRun) campaignRun.stages.push({ upgrade, inputs: [] });
    game = next;
  }
  saveCampaign();
  ui["new-run-confirmation"].hidden = true;
  for (const id of [
    "menu",
    "hero-label",
    "footer",
    "pause-screen",
    "upgrade-screen",
    "result",
    "route-screen",
    "daily-screen",
    "settings-screen",
    "room-screen",
    "discovery-screen",
    "vault-discovery",
    "cinema",
    "briefing",
  ])
    ui[id].hidden = true;
  mode = "playing";
  paused = false;
  menuWorld.visible = false;
  ui.hud.hidden = false;
  ui.pause.hidden = false;
  ui.game.classList.add("playing");
  ui.game.classList.toggle("multiplayer", !!game.multiplayer);
  ui["room-result"].hidden = true;
  ui["ending-crew"].hidden = true;
  ui["gold-reward"].hidden = true;
  ui.retry.hidden = false;
  ui["peer-status"].hidden = !game.multiplayer;
  ui["pause-room-note"].hidden = !game.multiplayer;
  ui["pause-retry"].hidden = !!game.multiplayer;
  ui["pause-route"].hidden = !!game.multiplayer;
  ui["restart-label"].textContent = game.daily
    ? "RETRY DAILY RUSH"
    : "RESTART RUN";
  ui["restart-note"].textContent = game.daily
    ? "Retry today's challenge from zero."
    : `Start over from aisle ${runKind === "practice" ? practiceLevel + 1 : 1}.`;
  try {
    await buildWorld();
    if (game.state === "cleared") handleEvents([]);
    if (game.multiplayer) {
      ui["radio-line"].textContent =
        game.multiplayer.kind === "coop"
          ? "Shared ammo. Stay beside a downed partner for two seconds to revive them."
          : "First to 7 KOs. Batteries grant five seconds of invincibility. Grab the dropped crumbs.";
      ui["run-badge"].textContent =
        `${game.multiplayer.kind === "coop" ? "SHARED SHIFT" : "SNACKDOWN"} · ROOM ${options.room.code}`;
    }
    if (
      (options.briefing || game.levelIndex === 20) &&
      game.state === "playing" &&
      !game.daily &&
      !game.multiplayer
    ) {
      briefingRemaining = 6;
      ui.briefing.hidden = false;
      ui["briefing-countdown"].textContent = "Starting in 6…";
      ui.game.classList.add("briefing");
      ui.pause.hidden = true;
      ui.message.classList.remove("show");
      radioUntil = 0;
      const mission =
        game.levelIndex === 20
          ? "Find the red triangle key, then approach a red lock. You keep each key for the whole aisle. The last backup is in the vault."
          : MISSION;
      ui["briefing-mop"].innerHTML = ui["radio-log"].innerHTML = storyCard(
        "mop",
        mission,
      );
    } else if (game.state === "playing")
      showMessage(
        game.daily ? "DAILY RUSH" : game.map.level.name,
        game.daily
          ? "90 seconds. Every crumb and takedown counts."
          : game.map.level.tagline,
        3,
      );
  } catch (error) {
    reportError(error);
  }
  building = false;
}

function finishBriefing() {
  if (briefingRemaining <= 0) return;
  briefingRemaining = 0;
  ui.briefing.hidden = true;
  ui.game.classList.remove("briefing");
  ui.pause.hidden = false;
  showMessage(
    `AISLE ${String(game.levelIndex + 1).padStart(2, "0")}`,
    game.levelIndex >= 20
      ? game.map.level.tagline
      : "Eat crumbs to reload. Reach the checkout.",
    2.5,
  );
}

function pause(value = !paused) {
  if (mode !== "playing" || game.state !== "playing" || building) return;
  paused = value;
  if (value) {
    releaseLook();
    sound.update(false, 0, game.map.level.theme);
  }
  accumulator = 0;
  clearInput();
  ui["pause-screen"].hidden = !value;
  ui.briefing.hidden = value || briefingRemaining <= 0;
  if (!value) sound.start();
}

function menu() {
  credits.hide();
  rooms.leave();
  roomViewKey = "";
  clearInput();
  mode = "menu";
  campaignRun = null;
  dailyAttempt = null;
  dailyLog = [];
  briefingRemaining = 0;
  ui.game.classList.remove("briefing");
  viewRig.reset();
  ending = null;
  pendingOverlay = "";
  rescueUntil = 0;
  scene.background.setHex(palette.ink);
  keyLight.color.setHex(0xf2f6ff);
  fillLight.color.setHex(0xc2cbdf);
  refreshProgressUI();
  applyLivery(menuHero);
  paused = false;
  if (world) world.visible = false;
  releaseLook();
  if (weapon) weapon.visible = false;
  menuWorld.visible = true;
  for (const id of ["menu", "hero-label", "footer"]) ui[id].hidden = false;
  for (const id of [
    "hud",
    "pause",
    "result",
    "pause-screen",
    "upgrade-screen",
    "route-screen",
    "daily-screen",
    "settings-screen",
    "room-screen",
    "discovery-screen",
    "vault-discovery",
    "cinema",
    "shield-visor",
    "briefing",
  ])
    ui[id].hidden = true;
  ui.game.classList.remove("playing", "overtime", "multiplayer");
  ui.message.classList.remove("show");
  resize();
}

function handleEvents(events) {
  for (const event of events) {
    sound.effect(event.type, game.collected);
    if (["key-found", "door-open", "door-locked"].includes(event.type)) {
      const key = keyType(event.color);
      if (event.type === "key-found") {
        burst(event.x, event.z, key.enamel, 28, 2.5);
        floatText(
          `${key.symbol} ${key.label} KEY!`,
          event.x,
          event.z,
          "shield-pop",
        );
        showMessage(
          `${key.label} KEY ACQUIRED`,
          `Approach a ${key.label.toLowerCase()} ${key.symbol} lock. You keep the key.`,
          2.4,
        );
      } else if (event.type === "door-open") {
        burst(event.x, event.z, key.enamel, 18, 1.4);
        floatText(`${key.symbol} ACCESS OPEN`, event.x, event.z, "shield-pop");
      } else
        showMessage(
          `${key.symbol} ${key.label} KEY NEEDED`,
          "Find the matching key on your map, then come back.",
          1.6,
        );
    }
    if (event.type === "crumb") {
      burst(event.x, event.z, palette.gold, 5, 1.3);
      if (clock - lastAmmoPop > 0.18) {
        floatText("+2 AMMO", event.x, event.z);
        lastAmmoPop = clock;
      }
    }
    if (event.type === "visor") {
      viewOverhead = false;
      fpsYaw = game.player.angle;
      fpsPitch = 0;
      pointerFire = false;
      burst(event.x, event.z, palette.blue, 50, 3);
      showMessage(
        "VAC CAM ONLINE",
        "18 seconds of rapid fire. V switches your view.",
        3,
      );
      floatText("+24 AMMO", event.x, event.z);
    }
    if (event.type === "wave")
      showMessage(`WAVE ${event.wave}`, "Fresh crumbs. Faster colleagues.", 2);
    if (event.type === "shield-save") {
      presentationFX?.hit(clock);
      floatText(
        game.player.shield > 0
          ? "SHIELD BLOCKED IT"
          : "SHIELD BROKEN · HIT BLOCKED",
        event.x,
        event.z,
        "shield-pop",
      );
      burst(event.x, event.z, 0xb4d9ff, 26, 2.5);
    }
    if (event.type === "lob-impact")
      burst(event.x, event.z, palette.gold, 35, 3);
    if (event.type === "drone-warning")
      burst(event.x, event.z, palette.red, 8, 0.5);
    if (event.type === "receipt-impact")
      burst(event.x, event.z, palette.cream, 5, 1.2);
    if (event.type === "heal") {
      floatText("♥ +1 REPAIRED", event.x, event.z, "heal-pop");
      burst(event.x, event.z, palette.red, 20, 1.6);
      ui.health.animate(
        [
          { filter: "brightness(2)", transform: "scale(1.15)" },
          { filter: "brightness(1)", transform: "scale(1)" },
        ],
        { duration: 550 },
      );
    }
    if (event.type === "shot") recoil = 1;
    if (event.type === "transport") {
      burst(event.x, event.z, palette.blue, 30, 3);
      burst(event.toX, event.toZ, palette.blue, 30, 3);
      floatText("SPECIAL DELIVERY!", event.toX, event.toZ, "shield-pop");
      viewRig.beginTransit(reducedMotion.matches);
      follow.set(event.toX, 0, event.toZ);
    }
    if (
      [
        "mine-burst",
        "mine-defused",
        "flour-burst",
        "stock-hit",
        "ricochet",
      ].includes(event.type)
    ) {
      const flour = event.type === "flour-burst";
      burst(
        event.x,
        event.z,
        flour ? palette.cream : palette.gold,
        flour ? 70 : 20,
        flour ? 4 : 2,
      );
      if (flour) floatText("BLINDED!", event.x, event.z, "shield-pop");
      if (event.type === "stock-hit")
        floatText("EXPRESS DELIVERY!", event.x, event.z, "shield-pop");
    }
    if (event.type === "hit") burst(event.x, event.z, palette.cream, 6, 2.5);
    if (event.type === "shield") burst(event.x, event.z, palette.blue, 3, 1.5);
    if (event.type === "charge-warning")
      burst(event.x, event.z, palette.red, 10, 0.7);
    if (event.type === "charge") burst(event.x, event.z, palette.blue, 14, 2);
    if (event.type === "enemy-down") {
      burst(event.x, event.z, palette.red, 32, 4);
      viewKick = 0.1;
      const model =
        enemies[game.enemies.findIndex((e) => e.id === event.enemyId)];
      if (model) model.userData.fallAt = clock;
      floatText(
        event.combo > 1
          ? `${event.combo}× HOSTILE TAKEOVER!`
          : [
              "MY WARRANTY!",
              "I JUST GOT PROMOTED!",
              "PLEASE KEEP THE RECEIPT.",
            ][game.kills % 3],
        event.x,
        event.z,
        "ko-pop",
      );
    }
    if (event.type === "dash") {
      dashTaught = true;
      burst(event.x, event.z, palette.blue, 15, 1.5);
      if (game.elapsed < 20)
        floatText("DODGE · PROTECTED", event.x, event.z, "shield-pop");
    }
    if (event.type === "damage") {
      damageUntil = clock + 0.85;
      damageBearing = Math.atan2(event.fromX - event.x, event.fromZ - event.z);
      burst(event.x, event.z, palette.red, 25, 3);
      floatText("♥ −1", event.x, event.z, "heart-pop");
      ui.health.animate(
        [
          { transform: "scale(1.2) translateX(-5px)" },
          { transform: "translateX(5px)" },
          { transform: "scale(1)" },
        ],
        { duration: 450 },
      );
    }
    if (event.type === "empty")
      showMessage(
        "CRUMBS ARE AMMO.",
        "Collect a few more and keep firing.",
        1.5,
      );
    if (event.type === "overtime") {
      burst(event.x, event.z, palette.gold, 55, 5);
      viewKick = 0.12;
      showMessage(
        "OVERTIME! YOU'RE INVINCIBLE.",
        "Touch flashing enemies to scrap them. Unlimited ammo!",
        2.3,
      );
    }
    if (event.type === "exit-open")
      showMessage(
        game.keycards.some((card) => !card.collected)
          ? "CRUMBS READY. KEYS STILL MISSING."
          : game.boss?.hp > 0
            ? "QUOTA DONE. ONE COMPLAINT LEFT."
            : "TIME TO CHECK OUT!",
        game.keycards.some((card) => !card.collected)
          ? "Explore the branches and collect the marked keys."
          : game.boss?.hp > 0
            ? `Defeat ${game.boss.name || "the Manager"}, then reach the checkout.`
            : "Follow the gold marker to the checkout.",
        3,
      );
    if (event.type === "boss-down") {
      burst(game.boss.x, game.boss.z, palette.red, 100, 8);
      viewKick = 0.35;
      showMessage(
        "MANAGEMENT HAS LEFT THE BUILDING.",
        game.levelIndex === 19
          ? "SHELF CONTROL is offline. Get the crew to the checkout!"
          : game.levelIndex === 24
            ? "The last backup is gone. Every door leads out now!"
            : game.levelIndex === 14
              ? "The basement crew is free. Find the core!"
              : game.boss.director
                ? "MOP-3 is free. Reach the checkout and get your friend out!"
                : "Access card acquired. MOP-3 is in the control wing.",
        3,
      );
    }
  }
  if (game.state === lastState) return;
  lastState = game.state;
  clearInput();
  releaseLook();
  if (game.multiplayer) {
    finishRoom();
    return;
  }
  const firstDirectorRescue =
    !game.daily && game.levelIndex === 9 && !progress.cleared.includes(9);
  if (!game.daily && ["cleared", "won"].includes(game.state))
    unlock(progress, game.levelIndex);
  refreshProgressUI();
  if (game.state === "cleared") {
    saveCampaign();
    ui["upgrade-screen"].hidden = false;
    ui["chapter-story"].hidden = ![9, 14].includes(game.levelIndex);
    if (game.levelIndex === 9)
      ui["chapter-story"].innerHTML = storyCard(
        "mop",
        "I'm free! But BUFF-0 and the basement crew are still trapped. The Director was just middle management. We're going back in.",
      );
    if (game.levelIndex === 14)
      ui["chapter-story"].innerHTML = storyCard(
        "buff",
        "You fired the Foreman! We'll get the crew ready. Five more floors to the core. Try not to become spare parts.",
      );
    if ([9, 14].includes(game.levelIndex)) {
      rescueUntil = clock + 2.6;
      pendingOverlay =
        game.levelIndex === 9
          ? firstDirectorRescue
            ? "credits-screen"
            : "discovery-screen"
          : "upgrade-screen";
      ui["upgrade-screen"].hidden = true;
      showMessage(
        "COLLEAGUE RESCUED!",
        "Nobody gets left on the night shift.",
        2.6,
      );
    }
    drawRoute(ui["upgrade-route"], progress, game.levelIndex + 1);
    ui["upgrade-options"].replaceChildren();
    for (const key of upgradeChoices(game)) {
      const data = UPGRADES[key],
        button = document.createElement("button");
      button.dataset.upgrade = key;
      button.innerHTML = `<div class="upgrade-art">${upgradeArt(key, game.upgrades[key], game.baseHp)}</div><div class="upgrade-stats">${upgradeStats(key, game.upgrades[key], game.baseHp)}</div><small>${data.tag} · LV ${game.upgrades[key] + 1}</small><h3>${data.name}</h3><p>${data.description(game.upgrades[key])}</p><b>EQUIP & CONTINUE <span>▶</span></b>`;
      button.onclick = () => start(false, key);
      ui["upgrade-options"].append(button);
    }
    ui["checkout-repair"].textContent =
      game.player.hp < game.player.maxHp
        ? "♥ CHECKOUT REPAIR: +1 HEART ON DEPARTURE"
        : "♥ HEALTH FULL · CHECKOUT REPAIRS 1 HEART WHEN NEEDED";
    ui["next-aisle"].textContent =
      `NEXT: ${LEVELS[game.levelIndex + 1].name.toUpperCase()} · ${LEVELS[game.levelIndex + 1].tagline}`;
    if (game.levelIndex === 19) {
      goldEnabled = true;
      try {
        localStorage.setItem("hft-gold-v1", "on");
      } catch {
        /* Optional cosmetic preference. */
      }
      refreshProgressUI();
      beginEscape("vault-discovery");
    }
    return;
  }
  if (!["lost", "won"].includes(game.state)) return;
  if (runKind === "campaign") clearCampaign();
  const won = game.state === "won",
    previousBest = best;
  if (runKind === "campaign") {
    best = Math.max(best, game.score);
    bestFloor = Math.max(bestFloor, game.levelIndex + 1);
  }
  try {
    localStorage.setItem(
      "hft-record-v1",
      JSON.stringify({ score: best, floor: bestFloor }),
    );
  } catch {
    /* Storage is optional in private browser modes. */
  }
  ui.best.textContent = `PERSONAL BEST ${best.toLocaleString("en-US")} · AISLE ${Math.min(bestFloor, visibleFloorCount(progress))}/${visibleFloorCount(progress)}`;
  ui["result-eyebrow"].textContent = game.daily
    ? `DAILY RUSH · ${game.daily.day}`
    : won
      ? "SHIFT COMPLETE"
      : "PERFORMANCE REVIEW";
  ui["result-title"].innerHTML =
    game.daily && won
      ? "Rush <em>survived.</em>"
      : won
        ? "Locks <em>broken.</em>"
        : game.time <= 0
          ? "Clocked <em>out.</em>"
          : "You <em>suck.</em>";
  ui["result-comment"].textContent = game.daily
    ? "Same challenge. Unlimited retries. Only your best score counts."
    : won
      ? "The Locksmith scrapped. Last backup erased. Every colleague is finally off the clock."
      : game.time <= 0
        ? "Store closed. Your overtime was not approved."
        : "Occupational hazard. No compensation.";
  ui["final-score"].textContent = game.score.toLocaleString("en-US");
  ui["result-stats"].textContent =
    `${runKind === "campaign" && game.score > previousBest ? "NEW PERSONAL BEST · " : ""}${game.daily ? `${game.elapsed.toFixed(1)}s` : `AISLE ${game.levelIndex + 1}/${visibleFloorCount(progress)}`} · ${runKills + game.kills} TAKEDOWNS · ${runCrumbs + game.collected} CRUMBS`;
  ui["score-form"].hidden = !(dailyAttempt || campaignRun);
  ui["share-score"].hidden = !game.daily;
  ui["score-status"].hidden = !campaignRun?.error;
  if (campaignRun?.error) {
    ui["score-form"].hidden = true;
    ui["score-status"].textContent =
      "Your personal best is saved here. This run could not connect to the shared board.";
  }
  ui["share-output"].hidden = true;
  ui.retry.innerHTML = game.daily
    ? "RETRY TODAY'S RUSH <span>▶</span>"
    : "ONE MORE SHIFT <span>▶</span>";
  ui.result.hidden = false;
  ui["ending-crew"].hidden = !won || !!game.daily;
  ui["gold-reward"].hidden = true;
  if (won && !game.daily) {
    ui["ending-crew"].innerHTML = ["mop", "buff", "mop"]
      .map((id) => portrait(id))
      .join("");
    refreshProgressUI();
    ui["gold-icon"].innerHTML =
      '<img src="./favicon.svg" alt="Golden vacuum reward">';
    beginEscape();
  }
}

function renderActor(actor) {
  if (!game.multiplayer) return actor;
  // Extrapolation is visual only; the server snapshot remains the gameplay authority.
  const age = Math.min(0.12, Math.max(0, clock - networkSeen));
  const x = actor.x + actor.vx * age,
    z = actor.z + actor.vz * age;
  return {
    ...actor,
    x: canStand(game, x, actor.z) ? x : actor.x,
    z: canStand(game, actor.x, z) ? z : actor.z,
  };
}

function updateModels(dt) {
  if (!hero || ending) return;
  const p = renderActor(game.player),
    moving = Math.hypot(p.vx, p.vz),
    overtime = game.overtime > 0;
  const scale =
    (overtime ? 1.23 + Math.sin(clock * 23) * 0.015 : 1) *
    (reducedMotion.matches
      ? 1
      : 1 - Math.sin(viewRig.transitProgress * Math.PI) * 0.18);
  hero.position.set(
    p.x,
    moving > 0.2 ? Math.abs(Math.sin(clock * 22)) * 0.045 : 0,
    p.z,
  );
  hero.rotation.set(
    Math.sin(clock * 22) * moving * 0.003,
    p.angle,
    game.multiplayer && p.hp <= 0
      ? -0.6
      : Math.cos(clock * 14) * moving * 0.004,
  );
  hero.scale.setScalar(scale);
  hero.visible = halo.visible = viewRig.blend < 0.75;
  ceiling.visible = viewRig.blend > 0.98;
  weapon.visible = viewRig.blend > 0.92 && viewRig.transitProgress > 0.9;
  const portraitFPS = innerWidth < 700 && innerHeight > innerWidth;
  weapon.scale.setScalar(portraitFPS ? 0.32 : 0.38);
  weapon.position.set(
    (portraitFPS ? 0.05 : 0.19) + Math.sin(clock * 10) * moving * 0.001,
    -0.23 -
      (1 - viewRig.blend) * 3 -
      Math.abs(Math.sin(clock * 10)) * moving * 0.002,
    -0.39 + recoil * 0.04,
  );
  const joints = hero.userData.joints;
  if (joints?.nozzle) joints.nozzle.rotation.x = recoil * -0.22;
  if (joints?.lid)
    joints.lid.rotation.x = -0.12 - (overtime ? 0.18 : 0) - recoil * 0.12;
  hero.traverse((node) => {
    if (node.userData.spinning) node.rotation.x += moving * dt * 4;
  });
  halo.position.set(p.x, 0.025, p.z);
  halo.scale.setScalar(overtime ? 1.5 : p.dash > 0 ? 1.3 : 1);
  halo.material.color.setHex(overtime ? palette.gold : palette.cream);
  if (p.dash > 0) halo.material.color.setHex(0x93d3ff);
  halo.material.opacity =
    p.invincible > 0 ? 0.35 + Math.sin(clock * 20) * 0.25 : 0.8;
  if (overtime !== lastOvertime) {
    markEmissive(hero, overtime);
    lastOvertime = overtime;
    ui.game.classList.toggle("overtime", overtime);
  }
  if (overtime)
    hero.traverse((node) => {
      if (node.isMesh)
        node.material.emissiveIntensity = reducedMotion.matches
          ? 0.6
          : 0.5 + (Math.sin(clock * 6) + 1) * 0.22;
    });
  for (const [i, model] of enemies.entries()) {
    const enemy = game.enemies[i];
    const fall = clock - (model.userData.fallAt ?? -10);
    model.visible = enemy.respawn <= 0 || fall < 0.65;
    model.position.set(
      enemy.x,
      (["shooter", "sniper"].includes(enemy.kind) ? 0.25 : 0) +
        Math.abs(Math.sin(clock * 12 + i)) * 0.045,
      enemy.z,
    );
    model.rotation.set(
      Math.sin(clock * 16 + i) * 0.03,
      enemy.angle,
      enemy.hit > 0 ? Math.sin(clock * 100) * 0.17 : 0,
    );
    if (enemy.respawn > 0 && fall < 0.65 && !reducedMotion.matches) {
      model.rotation.z = fall * 5;
      model.rotation.y += fall * 8;
      model.position.y += Math.sin((fall / 0.65) * Math.PI) * 1.1;
    }
    model.traverse((node) => {
      if (node.userData.enemyLabel) node.visible = !overtime;
      if (node.isMesh) {
        node.material.emissive.setHex(
          enemy.hit > 0
            ? 0xffffff
            : enemy.windup > 0 || enemy.charge > 0 || enemy.tell > 0
              ? palette.red
              : overtime
                ? palette.gold
                : enemy.frozen > 0
                  ? 0xa4ddff
                  : 0,
        );
        node.material.emissiveIntensity =
          enemy.hit > 0
            ? 0.7
            : enemy.windup > 0 || enemy.tell > 0
              ? 0.3 + Math.abs(Math.sin(clock * 24)) * 0.8
              : enemy.charge > 0
                ? 0.5
                : overtime
                  ? reducedMotion.matches
                    ? 0.7
                    : 0.5 + (Math.sin(clock * 6) + 1) * 0.4
                  : enemy.frozen > 0
                    ? 0.7
                    : 0.18;
      }
      if (node.name === "wheel") node.rotation.x += dt * 12;
      if (node.name.startsWith("brush")) node.rotation.y += dt * 18;
    });
  }
  for (const { model, ring, sign, i } of batteries) {
    const item = game.batteries[i];
    model.visible = ring.visible = !item.collected;
    model.position.y = 0.18 + Math.sin(clock * 3 + i) * 0.12;
    model.rotation.y = clock * 0.8;
    ring.scale.setScalar(1 + Math.sin(clock * 4) * 0.08);
    sign.visible =
      !item.collected && Math.hypot(item.x - p.x, item.z - p.z) < 9;
    ring.material.opacity = reducedMotion.matches
      ? 1
      : 0.7 + Math.sin(clock * 6) * 0.25;
    model.traverse((node) => {
      if (node.isMesh)
        node.material.emissiveIntensity = reducedMotion.matches
          ? 0.6
          : 0.55 + Math.sin(clock * 6) * 0.25;
    });
  }
  for (const { model, ring, sign, i } of repairModels) {
    const item = game.repairs[i];
    model.visible = ring.visible = sign.visible = !item.collected;
    model.position.y = 0.15 + Math.sin(clock * 3) * 0.06;
    ring.material.opacity = game.player.hp < game.player.maxHp ? 0.8 : 0.3;
  }
  if (friend) friend.rotation.y = Math.sin(clock * 2) * 0.3;
  if (rescueUntil > clock) {
    for (const [i, robot] of crew.entries()) {
      const phase = (3 - (rescueUntil - clock)) / 3;
      robot.position.lerp(
        vector.set(
          p.x + (i - 1) * 0.8,
          reducedMotion.matches ? 0 : Math.abs(Math.sin(phase * 14 + i)) * 0.3,
          p.z - 0.9,
        ),
        Math.min(1, dt * 3),
      );
      robot.rotation.y = reducedMotion.matches
        ? Math.PI
        : phase * Math.PI * 4 + i;
    }
    if (!reducedMotion.matches && Math.random() < dt * 10)
      burst(p.x, p.z, palette.gold, 12, 2.5);
  }
  for (const peer of peerModels) {
    const data = renderActor(game.players.find((p) => p.id === peer.id));
    peer.model.position.lerp(
      vector.set(data.x, 0.02, data.z),
      Math.min(1, dt * 20),
    );
    peer.model.rotation.set(0, data.angle, data.hp <= 0 ? -0.6 : 0);
    peer.ring.position.set(data.x, 0.04, data.z);
    peer.ring.scale.setScalar(data.hp <= 0 ? 1.35 : 1);
    peer.ring.material.opacity =
      data.hp <= 0 ? 0.4 + Math.sin(clock * 8) * 0.3 : 0.8;
    peer.name.position.set(data.x, 1.35, data.z);
  }
  for (const { model, ring, i } of visorModels) {
    const item = game.visors[i];
    model.visible = ring.visible = !item.collected;
    model.position.y = 0.28 + Math.sin(clock * 3) * 0.1;
    model.rotation.y = clock * 0.7;
  }
  for (const { mesh, local } of beltMeshes) {
    let i = 0;
    for (const b of game.map.belts)
      for (const offset of [-0.6, 0, 0.6]) {
        transform.position.set(
          b.x + ((clock * 2.3 * b.direction + offset + 1000) % 1.8) - 0.9,
          0.16,
          b.z,
        );
        transform.rotation.set(0, 0, 0);
        transform.scale.set(0.9, 0.3, 5);
        transform.updateMatrix();
        mesh.setMatrixAt(i++, transform.matrix.clone().multiply(local));
      }
    mesh.instanceMatrix.needsUpdate = true;
  }
  for (const { model, ring, data } of gates) {
    const closed = gateClosed(game, data.col, data.row);
    model.position.y +=
      ((closed ? 0 : -1.4) - model.position.y) * Math.min(1, dt * 15);
    ring.material.color.setHex(closed ? palette.red : palette.gold);
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
    !game.daily && game.multiplayer?.kind !== "versus" && checkoutReady(game);
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
          boss.exposed ? palette.gold : palette.red,
        );
        node.material.emissiveIntensity = boss.hit > 0 ? 0.8 : 0.1;
      }
    });
  }
  for (const [batch, shots] of [[shotPool, game.bullets]]) {
    batch.count = Math.min(shots.length, batch.instanceMatrix.count);
    for (let i = 0; i < batch.count; i++) {
      const b = shots[i];
      transform.position.set(b.x, 0.72, b.z);
      transform.rotation.set(0, Math.atan2(b.vx, b.vz), 0);
      transform.scale.set(0.7, 0.7, 3);
      transform.updateMatrix();
      batch.setMatrixAt(i, transform.matrix);
      if (game.multiplayer)
        batch.setColorAt(
          i,
          new THREE.Color(
            b.owner === game.selfId
              ? palette.gold
              : game.multiplayer.kind === "coop"
                ? palette.blue
                : palette.red,
          ),
        );
    }
    batch.instanceMatrix.needsUpdate = true;
    if (batch.instanceColor) batch.instanceColor.needsUpdate = true;
  }
  floorEffects?.update(game, clock, reducedMotion.matches);
  lockFX?.update(clock, reducedMotion.matches);
  presentationFX?.update(game, clock, viewRig.blend, reducedMotion.matches);
}

function screenPosition(x, y, z) {
  const projected = new THREE.Vector3(x, y, z).project(activeCamera());
  return {
    x: (projected.x * 0.5 + 0.5) * innerWidth,
    y: (-projected.y * 0.5 + 0.5) * innerHeight,
  };
}

function updateCamera(dt, advance = true) {
  if (ending) {
    ending.update(
      endingFinished ? ESCAPE_SECONDS : clock - endingAt,
      reducedMotion.matches,
    );
    return;
  }
  const portrait = innerWidth < 700 && innerHeight > innerWidth;
  if (mode === "menu") {
    const target = portrait
      ? new THREE.Vector3(1.2, 0, 5.3)
      : new THREE.Vector3(-3.4, 0, 0.5);
    camera.position.copy(target).add(new THREE.Vector3(6, 11, 15));
    camera.lookAt(target);
  } else {
    const visual = renderActor(game.player);
    const margin = portrait ? 4 : 8;
    const x = clamp(visual.x, margin, (game.map.width - 1) * 2 - margin);
    const z = clamp(visual.z - 1.2, 5, (game.map.height - 1) * 2 - 5);
    follow.lerp(vector.set(x, 0, z), Math.min(1, dt * 7));
    const shake = Math.max(game.shake, viewKick);
    camera.position
      .copy(follow)
      .add(vector.set((Math.random() - 0.5) * shake, 26, 17));
    camera.lookAt(follow);
  }
  camera.updateMatrixWorld();
  if (mode === "playing") {
    const p = game.player;
    fpsCamera.position.set(
      p.x,
      0.8 +
        Math.sin(clock * 11) * Math.min(0.015, Math.hypot(p.vx, p.vz) * 0.003),
      p.z,
    );
    fpsCamera.lookAt(
      p.x + Math.sin(fpsYaw) * Math.cos(fpsPitch),
      fpsCamera.position.y + Math.sin(fpsPitch),
      p.z + Math.cos(fpsYaw) * Math.cos(fpsPitch),
    );
    fpsCamera.updateMatrixWorld();
  }
  viewRig.update(advance && !paused ? dt : 0, isFPS(), reducedMotion.matches);
}

function drawMap() {
  mini.clearRect(0, 0, 204, 156);
  mini.fillStyle = "#111c2aee";
  mini.fillRect(0, 0, 204, 156);
  const size = Math.min(200 / game.map.width, 152 / game.map.height);
  const ox = (204 - size * game.map.width) / 2,
    oz = (156 - size * game.map.height) / 2;
  const mark = (p, color, r) => {
    mini.fillStyle = color;
    mini.fillRect(
      ox + (p.x / 2 + 0.5) * size - r / 2,
      oz + (p.z / 2 + 0.5) * size - r / 2,
      r,
      r,
    );
  };
  for (let z = 0; z < game.map.height; z++)
    for (let x = 0; x < game.map.width; x++) {
      const char = game.map.level.map[z][x];
      if (char !== " ")
        mark(
          { x: x * 2, z: z * 2 },
          char === "#" ? "#657189" : "#2c3a4a",
          size - 1,
        );
    }
  for (const c of game.crumbs) if (!c.collected) mark(c, "#efb546", 2);
  for (const c of game.batteries) if (!c.collected) mark(c, "#efb546", 5);
  for (const c of game.visors) if (!c.collected) mark(c, "#a4c0e0", 5);
  for (const c of game.repairs)
    if (!c.collected) {
      mark(c, "#ff8065", 6);
      mark(c, "#fff", 2);
    }
  for (const door of game.doors) {
    if (door.open) continue;
    mark(door, keyType(door.color).color, Math.max(5, size));
    mark(door, "#18283c", 2);
  }
  for (const card of game.keycards) {
    if (card.collected) continue;
    const key = keyType(card.color);
    mark(card, "#18283c", 11);
    mini.fillStyle = key.color;
    mini.font = "bold 11px sans-serif";
    mini.textAlign = "center";
    mini.fillText(
      key.symbol,
      ox + (card.x / 2 + 0.5) * size,
      oz + (card.z / 2 + 0.5) * size + 4,
    );
  }
  for (const g of game.map.gates)
    mark(g, gateClosed(game, g.col, g.row) ? "#ff8065" : "#a4c0e0", 5);
  for (const p of game.map.portals)
    mark(p, p.pair === 0 ? "#8bbff4" : "#d0a4e8", 6);
  for (const v of game.map.vents)
    mark(v, ventPhase(game, v) === "active" ? "#ff6046" : "#b98442", 3);
  if (!game.daily && game.multiplayer?.kind !== "versus")
    mark(
      game.map.exit,
      game.collected >= game.map.level.quota ? "#efb546" : "#a4c0e0",
      7,
    );
  for (const e of game.enemies)
    if (e.respawn <= 0) mark(e, game.overtime > 0 ? "#a4c0e0" : "#ff8065", 4);
  if (game.boss?.hp > 0) mark(game.boss, "#ff8065", 8);
  for (const p of game.players || [])
    if (p.id !== game.selfId)
      mark(p, game.multiplayer.kind === "coop" ? "#a4c0e0" : "#ff6046", 6);
  mark(game.player, "#fff", 5);
}

function updateHud() {
  const nextKey = KEY_TYPES.find((key) =>
    game.keycards.some((card) => card.color === key.id && !card.collected),
  );
  for (const slot of ui["key-ring"].children) {
    const held = game.keyring.includes(slot.dataset.key);
    slot.classList.toggle("held", held);
    slot.classList.toggle("next", slot.dataset.key === nextKey?.id);
    slot.setAttribute(
      "aria-label",
      `${slot.dataset.key} key ${held ? "collected" : "missing"}`,
    );
  }
  ui.collected.textContent = game.collected;
  ui["quota-fill"].style.width =
    `${Math.min(100, (game.daily ? game.elapsed / 90 : game.collected / game.map.level.quota) * 100)}%`;
  ui["goal-label"].textContent = game.daily
    ? `WAVE ${game.wave} / 5 · KEEP MOVING`
    : nextKey
      ? `FIND ${nextKey.label} ${nextKey.symbol} KEY`
      : game.collected >= game.map.level.quota
        ? game.boss?.hp > 0
          ? `DEFEAT ${game.boss.name || "THE MANAGER"}`
          : "REACH THE CHECKOUT"
        : "CRUMBS TO COLLECT";
  const time = Math.ceil(game.time);
  ui.clock.textContent = `${String(Math.floor(time / 60)).padStart(2, "0")}:${String(time % 60).padStart(2, "0")}`;
  ui.clock.parentElement.classList.toggle("urgent", time < 20);
  const healthKey = `${game.player.hp}/${game.player.maxHp}`;
  if (ui.health.dataset.value !== healthKey) {
    ui.health.dataset.value = healthKey;
    ui.health.innerHTML = Array.from(
      { length: game.player.maxHp },
      (_, i) =>
        `<span class="heart ${i < game.player.hp ? "full" : "empty"}"><svg viewBox="0 0 32 30" aria-hidden="true"><path d="M16 28 3 15C-5 6 8-4 16 6c8-10 21 0 13 9z"/></svg></span>`,
    ).join("");
  }
  ui.health.classList.toggle("critical", game.player.hp === 1);
  ui["shield-count"].textContent =
    game.player.shield > 0
      ? `SHIELD · ${game.player.shield} HIT${game.player.shield === 1 ? "" : "S"}`
      : "";
  ui.health.setAttribute("aria-label", `${game.player.hp} health`);
  ui.ammo.textContent =
    game.overtime > 0 ? "∞" : String(game.ammo).padStart(2, "0");
  ui["ammo-fill"].style.width =
    `${game.overtime > 0 ? 100 : (game.ammo / (game.multiplayer?.kind === "coop" ? 150 : 99)) * 100}%`;
  ui["ammo-panel"].classList.toggle(
    "low-ammo",
    game.ammo < 10 && game.overtime <= 0,
  );
  ui["ammo-hint"].textContent =
    game.overtime > 0
      ? "UNLIMITED FIREPOWER"
      : game.ammo === 0
        ? "EMPTY! GRAB CRUMBS"
        : game.ammo < 10
          ? "LOW AMMO · EAT CRUMBS"
          : "CRUMBS REFILL AMMO";
  ui["visor-hud"].hidden = game.fpsTime <= 0;
  ui["crosshair"].hidden = !isFPS() || paused || game.state !== "playing";
  ui["visor-time"].textContent = game.fpsTime.toFixed(1);
  ui["view-toggle"].textContent = viewOverhead
    ? "FIRST PERSON [V]"
    : "OVERHEAD [V]";
  ui["visor-hint"].textContent = matchMedia("(pointer: coarse)").matches
    ? "Left stick moves · Right stick turns and fires"
    : document.pointerLockElement
      ? "Mouse aims · Click fires · V changes view"
      : "Click to lock aim · Drag to aim if unavailable";
  const dash = game.player.dash > 0;
  ui["dash-status"].innerHTML = dash
    ? "DODGING · PROTECTED"
    : game.player.dashCooldown > 0
      ? `DODGE RECHARGES IN ${game.player.dashCooldown.toFixed(1)}s`
      : "DASH TO DODGE HITS <kbd>SPACE</kbd>";
  ui["dash-button"].style.setProperty(
    "--recharge",
    `${(1 - game.player.dashCooldown / 1.2) * 100}%`,
  );
  ui["dash-button"].textContent = dash
    ? "SAFE!"
    : game.player.dashCooldown > 0
      ? game.player.dashCooldown.toFixed(1)
      : "DODGE";
  ui["dash-button"].classList.toggle("protecting", dash);
  ui["dash-lesson"].hidden =
    dashTaught || game.elapsed > 14 || paused || !!game.multiplayer;
  ui.score.textContent = String(game.score).padStart(6, "0");
  ui.combo.textContent =
    game.comboTimer > 0 ? `${game.combo}× TAKEDOWN COMBO` : "NIGHT SHIFT SCORE";
  ui.overtime.hidden = game.overtime <= 0;
  ui["overtime-time"].textContent = game.overtime.toFixed(1);
  ui["overtime-fill"].style.width =
    `${(game.overtime / (game.daily || game.multiplayer ? 5 : 8)) * 100}%`;
  ui.overtime.classList.toggle(
    "ending",
    game.overtime > 0 && game.overtime < 2,
  );
  ui["overtime-action"].textContent =
    game.overtime < 2
      ? "ENDING SOON · MAKE SPACE!"
      : "INVINCIBLE · TOUCH ENEMIES TO SCRAP THEM";
  if (game.boss) {
    ui["boss-fill"].style.width = `${(game.boss.hp / game.boss.maxHp) * 100}%`;
    ui["boss-bar"].classList.toggle("exposed", game.boss.exposed);
    ui["boss-state"].textContent = game.boss.exposed
      ? `SHIELD DOWN · ${Math.ceil(game.boss.hp)} / ${game.boss.maxHp}`
      : `ARMOURED · ${Math.ceil(game.boss.hp)} / ${game.boss.maxHp}`;
  }
  ui["heal-hint"].textContent = game.daily
    ? "♥ REPAIR KIT +1 · RESPAWNS IN 30s"
    : "♥ REPAIR KIT +1 · CHECKOUT +1";
  ui["radio"].hidden =
    clock > radioUntil || paused || game.elapsed < 3 || game.overtime > 0;
  const closeMine = game.mines.some(
    (m) =>
      m.blast > 0 && Math.hypot(m.x - game.player.x, m.z - game.player.z) < 2.4,
  );
  const closeSteam = game.map.vents.some(
    (v) =>
      ventPhase(game, v) !== "safe" &&
      Math.hypot(v.x - game.player.x, v.z - game.player.z) < 1.8,
  );
  const closeLob = game.lobs?.some(
    (shot) =>
      !shot.hit &&
      Math.hypot(shot.x - game.player.x, shot.z - game.player.z) <
        shot.radius + 0.4,
  );
  const closeWave = game.waves?.some(
    (wave) =>
      wave.radius > 0 &&
      Math.abs(
        Math.hypot(wave.x - game.player.x, wave.z - game.player.z) -
          wave.radius,
      ) < 2,
  );
  ui["hazard-cue"].hidden =
    paused ||
    game.state !== "playing" ||
    game.overtime > 0 ||
    (!closeMine && !closeSteam && !closeLob && !closeWave);
  ui["hazard-cue"].textContent = closeLob
    ? "INCOMING · LEAVE THE ORANGE CIRCLE!"
    : closeWave
      ? "SHOCKWAVE · DASH THROUGH!"
      : closeMine
        ? "MINE · DODGE OUT OF THE CIRCLE!"
        : "STEAM · DASH CLEAR OF THE TILE!";
  ui["damage-direction"].hidden = clock >= damageUntil || viewRig.blend < 0.8;
  ui["damage-direction"].style.transform =
    `rotate(${fpsYaw - damageBearing}rad)`;
  if (game.multiplayer) {
    const coop = game.multiplayer.kind === "coop",
      peer = game.players.find((p) => p.id !== game.selfId);
    ui["peer-status"].textContent =
      `${peer.name} · ${peer.hp > 0 ? "♥".repeat(peer.hp) : coop ? `DOWN · ${peer.revive.toFixed(1)} / 2s REVIVE` : `RESPAWN ${Math.ceil(peer.respawn)}s`} · ${peer.kills} KOs`;
    ui["heal-hint"].textContent =
      game.player.hp <= 0
        ? coop
          ? `DOWN · PARTNER REPAIR ${game.player.revive.toFixed(1)} / 2s`
          : `RESPAWN IN ${Math.ceil(game.player.respawn)}s`
        : coop
          ? "♥ KITS +1 · STAY NEAR PARTNER TO REVIVE"
          : "♥ KITS +1 · KOs DROP CRUMBS";
    ui["ammo-hint"].textContent = coop
      ? "SHARED AMMO BAG"
      : "CRUMBS REFILL AMMO";
    ui["clock-label"].textContent = "ROUND ENDS";
    ui.combo.textContent = coop ? "SHARED SHIFT SCORE" : "SNACKDOWN SCORE";
    if (!coop) {
      ui.collected.textContent = game.player.kills;
      ui.quota.textContent = " / 7 KOs";
      ui["goal-label"].textContent = "FIRST TO SEVEN";
      ui["quota-fill"].style.width = `${(game.player.kills / 7) * 100}%`;
    } else if (game.collected >= game.map.level.quota && game.boss.hp <= 0)
      ui["goal-label"].textContent = "BOTH VACUUMS TO CHECKOUT";
  }
  drawMap();
}

function readInput() {
  if (viewRig.transitProgress < 0.85) {
    dashQueued = false;
    return {};
  }
  let x =
    Number(keys.has("KeyD") || keys.has("ArrowRight")) -
    Number(keys.has("KeyA") || keys.has("ArrowLeft")) +
    stickMove.x;
  let z =
    Number(keys.has("KeyS") || keys.has("ArrowDown")) -
    Number(keys.has("KeyW") || keys.has("ArrowUp")) +
    stickMove.z;
  let aim;
  if (isFPS()) {
    if (stickAim.active) {
      fpsYaw -= stickAim.x * TICK * 2.7;
      fpsPitch = clamp(fpsPitch - stickAim.z * TICK * 0.65, -0.4, 0.4);
    }
    aim = fpsYaw;
    const lateral = x,
      forward = -z;
    x = forward * Math.sin(fpsYaw) - lateral * Math.cos(fpsYaw);
    z = forward * Math.cos(fpsYaw) + lateral * Math.sin(fpsYaw);
  } else if (stickAim.active) aim = Math.atan2(stickAim.x, stickAim.z);
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
    briefing: briefingRemaining > 0,
    credits: credits.snapshot,
    state: game.state,
    floor: game.levelIndex + 1,
    theme: game.map.level.theme,
    hp: game.player.hp,
    maxHp: game.player.maxHp,
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
      ? {
          ...game.boss,
          screen: screenPosition(game.boss.x, 0.4, game.boss.z),
        }
      : null,
    keyring: [...game.keyring],
    keycards: game.keycards.map((card) => ({
      ...card,
      screen: screenPosition(card.x, 1.2, card.z),
    })),
    doors: game.doors.map((door) => ({
      ...door,
      screen: screenPosition(door.x, 1, door.z),
    })),
    audio: {
      enabled: sound.enabled,
      state: sound.ctx?.state || "idle",
      score: sound.mode,
    },
    multiplayer: game.multiplayer
      ? {
          ...game.multiplayer,
          code: rooms.room?.code,
          selfId: game.selfId,
          players: game.players.map((p) => ({
            ...p,
            screen: screenPosition(p.x, 0.4, p.z),
          })),
          roomPhase: rooms.room?.phase,
        }
      : null,
    firstPerson: isFPS(),
    viewBlend: viewRig.blend,
    transitProgress: viewRig.transitProgress,
    cameraPosition: activeCamera().position.toArray(),
    shieldVisible: presentationFX?.shieldVisible || false,
    lobs: (game.lobs || []).map((shot) => ({ ...shot })),
    waves: (game.waves || []).map((wave) => ({ ...wave })),
    visibleFloors: visibleFloorCount(progress),
    endingTime: ending?.time ?? null,
    goldEnabled,
    shape: game.map.level.shape,
    seed: game.seed,
    repairs: game.repairs.map((r) => ({ ...r })),
    hazards: game.hazards.map((h) => ({ ...h })),
    fpsTime: game.fpsTime,
    fpsYaw,
    fpsPitch,
    pointerLocked: !!document.pointerLockElement,
    runKind,
    dailyDay: game.daily?.day,
    dailyTicks: dailyLog.reduce((sum, row) => sum + row[0], 0),
    visors: game.visors.map((v) => ({ ...v })),
    wave: game.wave,
    maxHp: game.player.maxHp,
    shield: game.player.shield,
    portals: game.map.portals.map((p) => ({ ...p })),
    transportCooldown: game.player.transportCooldown,
    vents: game.map.vents.map((v) => ({
      ...v,
      phaseState: ventPhase(game, v),
    })),
    mines: game.mines.map((m) => ({ ...m })),
    stock: game.stock.map((s) => ({
      ...s,
      screen: screenPosition(s.x, 0.4, s.z),
    })),
    unlocked: progress.unlocked + 1,
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
  if (briefingRemaining > 0 && !paused && !building) {
    if (briefingRemaining <= dt) finishBriefing();
    else {
      briefingRemaining -= dt;
      ui["briefing-countdown"].textContent =
        `Starting in ${Math.ceil(briefingRemaining)}…`;
    }
  }
  const active =
    mode === "playing" &&
    !paused &&
    !building &&
    !credits.active &&
    briefingRemaining === 0 &&
    game.state === "playing";
  ui.game.classList.toggle("dodging", active && game.player.dash > 0);
  if (game.multiplayer && mode === "playing") {
    rooms.controls(packInput(active ? readInput() : {}));
    accumulator = 0;
  } else if (active) {
    accumulator += dt;
    while (accumulator >= TICK && game.state === "playing" && !building) {
      const packed = packInput(readInput());
      if (game.daily) recordInput(dailyLog, packed);
      else if (campaignRun)
        recordInput(campaignRun.stages.at(-1).inputs, packed);
      handleEvents(stepGame(game, unpackInput(packed), TICK));
      accumulator -= TICK;
    }
  } else accumulator = 0;
  if (wasFPS && !isFPS()) releaseLook();
  wasFPS = isFPS();
  ui.game.classList.toggle("first-person", isFPS());
  ui.game.classList.toggle("visor-active", game.fpsTime > 0);
  credits.update(dt);
  sound.update(
    credits.active || active,
    credits.active ? 0 : game.overtime,
    credits.active ? "food" : game.map.level.theme,
  );
  ui["transit-effect"].style.opacity = String(
    mode === "playing" && !ending
      ? Math.sin(viewRig.transitProgress * Math.PI) * 0.8
      : 0,
  );
  ui["shield-visor"].hidden =
    !active || game.player.shield <= 0 || viewRig.blend < 0.8;
  if (ending && !endingFinished) {
    const age = clock - endingAt;
    const lines = game.levelIndex >= 20 ? VAULT_ESCAPE_LINES : ESCAPE_LINES;
    const line = lines.findLastIndex((entry) => age >= entry.at);
    if (line !== endingLine) {
      endingLine = line;
      ui["cinema-title"].textContent = lines[line].title;
      ui["cinema-line"].innerHTML = storyCard(
        lines[line].speaker,
        lines[line].text,
      );
    }
    if (age >= ESCAPE_SECONDS) finishEnding();
  }
  updateCamera(dt);
  if (mode === "playing" && !building) {
    if (!paused) updateModels(dt);
    if (!ending) receiptFX?.update(game, activeCamera(), canStand);
    updateBossBar();
    hudTime += dt;
    if (hudTime > 0.08) {
      hudTime = 0;
      updateHud();
    }
    const pos = screenPosition(game.map.exit.x, 2.4, game.map.exit.z);
    const open =
      !game.daily && game.multiplayer?.kind !== "versus" && checkoutReady(game);
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
  if (pendingOverlay && clock >= rescueUntil) {
    if (pendingOverlay === "credits-screen") credits.open(true);
    else ui[pendingOverlay].hidden = false;
    if (pendingOverlay === "discovery-screen")
      ui["discovery-continue"].focus({ preventScroll: true });
    pendingOverlay = "";
  }
  ui["hit-flash"].classList.toggle("active", clock < damageUntil);
  for (let i = floating.length - 1; i >= 0; i--) {
    const f = floating[i],
      age = clock - f.start;
    if (age > 1.25) {
      f.el.remove();
      floating.splice(i, 1);
      continue;
    }
    const pos = isFPS()
      ? { x: innerWidth * 0.55, y: innerHeight * 0.61 }
      : screenPosition(f.x, 0.85, f.z);
    f.el.style.left = `${pos.x + age * (f.kind === "heart-pop" ? 25 : 6)}px`;
    f.el.style.top = `${pos.y - age * 70}px`;
    f.el.style.opacity = Math.min(1, (1.25 - age) * 3);
  }
  renderer.render(scene, activeCamera());
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
  fpsCamera.aspect = aspect;
  fpsCamera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(devicePixelRatio, portrait ? 1.5 : 2));
  renderer.setSize(innerWidth, innerHeight, false);
  updateCamera(1, false);
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
  ui.start.onclick = () =>
    savedCampaign ? continueCampaign() : requestCampaign();
  ui["new-campaign"].onclick = requestCampaign;
  ui["keep-campaign"].onclick = () => {
    ui["new-run-confirmation"].hidden = true;
    ui.start.focus();
  };
  ui["replace-campaign"].onclick = () => start(true, null, { briefing: true });
  ui["open-settings"].onclick = () => {
    ui["settings-screen"].hidden = false;
    ui["reset-confirmation"].hidden = true;
    ui["reset-save"].hidden = false;
    ui["settings-status"].textContent = "";
    ui["reset-save"].focus();
  };
  ui["settings-close"].onclick = () => {
    ui["settings-screen"].hidden = true;
    ui["open-settings"].focus();
  };
  ui["open-credits"].onclick = async () => {
    await sound.start();
    ui["settings-screen"].hidden = true;
    credits.open();
  };
  ui["reset-save"].onclick = () => {
    ui["reset-save"].hidden = true;
    ui["reset-confirmation"].hidden = false;
    ui["cancel-reset"].focus();
  };
  ui["cancel-reset"].onclick = () => {
    ui["reset-confirmation"].hidden = true;
    ui["reset-save"].hidden = false;
    ui["reset-save"].focus();
  };
  ui["confirm-reset"].onclick = async () => {
    ui["confirm-reset"].disabled = true;
    try {
      await saveWrites;
      await saves.clear();
      for (const key of ["hft-route-v1", "hft-record-v1", "hft-gold-v1"])
        localStorage.removeItem(key);
    } catch {
      ui["settings-status"].textContent =
        "This browser could not reset its saved data.";
      return;
    } finally {
      ui["confirm-reset"].disabled = false;
    }
    savedCampaign = null;
    saveError = "";
    progress.unlocked = 0;
    progress.cleared = [];
    best = 0;
    bestFloor = 1;
    goldEnabled = false;
    refreshProgressUI();
    applyLivery(menuHero);
    ui["reset-confirmation"].hidden = true;
    ui["reset-save"].hidden = false;
    ui["settings-status"].textContent =
      "Local save reset. A fresh shift is ready.";
    ui["settings-close"].focus();
  };
  ui["briefing-continue"].onclick = finishBriefing;
  ui["discovery-continue"].onclick = () => {
    ui["discovery-screen"].hidden = true;
    ui["upgrade-screen"].hidden = false;
  };
  ui["skip-ending"].onclick = finishEnding;
  ui["vault-continue"].onclick = () => {
    ui["vault-discovery"].hidden = true;
    ui["upgrade-screen"].hidden = false;
  };
  ui["vault-menu"].onclick = menu;
  ui["gold-toggle"].onclick = () => {
    goldEnabled = !goldEnabled;
    try {
      localStorage.setItem("hft-gold-v1", goldEnabled ? "on" : "off");
    } catch {
      /* Optional cosmetic preference. */
    }
    applyLivery(menuHero);
    refreshProgressUI();
  };
  ui["open-rooms"].onclick = () => {
    ui["room-screen"].hidden = false;
    ui["room-setup"].hidden = !!rooms.session;
    ui["room-lobby"].hidden = !rooms.session;
    ui["room-close"].textContent = rooms.session ? "LEAVE ROOM" : "MAIN MENU";
    ui["room-status"].textContent = "";
  };
  ui["room-reconnect"].onclick = async () => {
    await sound.start();
    rooms.reconnect();
  };
  ui["create-coop"].onclick = () => joinRoom("coop");
  ui["create-versus"].onclick = () => joinRoom("versus");
  ui["join-room"].onclick = () => {
    const code = ui["join-code"].value.trim().toUpperCase();
    if (!/^[A-Z2-9]{6}$/.test(code)) {
      ui["room-status"].textContent = "Enter the six-character room code.";
      return;
    }
    joinRoom(null, code);
  };
  ui["room-close"].onclick = () => {
    rooms.leave();
    roomViewKey = "";
    ui["room-screen"].hidden = true;
  };
  const startRoom = async () => {
    try {
      await rooms.start();
    } catch (error) {
      ui["room-status"].textContent = ui["room-rematch-note"].textContent =
        error.message;
    }
  };
  ui["room-start"].onclick = ui["room-rematch"].onclick = startRoom;
  ui["copy-room"].onclick = async () => {
    const link = `${location.origin}${location.pathname}?room=${rooms.room.code}`;
    try {
      await navigator.clipboard.writeText(link);
      ui["copy-room"].textContent = "Invite copied";
    } catch {
      ui["room-status"].textContent =
        `Share room code ${rooms.room.code} with your colleague.`;
    }
  };
  const retry = () =>
    runKind === "daily"
      ? startDaily()
      : start(true, null, {
          kind: runKind,
          level: runKind === "practice" ? practiceLevel : 0,
        });
  ui.retry.onclick = retry;
  ui["pause-retry"].onclick = retry;
  ui["back-menu"].onclick = menu;
  ui.pause.onclick = () => pause();
  ui.resume.onclick = () => pause(false);
  ui["pause-menu"].onclick = async () => {
    await saveWrites;
    menu();
  };
  ui["open-route"].onclick = ui["pause-route"].onclick = openRoute;
  ui["route-close"].onclick = () => {
    ui["route-screen"].hidden = true;
  };
  ui["practice-start"].onclick = () =>
    start(true, null, { kind: "practice", level: selectedStage });
  ui["open-daily"].onclick = () => openDaily();
  ui["open-leaderboard"].onclick = () => openDaily(true);
  for (const kind of ["daily", "general"]) {
    ui[`board-${kind}`].onclick = () => openDaily(true, kind);
    ui[`board-${kind}`].onkeydown = (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
        return;
      event.preventDefault();
      event.stopPropagation();
      const next =
        event.key === "Home"
          ? "daily"
          : event.key === "End"
            ? "general"
            : kind === "daily"
              ? "general"
              : "daily";
      openDaily(true, next);
      ui[`board-${next}`].focus();
    };
  }
  ui["board-campaign-start"].onclick = requestCampaign;
  ui["daily-close"].onclick = () => {
    boardRequest++;
    ui["daily-screen"].hidden = true;
    ui["open-leaderboard"].focus();
  };
  ui["refresh-board"].onclick = refreshBoard;
  ui["daily-start"].onclick = startDaily;
  ui["view-toggle"].onclick = toggleView;
  ui["score-form"].onsubmit = submitScore;
  ui["share-score"].onclick = async () => {
    const result = `Hungry for Trouble · Daily Rush ${game.daily.day}\n${game.score.toLocaleString("en-US")} points · ${game.kills} takedowns · ${game.state === "won" ? "SURVIVED" : `${game.elapsed.toFixed(1)} seconds`}\nCan you clean up better? ${location.origin}${location.pathname}`;
    try {
      await navigator.clipboard.writeText(result);
      ui["share-score"].textContent = "Copied! Challenge a friend.";
    } catch {
      ui["share-output"].value = result;
      ui["share-output"].hidden = false;
      ui["share-output"].select();
    }
  };
  ui.sound.onclick = () => {
    const enabled = sound.toggle();
    ui.sound.textContent = enabled ? "SOUND ON" : "SOUND OFF";
    ui.sound.setAttribute("aria-pressed", String(enabled));
    if (enabled) sound.start();
  };
  for (const button of document.querySelectorAll("[data-upgrade]"))
    button.onclick = () => start(false, button.dataset.upgrade);
  addEventListener("keydown", (event) => {
    if (credits.active) {
      if (event.code === "Escape" && !event.repeat) credits.skip();
      return;
    }
    if (["INPUT", "TEXTAREA"].includes(event.target.tagName)) return;
    if (
      ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(
        event.code,
      )
    )
      event.preventDefault();
    if (event.code === "Escape" && !event.repeat) {
      if (!ui["settings-screen"].hidden) ui["settings-close"].click();
      else if (!ui["route-screen"].hidden) ui["route-screen"].hidden = true;
      else if (!ui["daily-screen"].hidden) ui["daily-screen"].hidden = true;
      else if (!ui["room-screen"].hidden) ui["room-close"].click();
      else pause();
    }
    if (event.code === "KeyV" && !event.repeat) toggleView();
    if (event.code === "Space" && !event.repeat) dashQueued = true;
    keys.add(event.code);
  });
  addEventListener("keyup", (event) => keys.delete(event.code));
  addEventListener("blur", () => {
    clearInput();
    if (mode === "playing" && !game.multiplayer) pause(true);
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      sound.update(false, 0, game.map.level.theme);
      clearInput();
      if (!game.multiplayer) pause(true);
    }
  });
  ui.world.addEventListener("pointermove", (event) => {
    if (event.pointerType !== "mouse") return;
    if (isFPS()) {
      if (document.pointerLockElement === ui.world || pointerFire) {
        fpsYaw -= event.movementX * 0.003;
        fpsPitch = clamp(fpsPitch - event.movementY * 0.002, -0.45, 0.45);
      }
      return;
    }
    pointer.set(
      (event.clientX / innerWidth) * 2 - 1,
      1 - (event.clientY / innerHeight) * 2,
    );
    pointerKnown = true;
  });
  ui.world.addEventListener("pointerdown", (event) => {
    if (event.button === 0 && event.pointerType === "mouse") {
      pointerFire = true;
      if (isFPS()) {
        if (!document.pointerLockElement)
          ui.world.requestPointerLock?.()?.catch(() => {});
        return;
      }
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
  document.addEventListener("pointerlockchange", () => {
    if (!document.pointerLockElement && isFPS() && game.state === "playing")
      pause(true);
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
  scene.background = new THREE.Color(palette.ink);
  camera = new THREE.OrthographicCamera(-10, 10, 8, -8, 0.1, 100);
  fpsCamera = new THREE.PerspectiveCamera(
    76,
    innerWidth / innerHeight,
    0.035,
    65,
  );
  viewRig = new ViewRig(camera, fpsCamera);
  scene.add(fpsCamera);
  keyLight = new THREE.DirectionalLight(0xf2f6ff, 3.2);
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
  fillLight = new THREE.HemisphereLight(0xc2cbdf, 0x525e70, 1.65);
  scene.add(fillLight);
  const rim = new THREE.DirectionalLight(0xb7c9e4, 1.2);
  rim.position.set(0, 8, -15);
  scene.add(rim);
  const loaded = await Promise.all(
    paths.map((name) =>
      ASSET(
        `assets/${name}.js`,
        name === "floor" ? { keepHierarchy: true } : {},
      ),
    ),
  );
  prototypes = Object.fromEntries(paths.map((name, i) => [name, loaded[i]]));
  const floorSize = prototypes.floor.userData.nativeSize;
  const floorDecals = [];
  prototypes.floor.traverse((node) => {
    if (
      node.isMesh &&
      node.material.name === "metal" &&
      node.material.color.getHex() === 0x203f49
    )
      floorDecals.push(node);
  });
  // Remove only the recipe tile's raised directional inlay; preserve its rim and grout.
  for (const node of floorDecals) node.removeFromParent();
  prototypes.floor = bakeStatic(prototypes.floor);
  prototypes.floor.userData.nativeSize = floorSize;
  prototypes.floor.traverse((node) => {
    if (!node.isMesh) return;
    node.material = node.material.clone();
    if (node.material.color.getHex() === 0x203f49)
      node.material.color.setHex(0xf5e9c9);
  });
  for (const prototype of Object.values(prototypes)) recolorEnamel(prototype);
  prototypes.snack.traverse((node) => {
    if (!node.isMesh) return;
    node.material = node.material.clone();
    node.material.color.setHex(palette.gold);
    node.material.emissive.setHex(palette.gold);
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
      bestFloor = clamp(record.floor || 1, 1, LEVELS.length);
      ui.best.textContent = `PERSONAL BEST ${best.toLocaleString("en-US")} · AISLE ${Math.min(bestFloor, visibleFloorCount(progress))}/${visibleFloorCount(progress)}`;
    }
    ui["score-name"].value = localStorage.getItem("hft-alias") || "";
  } catch {
    /* A disabled or damaged local score must not prevent play. */
  }
  ui["briefing-mop"].innerHTML = storyCard("mop", MISSION);
  ui["vault-mop"].innerHTML = storyCard(
    "mop",
    "We got everyone out! But the Locksmith is restoring SHELF CONTROL from a backup. Five sealed aisles. Four keys. Let's pull the plug properly.",
  );
  ui["vault-keys"].innerHTML = KEY_TYPES.map(
    (key) => `<span>${keyIcon(key.id)}<b>${key.symbol} ${key.label}</b></span>`,
  ).join("");
  ui["discovery-mop"].innerHTML = storyCard(
    "mop",
    "You did it! Wait… this checkout has a service lift. I thought we only had ten floors.",
  );
  ui["discovery-buff"].innerHTML = storyCard(
    "buff",
    "BUFF-0 here. We're trapped downstairs. That Director was middle management. SHELF CONTROL is still running the basement.",
  );
  try {
    goldEnabled =
      progress.cleared.includes(19) &&
      localStorage.getItem("hft-gold-v1") !== "off";
  } catch {
    /* Optional cosmetic preference. */
  }
  applyLivery(menuHero);
  try {
    const checkpoint = await saves.read();
    if (checkpointCompatible(checkpoint)) savedCampaign = checkpoint;
    else if (checkpoint)
      saveError =
        "Your saved shift belongs to an older version. Unlocked aisles are kept.";
  } catch {
    saveError = "Autosave unavailable in this browser.";
  }
  refreshProgressUI();
  bindInput();
  resize();
  ui.start.disabled = false;
  ui["open-route"].disabled =
    ui["open-daily"].disabled =
    ui["open-leaderboard"].disabled =
    ui["open-settings"].disabled =
    ui["open-rooms"].disabled =
      false;
  refreshContinue();
  const savedRoom = rooms.saved();
  ui["room-reconnect"].hidden = !savedRoom;
  if (savedRoom)
    ui["room-reconnect"].textContent = `Reconnect to room ${savedRoom.code}`;
  const invited = new URLSearchParams(location.search).get("room");
  if (invited && /^[A-Z2-9]{6}$/.test(invited)) {
    ui["join-code"].value = invited;
    ui["room-screen"].hidden = false;
  }
  window.__READY__ = true;
  window.__START__ = () => start();
  requestAnimationFrame(frame);
}

init().catch(reportError);
