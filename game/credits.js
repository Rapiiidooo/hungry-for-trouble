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
    "COMBAT CUES & OVERTIME",
    "Web Audio & Codex",
    "Every hit, repair and invincible sprint has its own voice.",
  ],
  [
    "SOUNDTRACK & PORTRAITS",
    "Atlas",
    "Original music and two very opinionated robot portraits.",
  ],
  [
    "MUSIC GENERATOR",
    "Google Lyria 3 Clip",
    "Generated on Atlas. Now playing in a supermarket near you.",
  ],
  [
    "PORTRAIT GENERATOR",
    "Gemini 3.1 Flash Lite Image",
    "MOP-3 and SHELF CONTROL, generated on Atlas. Neither approved the photo.",
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
    "INSPIRATIONS",
    "The arcade classics",
    "Maze chases, frantic firefights, survival arenas and glorious power-ups.",
  ],
  [
    "SPECIAL THANKS",
    "You",
    "Please leave the store exactly as you didn't find it.",
  ],
];

const ROLL_SECONDS = 60;
const DELIVERY_SECONDS = 4.4;
const clamp = (value) => Math.max(0, Math.min(1, value));
const smooth = (value) => {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
};
const GAGS = [
  ["brake", "#c94732", "BRAKES. MOSTLY OPTIONAL."],
  ["peek", "#6c8fb8", "NOPE. WRONG CREDITS."],
  ["reverse", "#b98442", "I MEANT TO DO THAT."],
];

function vacuum(color) {
  const wheels = [44, 86]
    .map(
      (x) =>
        `<circle cx="${x}" cy="70" r="13" fill="#172231" stroke="#738ca7" stroke-width="4"/><g class="credit-spokes" data-x="${x}" stroke="#c3cedc" stroke-width="2"><path d="M${x - 8} 70h16M${x} 62v16"/></g>`,
    )
    .join("");
  return `<svg viewBox="0 0 150 90" aria-hidden="true"><ellipse cx="72" cy="80" rx="65" ry="6" fill="#000" opacity=".25"/><path d="M32 56h65v17H32z" fill="#152132"/>${wheels}<ellipse cx="61" cy="45" rx="39" ry="25" fill="${color}"/><path d="M22 43q38 25 78 0v12q-38 27-78 0z" fill="#f0f2f3"/><ellipse cx="61" cy="34" rx="36" ry="20" fill="#f0f2f3"/><path d="M43 13h31v9H43z" fill="${color}"/><path d="m45 31 38-3v13H45z" fill="#263650"/><path class="credit-eyes" d="M50 33h7v6h-7zm22-2h7v6h-7z" fill="#a4d9ed"/><path d="M93 47q33 0 28 24" fill="none" stroke="#344158" stroke-width="13"/><path d="M93 47q33 0 28 24" fill="none" stroke="#8297ad" stroke-width="3" stroke-dasharray="3 5"/><path d="M109 69h32v9h-32z" fill="${color}"/></svg>`;
}

function poseAt(time, frames) {
  const index = frames.findIndex((frame) => frame[0] >= time);
  const end = frames[Math.max(1, index)],
    start = frames[Math.max(0, index - 1)];
  const part = Math.max(
    0,
    Math.min(1, (time - start[0]) / (end[0] - start[0])),
  );
  const eased = part * part * (3 - 2 * part);
  return start
    .slice(1)
    .map((value, i) => value + (end[i + 1] - value) * eased);
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
    <div class="credits-traffic" aria-hidden="true">${GAGS.map(
      ([gag, color, line]) =>
        `<div class="credit-vacuum" data-gag="${gag}"><span class="credit-caption">${line}</span><div class="credit-machine"><div class="credit-dust"><i></i><i></i><i></i></div>${vacuum(color)}</div></div>`,
    ).join("")}</div>
    <div id="credits-delivery" class="credits-delivery" aria-hidden="true" hidden>
      <div id="credits-courier" class="credits-courier"><span id="credits-cough" class="credits-cough">KHH... PTOO!</span><div id="credits-courier-body">${vacuum("#c94732")}</div><div id="credits-spit" class="credit-dust credits-spit"><i></i><i></i><i></i></div></div>
    </div>
    <div id="credits-finale" class="credits-finale" hidden>
      <div id="credits-ticket-slot" class="credits-ticket-slot"><div id="credits-ticket" class="credits-ticket">
        <small class="receipt-code">NIGHT SHIFT · RECEIPT 001</small>
        <span class="receipt-label">MADE BY</span><h2>Rapido.</h2><p>Chief orchestrator. Professional bad influence.</p>
        <div class="receipt-barcode" aria-hidden="true"></div><small class="receipt-signoff">THANK YOU FOR MAKING A MESS.</small>
      </div></div>
      <div id="credits-twist" hidden><small>YOU MISSED A SPOT.</small><h3>The adventure<br><em>continues.</em></h3><p>A service lift. Ten hidden aisles. You're not clocking out yet.</p></div>
      <button id="credits-continue" class="primary">BACK TO SETTINGS</button>
    </div>
    <div class="credits-controls"><button id="credits-pause" aria-pressed="false">PAUSE SCROLL</button><span id="credits-caption">PLEASE KEEP YOUR FEET OFF THE CREDITS.</span><button id="credits-skip">BACK TO SETTINGS</button></div>`;
  const find = (id) => root.querySelector(`#${id}`);
  const roll = find("credits-roll"),
    viewport = find("credits-window");
  const finale = find("credits-finale"),
    ticket = find("credits-ticket"),
    slot = find("credits-ticket-slot"),
    courier = find("credits-courier"),
    courierBody = find("credits-courier-body"),
    courierWheels = [...courier.querySelectorAll(".credit-spokes")];
  const runners = [...root.querySelectorAll(".credit-vacuum")].map(
    (el) => ({
      el,
      machine: el.querySelector(".credit-machine"),
      caption: el.querySelector(".credit-caption"),
      dust: el.querySelector(".credit-dust"),
      eyes: el.querySelector(".credit-eyes"),
      wheels: [...el.querySelectorAll(".credit-spokes")],
    }),
  );
  let state = null;
  function updateControls() {
    const delivering = state.finaleTime !== null;
    find("credits-pause").textContent =
      `${state.paused ? "RESUME" : "PAUSE"} ${delivering ? "ANIMATION" : "SCROLL"}`;
    find("credits-pause").setAttribute(
      "aria-pressed",
      String(state.paused),
    );
    find("credits-skip").textContent = delivering
      ? "SKIP ANIMATION"
      : reducedMotion.matches
        ? "FINISH CREDITS"
        : "SKIP CREDITS";
  }
  function settleFinale() {
    if (!state || state.finished) return;
    state.finished = true;
    root.classList.remove("credits-ending");
    root.classList.add("credits-finished");
    find("credits-delivery").hidden = true;
    finale.inert = false;
    ticket.style.transform = "none";
    ticket.style.opacity = "1";
    root.style.setProperty("--credits-after", "1");
    root.style.setProperty("--credits-after-offset", "0px");
    find("credits-continue").focus({ preventScroll: true });
  }
  function renderDelivery(time) {
    const bounds = root.getBoundingClientRect(),
      target = slot.getBoundingClientRect();
    const width = courier.offsetWidth,
      height = courier.offsetHeight;
    const parkedX = Math.max(16, Math.min(180, bounds.width * 0.12));
    const floor = bounds.height - find("credits-skip").offsetHeight - 50;
    const enter = smooth(time / 1.15),
      leave = smooth((time - 2.5) / 1.2);
    const parkedY = floor - height;
    const cough =
      time > 1.2 && time < 1.85 ? Math.sin((time - 1.2) * 35) : 0;
    const x = -width - 35 + (parkedX + width + 35) * enter * (1 - leave);
    courier.style.transform = `translate(${x + cough * 3}px, ${parkedY}px)`;
    courierBody.style.transform = `rotate(${cough * 5}deg) scaleY(${1 - Math.abs(cough) * 0.055})`;
    for (const wheel of courierWheels)
      wheel.setAttribute(
        "transform",
        `rotate(${(x / width) * 650} ${wheel.dataset.x} 70)`,
      );
    find("credits-cough").style.opacity = String(
      smooth((time - 1.15) / 0.15) * (1 - smooth((time - 1.95) / 0.25)),
    );
    const puff = clamp((time - 1.8) / 0.55);
    find("credits-spit").style.opacity =
      time >= 1.8 ? String((1 - puff) * 0.75) : "0";
    find("credits-spit").style.transform =
      `translate(${puff * 30}px, ${-puff * 20}px) scale(${1 + puff * 2})`;

    const flight = clamp((time - 1.8) / 1.5),
      travel = 1 - (1 - flight) ** 3;
    const sourceX = bounds.left + parkedX + width * 0.93;
    const sourceY = bounds.top + parkedY + height * 0.82;
    const dx = sourceX - (target.left + target.width / 2);
    const dy = sourceY - (target.top + target.height / 2);
    const arc =
      Math.sin(flight * Math.PI) * Math.min(90, Math.abs(dy) * 0.25);
    ticket.style.opacity = String(clamp((time - 1.8) / 0.12));
    ticket.style.transform = `translate(${dx * (1 - travel)}px, ${dy * (1 - travel) - arc}px) rotate(${-14 * (1 - travel) + Math.sin(flight * Math.PI) * 6}deg) scale(${0.09 + 0.91 * smooth(flight)}, ${0.018 + 0.982 * smooth((flight - 0.18) / 0.82)})`;
    const after = smooth((time - 3.45) / 0.65);
    root.style.setProperty(
      "--credits-clear",
      String(1 - smooth(time / 0.55)),
    );
    root.style.setProperty("--credits-after", String(after));
    root.style.setProperty(
      "--credits-after-offset",
      `${(1 - after) * 8}px`,
    );
    root.style.setProperty(
      "--credits-controls-opacity",
      String(1 - smooth((time - 4.1) / 0.3)),
    );
  }
  function finish() {
    if (!state || state.finished) return;
    if (state.finaleTime !== null) {
      settleFinale();
      return;
    }
    state.finaleTime = 0;
    state.paused = false;
    root.classList.add("credits-ending");
    finale.hidden = false;
    finale.inert = true;
    finale.scrollTop = 0;
    find("credits-twist").hidden = !state.reveal;
    find("credits-continue").textContent = state.reveal
      ? "WHAT'S DOWNSTAIRS?"
      : "BACK TO SETTINGS";
    find("credits-delivery").hidden = reducedMotion.matches;
    updateControls();
    if (reducedMotion.matches) settleFinale();
    else renderDelivery(0);
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
    updateControls();
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
      state = {
        reveal,
        elapsed: 0,
        paused: false,
        finished: false,
        finaleTime: null,
      };
      root.classList.remove("credits-finished", "credits-ending");
      for (const property of [
        "--credits-clear",
        "--credits-after",
        "--credits-after-offset",
        "--credits-controls-opacity",
      ])
        root.style.removeProperty(property);
      root.classList.toggle("credits-reduced", reducedMotion.matches);
      root.hidden = false;
      find("credits-finale").hidden = true;
      find("credits-delivery").hidden = true;
      find("credits-pause").hidden = reducedMotion.matches;
      updateControls();
      viewport.scrollTop = 0;
      viewport.focus({ preventScroll: true });
      this.update(0);
    },
    update(dt) {
      if (!state) return;
      const reduced = reducedMotion.matches;
      root.classList.toggle("credits-reduced", reduced);
      find("credits-pause").hidden = reduced;
      if (state.finished) return;
      if (state.finaleTime !== null) {
        if (reduced) settleFinale();
        else {
          if (!state.paused) state.finaleTime += dt;
          renderDelivery(state.finaleTime);
          if (state.finaleTime >= DELIVERY_SECONDS) settleFinale();
        }
        return;
      }
      if (!state.paused && !reduced)
        state.elapsed = Math.min(ROLL_SECONDS, state.elapsed + dt);
      const portion = Math.min(1, state.elapsed / ROLL_SECONDS);
      const start =
        root.clientHeight < 560 ? 0 : viewport.clientHeight * 0.45;
      roll.style.transform = reduced
        ? "none"
        : `translateY(${start - portion * (start + roll.scrollHeight + 20)}px)`;
      for (const [i, runner] of runners.entries()) {
        const phase = ((state.elapsed - 2 - i * 15) % 45) / 11;
        runner.el.hidden =
          reduced || state.finished || phase < 0 || phase > 1;
        if (runner.el.hidden) continue;
        const width = runner.el.offsetWidth,
          edge = root.clientWidth;
        const left = Math.max(16, (edge - 590) / 2 - width - 24);
        const right = edge - left - width,
          offLeft = -width - 40,
          offRight = edge + 40;
        // A single clock freezes the roll, wheels, captions and dust together.
        const frames =
          i === 0
            ? [
                [0, offLeft, 0, 1],
                [0.3, left, -9, 1],
                [0.39, left, 4, 1],
                [0.46, left, 0, 1],
                [0.64, left, 0, 1],
                [1, offRight, -3, 1],
              ]
            : i === 1
              ? [
                  [0, offRight, 0, -1],
                  [0.3, right, 0, -1],
                  [0.49, right, 0, -1],
                  [0.61, right, 0, 1],
                  [1, offRight, -3, 1],
                ]
              : [
                  [0, offRight, 0, 1],
                  [0.34, right, 0, 1],
                  [0.41, right + 18, -6, 1],
                  [0.48, right, 4, 1],
                  [0.57, right, 0, 1],
                  [1, offLeft, 2, 1],
                ];
        const [x, tilt, facing] = poseAt(phase, frames);
        runner.el.style.transform = `translateX(${x}px)`;
        runner.machine.style.transform = `rotate(${tilt}deg) scaleX(${facing})`;
        runner.eyes.style.transform = `scaleY(${(state.elapsed + i) % 5.8 < 0.16 ? 0.12 : 1})`;
        for (const wheel of runner.wheels)
          wheel.setAttribute(
            "transform",
            `rotate(${(x / width) * 650} ${wheel.dataset.x} 70)`,
          );
        const caption = Math.max(
          0,
          Math.min(1, (phase - 0.24) * 12, (0.76 - phase) * 12),
        );
        runner.caption.style.opacity = String(caption);
        runner.caption.style.transform = `translateY(${(1 - caption) * 8}px) rotate(-4deg)`;
        const puff = (phase - (i === 0 ? 0.3 : 0.53)) / 0.15;
        runner.dust.style.opacity =
          puff > 0 && puff < 1 ? String((1 - puff) * 0.65) : "0";
        runner.dust.style.transform = `translate(${-puff * 22}px, ${-puff * 8}px) scale(${1 + Math.max(0, puff)})`;
      }
      if (portion >= 1) finish();
    },
  };
}
