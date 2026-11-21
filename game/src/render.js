// render.js — everything drawn on the canvas.
// One job: turn game state into a readable night scene. World is 1200x720,
// drawn offset by (40, 64) so the HUD bar and meter have room.
import { conePolygon } from './vision.js';
import { guardAlertWord } from './guards.js';
import { inShadow, inLight } from './levels.js';

export const OX = 40;
export const OY = 64;

function tileFloor(ctx, level, t) {
  // Checkerboard stone floor with a faint warm pool under each lamp.
  for (let ty = 0; ty < 18; ty++) {
    for (let tx = 0; tx < 30; tx++) {
      const x = tx * 40;
      const y = ty * 40;
      ctx.fillStyle = (tx + ty) % 2 === 0 ? '#232c42' : '#202839';
      ctx.fillRect(x, y, 40, 40);
    }
  }
  // Lit zones glow warm; shadow zones sink into teal dark.
  for (const z of level.def.lit) {
    const g = ctx.createRadialGradient(z.x + z.w / 2, z.y + z.h / 2, 10, z.x + z.w / 2, z.y + z.h / 2, Math.max(z.w, z.h) * 0.7);
    g.addColorStop(0, 'rgba(242, 193, 78, 0.20)');
    g.addColorStop(1, 'rgba(242, 193, 78, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(z.x - 20, z.y - 20, z.w + 40, z.h + 40);
  }
  for (const z of level.def.shadows) {
    ctx.fillStyle = 'rgba(24, 68, 74, 0.55)';
    ctx.fillRect(z.x, z.y, z.w, z.h);
    ctx.strokeStyle = 'rgba(126, 231, 135, 0.25)';
    ctx.setLineDash([6, 6]);
    ctx.strokeRect(z.x + 2, z.y + 2, z.w - 4, z.h - 4);
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(126, 231, 135, 0.5)';
    ctx.font = '11px Georgia, serif';
    ctx.fillText('SHADOW — SAFE', z.x + 8, z.y + 16);
  }
  // Rug runner down the middle of each level for colour.
  ctx.fillStyle = 'rgba(122, 44, 62, 0.5)';
  ctx.fillRect(560, 0, 80, 720);
  ctx.fillStyle = 'rgba(242, 193, 78, 0.35)';
  ctx.fillRect(560, 0, 4, 720);
  ctx.fillRect(636, 0, 4, 720);
}

function drawWallsAndCrates(ctx, level) {
  for (const w of level.def.walls) {
    ctx.fillStyle = '#111827';
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = '#3a4a66';
    ctx.fillRect(w.x, w.y, w.w, 5);
    ctx.fillStyle = '#2b3a55';
    ctx.fillRect(w.x, w.y + 5, w.w, w.h - 5);
  }
  for (const c of level.def.crates) {
    ctx.fillStyle = '#6b4a2b';
    ctx.fillRect(c.x, c.y, c.w, c.h);
    ctx.fillStyle = '#8a6238';
    ctx.fillRect(c.x + 4, c.y + 4, c.w - 8, c.h - 8);
    ctx.strokeStyle = '#4a3018';
    ctx.lineWidth = 2;
    ctx.strokeRect(c.x + 4, c.y + 4, c.w - 8, c.h - 8);
    ctx.beginPath();
    ctx.moveTo(c.x + 4, c.y + 4); ctx.lineTo(c.x + c.w - 4, c.y + c.h - 4);
    ctx.moveTo(c.x + c.w - 4, c.y + 4); ctx.lineTo(c.x + 4, c.y + c.h - 4);
    ctx.stroke();
    ctx.lineWidth = 1;
  }
}

function drawCone(ctx, level, g, t) {
  const pts = conePolygon(level, g);
  const color = g.state === 'spotted' ? '255, 93, 93' : g.state === 'suspicious' ? '242, 193, 78' : '255, 214, 120';
  const grad = ctx.createRadialGradient(g.x, g.y, 10, g.x, g.y, 230);
  grad.addColorStop(0, `rgba(${color}, 0.34)`);
  grad.addColorStop(1, `rgba(${color}, 0.05)`);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.closePath();
  ctx.fill();
  // Cone edge lines so the boundary reads at small size.
  ctx.strokeStyle = `rgba(${color}, 0.5)`;
  ctx.beginPath();
  ctx.moveTo(g.x, g.y);
  ctx.lineTo(pts[1].x, pts[1].y);
  ctx.moveTo(g.x, g.y);
  ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
  ctx.stroke();
}

function drawGuard(ctx, g, t) {
  // Footstep ring: tells the player where a guard is even off-cone.
  const phase = (t * 2 + g.id) % 1;
  ctx.strokeStyle = `rgba(255, 157, 92, ${0.35 * (1 - phase)})`;
  ctx.beginPath();
  ctx.arc(g.x, g.y, 14 + phase * 22, 0, Math.PI * 2);
  ctx.stroke();

  // Body: dark uniform, brass buttons, cap; red trim when hunting.
  const trim = g.state === 'spotted' ? '#ff5d5d' : g.state === 'suspicious' ? '#f2c14e' : '#ff9d5c';
  ctx.fillStyle = '#1d2733';
  ctx.beginPath();
  ctx.arc(g.x, g.y, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = trim;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.lineWidth = 1;
  // Facing nose / torch direction.
  ctx.strokeStyle = '#ffd678';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(g.x, g.y);
  ctx.lineTo(g.x + Math.cos(g.facing) * 20, g.y + Math.sin(g.facing) * 20);
  ctx.stroke();
  ctx.lineWidth = 1;
  // Cap brim.
  ctx.fillStyle = '#0f1622';
  ctx.beginPath();
  ctx.arc(g.x + Math.cos(g.facing) * 6, g.y + Math.sin(g.facing) * 6, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = trim;
  ctx.beginPath();
  ctx.arc(g.x, g.y, 3, 0, Math.PI * 2);
  ctx.fill();

  const word = guardAlertWord(g);
  if (word) {
    const bounce = Math.sin(t * 6) * 2;
    ctx.font = 'bold 26px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = word === '!' ? '#ff5d5d' : '#f2c14e';
    ctx.fillText(word, g.x, g.y - 26 + bounce);
    ctx.textAlign = 'left';
  }
  // Suspicion arc above the guard.
  if (g.suspicion > 3) {
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.arc(g.x, g.y, 20, -Math.PI / 2, Math.PI * 1.5);
    ctx.stroke();
    ctx.strokeStyle = g.suspicion >= 100 ? '#ff5d5d' : '#f2c14e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(g.x, g.y, 20, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * g.suspicion) / 100);
    ctx.stroke();
    ctx.lineWidth = 1;
  }
}

function drawPlayer(ctx, p, t, level) {
  const bob = p.moving ? Math.sin(p.bob) * 1.5 : 0;
  // Soft shadow blob.
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + 12, 14, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  // Hooded cloak: teal-green, readable against the blue floor.
  ctx.fillStyle = '#2f9e6e';
  ctx.beginPath();
  ctx.moveTo(p.x, p.y - 15 + bob);
  ctx.quadraticCurveTo(p.x + 15, p.y, p.x + 10, p.y + 13 + bob);
  ctx.quadraticCurveTo(p.x, p.y + 17 + bob, p.x - 10, p.y + 13 + bob);
  ctx.quadraticCurveTo(p.x - 15, p.y, p.x, p.y - 15 + bob);
  ctx.fill();
  ctx.strokeStyle = '#7ee787';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.lineWidth = 1;
  // Hood + face shadow.
  ctx.fillStyle = '#1d5c40';
  ctx.beginPath();
  ctx.arc(p.x, p.y - 4 + bob, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f2e6c8';
  ctx.beginPath();
  ctx.arc(p.x + p.faceX * 3, p.y - 4 + p.faceY * 3 + bob, 3.5, 0, Math.PI * 2);
  ctx.fill();
  // Sneak / run indicator.
  if (p.sneaking || p.running) {
    ctx.font = '11px Georgia, serif';
    ctx.fillStyle = p.sneaking ? '#7ee787' : '#ff9d5c';
    ctx.textAlign = 'center';
    ctx.fillText(p.sneaking ? 'sneaking' : 'RUNNING', p.x, p.y + 30);
    ctx.textAlign = 'left';
  }
  if (inShadow(level, p.x, p.y)) {
    ctx.font = 'bold 11px Georgia, serif';
    ctx.fillStyle = '#7ee787';
    ctx.textAlign = 'center';
    ctx.fillText('HIDDEN IN SHADOW', p.x, p.y - 24);
    ctx.textAlign = 'left';
  }
}

function drawIntelAndExit(ctx, level, t) {
  for (const it of level.intel) {
    if (it.taken) continue;
    const pulse = 1 + Math.sin(t * 4) * 0.12;
    ctx.save();
    ctx.translate(it.x, it.y);
    ctx.scale(pulse, pulse);
    const g = ctx.createRadialGradient(0, 0, 2, 0, 0, 26);
    g.addColorStop(0, 'rgba(242, 193, 78, 0.55)');
    g.addColorStop(1, 'rgba(242, 193, 78, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f6e7b8';
    ctx.fillRect(-9, -12, 18, 24);
    ctx.strokeStyle = '#8a6d2b';
    ctx.strokeRect(-9, -12, 18, 24);
    ctx.strokeStyle = '#5a4a1f';
    ctx.beginPath();
    ctx.moveTo(-5, -5); ctx.lineTo(5, -5);
    ctx.moveTo(-5, 0); ctx.lineTo(5, 0);
    ctx.moveTo(-5, 5); ctx.lineTo(2, 5);
    ctx.stroke();
    ctx.restore();
  }
  // Exit door.
  const ex = level.def.exit;
  const open = level.exitOpen;
  const glow = open ? 0.5 + Math.sin(t * 5) * 0.2 : 0.18;
  ctx.fillStyle = open ? `rgba(126, 231, 135, ${glow})` : 'rgba(90, 110, 90, 0.25)';
  ctx.fillRect(ex.x - 8, ex.y - 8, ex.w + 16, ex.h + 16);
  ctx.fillStyle = open ? '#2f9e6e' : '#3a4a42';
  ctx.fillRect(ex.x, ex.y, ex.w, ex.h);
  ctx.strokeStyle = open ? '#7ee787' : '#5a6b5a';
  ctx.lineWidth = 3;
  ctx.strokeRect(ex.x, ex.y, ex.w, ex.h);
  ctx.lineWidth = 1;
  ctx.fillStyle = open ? '#eafff0' : '#8a94a8';
  ctx.font = 'bold 13px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(open ? 'EXIT' : 'LOCKED', ex.x + ex.w / 2, ex.y + ex.h / 2 + 5);
  ctx.textAlign = 'left';
}

function drawParticles(ctx, particles) {
  for (const pt of particles) {
    ctx.globalAlpha = Math.max(0, pt.life / pt.max);
    ctx.fillStyle = pt.color;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawObjectiveArrow(ctx, game) {
  // Arrow at the screen edge of the world pointing at the next goal.
  const target = nextTarget(game);
  if (!target) return;
  const p = game.player;
  const ang = Math.atan2(target.y - p.y, target.x - p.x);
  const ax = p.x + Math.cos(ang) * 34;
  const ay = p.y + Math.sin(ang) * 34;
  ctx.save();
  ctx.translate(ax, ay);
  ctx.rotate(ang);
  ctx.fillStyle = 'rgba(242, 193, 78, 0.9)';
  ctx.beginPath();
  ctx.moveTo(10, 0); ctx.lineTo(-6, -6); ctx.lineTo(-6, 6);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function nextTarget(game) {
  const open = game.level.intel.find((i) => !i.taken);
  if (open) return open;
  if (game.level.exitOpen) {
    const e = game.level.def.exit;
    return { x: e.x + e.w / 2, y: e.y + e.h / 2 };
  }
  return null;
}

export function drawWorld(ctx, game, t) {
  ctx.save();
  if (game.shake > 0) {
    ctx.translate((Math.random() - 0.5) * game.shake, (Math.random() - 0.5) * game.shake);
  }
  ctx.translate(OX, OY);
  // World frame.
  ctx.fillStyle = '#0a0e1a';
  ctx.fillRect(-8, -8, 1216, 736);
  tileFloor(ctx, game.level, t);
  drawIntelAndExit(ctx, game.level, t);
  for (const g of game.guards) drawCone(ctx, game.level, g, t);
  drawWallsAndCrates(ctx, game.level);
  drawObjectiveArrow(ctx, game);
  drawPlayer(ctx, game.player, t, game.level);
  for (const g of game.guards) drawGuard(ctx, g, t);
  drawParticles(ctx, game.particles);
  // Noise ring from running.
  if (game.noiseRing && game.noiseRing.life > 0) {
    ctx.strokeStyle = `rgba(255, 157, 92, ${game.noiseRing.life * 0.5})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(game.noiseRing.x, game.noiseRing.y, (1 - game.noiseRing.life) * 260 + 20, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 1;
  }
  ctx.restore();
}

// --- Screens drawn over the world ---------------------------------------

export function drawTitle(ctx, t) {
  ctx.fillStyle = '#0a0e1a';
  ctx.fillRect(0, 0, 1280, 800);
  // Moon + skyline silhouette.
  const mg = ctx.createRadialGradient(1080, 120, 10, 1080, 120, 130);
  mg.addColorStop(0, 'rgba(242, 230, 180, 0.9)');
  mg.addColorStop(0.4, 'rgba(242, 230, 180, 0.25)');
  mg.addColorStop(1, 'rgba(242, 230, 180, 0)');
  ctx.fillStyle = mg;
  ctx.fillRect(900, 0, 380, 300);
  ctx.fillStyle = '#f2e6b4';
  ctx.beginPath();
  ctx.arc(1080, 120, 46, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#101828';
  const skyline = [0, 120, 90, 200, 60, 170, 110, 240, 80, 150, 100, 190, 70, 130];
  let sx = 0;
  for (let i = 0; i < skyline.length; i += 2) {
    ctx.fillRect(sx, 800 - 260 - skyline[i + 1], 90, 260 + skyline[i + 1]);
    sx += 92;
  }
  // A guard cone sweeping the title, for instant readability.
  ctx.save();
  ctx.translate(640, 560);
  ctx.rotate(Math.sin(t * 0.5) * 0.5);
  const cg = ctx.createRadialGradient(0, 0, 10, 0, 0, 260);
  cg.addColorStop(0, 'rgba(255, 214, 120, 0.4)');
  cg.addColorStop(1, 'rgba(255, 214, 120, 0)');
  ctx.fillStyle = cg;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, 260, -0.6, 0.6);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#f2c14e';
  ctx.font = 'bold 84px Georgia, serif';
  ctx.fillText('NIGHT LEDGER', 640, 250);
  ctx.fillStyle = '#e8eefc';
  ctx.font = 'italic 24px Georgia, serif';
  ctx.fillText('A quiet heist in three dark halls', 640, 300);
  ctx.fillStyle = '#9fb2d8';
  ctx.font = '18px Georgia, serif';
  ctx.fillText('Sneak past the guards. Lift every ledger. Reach the green door unseen.', 640, 350);
  ctx.fillText('Vision cones show what a guard can see — shadow hides you, lamplight betrays you.', 640, 380);
  ctx.fillStyle = '#7ee787';
  ctx.font = 'bold 22px Georgia, serif';
  ctx.fillText('WASD / arrows — move      SHIFT — run (loud)      C — sneak (silent)', 640, 450);
  ctx.fillText('P — pause      M — mute      Click or press ENTER to begin', 640, 486);
  ctx.fillStyle = '#f2c14e';
  ctx.font = 'bold 20px Georgia, serif';
  ctx.fillText(Math.sin(t * 4) > 0 ? '— PRESS ENTER OR CLICK TO START —' : '', 640, 560);
  ctx.textAlign = 'left';
}

export function drawPause(ctx) {
  ctx.fillStyle = 'rgba(5, 8, 16, 0.78)';
  ctx.fillRect(0, 0, 1280, 800);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#e8eefc';
  ctx.font = 'bold 52px Georgia, serif';
  ctx.fillText('PAUSED', 640, 360);
  ctx.font = '20px Georgia, serif';
  ctx.fillStyle = '#9fb2d8';
  ctx.fillText('Press P or ENTER to keep sneaking', 640, 410);
  ctx.textAlign = 'left';
}
