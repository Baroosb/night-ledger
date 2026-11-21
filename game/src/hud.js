// hud.js — the heads-up display and screen banners.
// One job: draw everything that tells the player how seen they are.
import { LEVELS } from './levels.js';

export function drawHud(ctx, game) {
  const level = game.level;
  const taken = level.intel.filter((i) => i.taken).length;
  const total = level.intel.length;
  const detection = game.detection; // 0..100, highest guard suspicion
  const alert = game.anySpotted;

  // --- top bar
  ctx.fillStyle = 'rgba(8, 12, 24, 0.88)';
  ctx.fillRect(0, 0, 1280, 52);
  ctx.fillStyle = '#2b3a55';
  ctx.fillRect(0, 52, 1280, 2);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#f2c14e';
  ctx.font = 'bold 17px Georgia, serif';
  ctx.fillText('NIGHT LEDGER', 18, 27);
  ctx.fillStyle = '#9fb2d8';
  ctx.font = '13px Georgia, serif';
  ctx.fillText(level.def.name, 180, 27);

  // objectives
  ctx.fillStyle = taken === total ? '#7ee787' : '#e8eefc';
  ctx.font = 'bold 15px Georgia, serif';
  ctx.fillText(`LEDGERS  ${taken}/${total}`, 560, 27);
  ctx.fillStyle = level.exitOpen ? '#7ee787' : '#8a94a8';
  ctx.font = '13px Georgia, serif';
  ctx.fillText(level.exitOpen ? '→ REACH THE GREEN DOOR' : '→ COLLECT ALL LEDGERS', 700, 27);

  // timer
  const t = Math.floor(level.elapsed);
  ctx.fillStyle = '#c8d2e8';
  ctx.font = '15px Georgia, serif';
  ctx.textAlign = 'right';
  ctx.fillText(`${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`, 1262, 27);
  ctx.textAlign = 'left';

  // --- detection meter (bottom centre): the heart of the HUD
  const mw = 340;
  const mx = 640 - mw / 2;
  const my = 800 - 44;
  ctx.fillStyle = 'rgba(8, 12, 24, 0.88)';
  roundRect(ctx, mx - 14, my - 16, mw + 28, 40, 10);
  ctx.fill();
  const label = alert ? 'SPOTTED!' : detection >= 45 ? 'SUSPICIOUS…' : detection > 2 ? 'SEEN…' : 'HIDDEN';
  ctx.fillStyle = alert ? '#ff5d5d' : detection >= 45 ? '#f2c14e' : '#7ee787';
  ctx.font = 'bold 13px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(label, 640, my - 2);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#1b2438';
  roundRect(ctx, mx, my + 8, mw, 10, 5);
  ctx.fill();
  const grad = ctx.createLinearGradient(mx, 0, mx + mw, 0);
  grad.addColorStop(0, '#7ee787');
  grad.addColorStop(0.45, '#f2c14e');
  grad.addColorStop(1, '#ff5d5d');
  ctx.fillStyle = grad;
  if (detection > 0.5) {
    roundRect(ctx, mx, my + 8, (mw * detection) / 100, 10, 5);
    ctx.fill();
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.strokeRect(mx + mw * 0.45, my + 8, 1, 10);

  // stance hint
  ctx.fillStyle = '#8a94a8';
  ctx.font = '12px Georgia, serif';
  ctx.fillText(game.player.sneaking ? 'SNEAKING — slow, silent' : game.player.running ? 'RUNNING — fast, LOUD' : 'WASD move · SHIFT run · C sneak · P pause · M mute', 18, 800 - 22);

  drawMinimap(ctx, game);
}

function drawMinimap(ctx, game) {
  // Small live map, top-right under the bar: guards as dots, player as a diamond.
  const x0 = 1280 - 208;
  const y0 = 62;
  const w = 190;
  const h = 114;
  const sx = w / 1200;
  const sy = h / 720;
  ctx.fillStyle = 'rgba(8, 12, 24, 0.8)';
  roundRect(ctx, x0 - 6, y0 - 6, w + 12, h + 12, 8);
  ctx.fill();
  ctx.strokeStyle = '#2b3a55';
  ctx.strokeRect(x0, y0, w, h);
  for (const wall of game.level.def.walls) {
    ctx.fillStyle = '#3a4a66';
    ctx.fillRect(x0 + wall.x * sx, y0 + wall.y * sy, Math.max(1, wall.w * sx), Math.max(1, wall.h * sy));
  }
  for (const it of game.level.intel) {
    if (it.taken) continue;
    ctx.fillStyle = '#f2c14e';
    ctx.beginPath();
    ctx.arc(x0 + it.x * sx, y0 + it.y * sy, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  const ex = game.level.def.exit;
  ctx.fillStyle = game.level.exitOpen ? '#7ee787' : '#4c6b4c';
  ctx.fillRect(x0 + ex.x * sx, y0 + ex.y * sy, 9, 9);
  for (const g of game.guards) {
    ctx.fillStyle = g.state === 'spotted' ? '#ff5d5d' : g.state === 'suspicious' ? '#f2c14e' : '#ff9d5c';
    ctx.beginPath();
    ctx.arc(x0 + g.x * sx, y0 + g.y * sy, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#7ee787';
  const px = x0 + game.player.x * sx;
  const py = y0 + game.player.y * sy;
  ctx.beginPath();
  ctx.moveTo(px, py - 5); ctx.lineTo(px + 5, py); ctx.lineTo(px, py + 5); ctx.lineTo(px - 5, py);
  ctx.closePath(); ctx.fill();
}

// Big centre banner (SPOTTED / level clear / caught).
export function drawBanner(ctx, title, sub, color) {
  ctx.fillStyle = 'rgba(5, 8, 16, 0.72)';
  ctx.fillRect(0, 300, 1280, 150);
  ctx.fillStyle = color;
  ctx.fillRect(0, 300, 1280, 3);
  ctx.fillRect(0, 447, 1280, 3);
  ctx.textAlign = 'center';
  ctx.fillStyle = color;
  ctx.font = 'bold 54px Georgia, serif';
  ctx.fillText(title, 640, 360);
  ctx.fillStyle = '#e8eefc';
  ctx.font = '19px Georgia, serif';
  ctx.fillText(sub, 640, 408);
  ctx.textAlign = 'left';
}

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function levelCount() { return LEVELS.length; }
