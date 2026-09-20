const pellet = (x, y, bright = true) =>
  `<rect x="${x}" y="${y}" width="8" height="5" rx="2" fill="${bright ? "#efb546" : "#697587"}"/>`;
const robot = (x, y, shield = false) =>
  `<g transform="translate(${x} ${y})">${shield ? '<path d="M-19-18Q0-30 19-18V5Q12 23 0 28Q-12 23-19 5Z" fill="#6c8fb833" stroke="#a4c0e0" stroke-width="3"/>' : ""}<rect x="-12" y="-11" width="24" height="24" rx="8" fill="#f0f2f3"/><circle cx="-5" cy="-2" r="2" fill="#263650"/><circle cx="5" cy="-2" r="2" fill="#263650"/><path d="M-8 15h16" stroke="#697587" stroke-width="5"/></g>`;
const heart = (x, y, full = true) =>
  `<path transform="translate(${x} ${y}) scale(.6)" d="M0 8C-12-8-25 5-17 15L0 32 17 15C25 5 12-8 0 8Z" fill="${full ? "#ed604e" : "#3c485c"}" stroke="${full ? "#ff978a" : "#798499"}" stroke-width="2"/>`;
function diagram(key, after, n) {
  if (key === "rapid")
    return (
      robot(24, 61) +
      Array.from({ length: after ? 7 : 3 }, (_, i) =>
        pellet(45 + i * (after ? 9 : 23), 60, after),
      ).join("") +
      '<path d="M43 80H115" stroke="#697587" stroke-width="2"/>'
    );
  if (key === "spread")
    return (
      robot(24, 66) +
      Array.from({ length: Math.min(7, 1 + n * 2) }, (_, i) => {
        const count = Math.min(7, 1 + n * 2);
        const y = count === 1 ? 66 : 26 + (i * 80) / (count - 1);
        return (
          `<path d="M42 66 103 ${y}" stroke="${after ? "#efb546" : "#697587"}" stroke-width="2" opacity=".45"/>` +
          pellet(105, y - 2, after)
        );
      }).join("")
    );
  if (key === "pierce")
    return (
      [52, 82, 112].map((x) => robot(x, 64)).join("") +
      `<path d="M9 65H${Math.min(125, 55 + n * 30)}" stroke="${after ? "#efb546" : "#697587"}" stroke-width="5"/>` +
      (after
        ? '<path d="m89 58 9 7-9 7" fill="none" stroke="#efb546" stroke-width="3"/>'
        : '<path d="m49 53 12 22m-12 0 12-22" stroke="#ed604e" stroke-width="3"/>')
    );
  if (key === "shield")
    return (
      robot(86, 65, after) +
      '<path d="M10 61h33" stroke="#ed604e" stroke-width="4"/>' +
      (after
        ? '<path d="m49 48 9 13-9 13" fill="none" stroke="#a4c0e0" stroke-width="4"/><text x="67" y="108" fill="#a4c0e0" font-size="10">BLOCKED</text>'
        : heart(85, 94))
    );
  if (key === "magnet")
    return (
      `<circle cx="66" cy="65" r="${after ? 43 : 23}" fill="#efb5460a" stroke="${after ? "#efb546" : "#697587"}" stroke-width="2" stroke-dasharray="4 4"/>` +
      robot(66, 65) +
      [
        [23, 39],
        [103, 40],
        [27, 88],
        [105, 87],
      ]
        .map(([x, y]) => pellet(x, y, after))
        .join("") +
      (after
        ? '<path d="m32 44 9 5m58-5-9 5m-54 34 9-5m45 5-9-5" stroke="#efb546" stroke-width="2"/>'
        : "")
    );
  return (
    Array.from({ length: Math.min(6, 4 + n) }, (_, i) =>
      heart(13 + i * 21, 50),
    ).join("") +
    (after
      ? '<text x="65" y="105" text-anchor="middle" fill="#f0f2f3" font-size="13">+1 MAX ♥</text>'
      : '<text x="65" y="105" text-anchor="middle" fill="#8e9ab0" font-size="11">CURRENT HEALTH</text>')
  );
}
export function upgradeStats(key, n) {
  const values = {
    rapid: [(1 + n * 0.25) / 0.22, (1 + (n + 1) * 0.25) / 0.22, "shots/sec"],
    spread: [1 + n * 2, 3 + n * 2, "pellets/shot"],
    pierce: [1 + n, 2 + n, "targets/shot"],
    shield: [n, n + 1, "blocks/aisle"],
    magnet: [0.85 + n * 0.32, 0.85 + (n + 1) * 0.32, "metre range"],
    heart: [4 + n, 5 + n, "max hearts"],
  };
  const [a, b, unit] = values[key];
  const fmt = (v) => (Number.isInteger(v) ? v : v.toFixed(1));
  return `<span>${fmt(a)}</span><i>→</i><strong>${fmt(b)}</strong><small>${unit}</small>`;
}
export function upgradeArt(key, n) {
  return `<svg viewBox="0 0 288 146" aria-hidden="true"><text x="66" y="17" text-anchor="middle" fill="#8e9ab0" font-size="10" font-weight="700">NOW</text><text x="219" y="17" text-anchor="middle" fill="#efb546" font-size="10" font-weight="700">AFTER UPGRADE</text><path d="M143 30v93" stroke="#475369" stroke-dasharray="3 5"/><g transform="translate(1 13)">${diagram(key, false, n)}</g><g transform="translate(153 13)">${diagram(key, true, n + 1)}</g></svg>`;
}
