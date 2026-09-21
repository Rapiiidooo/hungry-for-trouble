import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createRooms } from "../server/rooms.mjs";
const rooms = createRooms();
import { createLeaderboard } from "../server/leaderboard.mjs";
const api = await createLeaderboard({
  file: path.resolve(process.env.LEADERBOARD_FILE || "data/leaderboard.json"),
});
const root = path.resolve("game");
const port = Number(process.env.PORT || 3001);
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".mp3": "audio/mpeg",
  ".json": "application/json",
  ".svg": "image/svg+xml",
};
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    if (await rooms(req, res, url)) return;
    if (await api(req, res, url)) return;
    const file = path.resolve(
      root,
      "." +
        decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname),
    );
    if (!file.startsWith(root + path.sep)) {
      res.writeHead(403);
      res.end();
      return;
    }
    const body = await readFile(file);
    res.writeHead(200, {
      "Content-Type": types[path.extname(file)] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
});
server.requestTimeout = 15000;
server.listen(port, process.env.HOST || "127.0.0.1", () =>
  console.log(`Hungry for Trouble: http://localhost:${port}`),
);
