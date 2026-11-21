// vision.js — line of sight and vision cones.
// One job: answer "can this guard see that point?" and describe the cone.
import { solidRects } from './levels.js';

export const CONE_RANGE = 230;
export const CONE_HALF_ANGLE = 0.61; // ~35 degrees each side

function segmentHitsRect(x1, y1, x2, y2, r) {
  // Slab test: does the segment cross the rectangle?
  const dx = x2 - x1;
  const dy = y2 - y1;
  let tMin = 0;
  let tMax = 1;
  for (const [p, d, lo, hi] of [[x1, dx, r.x, r.x + r.w], [y1, dy, r.y, r.y + r.h]]) {
    if (Math.abs(d) < 1e-9) {
      if (p < lo || p > hi) return false;
    } else {
      let t1 = (lo - p) / d;
      let t2 = (hi - p) / d;
      if (t1 > t2) { const t = t1; t1 = t2; t2 = t; }
      tMin = Math.max(tMin, t1);
      tMax = Math.min(tMax, t2);
      if (tMin > tMax) return false;
    }
  }
  return true;
}

export function lineOfSightClear(level, x1, y1, x2, y2) {
  for (const rect of solidRects(level)) {
    if (segmentHitsRect(x1, y1, x2, y2, rect)) return false;
  }
  return true;
}

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// Full visibility test: range, cone angle, then line of sight.
export function canSee(level, guard, px, py) {
  const dx = px - guard.x;
  const dy = py - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist > CONE_RANGE) return false;
  if (dist > 26 && Math.abs(angleDiff(Math.atan2(dy, dx), guard.facing)) > CONE_HALF_ANGLE) return false;
  return lineOfSightClear(level, guard.x, guard.y, px, py);
}

// Cone polygon points (for rendering): arc clipped by walls is approximated
// by ray-casting the cone edge against solids, so cones hug the cover.
export function conePolygon(level, guard) {
  const steps = 14;
  const pts = [{ x: guard.x, y: guard.y }];
  for (let i = 0; i <= steps; i++) {
    const a = guard.facing - CONE_HALF_ANGLE + (2 * CONE_HALF_ANGLE * i) / steps;
    pts.push(castRay(level, guard.x, guard.y, a, CONE_RANGE));
  }
  return pts;
}

function castRay(level, x, y, angle, maxDist) {
  const step = 8;
  let dist = 0;
  while (dist < maxDist) {
    dist += step;
    const px = x + Math.cos(angle) * dist;
    const py = y + Math.sin(angle) * dist;
    if (px < 0 || py < 0 || px > 1200 || py > 720) break;
    if (solidRects(level).some((r) => px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h)) break;
  }
  return { x: x + Math.cos(angle) * dist, y: y + Math.sin(angle) * dist };
}
