import { newGame, canStand, pathTo, lineOfSight } from "./sim.js";
const gap = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
export const MATCH_TICK = 1 / 60;

export function newMatch(kind, seed, roster) {
  const g = newGame(3, { seed });
  g.multiplayer = { kind, winner: null, reason: "", target: 7 };
  g.time = kind === "coop" ? 210 : 180;
  g.map.level = {
    ...g.map.level,
    tagline:
      kind === "coop"
        ? "Shared ammo. Revive your colleague. Check out together."
        : "First to seven KOs. Eat the evidence.",
    name: kind === "coop" ? "Shared Shift" : "Snackdown",
    department:
      kind === "coop"
        ? "TWO VACUUMS · ONE DUST BAG"
        : "CLEAN FIGHT · DIRTY TACTICS",
    quota: 60,
  };
  g.visors = [];
  g.map.visors = [];
  g.players = roster.map((member, i) => ({
    ...g.player,
    id: member.id,
    name: member.name,
    x: i && kind === "versus" ? g.map.exit.x : g.map.start.x + i * 2,
    z: i && kind === "versus" ? g.map.exit.z : g.map.start.z,
    hp: 4,
    maxHp: 4,
    ammo: 40,
    score: 0,
    kills: 0,
    deaths: 0,
    overtime: 0,
    respawn: 0,
    revive: 0,
    invincible: 2,
  }));
  g.sharedAmmo = 70;
  g.enemies =
    kind === "coop"
      ? g.enemies.slice(0, 4).map((e, i) => ({
          ...e,
          kind: i % 2 ? "hunter" : "shooter",
          hp: 5,
          maxHp: 5,
          shotCooldown: 3 + i,
        }))
      : [];
  if (kind === "coop") {
    const arena = g.crumbs
      .filter((c) => canStand(g, c.x, c.z, 1.4))
      .sort(
        (a, b) =>
          Math.hypot(a.x - 22, a.z - 18) - Math.hypot(b.x - 22, b.z - 18),
      )[0];
    g.boss = {
      ...newGame(4).boss,
      x: arena.x,
      z: arena.z,
      hp: 140,
      maxHp: 140,
    };
  }
  for (const c of g.crumbs) {
    c.respawn = 0;
    c.drop = false;
  }
  for (let i = 0; i < 16; i++)
    g.crumbs.push({
      x: g.map.start.x,
      z: g.map.start.z,
      collected: true,
      respawn: 0,
      drop: true,
    });
  g.events = [];
  g.eventSerial = 0;
  g.eventHistory = [];
  return g;
}

function emit(g, type, p, extra = {}) {
  const event = {
    id: ++g.eventSerial,
    type,
    x: p?.x,
    z: p?.z,
    playerId: p?.id,
    ...extra,
  };
  g.events.push(event);
  g.eventHistory.push(event);
  if (g.eventHistory.length > 256) g.eventHistory.shift();
}
function move(g, p, dx, dz) {
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / 0.15));
  for (let i = 0; i < steps; i++) {
    if (canStand(g, p.x + dx / steps, p.z)) p.x += dx / steps;
    if (canStand(g, p.x, p.z + dz / steps)) p.z += dz / steps;
  }
}
function finish(g, reason, winner = null) {
  if (g.state !== "playing") return;
  g.state = reason === "rescued" ? "won" : "lost";
  Object.assign(g.multiplayer, { reason, winner });
  emit(g, "match-end", null);
}
function hurt(g, p, source, attacker) {
  if (p.hp <= 0 || p.invincible > 0 || p.overtime > 0 || p.dash > 0) return;
  p.hp--;
  p.invincible = 0.7;
  emit(g, "damage", p, { fromX: source.x, fromZ: source.z });
  if (p.hp > 0) return;
  p.deaths++;
  p.vx = p.vz = 0;
  p.revive = 0;
  emit(g, "downed", p);
  if (g.multiplayer.kind === "versus") {
    p.respawn = 3;
    if (attacker) {
      attacker.kills++;
      attacker.score += 100;
      emit(g, "knockout", attacker, { victim: p.name });
    }
    const cells = g.map.level.map
      .flatMap((row, z) =>
        [...row].flatMap((c, x) =>
          !["#", " "].includes(c) ? [{ x: x * 2, z: z * 2 }] : [],
        ),
      )
      .sort((a, b) => gap(a, p) - gap(b, p));
    const reserve = g.crumbs.filter((c) => c.drop && c.collected).slice(0, 8);
    reserve.forEach((c, i) =>
      Object.assign(c, cells[i], { collected: false, respawn: 0 }),
    );
    if (attacker?.kills >= g.multiplayer.target)
      finish(g, "score", attacker.id);
  }
}
function takedown(g, e, p) {
  if (e.respawn > 0) return;
  e.hp = 0;
  e.respawn = 10;
  e.tell = 0;
  p.kills++;
  p.score += 100;
  g.score += 100;
  g.sharedAmmo = Math.min(150, g.sharedAmmo + 7);
  emit(g, "enemy-down", e, { playerId: p.id, combo: 1 });
}
function launch(g, e, angle, speed = 6) {
  g.hazards.push({
    x: e.x,
    z: e.z,
    vx: Math.sin(angle) * speed,
    vz: Math.cos(angle) * speed,
    life: 3,
    age: 0,
  });
}
export function stepMatch(g, inputs, dt = MATCH_TICK) {
  g.events = [];
  if (g.state !== "playing") return;
  dt = Math.min(dt, 0.05);
  g.elapsed += dt;
  g.time = Math.max(0, g.time - dt);
  const coop = g.multiplayer.kind === "coop";
  if (g.time === 0) {
    const [a, b] = g.players;
    finish(
      g,
      coop ? "time" : a.kills === b.kills ? "draw" : "time",
      !coop && a.kills !== b.kills ? (a.kills > b.kills ? a.id : b.id) : null,
    );
    return;
  }
  for (const p of g.players) {
    for (const k of [
      "invincible",
      "dash",
      "dashCooldown",
      "fireCooldown",
      "overtime",
    ])
      p[k] = Math.max(0, p[k] - dt);
    if (p.hp <= 0) {
      if (!coop) {
        p.respawn -= dt;
        if (p.respawn <= 0) {
          const other = g.players.find((q) => q !== p);
          const spots = [g.map.start, g.map.exit, ...g.batteries, ...g.repairs]
            .filter((c) => canStand(g, c.x, c.z))
            .sort((a, b) => gap(b, other) - gap(a, other));
          Object.assign(p, {
            x: spots[0].x,
            z: spots[0].z,
            hp: 4,
            ammo: 40,
            invincible: 2,
            fireCooldown: 0.2,
            respawn: 0,
          });
          emit(g, "respawn", p);
        }
      } else {
        const helper = g.players.find((q) => q.hp > 0 && gap(q, p) < 2.2);
        p.revive = helper ? p.revive + dt : Math.max(0, p.revive - dt * 2);
        if (p.revive >= 2) {
          p.hp = 3;
          p.invincible = 3;
          p.revive = 0;
          emit(g, "revive", p);
        }
      }
      continue;
    }
    const input = inputs[p.id] || {},
      length = Math.max(1, Math.hypot(input.x || 0, input.z || 0));
    const x = (input.x || 0) / length,
      z = (input.z || 0) / length;
    if (Number.isFinite(input.aim)) p.angle = input.aim;
    else if (x || z) p.angle = Math.atan2(x, z);
    if (input.dash && p.dashCooldown === 0 && (x || z)) {
      p.dash = 0.18;
      p.dashCooldown = 1.2;
      emit(g, "dash", p);
    }
    const speed = p.dash > 0 ? 13 : p.overtime > 0 ? 5.9 : 4.7;
    p.vx += (x * speed - p.vx) * Math.min(1, dt * 24);
    p.vz += (z * speed - p.vz) * Math.min(1, dt * 24);
    move(g, p, p.vx * dt, p.vz * dt);
    const ammo = coop ? g.sharedAmmo : p.ammo;
    if (input.fire && p.fireCooldown === 0 && (ammo > 0 || p.overtime > 0)) {
      if (p.overtime <= 0) {
        if (coop) g.sharedAmmo--;
        else p.ammo--;
      }
      p.fireCooldown = p.overtime > 0 ? 0.13 : 0.22;
      for (const offset of coop || p.overtime > 0 ? [-0.12, 0, 0.12] : [0]) {
        const angle = p.angle + offset;
        g.bullets.push({
          x: p.x,
          z: p.z,
          vx: Math.sin(angle) * 19,
          vz: Math.cos(angle) * 19,
          life: 0.9,
          owner: p.id,
        });
      }
      g.shots++;
      emit(g, "shot", p);
    }
    for (const c of g.crumbs)
      if (!c.collected && gap(c, p) < 0.9) {
        c.collected = true;
        c.respawn = 14;
        g.collected++;
        g.score += 10;
        p.score += 10;
        if (coop) g.sharedAmmo = Math.min(150, g.sharedAmmo + 2);
        else p.ammo = Math.min(99, p.ammo + 2);
        emit(g, "crumb", p);
      }
    for (const c of g.batteries)
      if (!c.collected && gap(c, p) < 0.85) {
        c.collected = true;
        c.respawn = 25;
        for (const q of coop ? g.players : [p]) q.overtime = 5;
        emit(g, "overtime", p);
      }
    for (const c of g.repairs)
      if (!c.collected && p.hp < p.maxHp && gap(c, p) < 0.85) {
        c.collected = true;
        c.respawn = 25;
        p.hp++;
        emit(g, "heal", p);
      }
  }
  for (const c of [...g.crumbs, ...g.batteries, ...g.repairs])
    if (c.collected && !c.drop) {
      c.respawn -= dt;
      if (c.respawn <= 0) c.collected = false;
    }
  const alive = g.players.filter((p) => p.hp > 0);
  if (coop && !alive.length) {
    finish(g, "downed");
    return;
  }
  for (const e of g.enemies) {
    e.hit = Math.max(0, e.hit - dt);
    e.stun = Math.max(0, e.stun - dt);
    if (e.respawn > 0) {
      e.respawn -= dt;
      if (e.respawn <= 0) {
        Object.assign(e, e.origin, { hp: e.maxHp, stun: 1, waypoint: null });
        if (alive.some((p) => gap(p, e) < 3)) e.respawn = 2;
      }
      continue;
    }
    const p = alive.slice().sort((a, b) => gap(a, e) - gap(b, e))[0];
    if (!p) continue;
    if (e.kind === "shooter" && !p.overtime) {
      e.shotCooldown = Math.max(0, e.shotCooldown - dt);
      if (e.tell > 0) {
        e.tell = Math.max(0, e.tell - dt);
        if (!e.tell) {
          launch(g, e, e.shotAngle);
          e.shotCooldown = 2;
          emit(g, "drone-shot", e);
        }
      } else if (!e.shotCooldown && gap(e, p) < 14 && lineOfSight(g, e, p)) {
        e.tell = 0.65;
        e.shotAngle = Math.atan2(p.x - e.x, p.z - e.z);
        emit(g, "drone-warning", e);
      }
      if (e.tell || (gap(e, p) > 4 && gap(e, p) < 10 && lineOfSight(g, e, p)))
        continue;
    }
    if (e.stun <= 0) {
      if (!e.waypoint || gap(e, e.waypoint) < 0.08)
        e.waypoint = pathTo(g, e, p, p.overtime > 0);
      const dx = e.waypoint.x - e.x,
        dz = e.waypoint.z - e.z,
        d = Math.hypot(dx, dz),
        travel = Math.min(d, dt * (3 + Math.min(1, g.elapsed / 90)));
      if (d > 0.01) {
        e.angle = Math.atan2(dx, dz);
        move(g, e, (dx / d) * travel, (dz / d) * travel);
      }
    }
    for (const q of alive)
      if (gap(e, q) < 0.75) {
        if (q.overtime > 0) takedown(g, e, q);
        else hurt(g, q, e);
      }
  }
  if (g.boss?.hp > 0) {
    const b = g.boss;
    b.phase += dt;
    b.fire -= dt;
    b.hit = Math.max(0, b.hit - dt);
    b.exposed = b.phase % 6 > 3;
    if (!b.exposed && b.fire <= 0) {
      b.fire = 0.95;
      const p = alive.slice().sort((a, c) => gap(a, b) - gap(c, b))[0];
      if (p) {
        const angle = Math.atan2(p.x - b.x, p.z - b.z);
        for (const offset of [-0.3, 0, 0.3]) launch(g, b, angle + offset, 5);
      }
    }
    for (const p of alive) if (gap(p, b) < 1.6) hurt(g, p, b);
  }
  for (const b of g.bullets) {
    b.life -= dt;
    const owner = g.players.find((p) => p.id === b.owner);
    for (let i = 0; i < 4 && b.life > 0; i++) {
      b.x += (b.vx * dt) / 4;
      b.z += (b.vz * dt) / 4;
      if (!canStand(g, b.x, b.z, 0.08)) {
        b.life = 0;
        break;
      }
      if (!coop)
        for (const p of g.players)
          if (p !== owner && p.hp > 0 && gap(p, b) < 0.55) {
            hurt(g, p, owner, owner);
            b.life = 0;
            break;
          }
      if (coop) {
        for (const e of g.enemies)
          if (e.respawn <= 0 && gap(e, b) < 0.6) {
            e.hp -= owner?.overtime > 0 ? 3 : 1;
            e.hit = 0.12;
            e.stun = 0.1;
            b.life = 0;
            emit(g, "hit", e);
            if (e.hp <= 0) takedown(g, e, owner);
            break;
          }
        if (b.life > 0 && g.boss?.hp > 0 && gap(g.boss, b) < 1.3) {
          b.life = 0;
          if (g.boss.exposed) {
            g.boss.hp--;
            g.boss.hit = 0.15;
            emit(g, "hit", g.boss);
            if (!g.boss.hp) emit(g, "boss-down", g.boss);
          }
        }
      }
    }
  }
  g.bullets = g.bullets.filter((b) => b.life > 0);
  for (const b of g.hazards) {
    b.life -= dt;
    b.age += dt;
    for (let i = 0; i < 3 && b.life > 0; i++) {
      b.x += (b.vx * dt) / 3;
      b.z += (b.vz * dt) / 3;
      if (!canStand(g, b.x, b.z, 0.15)) {
        b.life = 0;
        emit(g, "receipt-impact", b);
        break;
      }
      for (const p of alive)
        if (gap(p, b) < 0.48) {
          hurt(g, p, { x: b.x - b.vx, z: b.z - b.vz });
          b.life = 0;
          break;
        }
    }
  }
  g.hazards = g.hazards.filter((b) => b.life > 0);
  if (
    coop &&
    g.collected >= g.map.level.quota &&
    g.boss.hp <= 0 &&
    g.players.every((p) => p.hp > 0 && gap(p, g.map.exit) < 2.8)
  )
    finish(g, "rescued");
}

export function matchSnapshot(g, selfId, since = 0) {
  const p = g.players.find((p) => p.id === selfId);
  return {
    state: g.state,
    time: g.time,
    elapsed: g.elapsed,
    player: { ...p },
    players: g.players.map((p) => ({ ...p })),
    enemies: g.enemies.map((e) => ({ ...e })),
    boss: g.boss ? { ...g.boss } : null,
    bullets: g.bullets.map((b) => ({ ...b })),
    hazards: g.hazards.map((b) => ({ ...b })),
    crumbs: g.crumbs.map((c) => ({ ...c })),
    batteries: g.batteries.map((b) => ({ ...b })),
    repairs: g.repairs.map((r) => ({ ...r })),
    ammo: g.multiplayer.kind === "coop" ? g.sharedAmmo : p.ammo,
    overtime: p.overtime,
    collected: g.collected,
    score: g.multiplayer.kind === "coop" ? g.score : p.score,
    kills: p.kills,
    shots: g.shots,
    multiplayer: { ...g.multiplayer },
    eventSerial: g.eventSerial,
    events: g.eventHistory.filter((e) => e.id > since).map((e) => ({ ...e })),
  };
}
