// Project collage: drag pieces around (desktop, mouse or pen), click to open,
// and link each index row to its piece. Pieces stay ordinary links, so keyboard
// and screen-reader use is unchanged.
(() => {
  const collage = document.querySelector('.collage');
  if (!collage) return;
  const pieces = [...collage.querySelectorAll('.piece')];
  const canDrag = () => matchMedia('(min-width: 701px) and (pointer: fine)').matches;
  let top = pieces.length + 1;

  pieces.forEach(piece => {
    let start = null, moved = false;

    // pieces are links; stop the browser's own link-drag from cancelling ours
    piece.setAttribute('draggable', 'false');
    piece.addEventListener('dragstart', e => e.preventDefault());

    piece.addEventListener('pointerdown', e => {
      if (!canDrag() || e.button !== 0 || e.pointerType === 'touch') return;
      start = {
        x: e.clientX, y: e.clientY,
        dx: parseFloat(piece.style.getPropertyValue('--dx')) || 0,
        dy: parseFloat(piece.style.getPropertyValue('--dy')) || 0,
        box: collage.getBoundingClientRect(), rect: piece.getBoundingClientRect(),
      };
      moved = false;
      piece.setPointerCapture(e.pointerId);
    });

    piece.addEventListener('pointermove', e => {
      if (!start) return;
      let dx = e.clientX - start.x, dy = e.clientY - start.y;
      if (!moved && Math.hypot(dx, dy) < 5) return;   // a small wobble is still a click
      if (!moved) {
        moved = true;
        piece.classList.add('is-dragging');
        piece.style.setProperty('--z', ++top);         // the piece you move stays on top
      }
      // keep at least half of the piece inside the collage
      const { box, rect } = start;
      dx = Math.max(box.left - rect.left - rect.width / 2, Math.min(dx, box.right - rect.right + rect.width / 2));
      dy = Math.max(box.top - rect.top - rect.height / 2, Math.min(dy, box.bottom - rect.bottom + rect.height / 2));
      piece.style.setProperty('--dx', `${start.dx + dx}px`);
      piece.style.setProperty('--dy', `${start.dy + dy}px`);
    });

    const end = () => { start = null; piece.classList.remove('is-dragging'); };
    piece.addEventListener('pointerup', end);
    piece.addEventListener('pointercancel', end);

    // a drag is not a click
    piece.addEventListener('click', e => { if (moved) { e.preventDefault(); moved = false; } });
  });

  // Hovering or focusing an index row lifts its piece, and the reverse
  const link = (no, on) => document.querySelectorAll(`[data-piece="${no}"]`)
    .forEach(el => el.classList.toggle('is-lifted', on));
  document.querySelectorAll('.work-row, .piece').forEach(el => {
    const no = el.dataset.piece;
    for (const [ev, on] of [['mouseenter', true], ['mouseleave', false], ['focus', true], ['blur', false]])
      el.addEventListener(ev, () => link(no, on));
  });
})();
