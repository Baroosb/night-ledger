// guards.js — guard patrol AI and alert states.
// One job: move guards along their routes and track how suspicious each one is.
// States: patrol -> suspicious (investigate) -> spotted (hunt) -> calm down.
import { canSee } from './vision.js';
import { inShadow, inLight, solidRects } from './levels.js';

// Guards slide along walls instead of clipping through them.
function guardHitsSolid(level, x, y, r) {
  for (const s of solidRects(level)) {
    const cx = Math.max(s.x, Math.min(x, s.x + s.w));
    const cy = Math.max(s.y, Math.min(y, s.y + s.h));
    if ((x - cx) * (x - cx) + (y - cy) * (y - cy) < r * r) return true;
  }
  return false;
}

export function makeGuard(def, index) {
  const [sx, sy] = def.waypoints[0];
  return {
    id: index,
    x: sx, y: sy,
    waypoints: def.waypoints,
    wpIndex: 1 % def.waypoints.length,
    speed: def.speed,
    pause: def.pause,
    pauseLeft: 0,
    facing: 0,
    state: 'patrol', // patrol | suspicious | spotted
    suspicion: 0, // 0..100, per-guard
    lastSeen: null,
    investigate: null,
    calm: 0,
    stepPhase: Math.random() * Math.PI * 2,
    stepTimer: 0,
  };
}

function moveToward(g, tx, ty, speed, dt, level) {
  const dx = tx - g.x;
  const dy = ty - g.y;
  const d = Math.hypot(dx, dy);
  if (d < 2) return true;
  const s = Math.min(speed * dt, d);
  const nx = g.x + (dx / d) * s;
  const ny = g.y + (dy / d) * s;
  if (!guardHitsSolid(level, nx, g.y, 13)) g.x = nx;
  if (!guardHitsSolid(level, g.x, ny, 13)) g.y = ny;
  g.facing = Math.atan2(dy, dx);
  return d - s < 2;
}

function lookAround(g, dt, t) {
  // Sweep the head while paused at a waypoint — patrols stay learnable.
  g.facing += Math.sin(t * 1.6 + g.id * 2.1) * dt * 1.1;
}

// Returns { spotted: bool, noiseHeard: bool } for the frame.
export function updateGuard(g, level, player, dt, t, noise) {
  const sees = canSee(level, g, player.x, player.y);
  const dist = Math.hypot(player.x - g.x, player.y - g.y);

  // --- detection: closer + lit + running = faster; shadow = much slower.
  if (sees) {
    let rate = 55;
    if (dist < 110) rate += 45;
    else if (dist < 170) rate += 18;
    if (inLight(level, player.x, player.y)) rate += 25;
    if (inShadow(level, player.x, player.y)) rate *= 0.35;
    if (player.running) rate += 30;
    if (player.sneaking) rate *= 0.6;
    g.suspicion = Math.min(100, g.suspicion + rate * dt);
    g.lastSeen = { x: player.x, y: player.y };
    g.calm = 0;
  } else {
    g.suspicion = Math.max(0, g.suspicion - 14 * dt);
  }

  // Noise: a running player within earshot draws a guard to investigate.
  if (noise && noise.level > 0) {
    const nd = Math.hypot(noise.x - g.x, noise.y - g.y);
    if (nd < noise.level && g.state !== 'spotted') {
      g.state = 'suspicious';
      g.investigate = { x: noise.x, y: noise.y };
    }
  }

  // --- state transitions
  if (g.suspicion >= 100 && g.state !== 'spotted') {
    g.state = 'spotted';
    g.investigate = null;
  } else if (g.suspicion >= 45 && g.state === 'patrol') {
    g.state = 'suspicious';
    g.investigate = g.lastSeen ? { ...g.lastSeen } : null;
  } else if (g.state === 'spotted' && !sees) {
    g.calm += dt;
    if (g.calm > 4) { g.state = 'suspicious'; g.investigate = g.lastSeen ? { ...g.lastSeen } : null; g.calm = 0; }
  } else if (g.state === 'suspicious' && g.suspicion < 12) {
    g.state = 'patrol';
    g.investigate = null;
  }

  // --- movement by state
  if (g.state === 'spotted' && g.lastSeen) {
    // Hunt: chase the last seen spot, faster than patrol.
    const arrived = moveToward(g, g.lastSeen.x, g.lastSeen.y, g.speed * 1.55, dt, level);
    if (arrived && !sees) g.lastSeen = null;
  } else if (g.state === 'suspicious' && g.investigate) {
    const arrived = moveToward(g, g.investigate.x, g.investigate.y, g.speed * 1.15, dt, level);
    if (arrived) { g.investigate = null; g.pauseLeft = 1.2; }
  } else if (g.state === 'patrol') {
    if (g.pauseLeft > 0) {
      g.pauseLeft -= dt;
      lookAround(g, dt, t);
    } else {
      const [tx, ty] = g.waypoints[g.wpIndex];
      if (moveToward(g, tx, ty, g.speed, dt, level)) {
        g.wpIndex = (g.wpIndex + 1) % g.waypoints.length;
        g.pauseLeft = g.pause;
      }
    }
  } else if (g.pauseLeft > 0) {
    g.pauseLeft -= dt;
    lookAround(g, dt, t);
  }

  // Footstep ticks for the renderer / audio (only while actually moving).
  g.stepTimer -= dt;
  return { spotted: g.state === 'spotted', sees };
}

export function guardAlertWord(g) {
  if (g.state === 'spotted') return '!';
  if (g.state === 'suspicious') return '?';
  return '';
}
