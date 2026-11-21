// player.js — the thief: movement, stance, noise and collisions.
// One job: turn input into a position, and say how loud that move is.
import { solidRects } from './levels.js';

export function makePlayer(start) {
  return {
    x: start.x, y: start.y,
    radius: 13,
    sneaking: false, // slow + quiet
    running: false, // fast + loud
    moving: false,
    faceX: 0, faceY: -1,
    stepTimer: 0,
    bob: 0,
  };
}

function circleHitsSolids(level, x, y, r) {
  for (const s of solidRects(level)) {
    const cx = Math.max(s.x, Math.min(x, s.x + s.w));
    const cy = Math.max(s.y, Math.min(y, s.y + s.h));
    if ((x - cx) * (x - cx) + (y - cy) * (y - cy) < r * r) return true;
  }
  return false;
}

// Noise radius the player emits this frame (0 when still or sneaking).
function noiseRadius(p) {
  if (!p.moving) return 0;
  if (p.sneaking) return 0;
  if (p.running) return 260;
  return 120;
}

export function updatePlayer(p, level, input, dt) {
  let dx = 0;
  let dy = 0;
  if (input.left) dx -= 1;
  if (input.right) dx += 1;
  if (input.up) dy -= 1;
  if (input.down) dy += 1;
  p.moving = dx !== 0 || dy !== 0;
  p.sneaking = !!input.sneak;
  p.running = !!input.run && !p.sneaking;

  if (p.moving) {
    const len = Math.hypot(dx, dy);
    dx /= len; dy /= len;
    const speed = p.sneaking ? 95 : p.running ? 235 : 165;
    p.faceX = dx; p.faceY = dy;
    p.bob += dt * (p.running ? 14 : 9);
    // Axis-separated movement so the player slides along walls.
    const nx = p.x + dx * speed * dt;
    if (!circleHitsSolids(level, nx, p.y, p.radius) && nx > 14 && nx < 1186) p.x = nx;
    const ny = p.y + dy * speed * dt;
    if (!circleHitsSolids(level, p.x, ny, p.radius) && ny > 14 && ny < 706) p.y = ny;
  }

  // Footstep timing: the renderer draws the ring, audio plays the tick.
  p.stepTimer -= dt;
  let stepped = false;
  if (p.moving && p.stepTimer <= 0) {
    p.stepTimer = p.running ? 0.26 : p.sneaking ? 0.55 : 0.38;
    stepped = true;
  }
  return { stepped, noise: p.moving ? { x: p.x, y: p.y, level: noiseRadius(p) } : null };
}
