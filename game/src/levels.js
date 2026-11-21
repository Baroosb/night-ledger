// levels.js — the three night-facility layouts for Night Ledger.
// One job: level data only. Walls, crates, shadow and lit zones, intel,
// the exit and each guard's patrol are plain data; the engine reads it.
export const TILE = 40;
export const WORLD_W = 1200;
export const WORLD_H = 720;

// rect helper: [x, y, w, h] in pixels, inside the 1200x720 world.
function r(x, y, w, h) { return { x, y, w, h }; }

export const LEVELS = [
  {
    name: 'LEVEL 1 — THE ARCHIVE',
    brief: 'Lift the two ledgers, then slip out the green door. Stay in the dark.',
    playerStart: { x: 90, y: 640 },
    exit: r(1120, 620, 56, 56),
    intel: [{ x: 330, y: 150 }, { x: 860, y: 560 }],
    // perimeter walls (the room shell is drawn from these too)
    walls: [
      r(0, 0, 1200, 24), r(0, 696, 1200, 24), r(0, 0, 24, 720), r(1176, 0, 24, 720),
      // interior archive shelving — long walls that split the floor into lanes
      r(200, 120, 24, 300), r(200, 480, 24, 120),
      r(520, 120, 24, 180), r(520, 420, 24, 180),
      r(820, 240, 24, 300), r(820, 120, 24, 60),
      r(420, 300, 220, 24), r(940, 420, 180, 24),
    ],
    crates: [r(300, 560, 64, 64), r(640, 160, 64, 64), r(960, 120, 64, 64), r(1040, 560, 64, 64), r(420, 600, 64, 64)],
    shadows: [r(240, 440, 200, 120), r(560, 60, 220, 110), r(880, 480, 180, 120), r(60, 120, 120, 160)],
    lit: [r(280, 60, 200, 110), r(700, 300, 180, 110), r(960, 300, 170, 110)],
    guards: [
      { waypoints: [[330, 260], [330, 620], [700, 620], [700, 260]], speed: 62, pause: 1.4 },
      { waypoints: [[950, 180], [950, 540], [1080, 540], [1080, 180]], speed: 70, pause: 1.0 },
    ],
  },
  {
    name: 'LEVEL 2 — THE GALLERY',
    brief: 'Three manifests hide among the exhibits. The guards cross the hall — time your moves.',
    playerStart: { x: 90, y: 90 },
    exit: r(1120, 620, 56, 56),
    intel: [{ x: 600, y: 120 }, { x: 180, y: 560 }, { x: 1000, y: 360 }],
    walls: [
      r(0, 0, 1200, 24), r(0, 696, 1200, 24), r(0, 0, 24, 720), r(1176, 0, 24, 720),
      r(280, 0, 24, 200), r(280, 320, 24, 200),
      r(600, 200, 24, 320), r(600, 520, 24, 200),
      r(900, 0, 24, 200), r(900, 320, 24, 200),
      r(420, 360, 160, 24), r(760, 180, 160, 24),
    ],
    crates: [r(140, 300, 64, 64), r(460, 120, 64, 64), r(760, 560, 64, 64), r(1020, 120, 64, 64), r(360, 600, 64, 64), r(1040, 480, 64, 64)],
    shadows: [r(60, 240, 150, 150), r(340, 60, 180, 110), r(660, 420, 180, 120), r(960, 560, 160, 110)],
    lit: [r(420, 60, 200, 110), r(60, 480, 180, 110), r(840, 240, 180, 110)],
    guards: [
      { waypoints: [[200, 200], [560, 200], [560, 520], [200, 520]], speed: 72, pause: 1.0 },
      { waypoints: [[760, 120], [1100, 120], [1100, 480], [760, 480]], speed: 78, pause: 0.8 },
      { waypoints: [[460, 640], [760, 640], [760, 300], [460, 300]], speed: 66, pause: 1.6 },
    ],
  },
  {
    name: 'LEVEL 3 — THE VAULT FLOOR',
    brief: 'The final ledger sits behind four patrols. Patience wins — the vault door is yours.',
    playerStart: { x: 90, y: 640 },
    exit: r(1120, 620, 56, 56),
    intel: [{ x: 600, y: 360 }, { x: 240, y: 140 }, { x: 980, y: 580 }],
    walls: [
      r(0, 0, 1200, 24), r(0, 696, 1200, 24), r(0, 0, 24, 720), r(1176, 0, 24, 720),
      r(220, 120, 24, 240), r(220, 480, 24, 120),
      r(480, 240, 24, 300), r(480, 60, 24, 120),
      r(740, 120, 24, 240), r(740, 480, 24, 120),
      r(980, 240, 24, 300), r(980, 60, 24, 120),
      r(340, 420, 140, 24), r(620, 180, 140, 24), r(860, 540, 140, 24),
    ],
    crates: [r(320, 160, 64, 64), r(560, 560, 64, 64), r(840, 300, 64, 64), r(1060, 380, 64, 64), r(140, 360, 64, 64)],
    shadows: [r(60, 120, 130, 140), r(280, 540, 170, 110), r(540, 60, 180, 100), r(800, 420, 170, 120), r(1040, 120, 110, 130)],
    lit: [r(360, 60, 190, 110), r(640, 300, 190, 110), r(60, 480, 180, 110), r(960, 480, 170, 110)],
    guards: [
      { waypoints: [[180, 300], [440, 300], [440, 620], [180, 620]], speed: 76, pause: 0.9 },
      { waypoints: [[560, 140], [560, 460], [880, 460], [880, 140]], speed: 82, pause: 0.8 },
      { waypoints: [[1020, 200], [1020, 600], [1120, 600], [1120, 200]], speed: 74, pause: 1.1 },
      { waypoints: [[300, 60], [700, 60], [700, 300], [300, 300]], speed: 68, pause: 1.5 },
    ],
  },
];

// buildLevel turns level data into live state: fresh intel flags, exit state.
export function buildLevel(index) {
  const def = LEVELS[index];
  return {
    def,
    index,
    intel: def.intel.map((p) => ({ x: p.x, y: p.y, taken: false })),
    exitOpen: false,
    elapsed: 0,
  };
}

export function pointInRect(px, py, rect) {
  return px >= rect.x && px <= rect.x + rect.w && py >= rect.y && py <= rect.y + rect.h;
}

// Every solid obstacle in the level (walls + crates block movement and sight).
export function solidRects(level) {
  return level.def.walls.concat(level.def.crates);
}

export function inShadow(level, px, py) {
  return level.def.shadows.some((z) => pointInRect(px, py, z));
}

export function inLight(level, px, py) {
  return level.def.lit.some((z) => pointInRect(px, py, z));
}
