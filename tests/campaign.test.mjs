import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { createLeaderboard } from "../server/leaderboard.mjs";
import {
  verifyCampaign,
  restoreCampaign,
  CAMPAIGN_RULESET,
} from "../game/campaign.js";
import { makeCheckpoint, checkpointCompatible } from "../game/checkpoint.js";
import {
  newGame,
  nextLevel,
  stepGame,
  pathTo,
  lineOfSight,
} from "../game/sim.js";
import {
  newDaily,
  TICK,
  packInput,
  unpackInput,
  recordInput,
} from "../game/daily.js";

const config = { seed: 1234, ruleset: CAMPAIGN_RULESET };
function record(game, log, input) {
  const row = packInput(input);
  recordInput(log, row);
  stepGame(game, unpackInput(row), TICK);
}
function run(clearFirst = false) {
  let game = newGame(0, { seed: config.seed });
  const stages = [{ inputs: [] }];
  if (clearFirst) {
    let target, waypoint;
    for (let ticks = 0; ticks < 7000 && game.state === "playing"; ticks++) {
      const player = game.player;
      const distance = (point) =>
        Math.hypot(point.x - player.x, point.z - player.z);
      if (!target || target.collected || distance(target) < 0.15) {
        target =
          game.collected >= game.map.level.quota
            ? game.map.exit
            : game.crumbs
                .filter((c) => !c.collected)
                .sort((a, b) => distance(a) - distance(b))[0];
        waypoint = null;
      }
      if (!waypoint || distance(waypoint) < 0.12)
        waypoint = pathTo(game, player, target);
      const enemy = game.enemies
        .filter((e) => e.respawn <= 0 && lineOfSight(game, player, e))
        .sort((a, b) => distance(a) - distance(b))[0];
      const dx = waypoint.x - player.x,
        dz = waypoint.z - player.z,
        gap = Math.hypot(dx, dz);
      record(game, stages[0].inputs, {
        x: gap > 0.05 ? dx / gap : 0,
        z: gap > 0.05 ? dz / gap : 0,
        fire: !!enemy,
        aim: enemy
          ? Math.atan2(enemy.x - player.x, enemy.z - player.z)
          : undefined,
      });
    }
    assert.equal(
      game.state,
      "cleared",
      "The fixture must actually collect the quota and walk to checkout",
    );
    game = nextLevel(game, "spread");
    stages.push({ upgrade: "spread", inputs: [] });
  }
  while (game.state === "playing") record(game, stages.at(-1).inputs, {});
  return { game, stages };
}
const short = run(),
  longer = run(true);

test("checkpoints reconstruct earned equipment, health, ammo and score at aisle boundaries", async () => {
  const completed = [longer.stages[0]];
  const checkout = await restoreCampaign(config, completed);
  assert.equal(checkout.game.state, "cleared");
  const expected = nextLevel(checkout.game, "spread");
  const stages = [...completed, { upgrade: "spread", inputs: [] }];
  const restored = await restoreCampaign(config, stages);
  assert.deepEqual(restored.game, expected);
  assert.equal(restored.kills, checkout.game.kills);
  assert.equal(restored.crumbs, checkout.game.collected);
  const save = makeCheckpoint("test-shift", restored.game, stages);
  assert.equal(checkpointCompatible(save), true);
  assert.equal(checkpointCompatible({ ...save, ruleset: "obsolete" }), false);
  assert.equal(checkpointCompatible({ ...save, floor: 100 }), false);
  stages[1].inputs.push([1, 0, 0, null, 0]);
  assert.deepEqual(
    save.stages[1].inputs,
    [],
    "Saving freezes the log before this aisle starts",
  );
  await assert.rejects(restoreCampaign(config, stages), /checkpoint/);
  await assert.rejects(restoreCampaign(config, short.stages), /checkpoint/);
  await assert.rejects(
    restoreCampaign(config, [
      { inputs: [] },
      { upgrade: "spread", inputs: [] },
    ]),
    /Invalid replay/,
  );
  assert.throws(
    () => makeCheckpoint("dead", short.game, short.stages),
    /boundary/,
  );
});

test("a resumed campaign survives server expiry, verifies its prefix and clocks only new gameplay", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "hft-resume-"));
  let clock = Date.parse("2026-09-21T12:00:00Z");
  let api = await createLeaderboard({
    file: path.join(directory, "scores.json"),
    now: () => clock,
  });
  const server = http.createServer((req, res) =>
    api(req, res, new URL(req.url, "http://localhost")),
  );
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  let cookie;
  const request = async (url, body) => {
    const response = await fetch(base + url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(cookie ? { Cookie: cookie } : {}),
      },
      body: JSON.stringify(body),
    });
    cookie ||= response.headers.get("set-cookie")?.split(";")[0];
    return { status: response.status, data: await response.json() };
  };
  const checkpoint = {
    ...config,
    stages: [longer.stages[0], { upgrade: "spread", inputs: [] }],
  };
  try {
    await request("/api/campaign/runs", { seed: config.seed });
    clock += 7 * 86400000;
    api = await createLeaderboard({
      file: path.join(directory, "scores.json"),
      now: () => clock,
    });
    const resumed = await request("/api/campaign/resume", checkpoint);
    assert.equal(resumed.status, 201);
    const endpoint = `/api/campaign/runs/${resumed.data.id}/score`;
    const payload = {
      name: "CONTINUED",
      score: 9999999,
      stages: longer.stages,
    };
    assert.equal(
      (await request(endpoint, payload)).status,
      400,
      "New gameplay cannot be fast-forwarded",
    );
    const altered = structuredClone(longer.stages);
    altered[0].inputs[0][1] = altered[0].inputs[0][1] === 1000 ? -1000 : 1000;
    clock += 300000;
    assert.match(
      (await request(endpoint, { ...payload, stages: altered })).data.error,
      /history/,
    );
    const accepted = await request(endpoint, payload);
    assert.equal(accepted.status, 200);
    assert.equal(accepted.data.score, longer.game.score);
    assert.equal((await request(endpoint, payload)).status, 409);
    assert.equal(
      (await request("/api/campaign/resume", { ...checkpoint, ruleset: "old" }))
        .status,
      400,
    );
    assert.equal(
      (
        await request("/api/campaign/resume", {
          ...config,
          stages: short.stages,
        })
      ).status,
      400,
    );
    const pending = await request("/api/campaign/resume", {
      ...config,
      stages: [longer.stages[0]],
    });
    assert.equal(
      pending.status,
      201,
      "Pending upgrade choices can also resume",
    );
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await rm(directory, { recursive: true, force: true });
  }
});

test("campaign replay follows real checkouts and offered upgrades, rejecting skipped or unfinished stages", async () => {
  let yields = 0;
  const result = await verifyCampaign(config, longer.stages, async () => {
    yields++;
  });
  assert.equal(result.score, longer.game.score);
  assert.equal(result.floor, 2);
  assert.equal(result.survived, false);
  assert.ok(
    yields > 0,
    "Long replay validation yields to the server event loop",
  );
  await assert.rejects(
    verifyCampaign(config, [{ inputs: [[1, 0, 0, null, 0]] }]),
    /Finish/,
  );
  await assert.rejects(
    verifyCampaign(config, [{ inputs: [[9999999, 0, 0, null, 0]] }]),
    /too long/,
  );
  await assert.rejects(
    verifyCampaign(config, [{ inputs: [[1, 9000, 0, null, 0]] }]),
    /Invalid/,
  );
  await assert.rejects(
    verifyCampaign(config, [{ ...short.stages[0], upgrade: "heart" }]),
    /equipment/,
  );
  await assert.rejects(
    verifyCampaign(config, [...short.stages, longer.stages[1]]),
    /skipped aisle/,
  );
  await assert.rejects(
    verifyCampaign(config, [
      longer.stages[0],
      { ...longer.stages[1], upgrade: "magnet" },
    ]),
    /upgrade/,
  );
  const extra = structuredClone(short.stages);
  extra[0].inputs.push([1, 0, 0, null, 0]);
  await assert.rejects(verifyCampaign(config, extra), /after the aisle ended/);
  await assert.rejects(
    verifyCampaign({ ...config, ruleset: "old" }, longer.stages),
    /Invalid/,
  );
});

test("general records verify inputs, stay separate from daily scores and survive resets, pruning and restart", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "hft-general-"));
  const file = path.join(directory, "scores.json");
  let clock = Date.parse("2026-09-21T12:00:00Z");
  const oldDays = Object.fromEntries(
    Array.from({ length: 90 }, (_, i) => [
      `daily-rush-4:${new Date(clock - (i + 1) * 86400000).toISOString().slice(0, 10)}`,
      [],
    ]),
  );
  await writeFile(
    file,
    JSON.stringify({
      ...oldDays,
      "campaign-1:all": [
        {
          player: "legacy-player",
          name: "LEGACY",
          score: 90000,
          ticks: 60000,
          kills: 120,
          floor: 20,
          survived: true,
          created: clock - 86400000,
        },
      ],
    }),
  );
  let api = await createLeaderboard({ file, now: () => clock });
  const server = http.createServer((req, res) =>
    api(req, res, new URL(req.url, "http://localhost")),
  );
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  async function request(url, body, cookie) {
    const res = await fetch(base + url, {
      method: body === undefined ? "GET" : "POST",
      headers: {
        "Content-Type": "application/json",
        ...(cookie ? { Cookie: cookie } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return {
      status: res.status,
      data: await res.json(),
      cookie: res.headers.get("set-cookie")?.split(";")[0],
    };
  }
  const general = () => request("/api/leaderboard?scope=general");
  try {
    assert.equal(
      (await general()).data.entries[0].name,
      "LEGACY",
      "The previous campaign's all-time records remain visible",
    );
    assert.equal(
      (await request("/api/campaign/runs", { seed: -1 })).status,
      400,
    );
    const a = await request("/api/campaign/runs", { seed: config.seed });
    const b = await request("/api/campaign/runs", { seed: config.seed });
    const scoreUrl = `/api/campaign/runs/${a.data.id}/score`;
    const post = { name: "ALICE", score: 99999999, stages: longer.stages };
    assert.equal((await request(scoreUrl, post, b.cookie)).status, 409);
    assert.equal(
      (await request(`/api/runs/${a.data.id}/score`, post, a.cookie)).status,
      409,
    );
    assert.equal(
      (await request(scoreUrl, post, a.cookie)).status,
      400,
      "Fast-forwarded campaigns are rejected",
    );
    clock += 300000;
    const duplicates = await Promise.all(
      [1, 2].map(() => request(scoreUrl, post, a.cookie)),
    );
    assert.deepEqual(duplicates.map((r) => r.status).sort(), [200, 409]);
    const accepted = duplicates.find((r) => r.status === 200).data;
    assert.equal(accepted.score, longer.game.score);
    assert.equal(accepted.floor, 2);
    assert.equal(
      (
        await request(
          `/api/campaign/runs/${b.data.id}/score`,
          { name: "BOB", stages: short.stages },
          b.cookie,
        )
      ).status,
      200,
    );
    let board = (await general()).data;
    assert.deepEqual(
      board.entries.map((r) => r.name),
      ["LEGACY", "ALICE", "BOB"],
    );
    assert.equal(board.players, 3);
    assert.ok(!JSON.stringify(board.entries).includes('"player":'));
    assert.equal((await request("/api/leaderboard")).data.players, 0);
    const daily = await request("/api/runs", {}, a.cookie);
    assert.equal(
      (
        await request(
          `/api/campaign/runs/${daily.data.id}/score`,
          post,
          a.cookie,
        )
      ).status,
      409,
    );
    const dailyGame = newDaily(daily.data.config),
      inputs = [];
    while (dailyGame.state === "playing") record(dailyGame, inputs, {});
    clock += 100000;
    assert.equal(
      (
        await request(
          `/api/runs/${daily.data.id}/score`,
          { name: "DAILY_ONLY", inputs },
          a.cookie,
        )
      ).status,
      200,
    );
    assert.equal((await request("/api/leaderboard")).data.players, 1);
    assert.deepEqual(
      (await general()).data,
      board,
      "Daily pruning must preserve general records",
    );
    const retry = await request(
      "/api/campaign/runs",
      { seed: config.seed },
      a.cookie,
    );
    clock += 100000;
    assert.equal(
      (
        await request(
          `/api/campaign/runs/${retry.data.id}/score`,
          { name: "ALICE", stages: short.stages },
          a.cookie,
        )
      ).status,
      200,
    );
    assert.deepEqual(
      (await general()).data,
      board,
      "A weaker retry cannot replace a personal best",
    );
    clock += 86400000 * 91;
    assert.equal((await request("/api/leaderboard")).data.players, 0);
    assert.deepEqual((await general()).data, board);
    api = await createLeaderboard({ file, now: () => clock });
    assert.deepEqual((await general()).data, board);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await rm(directory, { recursive: true, force: true });
  }
});
