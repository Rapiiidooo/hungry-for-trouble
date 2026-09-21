import { CAMPAIGN_RULESET } from "./campaign.js";
import { LEVELS } from "./levels.js";

export const CHECKPOINT_DB = "hft-campaign-v1";

export function makeCheckpoint(id, game, stages) {
  if (
    game.daily ||
    game.multiplayer ||
    !["playing", "cleared"].includes(game.state) ||
    (game.state === "playing" && game.elapsed !== 0)
  )
    throw new Error("Invalid checkpoint boundary");
  return structuredClone({
    version: 1,
    id,
    ruleset: CAMPAIGN_RULESET,
    seed: game.seed,
    floor: game.levelIndex + 1,
    phase: game.state,
    stages,
    savedAt: Date.now(),
  });
}

export function checkpointCompatible(value) {
  return (
    !!value &&
    value.version === 1 &&
    value.ruleset === CAMPAIGN_RULESET &&
    typeof value.id === "string" &&
    value.id.length <= 64 &&
    Number.isInteger(value.seed) &&
    value.seed >= 0 &&
    value.seed <= 0xffffffff &&
    Number.isInteger(value.floor) &&
    value.floor >= 1 &&
    value.floor <= LEVELS.length &&
    ["playing", "cleared"].includes(value.phase) &&
    Array.isArray(value.stages) &&
    value.stages.length === value.floor
  );
}

// Input logs can exceed localStorage's small quota on a full campaign.
export function checkpointStore(database = globalThis.indexedDB) {
  let connection;
  function open() {
    if (!connection)
      connection = new Promise((resolve, reject) => {
        if (!database)
          return reject(
            new Error("Campaign saving is unavailable in this browser."),
          );
        const request = database.open(CHECKPOINT_DB, 1);
        request.onupgradeneeded = () =>
          request.result.createObjectStore("save");
        request.onerror = () => reject(request.error);
        request.onblocked = () =>
          reject(new Error("Close other game tabs to access your save."));
        request.onsuccess = () => {
          const db = request.result;
          db.onversionchange = () => {
            db.close();
            connection = null;
          };
          resolve(db);
        };
      });
    return connection;
  }
  async function transaction(mode, action) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("save", mode);
      let value;
      const request = action(tx.objectStore("save"));
      request.onsuccess = () => {
        value = request.result;
      };
      tx.oncomplete = () => resolve(value);
      tx.onabort = tx.onerror = () =>
        reject(tx.error || new Error("Campaign save failed."));
    });
  }
  return {
    read: () => transaction("readonly", (store) => store.get("campaign")),
    write: (value) =>
      transaction("readwrite", (store) => store.put(value, "campaign")),
    clear: () => transaction("readwrite", (store) => store.delete("campaign")),
  };
}
