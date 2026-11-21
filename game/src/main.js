// main.js — boot and the game loop for Night Ledger.
// One job: own the screens, tick the world, and hand drawing to render/hud.
import { LEVELS, buildLevel, pointInRect, inShadow } from './levels.js';
import { makeGuard, updateGuard } from './guards.js';
import { makePlayer, updatePlayer } from './player.js';
import { makeInput } from './input.js';
import { sfx, unlockAudio, toggleMute, isMuted } from './audio.js';
import { drawWorld, drawTitle, drawPause, OX, OY } from './render.js';
import { drawHud, drawBanner, levelCount } from './hud.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const input = makeInput();
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');

const game = {
  screen: 'title', // title | playing | paused | levelClear | gameOver | victory
  levelIndex: 0,
  level: null,
  player: null,
  guards: [],
  particles: [],
  detection: 0,
  anySpotted: false,
  shake: 0,
  noiseRing: null,
  bannerTimer: 0,
  time: 0,
  alertedOnce: false,
  caughtFlash: 0,
};

function startLevel(index) {
  game.levelIndex = index;
  game.level = buildLevel(index);
  game.player = makePlayer(game.level.def.playerStart);
  game.guards = game.level.def.guards.map((d, i) => makeGuard(d, i));
  game.particles = [];
  game.detection = 0;
  game.anySpotted = false;
  game.shake = 0;
  game.alertedOnce = false;
  game.screen = 'playing';
}

function spawnParticles(x, y, color, n) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 40 + Math.random() * 90;
    game.particles.push({
      x, y,
      vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
      life: 0.7, max: 0.7,
      size: 2 + Math.random() * 3,
      color,
    });
  }
}

function checkPickups() {
  const p = game.player;
  for (const it of game.level.intel) {
    if (!it.taken && Math.hypot(it.x - p.x, it.y - p.y) < 26) {
      it.taken = true;
      spawnParticles(it.x, it.y, '#f2c14e', 22);
      sfx.pickup();
      if (game.level.intel.every((i) => i.taken)) {
        game.level.exitOpen = true;
        spawnParticles(game.level.def.exit.x + 28, game.level.def.exit.y + 28, '#7ee787', 26);
      }
    }
  }
}

function checkExit() {
  if (!game.level.exitOpen) return;
  const e = game.level.def.exit;
  if (pointInRect(game.player.x, game.player.y, e)) {
    sfx.levelClear();
    if (game.levelIndex + 1 >= levelCount()) {
      game.screen = 'victory';
    } else {
      game.screen = 'levelClear';
      game.bannerTimer = 0;
    }
  }
}

function checkCaught() {
  for (const g of game.guards) {
    if (g.state === 'spotted' && Math.hypot(g.x - game.player.x, g.y - game.player.y) < 26) {
      game.screen = 'gameOver';
      game.caughtFlash = 1;
      sfx.caught();
      return;
    }
  }
}

function tick(dt) {
  game.time += dt;
  if (game.screen !== 'playing') return;
  game.level.elapsed += dt;

  const moved = updatePlayer(game.player, game.level, input, dt);
  if (moved.stepped) sfx.step(game.player.running);
  if (moved.noise && moved.noise.level > 0) {
    game.noiseRing = { x: moved.noise.x, y: moved.noise.y, life: 1 };
  }
  if (game.noiseRing) game.noiseRing.life = Math.max(0, game.noiseRing.life - dt * 1.6);

  let spotted = false;
  let top = 0;
  for (const g of game.guards) {
    const res = updateGuard(g, game.level, game.player, dt, game.time, moved.noise);
    if (res.spotted) spotted = true;
    top = Math.max(top, g.suspicion);
  }
  game.anySpotted = spotted;
  game.detection = top;
  if (spotted && !game.alertedOnce) {
    game.alertedOnce = true;
    game.shake = 7;
    sfx.alert();
  }
  if (game.shake > 0) game.shake = Math.max(0, game.shake - dt * 14);

  for (const pt of game.particles) {
    pt.x += pt.vx * dt;
    pt.y += pt.vy * dt;
    pt.vx *= 0.96; pt.vy *= 0.96;
    pt.life -= dt;
  }
  game.particles = game.particles.filter((pt) => pt.life > 0);

  checkPickups();
  checkExit();
  checkCaught();

  if (input.wasPressed('KeyM')) toggleMute();
}

function handleScreens() {
  // Pause lives here alone: tick() must not toggle it, or one press would
  // pause and unpause in the same frame.
  if (game.screen === 'playing') {
    if (input.wasPressed('KeyP', 'Escape')) game.screen = 'paused';
  } else if (game.screen === 'title') {
    if (input.wasPressed('Enter', 'Space') || input.mousePressed) {
      unlockAudio();
      sfx.click();
      startLevel(0);
    }
  } else if (game.screen === 'paused') {
    if (input.wasPressed('KeyP', 'Escape', 'Enter')) game.screen = 'playing';
  } else if (game.screen === 'levelClear') {
    game.bannerTimer += 1 / 60;
    if (game.bannerTimer > 0.4 && (input.wasPressed('Enter', 'Space') || input.mousePressed)) {
      sfx.click();
      startLevel(game.levelIndex + 1);
    }
  } else if (game.screen === 'gameOver') {
    if (input.wasPressed('Enter', 'Space', 'KeyR') || input.mousePressed) {
      sfx.click();
      startLevel(game.levelIndex);
    }
  } else if (game.screen === 'victory') {
    if (input.wasPressed('Enter', 'Space', 'KeyR') || input.mousePressed) {
      sfx.click();
      startLevel(0);
    }
  }
  if (input.wasPressed('KeyM') && game.screen !== 'playing') toggleMute();
}

function draw() {
  ctx.clearRect(0, 0, 1280, 800);
  if (game.screen === 'title') {
    drawTitle(ctx, game.time);
    return;
  }
  drawWorld(ctx, game, game.time);
  if (game.screen === 'playing' || game.screen === 'paused') drawHud(ctx, game);
  if (game.screen === 'paused') drawPause(ctx);
  if (game.screen === 'playing' && game.anySpotted) {
    drawBanner(ctx, 'SPOTTED!', 'Break line of sight and hide in shadow — the hunt cools down.', '#ff5d5d');
  }
  if (game.screen === 'levelClear') {
    drawHud(ctx, game);
    drawBanner(ctx, 'LEVEL CLEAR', 'Every ledger lifted. Press ENTER for the next hall.', '#7ee787');
  }
  if (game.screen === 'gameOver') {
    drawBanner(ctx, 'CAUGHT!', 'A guard laid hands on you. Press ENTER to try this hall again.', '#ff5d5d');
  }
  if (game.screen === 'victory') {
    drawBanner(ctx, 'THE LEDGER IS YOURS', 'All three halls, unseen. The night keeps your secret.', '#f2c14e');
    ctx.textAlign = 'center';
    ctx.fillStyle = '#9fb2d8';
    ctx.font = '18px Georgia, serif';
    ctx.fillText('Press ENTER to run it again', 640, 480);
    ctx.textAlign = 'left';
  }
  if (isMuted()) {
    ctx.fillStyle = '#8a94a8';
    ctx.font = '12px Georgia, serif';
    ctx.fillText('MUTED (M)', 1220, 800 - 22);
  }
}

// Boot: fresh level 1 under the title screen, then stage a shot if asked.
startLevel(0);
game.screen = 'title';
window.__nightLedger = game; // debug handle for local play-testing
if (shot) stageShot(game, shot);

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  tick(dt);
  handleScreens();
  draw();
  input.endFrame();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
