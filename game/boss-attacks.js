const gap = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const TAU = Math.PI * 2;

function lob(game, point, duration, radius, canStand) {
  if (game.lobs.length >= 18 || !canStand(game, point.x, point.z, 0.1)) return;
  game.lobs.push({
    fromX: game.boss.x,
    fromZ: game.boss.z,
    x: point.x,
    z: point.z,
    age: 0,
    duration,
    radius,
    hit: false,
  });
  game.events.push({ type: "lob-warning", x: point.x, z: point.z });
}

export function updateBoss(game, dt, { hurt, canStand, launchHazard }) {
  const boss = game.boss,
    p = game.player;
  if (!boss) return;
  if (boss.hp <= 0) {
    game.lobs = [];
    game.waves = [];
    if (boss.kind === "core") {
      game.hazards = [];
      game.mines = [];
      for (const enemy of game.enemies) enemy.respawn = 999;
    }
    return;
  }
  boss.hit = Math.max(0, boss.hit - dt);
  boss.phase += dt;
  boss.special -= dt;
  boss.fire -= dt;
  boss.exposed = boss.director ? boss.phase % 7 > 4 : boss.phase % 6 > 3.5;
  const enraged = boss.hp < boss.maxHp / 2;
  const aim = Math.atan2(p.x - boss.x, p.z - boss.z);
  if (boss.director && boss.special <= 0) {
    boss.attack = (boss.attack || 0) + 1;
    if (boss.kind === "core" && boss.attack % 2 === 0) {
      game.waves.push({
        x: boss.x,
        z: boss.z,
        age: 0,
        warning: 1.1,
        radius: 0,
        gapAngle: aim,
        hit: false,
      });
      game.events.push({ type: "pulse-warning", x: boss.x, z: boss.z });
    } else {
      lob(game, p, 1.55, boss.kind === "director" ? 1.55 : 1.8, canStand);
      if (boss.kind === "foreman")
        for (const side of [-1, 1])
          lob(
            game,
            {
              x: p.x + Math.cos(aim) * side * 3.1,
              z: p.z - Math.sin(aim) * side * 3.1,
            },
            1.75 + (side + 1) * 0.1,
            1.6,
            canStand,
          );
      if (boss.kind === "core")
        for (let i = 0; i < 4; i++)
          lob(
            game,
            {
              x: p.x + Math.sin((i * Math.PI) / 2) * 3.4,
              z: p.z + Math.cos((i * Math.PI) / 2) * 3.4,
            },
            1.9,
            1.6,
            canStand,
          );
    }
    boss.special =
      boss.kind === "director"
        ? 5.2
        : boss.kind === "foreman"
          ? 4.8
          : enraged
            ? 3.8
            : 4.6;
  }
  if (boss.fire <= 0 && !boss.exposed) {
    let angles = [-0.24, 0, 0.24].map((offset) => aim + offset);
    boss.fire = enraged ? 0.7 : 0.95;
    if (boss.kind === "director") {
      angles = [-0.45, -0.22, 0, 0.22, 0.45].map((offset) => aim + offset);
      boss.fire = enraged ? 0.8 : 1.1;
    } else if (boss.kind === "foreman") {
      angles = [-0.18, 0, 0.18].map((offset) => aim + offset);
      boss.fire = enraged ? 1 : 1.4;
    } else if (boss.kind === "core") {
      angles = Array.from(
        { length: 10 },
        (_, i) => (i * TAU) / 10 + boss.phase * 0.3,
      );
      boss.fire = enraged ? 0.8 : 1.2;
    } else if (enraged)
      for (let i = 0; i < 8; i++)
        angles.push((i * Math.PI) / 4 + boss.phase * 0.12);
    for (const direction of angles) launchHazard(game, boss, direction, 5, 4);
    game.events.push({ type: "boss-shot" });
  }
  if (gap(p, boss) < 1.6) hurt(game, boss);
  for (const shot of game.lobs) {
    shot.age += dt;
    if (shot.age >= shot.duration && !shot.hit) {
      shot.hit = true;
      if (gap(p, shot) < shot.radius) hurt(game, shot);
      game.events.push({ type: "lob-impact", x: shot.x, z: shot.z });
    }
  }
  game.lobs = game.lobs.filter((shot) => shot.age < shot.duration + 0.4);
  for (const wave of game.waves) {
    wave.age += dt;
    wave.radius = Math.max(0, (wave.age - wave.warning) * 5);
    const angle = Math.atan2(p.x - wave.x, p.z - wave.z);
    const inGap = Math.cos(angle - wave.gapAngle) > Math.cos(0.55);
    if (
      !wave.hit &&
      wave.radius > 0 &&
      Math.abs(gap(p, wave) - wave.radius) < 0.45 &&
      !inGap
    ) {
      wave.hit = true;
      hurt(game, wave);
    }
  }
  game.waves = game.waves.filter((wave) => wave.radius < 18);
}
