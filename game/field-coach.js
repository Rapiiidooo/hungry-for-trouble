export const LESSON_KEY = "hft-lessons-v1";

// Only presentation observes these events. Learning never changes simulation or replays.
export function createFieldCoach({
  container,
  dashButton,
  aimStick,
  ammoPanel,
}) {
  const tip = document.createElement("aside");
  tip.id = "field-tip";
  tip.hidden = true;
  tip.setAttribute("role", "status");
  tip.innerHTML = '<b aria-hidden="true"></b><span></span>';
  container.append(tip);
  let learned = {};
  try {
    learned = JSON.parse(localStorage.getItem(LESSON_KEY) || "{}");
  } catch {
    /* Lessons are optional. */
  }
  if (!learned || typeof learned !== "object" || Array.isArray(learned))
    learned = {};
  let elapsed = 0,
    current = null,
    until = 0,
    cooldown = 0,
    fired = false;
  let previousFloor = -1,
    shown = new Set(),
    enabled = false;
  const targets = { ammo: ammoPanel, dash: dashButton, visor: aimStick };
  const clear = () => {
    tip.hidden = true;
    for (const node of Object.values(targets))
      node.classList.remove("lesson-target");
  };
  const show = (id, text, symbol, confirmation = false) => {
    current = { id, text, symbol, confirmation };
    until = elapsed + (confirmation ? 2.2 : 4.5);
    cooldown = until + 3;
    shown.add(id);
  };
  const complete = (id, text, symbol) => {
    if (learned[id]) return;
    learned[id] = true;
    try {
      localStorage.setItem(LESSON_KEY, JSON.stringify(learned));
    } catch {
      /* Private storage may be unavailable. */
    }
    show(id, text, symbol, true);
  };
  return {
    begin(game, kind) {
      enabled = !game.daily && !game.multiplayer && game.levelIndex < 3;
      if (game.levelIndex !== previousFloor || kind !== "campaign")
        shown = new Set();
      previousFloor = game.levelIndex;
      elapsed = 0;
      current = null;
      until = 0;
      cooldown = 3;
      fired = false;
      clear();
    },
    event(event, game, compact) {
      if (!enabled) return;
      if (event.type === "shot") {
        fired = true;
        if (game.fpsTime > 0)
          complete(
            "visor",
            "Rapid fire online. Top View brings you back.",
            "◉",
          );
      }
      if (event.type === "crumb" && fired)
        complete("ammo", "Reloaded. Every crumb gives you two shots.", "+2");
      if (event.type === "dash")
        complete("dash", "Good dodge. Blue means protected.", "✓");
      if (event.type === "visor" && !learned.visor)
        show(
          "visor",
          compact
            ? "Hold to fire. Swipe to turn. Tap Top View to return."
            : "Click to aim and fire. Press V to return to top view.",
          "◉",
        );
    },
    update(game, { dt, active, compact, busy, firstPerson }) {
      clear();
      if (!enabled || !active) return;
      // Do not spend a lesson's reading time behind a pickup or hazard message.
      if (!busy) elapsed += dt;
      if (current && elapsed >= until) current = null;
      if (!current && elapsed >= cooldown && !busy) {
        const nearEnemy = game.enemies.some(
          (e) =>
            e.respawn <= 0 &&
            Math.hypot(e.x - game.player.x, e.z - game.player.z) < 6,
        );
        const nearVisor = game.visors.some(
          (v) =>
            !v.collected &&
            Math.hypot(v.x - game.player.x, v.z - game.player.z) < 5,
        );
        if (!learned.visor && !shown.has("visor") && (nearVisor || firstPerson))
          show(
            "visor",
            firstPerson
              ? compact
                ? "Hold to fire. Swipe to turn. Top View brings you back."
                : "Click to fire. Press V for top view."
              : "Blue visor ahead: 18 seconds of first-person rapid fire.",
            "◉",
          );
        else if (!learned.dash && !shown.has("dash") && nearEnemy)
          show(
            "dash",
            compact
              ? "Enemy close. Move and tap DODGE to slip past safely."
              : "Enemy close. Move + SPACE dodges through danger.",
            "↗",
          );
        else if (!learned.ammo && !shown.has("ammo"))
          show(
            "ammo",
            "Shoot, then eat crumbs to refill your ammunition.",
            "+2",
          );
      }
      if (!current || busy) return;
      tip.hidden = false;
      tip.dataset.lesson = current.id;
      tip.classList.toggle("confirmed", current.confirmation);
      tip.firstElementChild.textContent = current.symbol;
      tip.lastElementChild.textContent = current.text;
      if (!current.confirmation)
        targets[current.id]?.classList.add("lesson-target");
    },
    reset() {
      learned = {};
      shown = new Set();
      current = null;
      previousFloor = -1;
      try {
        localStorage.removeItem(LESSON_KEY);
      } catch {
        /* Optional storage. */
      }
      clear();
    },
    get snapshot() {
      return {
        learned: { ...learned },
        visible: !tip.hidden,
        lesson: tip.hidden ? null : current?.id,
      };
    },
  };
}
