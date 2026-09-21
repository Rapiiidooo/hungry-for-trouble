// Original synthesised score and effects, started only by a player gesture.
export class Sound {
  constructor() {
    this.enabled = true;
    this.ctx = null;
    this.beat = 0;
    this.nextBeat = 0;
    this.mode = "idle";
  }

  async start() {
    if (!this.ctx) {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return;
      this.ctx = new Audio();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.enabled ? 0.32 : 0;
      this.master.connect(this.ctx.destination);
      const length = this.ctx.sampleRate * 0.2;
      this.noiseBuffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
      const data = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    }
    await this.ctx.resume();
    this.nextBeat = this.ctx.currentTime;
  }

  toggle() {
    this.enabled = !this.enabled;
    if (this.ctx)
      this.master.gain.setTargetAtTime(
        this.enabled ? 0.32 : 0,
        this.ctx.currentTime,
        0.03,
      );
    return this.enabled;
  }

  note(
    frequency,
    duration = 0.1,
    volume = 0.15,
    type = "sine",
    end = frequency,
    delay = 0,
  ) {
    if (!this.ctx || !this.enabled) return;
    const t = this.ctx.currentTime + delay;
    const oscillator = this.ctx.createOscillator(),
      envelope = this.ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, t);
    oscillator.frequency.exponentialRampToValueAtTime(
      Math.max(20, end),
      t + duration,
    );
    envelope.gain.setValueAtTime(0.001, t);
    envelope.gain.exponentialRampToValueAtTime(
      Math.max(0.002, volume),
      t + 0.006,
    );
    envelope.gain.exponentialRampToValueAtTime(0.001, t + duration);
    oscillator.connect(envelope).connect(this.master);
    oscillator.start(t);
    oscillator.stop(t + duration + 0.01);
    oscillator.onended = () => {
      oscillator.disconnect();
      envelope.disconnect();
    };
  }

  noise(duration = 0.08, volume = 0.1, frequency = 2000) {
    if (!this.ctx || !this.enabled) return;
    const t = this.ctx.currentTime,
      source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter(),
      gain = this.ctx.createGain();
    filter.type = "highpass";
    filter.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    source.connect(filter).connect(gain).connect(this.master);
    source.start(t);
    source.stop(t + duration);
    source.onended = () => {
      source.disconnect();
      filter.disconnect();
      gain.disconnect();
    };
  }

  effect(type, count = 1) {
    if (type === "escape") {
      for (const [i, interval] of [
        0, 4, 7, 12, 9, 7, 4, 7, 12, 16, 19, 24,
      ].entries())
        this.note(
          261.63 * 2 ** (interval / 12),
          i === 11 ? 1.8 : 0.45,
          0.16,
          "triangle",
          261.63 * 2 ** (interval / 12),
          0.4 + i * 0.24,
        );
      for (const frequency of [130.81, 164.81, 196])
        this.note(frequency, 2.4, 0.07, "sine", frequency, 2.8);
    }
    if (type === "lob-warning" || type === "pulse-warning") {
      this.note(310, 0.24, 0.09, "triangle", 620);
      this.note(620, 0.17, 0.08, "triangle", 930, 0.22);
    }
    if (type === "lob-impact") {
      this.noise(0.18, 0.2, 400);
      this.note(90, 0.23, 0.2, "sine", 25);
    }
    if (type === "transport") {
      this.note(180, 0.3, 0.13, "sine", 1400);
      this.note(1400, 0.3, 0.1, "triangle", 440, 0.15);
    }
    if (type === "ricochet") this.note(1300, 0.08, 0.06, "triangle", 700);
    if (["mine-warning", "mine-trigger"].includes(type))
      this.note(type === "mine-trigger" ? 880 : 440, 0.12, 0.09, "square", 600);
    if (type === "mine-defused") this.note(660, 0.13, 0.12, "sine", 1100);
    if (["flour-burst", "mine-burst", "stock-hit", "cart-push"].includes(type))
      this.noise(0.16, 0.18, 500);
    if (type === "heal") {
      this.note(660, 0.18, 0.18, "sine", 880);
      this.note(990, 0.3, 0.16, "sine", 1320, 0.12);
    }
    if (type === "drone-warning") this.note(620, 0.2, 0.13, "square", 920);
    if (type === "drone-shot") this.note(250, 0.1, 0.15, "sawtooth", 70);
    if (type === "shield-save") this.note(1200, 0.35, 0.22, "sine", 400);
    if (type === "visor" || type === "wave") {
      for (const [i, f] of [330, 660, 990].entries())
        this.note(f, 0.2, 0.19, "triangle", f, i * 0.1);
    }
    if (type === "charge-warning") {
      this.note(450, 0.12, 0.2, "square", 650);
      this.note(450, 0.12, 0.2, "square", 650, 0.2);
    }
    if (type === "charge") this.noise(0.14, 0.25, 800);
    if (type === "shield") this.note(800, 0.04, 0.035, "sine", 350);
    if (type === "crumb")
      this.note(550 + (count % 8) * 65, 0.07, 0.08, "sine", 1100);
    if (type === "shot") {
      this.note(165, 0.06, 0.19, "square", 45);
      this.noise(0.035, 0.08);
    }
    if (type === "hit") {
      this.noise(0.055, 0.16, 1100);
      this.note(290, 0.05, 0.1, "triangle", 80);
    }
    if (type === "enemy-down") {
      this.note(85, 0.28, 0.35, "sawtooth", 25);
      this.noise(0.15, 0.3, 500);
    }
    if (type === "dash") {
      this.noise(0.13, 0.23, 1200);
      this.note(140, 0.14, 0.1, "triangle", 450);
    }
    if (type === "damage") {
      this.note(110, 0.32, 0.35, "sawtooth", 32);
      this.noise(0.15, 0.22, 300);
    }
    if (type === "empty") this.note(120, 0.04, 0.12, "square", 70);
    if (type === "boss-shot") this.note(100, 0.16, 0.2, "sawtooth", 45);
    if (
      ["overtime", "exit-open", "cleared", "won", "boss-down"].includes(type)
    ) {
      for (const [i, f] of [262, 330, 392, 523, 784].entries())
        this.note(f, 0.22, 0.17, "triangle", f, i * 0.065);
    }
    if (type === "lost")
      for (let i = 0; i < 4; i++)
        this.note(260 - i * 50, 0.3, 0.15, "triangle", 80, i * 0.15);
  }

  update(playing, overtime, theme) {
    if (!this.ctx) return;
    const time = this.ctx.currentTime;
    if (!playing) {
      this.nextBeat = time;
      this.mode = "idle";
      return;
    }
    const mode = overtime > 0 ? "overtime" : "shift";
    if (this.mode !== mode) {
      this.mode = mode;
      this.beat = 0;
      this.nextBeat = time;
    }
    if (time < this.nextBeat) return;
    if (mode === "overtime") {
      // An original major-key 158 BPM sprint, independent of the normal shift melody.
      const step = this.beat++ % 32;
      const tune = [
        0, 7, 4, 9, 7, 12, 11, 7, 2, 9, 5, 12, 9, 14, 12, 7, 4, 11, 7, 14, 12,
        16, 14, 11, 5, 12, 9, 16, 14, 17, 16, 12,
      ];
      this.nextBeat = time + 60 / 158 / 4;
      this.note(261.63 * 2 ** (tune[step] / 12), 0.085, 0.12, "triangle");
      if (step % 4 === 0) {
        const bass = [0, 5, 7, 5][Math.floor(step / 8)];
        this.note(130.81 * 2 ** (bass / 12), 0.15, 0.13, "square");
        this.note(180, 0.12, 0.17, "sine", 45);
      }
      if (step % 4 === 2) this.noise(0.04, 0.075, 4200);
      if (overtime < 2 && step % 4 === 0) this.note(1760, 0.055, 0.07);
      return;
    }
    const beat = this.beat++ % 16,
      fast = overtime > 0;
    this.nextBeat = time + (fast ? 0.105 : 0.14);
    const root = theme === "ice" ? 73.42 : theme === "boss" ? 55 : 65.41;
    const bass = [0, 0, 7, 0, 3, 0, 10, 7][Math.floor(beat / 2)];
    if (beat % 2 === 0)
      this.note(root * 2 ** (bass / 12), 0.13, 0.13, "triangle");
    if (beat % 4 === 0) this.note(130, 0.12, 0.26, "sine", 35);
    if (beat % 8 === 4) this.noise(0.07, 0.13, 950);
    if (beat % 2 === 1) this.noise(0.027, fast ? 0.065 : 0.035, 6500);
    if (fast || beat % 4 === 2) {
      const melody = [12, 19, 24, 22, 15, 19, 22, 10][Math.floor(beat / 2)];
      this.note(
        root * 2 ** (melody / 12),
        0.075,
        fast ? 0.07 : 0.035,
        "square",
      );
    }
  }
}
