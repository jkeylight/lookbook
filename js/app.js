/* ==========================================================
   APP.JS — Master Init
   ========================================================== */
document.addEventListener('DOMContentLoaded', function() {

  gsap.registerPlugin(ScrollTrigger);

  /* ====================================
     LENIS
     ==================================== */
  window.lenis = null;
  var isMobile = window.innerWidth <= 1000;

  if (!isMobile && typeof Lenis !== 'undefined') {
    window.lenis = new Lenis({ lerp: 0.06, smoothWheel: true });
    window.lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function(time) { window.lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  /* ====================================
     PRE-LOADER MODULES
     ==================================== */
  initCursor();

  /* ====================================
     LOADER → THEN EVERYTHING
     ==================================== */
  initLoader(function() {
    document.getElementById('header').style.opacity = '1';
    initSnapScroll();
    initColorShift();
    initHeroAnimation();
    initColophonAnimation();
    if (typeof RollbackLog !== 'undefined') RollbackLog.capture('loader complete — all modules initialized');
  });

  /* ====================================
     HERO ANIMATION
     ==================================== */
  function initHeroAnimation() {
    // Start the breathe loop after initial entrance completes
    setTimeout(function() {
      var volume = document.querySelector('.hero-volume');
      if (volume) volume.classList.add('breathe');
    }, 1800);
  }

  /* ====================================
     COLOPHON ANIMATION
     ==================================== */
  function initColophonAnimation() {
    gsap.from('.colophon-inner', {
      opacity: 0, y: 50,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.colophon',
        start: 'top 70%',
        toggleActions: 'play none none none'
      }
    });
  }

  /* ====================================
     MENU
     ==================================== */
  var menuOverlay = document.getElementById('menuOverlay');
  var menuTrigger = document.getElementById('menuTrigger');
  var menuClose = document.getElementById('menuClose');

  if (menuTrigger) {
    var menuTl = null;

    menuTrigger.addEventListener('click', function() {
      // Kill any in-progress menu animation to prevent stacking
      if (menuTl) menuTl.kill();

      menuOverlay.classList.add('open');
      menuTl = gsap.timeline();
      menuTl.to(menuOverlay, { opacity: 1, y: 0, duration: 0.7, ease: 'power4.out' })
        .from('.menu-item', { y: 50, opacity: 0, stagger: 0.05, duration: 0.4, ease: 'power3.out' }, '-=0.5')
        .to(menuClose, { opacity: 1, duration: 0.5 }, '-=0.2');

      if (window.lenis) window.lenis.stop();
      if (typeof RollbackLog !== 'undefined') RollbackLog.capture('menu opened');
    });
  }

  if (menuClose) {
    menuClose.addEventListener('click', closeMenu);
  }

  function closeMenu() {
    gsap.to(menuOverlay, {
      opacity: 0, y: '-100%', duration: 0.5, ease: 'power4.in',
      onComplete: function() { menuOverlay.classList.remove('open'); }
    });
    if (window.lenis) window.lenis.start();
    if (typeof RollbackLog !== 'undefined') RollbackLog.capture('menu closed');
  }

  // Menu item click → scroll to panel
  document.querySelectorAll('.menu-item').forEach(function(item) {
    item.addEventListener('click', function(e) {
      e.preventDefault();
      var panelIndex = parseInt(item.getAttribute('data-panel'));
      closeMenu();
      setTimeout(function() {
        scrollToPanel(panelIndex);
      }, 600);
    });
  });

  /* ====================================
     BRAND LOGO → SCROLL TO TOP
     ==================================== */
  var brandLogo = document.getElementById('brandLogo');
  if (brandLogo) {
    brandLogo.addEventListener('click', function(e) {
      e.preventDefault();
      if (menuOverlay && menuOverlay.classList.contains('open')) {
        closeMenu();
        setTimeout(scrollToTop, 600);
      } else {
        scrollToTop();
      }
    });
  }

  function scrollToTop() {
    if (window.lenis) {
      window.lenis.scrollTo(0, { duration: 2, easing: function(t) {
        return t < 0.5
          ? 4 * t * t * t
          : 1 - Math.pow(-2 * t + 2, 3) / 2;
      }});
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

});
