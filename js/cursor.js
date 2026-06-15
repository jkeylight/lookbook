/* ==========================================================
   CURSOR
   ========================================================== */
function initCursor() {
  if (window.innerWidth <= 1000) return;

  var dot = document.querySelector('.cursor-dot');
  var ring = document.querySelector('.cursor-ring');
  if (!dot || !ring) return;

  var mx = 0, my = 0, rx = 0, ry = 0;
  var rafId = null;
  var isRunning = true;

  document.addEventListener('mousemove', function(e) {
    mx = e.clientX;
    my = e.clientY;
    gsap.set(dot, { x: mx - 4, y: my - 4 });
  });

  function moveRing() {
    if (!isRunning) return;
    rx += (mx - rx) * 0.08;
    ry += (my - ry) * 0.08;
    gsap.set(ring, { x: rx - 16, y: ry - 16 });
    rafId = requestAnimationFrame(moveRing);
  }
  moveRing();

  var interactives = document.querySelectorAll(
    'a, .menu-trigger, .menu-close, .menu-item, .cover-enter'
  );
  interactives.forEach(function(el) {
    el.addEventListener('mouseenter', function() { ring.classList.add('grow'); });
    el.addEventListener('mouseleave', function() { ring.classList.remove('grow'); });
  });
}
