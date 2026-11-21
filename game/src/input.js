// input.js — keyboard and mouse state.
// One job: present a clean, edge-triggered input snapshot to the game loop.
export function makeInput() {
  const keys = new Set();
  const pressed = new Set(); // edge-triggered, consumed once per frame
  let mouseX = 0;
  let mouseY = 0;
  let mousePressed = false;

  function code(e) { return e.code; }

  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    if (!keys.has(e.code)) pressed.add(e.code);
    keys.add(e.code);
  });
  window.addEventListener('keyup', (e) => keys.delete(e.code));
  window.addEventListener('blur', () => keys.clear());
  window.addEventListener('mousemove', (e) => {
    const r = document.getElementById('game').getBoundingClientRect();
    mouseX = (e.clientX - r.left) * (1280 / r.width);
    mouseY = (e.clientY - r.top) * (800 / r.height);
  });
  window.addEventListener('mousedown', (e) => { if (e.button === 0) mousePressed = true; });
  window.addEventListener('mouseup', () => { mousePressed = false; });

  return {
    get up() { return keys.has('KeyW') || keys.has('ArrowUp'); },
    get down() { return keys.has('KeyS') || keys.has('ArrowDown'); },
    get left() { return keys.has('KeyA') || keys.has('ArrowLeft'); },
    get right() { return keys.has('KeyD') || keys.has('ArrowRight'); },
    get run() { return keys.has('ShiftLeft') || keys.has('ShiftRight'); },
    get sneak() { return keys.has('KeyC') || keys.has('ControlLeft'); },
    get mouseX() { return mouseX; },
    get mouseY() { return mouseY; },
    get mousePressed() { return mousePressed; },
    // True once, on the frame the key went down.
    wasPressed(...codes) { return codes.some((c) => pressed.has(c)); },
    endFrame() { pressed.clear(); mousePressed = false; },
  };
}
