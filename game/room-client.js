export class RoomClient {
  constructor(callbacks) {
    this.callbacks = callbacks;
    this.session = null;
    this.room = null;
    this.round = 0;
    this.seq = Date.now();
    this.since = 0;
    this.input = [1, 0, 0, null, 0];
    this.dash = false;
    this.generation = 0;
  }
  async request(path, body) {
    const response = await fetch(`/api/rooms${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(4000),
    });
    const data = await response
      .json()
      .catch(() => ({ error: "Rooms are unavailable on this host." }));
    if (!response.ok) {
      const error = new Error(data.error || "Room unavailable.");
      error.status = response.status;
      throw error;
    }
    return data;
  }
  saved() {
    try {
      const value = JSON.parse(sessionStorage.getItem("hft-room") || "null");
      return value &&
        /^[A-Z2-9]{6}$/.test(value.code) &&
        /^[a-f0-9]{48}$/.test(value.token)
        ? value
        : null;
    } catch {
      return null;
    }
  }
  remember() {
    try {
      sessionStorage.setItem(
        "hft-room",
        JSON.stringify({ ...this.session, seq: this.seq }),
      );
    } catch {}
  }
  reconnect() {
    const saved = this.saved();
    if (!saved) return;
    this.session = saved;
    this.round = 0;
    this.since = 0;
    this.seq = Math.max(Date.now(), (saved.seq || 0) + 1000);
    this.poll(++this.generation);
  }
  async connect(kind, name, code) {
    if (this.session) await this.leave();
    const packet = await this.request(
      code ? `/${code}/join` : "",
      code ? { name } : { kind, name },
    );
    this.session = {
      code: packet.room.code,
      id: packet.id,
      token: packet.token,
    };
    this.room = packet.room;
    this.round = 0;
    this.seq = Date.now();
    this.since = 0;
    this.remember();
    this.callbacks.lobby(this.room, this.session.id);
    this.poll(++this.generation);
  }
  controls(input) {
    this.input = input;
    this.dash ||= !!(input[4] & 2);
  }
  async start() {
    if (this.session)
      await this.request(`/${this.session.code}/start`, {
        token: this.session.token,
      });
  }
  async poll(generation) {
    let failures = 0;
    while (this.session && generation === this.generation) {
      try {
        const input = [...this.input];
        if (this.dash) input[4] |= 2;
        this.dash = false;
        const packet = await this.request(`/${this.session.code}/sync`, {
          token: this.session.token,
          seq: ++this.seq,
          since: this.since,
          input,
        });
        if (generation !== this.generation) return;
        failures = 0;
        this.remember();
        this.room = packet.room;
        this.callbacks.connection("");
        this.callbacks.lobby(this.room, this.session.id);
        if (packet.snapshot && packet.room.round !== this.round) {
          this.round = packet.room.round;
          this.since = 0;
          this.input = [1, 0, 0, null, 0];
          await this.callbacks.round(
            packet.room,
            packet.snapshot,
            this.session.id,
          );
          if (generation !== this.generation) return;
        }
        if (packet.snapshot) {
          this.since = packet.snapshot.eventSerial;
          this.callbacks.snapshot(packet.snapshot);
        }
      } catch (error) {
        if (generation !== this.generation) return;
        failures++;
        this.callbacks.connection(error.message);
        this.input = [1, 0, 0, null, 0];
        this.dash = false;
        if ([403, 404].includes(error.status)) {
          try {
            sessionStorage.removeItem("hft-room");
          } catch {}
          this.session = null;
          this.callbacks.disconnected(error.message);
          return;
        }
      }
      await new Promise((resolve) => setTimeout(resolve, failures ? 600 : 50));
    }
  }
  async leave() {
    const previous = this.session;
    try {
      sessionStorage.removeItem("hft-room");
    } catch {}
    this.session = null;
    this.room = null;
    this.generation++;
    this.input = [1, 0, 0, null, 0];
    this.dash = false;
    if (previous)
      await this.request(`/${previous.code}/leave`, {
        token: previous.token,
      }).catch(() => {});
  }
}
