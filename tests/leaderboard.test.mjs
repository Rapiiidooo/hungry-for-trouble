import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { createLeaderboard } from "../server/leaderboard.mjs";
import {
  newDaily,
  TICK,
  packInput,
  unpackInput,
  recordInput,
} from "../game/daily.js";
import { stepGame } from "../game/sim.js";

test("shared board verifies two identities, rejects tampering/reuse and survives restart", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "hft-board-"));
  const file = path.join(directory, "scores.json");
  let clock = Date.parse("2026-09-20T12:00:00Z");
  let api = await createLeaderboard({ file, now: () => clock });
  const server = http.createServer((req, res) =>
    api(req, res, new URL(req.url, "http://localhost")),
  );
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const request = async (url, body, cookie, extra = {}) => {
    const response = await fetch(base + url, {
      method: body === undefined ? "GET" : "POST",
      headers: {
        "Content-Type": "application/json",
        ...(cookie ? { Cookie: cookie } : {}),
        ...extra,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return {
      status: response.status,
      cookie: response.headers.get("set-cookie")?.split(";")[0],
      data: await response.json(),
    };
  };
  try {
    const first = await request("/api/runs", {});
    assert.equal(first.status, 201);
    const second = await request("/api/runs", {});
    assert.notEqual(first.cookie, second.cookie);
    const { config } = first.data;
    const simulate = (move) => {
      const game = newDaily(config),
        log = [];
      for (let i = 0; i < 5400 && game.state === "playing"; i++) {
        const row = packInput({
          x: i < move ? 1 : 0,
          fire: true,
          aim: Math.PI,
        });
        recordInput(log, row);
        stepGame(game, unpackInput(row), TICK);
      }
      return { game, log };
    };
    const a = simulate(100),
      b = simulate(160);
    const endpoint = `/api/runs/${first.data.id}/score`;
    assert.equal(
      (await request(endpoint, { name: "ALICE", inputs: a.log }, second.cookie))
        .status,
      409,
    );
    assert.equal(
      (await request(endpoint, { name: "ALICE", inputs: a.log }, first.cookie))
        .status,
      400,
      "Runs cannot be fast-forwarded",
    );
    assert.equal(
      (
        await request(
          endpoint,
          { name: "ALICE", inputs: [[1, 5000, 0, 0, 0]] },
          first.cookie,
        )
      ).status,
      400,
    );
    assert.equal(
      (
        await request(
          endpoint,
          { name: "<script>", inputs: a.log },
          first.cookie,
        )
      ).status,
      400,
    );
    assert.equal(
      (
        await request(
          endpoint,
          { name: "ALICE", inputs: a.log },
          first.cookie,
          { Origin: "https://unrelated.invalid" },
        )
      ).status,
      403,
    );
    clock += 100000;
    const duplicate = await Promise.all(
      [1, 2].map(() =>
        request(
          endpoint,
          { name: "ALICE", score: 999999999, inputs: a.log },
          first.cookie,
        ),
      ),
    );
    assert.deepEqual(duplicate.map((r) => r.status).sort(), [200, 409]);
    assert.equal(
      duplicate.find((r) => r.status === 200).data.score,
      a.game.score,
      "The fabricated client score must be ignored",
    );
    const accepted = await request(
      `/api/runs/${second.data.id}/score`,
      { name: "BOB", inputs: b.log },
      second.cookie,
    );
    assert.equal(accepted.status, 200);
    const board = await request("/api/leaderboard");
    assert.equal(board.data.players, 2);
    assert.deepEqual(
      new Set(board.data.entries.map((e) => e.name)),
      new Set(["ALICE", "BOB"]),
    );
    assert.ok(
      !JSON.stringify(board.data).includes("player" + '":'),
      "Private identity is not a public field",
    );
    api = await createLeaderboard({ file, now: () => clock });
    assert.deepEqual((await request("/api/leaderboard")).data, board.data);
    const retry = await request("/api/runs", {}, first.cookie);
    clock += 100000;
    assert.equal(
      (
        await request(
          `/api/runs/${retry.data.id}/score`,
          { name: "ALICE", inputs: a.log },
          first.cookie,
        )
      ).status,
      200,
    );
    assert.equal(
      (await request("/api/leaderboard")).data.players,
      2,
      "Retries update one identity's best",
    );
    clock += 86400000;
    assert.equal((await request("/api/leaderboard")).data.players, 0);
    assert.notEqual((await request("/api/daily")).data.seed, config.seed);
    assert.equal(
      (await request("/api/leaderboard?day=2026-09-20")).data.players,
      2,
    );
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await rm(directory, { recursive: true, force: true });
  }
});
