// Keyboard + touch input. Movement is a normalised vector; moves are "held" flags.

const Input = (() => {
  const keys = {};
  const stick = { x: 0, y: 0, id: null, cx: 0, cy: 0 };
  const held = [false, false, false, false];
  const btnHeld = [false, false, false, false];
  const MOVE_KEYS = [['KeyJ', 'Digit1', 'Space'], ['KeyK', 'Digit2'], ['KeyL', 'Digit3'], ['Semicolon', 'Digit4', 'KeyI']];
  let onPause = null, onMute = null, onSwap = null;

  window.addEventListener('keydown', e => {
    if (e.repeat) return;
    keys[e.code] = true;
    if ((e.code === 'Escape' || e.code === 'KeyP') && onPause) onPause();
    if (e.code === 'KeyM' && onMute) onMute();
    if ((e.code === 'KeyQ' || e.code === 'Tab') && onSwap) { e.preventDefault(); onSwap(); }
    if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault();
    document.body.classList.add('no-touch');
  });
  window.addEventListener('keyup', e => { keys[e.code] = false; });
  window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; });

  // Touch devices get the virtual stick; desktop gets a keyboard move bar.
  const isTouch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
  if (!isTouch) document.body.classList.add('no-touch');

  function bindStick(zone, base, knob) {
    const radius = () => base.getBoundingClientRect().width / 2;
    zone.addEventListener('pointerdown', e => {
      if (stick.id !== null) return;
      stick.id = e.pointerId;
      zone.setPointerCapture(e.pointerId);
      const zr = zone.getBoundingClientRect();
      const r = radius();
      // move the stick base to where the thumb landed
      base.style.left = (e.clientX - zr.left - r) + 'px';
      base.style.top = (e.clientY - zr.top - r) + 'px';
      base.style.bottom = 'auto';
      stick.cx = e.clientX; stick.cy = e.clientY;
      update(e);
    });
    const update = e => {
      const r = radius();
      let dx = e.clientX - stick.cx, dy = e.clientY - stick.cy;
      const d = Math.hypot(dx, dy);
      if (d > r) { dx *= r / d; dy *= r / d; }
      knob.style.transform = `translate(${dx}px, ${dy}px)`;
      const m = Math.hypot(dx, dy) / r;
      stick.x = m > 0.18 ? dx / r : 0;
      stick.y = m > 0.18 ? dy / r : 0;
    };
    zone.addEventListener('pointermove', e => { if (e.pointerId === stick.id) update(e); });
    const end = e => {
      if (e.pointerId !== stick.id) return;
      stick.id = null; stick.x = stick.y = 0;
      knob.style.transform = '';
    };
    zone.addEventListener('pointerup', end);
    zone.addEventListener('pointercancel', end);
  }

  function bindMoveButton(el, i) {
    const down = e => { e.preventDefault(); btnHeld[i] = true; el.classList.add('pressed'); };
    const up = () => { btnHeld[i] = false; el.classList.remove('pressed'); };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointerleave', up);
    el.addEventListener('pointercancel', up);
  }

  return {
    bindStick, bindMoveButton,
    set onPause(f) { onPause = f; }, set onMute(f) { onMute = f; }, set onSwap(f) { onSwap = f; },
    dir() {
      let x = stick.x, y = stick.y;
      if (keys.KeyA || keys.ArrowLeft) x -= 1;
      if (keys.KeyD || keys.ArrowRight) x += 1;
      if (keys.KeyW || keys.ArrowUp) y -= 1;
      if (keys.KeyS || keys.ArrowDown) y += 1;
      const m = Math.hypot(x, y);
      return m > 1 ? { x: x / m, y: y / m } : { x, y };
    },
    moves() {
      for (let i = 0; i < 4; i++) held[i] = btnHeld[i] || MOVE_KEYS[i].some(k => keys[k]);
      return held;
    },
    reset() { for (const k in keys) keys[k] = false; btnHeld.fill(false); stick.x = stick.y = 0; },
  };
})();
