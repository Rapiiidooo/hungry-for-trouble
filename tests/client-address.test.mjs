import test from "node:test";
import assert from "node:assert/strict";
import { clientAddress, trustedAddresses } from "../server/client-address.mjs";

test("proxy addresses are explicit and untrusted clients cannot forge rate-limit identities", () => {
  const request = (peer, value) => ({
    socket: { remoteAddress: peer },
    headers: { "x-real-ip": value },
  });
  const trusted = trustedAddresses("127.0.0.1, ::1");
  assert.equal(
    clientAddress(request("::ffff:127.0.0.1", "203.0.113.4"), trusted),
    "203.0.113.4",
  );
  assert.equal(
    clientAddress(request("203.0.113.5", "203.0.113.4"), trusted),
    "203.0.113.5",
  );
  assert.equal(clientAddress(request("127.0.0.1", "203.0.113.4")), "127.0.0.1");
  for (const header of [
    undefined,
    "spoof",
    "203.0.113.4, 203.0.113.5",
    ["203.0.113.4"],
  ])
    assert.equal(
      clientAddress(request("127.0.0.1", header), trusted),
      "127.0.0.1",
    );
  assert.throws(() => trustedAddresses("*"), /exact IP/);
});
