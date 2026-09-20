// Run with Node's --env-file option; credentials never enter arguments or output.
import { writeFile } from "node:fs/promises";
const endpoint = process.env.ATLAS_MCP_URL || "https://mcp.prod-market.atlas.design/mcp";
if (!process.env.ATLAS_API_KEY) throw new Error("Load ATLAS_API_KEY into the process environment.");
let session, id = 0;
async function rpc(method, params, notification = false) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.ATLAS_API_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      ...(session ? { "Mcp-Session-Id": session, "MCP-Protocol-Version": "2024-11-05" } : {}),
    },
    body: JSON.stringify({ jsonrpc: "2.0", ...(notification ? {} : { id: ++id }), method, params }),
    signal: AbortSignal.timeout(240000),
  });
  session = response.headers.get("mcp-session-id") || session;
  if (!response.ok) throw new Error(`Atlas HTTP ${response.status}`);
  const raw = await response.text();
  if (!raw) return null;
  const result = response.headers.get("content-type")?.includes("event-stream")
    ? raw.split("\n").filter(line => line.startsWith("data:")).map(line => JSON.parse(line.slice(5))).find(value => value.id === id)
    : JSON.parse(raw);
  if (result?.error) throw new Error(JSON.stringify(result.error));
  return result?.result;
}
await rpc("initialize", { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "hft-asset-builder", version: "1.0.0" } });
await rpc("notifications/initialized", {}, true);
const [method = "tools/list", args = "{}", destination] = process.argv.slice(2);
const result = await rpc(method, JSON.parse(args));
if (destination) { await writeFile(destination, JSON.stringify(result, null, 2) + "\n"); console.log(`Atlas result saved to ${destination}`); }
else console.log(JSON.stringify(result, null, 2));
