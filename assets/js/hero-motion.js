// Hero motion — his 3D explorations as one continuous piece (2026-11-21, v2).
// One window survives every change: it reshapes to fit the next clip while the old clip
// accelerates out and the new one arrives big and blurred, then settles and plays once.
// Pauses off screen; a still first frame under reduced motion; tilts toward the pointer.
(() => {
  const el = document.querySelector('.hero-motion');
  if (!el) return;
  const win = el.querySelector('.hm-window');
  const clips = [...el.querySelectorAll('.hm-clip')];
  if (!win || !clips.length) return;

  // window shape (in % of the stage width; the stage is 110 tall) and ground colour per clip
  const SHAPES = {
    'tall':     { width: '60cqw', height: '110cqw', borderRadius: '0px', backgroundColor: '#19282C' },
    'circle':   { width: '82cqw', height: '82cqw',  borderRadius: '50%', backgroundColor: '#D15F71' },
    'square':   { width: '90cqw', height: '90cqw',  borderRadius: '0px', backgroundColor: '#C3C3BF' },
    'circle-s': { width: '78cqw', height: '78cqw',  borderRadius: '50%', backgroundColor: '#804D63' },
  };
  const EASE_MORPH = 'cubic-bezier(.7, 0, .2, 1)';   // window: decisive in, soft landing
  const EASE_IN    = 'cubic-bezier(.15, .85, .25, 1)'; // arrivals settle fast
  const EASE_OUT   = 'cubic-bezier(.6, 0, .9, .4)';   // exits accelerate

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  clips.forEach(v => { v.muted = true; v.loop = true; });
  if (reduced) return;   // the first clip's poster stays as a still

  let i = 0, timer = 0, running = false, visible = true;
  const settle = a => a.finished.then(() => { try { a.commitStyles(); } catch (e) {} a.cancel(); }).catch(() => {});
  const play = v => { try { v.currentTime = 0; } catch (e) {} const p = v.play(); if (p) p.catch(() => {}); };
  const holdFor = v => {
    const d = isFinite(v.duration) && v.duration > 0 ? v.duration : 3;
    return Math.max(2400, d * 1000 - 380);   // the clip plays through once, then the change
  };

  function change() {
    const prev = clips[i];
    i = (i + 1) % clips.length;
    const cur = clips[i];
    play(cur);
    settle(win.animate([SHAPES[cur.dataset.shape]], { duration: 720, easing: EASE_MORPH, fill: 'forwards' }));
    settle(prev.animate(
      [{ opacity: 1, scale: 1, filter: 'blur(0px)' }, { opacity: 0, scale: .86, filter: 'blur(8px)' }],
      { duration: 340, easing: EASE_OUT, fill: 'forwards' }));
    settle(cur.animate(
      [{ opacity: 0, scale: 1.3, filter: 'blur(18px)' }, { opacity: 1, scale: 1, filter: 'blur(0px)' }],
      { duration: 560, delay: 200, easing: EASE_IN, fill: 'forwards' }));
    setTimeout(() => prev.pause(), 600);
    return cur;
  }
  function next() {
    if (!running) return;
    const cur = change();
    timer = setTimeout(next, holdFor(cur) + 200);
  }
  function start() {
    if (running || !visible || document.hidden) return;
    running = true;
    const cur = clips[i];
    const p = cur.play(); if (p) p.catch(() => {});
    timer = setTimeout(next, holdFor(cur));
  }
  function stop() {
    running = false;
    clearTimeout(timer);
    clips.forEach(v => v.pause());
  }

  new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? start() : stop(); }).observe(el);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  window.__hm = { change, stop };   // used by the review screenshots only

  // tilt toward the pointer
  if (!matchMedia('(pointer: fine)').matches) return;
  const hero = el.closest('.hero') || document;
  let raf = 0;
  hero.addEventListener('pointermove', ev => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const r = el.getBoundingClientRect();
      const tx = Math.max(-1, Math.min(1, (ev.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2)));
      const ty = Math.max(-1, Math.min(1, (ev.clientY - (r.top + r.height / 2)) / (window.innerHeight / 2)));
      el.style.setProperty('--tx', tx.toFixed(3));
      el.style.setProperty('--ty', ty.toFixed(3));
    });
  });
  hero.addEventListener('pointerleave', () => { el.style.setProperty('--tx', 0); el.style.setProperty('--ty', 0); });
})();
