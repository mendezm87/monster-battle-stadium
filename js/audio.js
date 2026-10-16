// Tiny synthesized sound effects (WebAudio, no asset files).
const Sfx = (() => {
  let ctx = null, master = null, noiseBuf = null, muted = false;
  const last = {};

  function init() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.3;
      master.connect(ctx.destination);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === 'suspended') ctx.resume();
  }

  function tone(freq, dur, type = 'square', vol = 0.2, slide = 0, delay = 0) {
    const t = ctx.currentTime + delay;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(master);
    o.start(t); o.stop(t + dur + 0.02);
  }

  function noise(dur, vol = 0.3, freq = 1000, delay = 0) {
    const t = ctx.currentTime + delay;
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf;
    f.type = 'lowpass'; f.frequency.value = freq;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f).connect(g).connect(master);
    s.start(t); s.stop(t + dur + 0.02);
  }

  const lib = {
    select() { tone(880, 0.06, 'square', 0.12); },
    back() { tone(440, 0.06, 'square', 0.1); },
    shoot() { tone(720, 0.09, 'square', 0.08, -420); },
    dash() { noise(0.18, 0.18, 2400); tone(260, 0.15, 'sawtooth', 0.06, 300); },
    charge() { tone(180, 0.45, 'sawtooth', 0.07, 600); },
    beam() { noise(0.6, 0.22, 1800); tone(110, 0.6, 'sawtooth', 0.1, 40); },
    hit() { noise(0.12, 0.35, 1600); tone(150, 0.1, 'square', 0.14, -70); },
    bigHit() { noise(0.3, 0.5, 900); tone(90, 0.25, 'square', 0.2, -50); },
    boom() { noise(0.45, 0.5, 600); tone(70, 0.4, 'triangle', 0.25, -30); },
    zap() { noise(0.2, 0.3, 4000); tone(1200, 0.12, 'square', 0.06, -900); },
    heal() { tone(523, 0.1, 'triangle', 0.15); tone(659, 0.1, 'triangle', 0.15, 0, 0.08); tone(784, 0.18, 'triangle', 0.15, 0, 0.16); },
    buff() { tone(400, 0.25, 'triangle', 0.14, 500); },
    status() { tone(300, 0.08, 'square', 0.1); tone(300, 0.08, 'square', 0.1, 0, 0.12); },
    ball() { tone(380, 0.18, 'sine', 0.18, 500); },
    pop() { noise(0.12, 0.25, 3000); tone(900, 0.08, 'square', 0.08); },
    faint() { tone(500, 0.7, 'triangle', 0.22, -420); },
    win() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'square', 0.1, 0, i * 0.13)); },
    lose() { [392, 330, 262, 196].forEach((f, i) => tone(f, 0.28, 'triangle', 0.14, 0, i * 0.18)); },
  };

  return {
    init,
    play(name) {
      if (!ctx || muted || !lib[name]) return;
      const now = performance.now();
      if (last[name] && now - last[name] < 45) return; // throttle spam
      last[name] = now;
      lib[name]();
    },
    toggle() { muted = !muted; return muted; },
    get muted() { return muted; },
  };
})();
