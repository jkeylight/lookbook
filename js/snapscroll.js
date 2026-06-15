/* ==========================================================
   SNAP SCROLL — GSAP Snap between cover panels
   ========================================================== */
function initSnapScroll() {
  var panels = gsap.utils.toArray('.cover-panel');
  if (panels.length === 0) return;

  var totalPanels = panels.length;

  // SNAP — snaps to each panel boundary
  ScrollTrigger.create({
    trigger: '.covers-wrapper',
    start: 'top top',
    end: 'bottom bottom',
    snap: {
      snapTo: 1 / (totalPanels - 1),
      duration: { min: 0.2, max: 0.5 },
      ease: 'power2.inOut',
      delay: 0.05
    }
  });

  // ANIMATE each panel on enter
  panels.forEach(function(panel, i) {
    var textEl = panel.querySelector('.cover-text');
    var imgEl = panel.querySelector('.cover-image');

    // Text reveal
    if (textEl) {
      gsap.fromTo(textEl,
        { opacity: 0, y: 40 },
        {
          opacity: 1, y: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: panel,
            start: 'top 70%',
            toggleActions: 'play none none reverse'
          }
        }
      );
    }

    // Image reveal — page-turn clip-path
    if (imgEl) {
      gsap.fromTo(imgEl,
        { opacity: 0, clipPath: 'inset(0 0 0 100%)' },
        {
          opacity: 1, clipPath: 'inset(0 0 0 0%)',
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: panel,
            start: 'top 65%',
            toggleActions: 'play none none reverse'
          }
        }
      );
    }
  });

  // PROGRESS BAR
  var progressBar = document.getElementById('progressBar');
  if (progressBar) {
    ScrollTrigger.create({
      trigger: '.covers-wrapper',
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: function(self) {
        progressBar.style.width = (self.progress * 100) + '%';
      }
    });
  }

  if (typeof RollbackLog !== 'undefined') RollbackLog.capture('snap scroll initialized — ' + totalPanels + ' panels');
}

/* Scroll to a specific panel */
window.scrollToPanel = function(index) {
  var panels = document.querySelectorAll('.cover-panel');
  if (index >= panels.length) return;

  var panel = panels[index];
  if (window.lenis) {
    window.lenis.scrollTo(panel, { duration: 2 });
  } else {
    panel.scrollIntoView({ behavior: 'smooth' });
  }
  if (typeof RollbackLog !== 'undefined') RollbackLog.capture('scroll to panel ' + index);
};
