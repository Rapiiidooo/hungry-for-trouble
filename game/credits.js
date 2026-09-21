const ROLES = [
  ["CREATIVE DIRECTOR", "Rapido", "The person who gave a vacuum a gun."],
  [
    "LEAD DEVELOPER",
    "Codex · OpenAI",
    "One more tiny change. Famous last words.",
  ],
  [
    "ANIMATION DEPARTMENT",
    "Three.js & Codex",
    "Motion capture performed by absolutely no humans.",
  ],
  [
    "PROCEDURAL 3D",
    "404 game recipe",
    "Every shelf, wheel and suspicious appliance built in Three.js.",
  ],
  [
    "THE JAM THAT STARTED THIS",
    "404 on Bittensor",
    "A game jam. A subnet. A deeply unqualified employee.",
  ],
  [
    "CONCEPT REFERENCES",
    "OpenAI ImageGen",
    "Original visual studies. The meshes are still made of code.",
  ],
  [
    "MUSIC & SOUND EFFECTS",
    "Web Audio & Codex",
    "Original elevator music with unresolved anger issues.",
  ],
  [
    "ASSET EXPLORATION",
    "Atlas",
    "Portrait and soundtrack studies generated for this project.",
  ],
  [
    "MUSIC GENERATOR STUDIES",
    "Google Lyria 3 Clip",
    "Generated on Atlas. Study track, not used in this build.",
  ],
  [
    "PORTRAIT GENERATOR STUDIES",
    "Gemini 3.1 Flash Lite Image",
    "MOP-3 and SHELF CONTROL studies on Atlas, not used in this build.",
  ],
  [
    "STUNT COORDINATOR",
    "A trolley with no brakes",
    "We asked for a safety report. It sent a receipt.",
  ],
  [
    "TESTING & QUALITY CONTROL",
    "404 harness · Chrome · Puppeteer",
    "And every brave player who asked: is that supposed to happen?",
  ],
  [
    "SPECIAL THANKS",
    "You",
    "Please leave the store exactly as you didn't find it.",
  ],
];

function vacuum(color) {
  return `<svg viewBox="0 0 150 90" aria-hidden="true"><ellipse cx="72" cy="80" rx="65" ry="6" fill="#000" opacity=".25"/><path d="M32 56h65v17H32z" fill="#152132"/><circle cx="44" cy="70" r="13" fill="#172231" stroke="#738ca7" stroke-width="4"/><circle cx="86" cy="70" r="13" fill="#172231" stroke="#738ca7" stroke-width="4"/><ellipse cx="61" cy="45" rx="39" ry="25" fill="${color}"/><path d="M22 43q38 25 78 0v12q-38 27-78 0z" fill="#f0f2f3"/><ellipse cx="61" cy="34" rx="36" ry="20" fill="#f0f2f3"/><path d="M43 13h31v9H43z" fill="${color}"/><path d="m45 31 38-3v13H45z" fill="#263650"/><path d="M50 33h7v6h-7zm22-2h7v6h-7z" fill="#a4d9ed"/><path d="M93 47q33 0 28 24" fill="none" stroke="#344158" stroke-width="13"/><path d="M93 47q33 0 28 24" fill="none" stroke="#8297ad" stroke-width="3" stroke-dasharray="3 5"/><path d="M109 69h32v9h-32z" fill="${color}"/></svg>`;
}

export function createCredits(root, { reducedMotion, onExit }) {
  root.innerHTML = `
    <div class="credits-header"><span>HUNGRY FOR TROUBLE</span><b>STAFF ROLL</b></div>
    <div id="credits-window" class="credits-window" tabindex="0" aria-label="Game credits">
      <div id="credits-roll" class="credits-roll">
        <div class="credits-intro"><span>AN EXTREMELY UNAUTHORIZED PRODUCTION</span><h2>That's a<br><em>wrap.</em></h2><p>Somebody still has to clean this up.</p></div>
        ${ROLES.map(([role, name, note]) => `<section class="credit-block"><span>${role}</span><h3>${name}</h3><p>${note}</p></section>`).join("")}
        <p class="credits-disclaimer">No vacuums were harmed.<br>Several warranties were invalidated.</p>
      </div>
    </div>
    <div class="credits-traffic" aria-hidden="true">${[
      ["#c94732", "I'M STILL ON THE CLOCK."],
      ["#6c8fb8", "WHO DROPPED THESE CREDITS?"],
      ["#b98442", "404: LUNCH BREAK NOT FOUND."],
    ]
      .map(
        ([color, line]) =>
          `<div class="credit-vacuum"><span>${line}</span>${vacuum(color)}</div>`,
      )
      .join("")}</div>
    <div id="credits-finale" class="credits-finale" hidden>
      <span>MADE BY</span><h2>Rapido.</h2><p>Chief orchestrator. Professional bad influence.</p>
      <div id="credits-twist" hidden><small>YOU MISSED A SPOT.</small><h3>The adventure<br><em>continues.</em></h3><p>A service lift. Ten hidden aisles. You're not clocking out yet.</p></div>
      <button id="credits-continue" class="primary">BACK TO SETTINGS</button>
    </div>
    <div class="credits-controls"><button id="credits-pause" aria-pressed="false">PAUSE SCROLL</button><span id="credits-caption">PLEASE KEEP YOUR FEET OFF THE CREDITS.</span><button id="credits-skip">BACK TO SETTINGS</button></div>`;
  const find = (id) => root.querySelector(`#${id}`);
  const roll = find("credits-roll"),
    viewport = find("credits-window");
  const runners = [...root.querySelectorAll(".credit-vacuum")];
  let state = null;
  function finish() {
    if (!state || state.finished) return;
    state.finished = true;
    root.classList.add("credits-finished");
    find("credits-finale").hidden = false;
    find("credits-twist").hidden = !state.reveal;
    find("credits-continue").textContent = state.reveal
      ? "WHAT'S DOWNSTAIRS?"
      : "BACK TO SETTINGS";
    find("credits-continue").focus({ preventScroll: true });
  }
  function hide() {
    state = null;
    root.hidden = true;
  }
  function close() {
    if (!state) return;
    const reveal = state.reveal;
    hide();
    onExit(reveal);
  }
  find("credits-skip").onclick = finish;
  find("credits-continue").onclick = close;
  find("credits-pause").onclick = () => {
    if (!state) return;
    state.paused = !state.paused;
    find("credits-pause").textContent = state.paused
      ? "RESUME SCROLL"
      : "PAUSE SCROLL";
    find("credits-pause").setAttribute("aria-pressed", String(state.paused));
  };
  return {
    get active() {
      return !!state;
    },
    get snapshot() {
      return state ? { ...state } : null;
    },
    hide,
    skip: () => (state?.reveal && !state.finished ? finish() : close()),
    open(reveal = false) {
      state = { reveal, elapsed: 0, paused: false, finished: false };
      root.classList.remove("credits-finished");
      root.classList.toggle("credits-reduced", reducedMotion.matches);
      root.hidden = false;
      find("credits-finale").hidden = true;
      find("credits-pause").hidden = reducedMotion.matches;
      find("credits-pause").textContent = "PAUSE SCROLL";
      find("credits-pause").setAttribute("aria-pressed", "false");
      find("credits-skip").textContent = reducedMotion.matches
        ? "FINISH CREDITS"
        : "SKIP CREDITS";
      viewport.scrollTop = 0;
      viewport.focus({ preventScroll: true });
      this.update(0);
    },
    update(dt) {
      if (!state) return;
      const reduced = reducedMotion.matches;
      root.classList.toggle("credits-reduced", reduced);
      find("credits-pause").hidden = reduced;
      if (!state.paused && !reduced) state.elapsed += dt;
      const portion = Math.min(1, state.elapsed / 48);
      const start = viewport.clientHeight * 0.45;
      roll.style.transform = reduced
        ? "none"
        : `translateY(${start - portion * (start + roll.scrollHeight + 20)}px)`;
      for (const [i, runner] of runners.entries()) {
        const phase = ((state.elapsed - i * 6) % 19) / 5.5;
        runner.hidden = reduced || phase < 0 || phase > 1;
        const left = i % 2 ? 1 - phase : phase;
        runner.style.transform = `translate(${left * (root.clientWidth + 240) - 180}px, ${Math.sin(state.elapsed * 17) * 2}px)`;
        runner.style.bottom = `${12 + i * 24}%`;
        runner.querySelector("svg").style.transform =
          i % 2 ? "scaleX(-1)" : "none";
      }
      if (portion >= 1) finish();
    },
  };
}
