// audio.js — synthesized WebAudio only. No audio files, no network.
// One job: footsteps, alert sting, pickup blip and a low ambient hum.
let ctx = null;
let muted = false;
let humNodes = null;

export function isMuted() { return muted; }

export function toggleMute() {
  muted = !muted;
  if (humNodes) humNodes.gain.gain.value = muted ? 0 : 0.035;
  return muted;
}

function ensureCtx() {
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) { ctx = null; }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// Called on the first user gesture so the browser allows sound.
export function unlockAudio() {
  const c = ensureCtx();
  if (!c || humNodes) return;
  const osc = c.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = 52;
  const osc2 = c.createOscillator();
  osc2.type = 'triangle';
  osc2.frequency.value = 104.5;
  const gain = c.createGain();
  gain.gain.value = muted ? 0 : 0.035;
  const gain2 = c.createGain();
  gain2.gain.value = 0.4;
  osc.connect(gain); osc2.connect(gain2); gain2.connect(gain); gain.connect(c.destination);
  osc.start(); osc2.start();
  humNodes = { gain };
}

function blip(freq, dur, type, vol, slideTo) {
  if (muted) return;
  const c = ensureCtx();
  if (!c) return;
  const o = c.createOscillator();
  o.type = type;
  o.frequency.value = freq;
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, c.currentTime + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(vol, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
  o.connect(g); g.connect(c.destination);
  o.start(); o.stop(c.currentTime + dur);
}

function noiseTick(vol, lowpass) {
  if (muted) return;
  const c = ensureCtx();
  if (!c) return;
  const len = Math.floor(c.sampleRate * 0.07);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = 'lowpass'; f.frequency.value = lowpass;
  const g = c.createGain();
  g.gain.value = vol;
  src.connect(f); f.connect(g); g.connect(c.destination);
  src.start();
}

export const sfx = {
  step(run) { noiseTick(run ? 0.16 : 0.07, run ? 900 : 500); },
  guardStep() { noiseTick(0.05, 350); },
  pickup() { blip(660, 0.12, 'sine', 0.22, 990); setTimeout(() => blip(990, 0.16, 'sine', 0.2, 1320), 70); },
  alert() { blip(220, 0.5, 'sawtooth', 0.16, 440); setTimeout(() => blip(330, 0.4, 'sawtooth', 0.12, 220), 120); },
  caught() { blip(180, 0.7, 'square', 0.14, 60); },
  levelClear() { [523, 659, 784].forEach((f, i) => setTimeout(() => blip(f, 0.22, 'triangle', 0.2), i * 110)); },
  click() { blip(520, 0.06, 'square', 0.08); },
};
