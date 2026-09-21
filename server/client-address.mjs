import { isIP } from "node:net";

const normal = (value = "") =>
  value.startsWith("::ffff:") ? value.slice(7) : value;

export function clientAddress(req, trusted = new Set()) {
  const peer = normal(req.socket.remoteAddress);
  const forwarded = req.headers["x-real-ip"];
  // Only an explicitly configured proxy may supply this single, overwritten header.
  return trusted.has(peer) && typeof forwarded === "string" && isIP(forwarded)
    ? normal(forwarded)
    : peer;
}

export function trustedAddresses(value = "") {
  const addresses = value
    .split(",")
    .map((part) => normal(part.trim()))
    .filter(Boolean);
  if (addresses.some((address) => !isIP(address)))
    throw new Error("TRUSTED_PROXY_IPS must contain exact IP addresses");
  return new Set(addresses);
}
