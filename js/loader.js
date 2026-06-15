/* ==========================================================
   LOADER — Cinematic Sequence
   ========================================================== */
function initLoader(onComplete) {
  var loader = document.getElementById('loader');
  if (!loader) { if (onComplete) onComplete(); return; }

  var lines = [
    document.getElementById('loaderLine1'),  // CODE IS POETRY
    document.getElementById('loaderLine2'),  // 10 MODELS
    document.getElementById('loaderLine3'),  // 10 WORLDS
    document.getElementById('loaderLine4'),  // 10 VISIONS
    document.getElementById('loaderLine5'),  // A LOOKBOOK PROJECT
    document.getElementById('loaderLine6')   // FOR EMPATHY STUDIO
  ];
  var signature = document.getElementById('loaderSignature');

  var tl = gsap.timeline({
    onComplete: function() {
      loader.style.display = 'none';
      if (typeof RollbackLog !== 'undefined') RollbackLog.capture('loader animation complete');
      if (onComplete) onComplete();
    }
  });

  // For each text line: fade in → hold → fade out
  lines.forEach(function(line, i) {
    if (!line) return;

    var fadeInDur = 0.8;
    var holdDur = 1.0;
    var fadeOutDur = 0.6;

    tl.to(line, {
      opacity: 1,
      duration: fadeInDur,
      ease: 'power2.out'
    })
    .to({}, { duration: holdDur })
    .to(line, {
      opacity: 0,
      duration: fadeOutDur,
      ease: 'power2.in'
    });

    // Small gap between lines (except after last)
    if (i < lines.length - 1) {
      tl.to({}, { duration: 0.15 });
    }
  });

  // 1 second blank gap after last line
  tl.to({}, { duration: 1.0 });

  // "by" fades in gently
  tl.to(document.getElementById('loaderBy'), {
    opacity: 0.4,
    duration: 0.6,
    ease: 'power1.out'
  })
  .to({}, { duration: 0.8 })
  .to(document.getElementById('loaderBy'), {
    opacity: 0,
    duration: 0.4,
    ease: 'power2.in'
  })
  .to({}, { duration: 0.3 });

  // Signature: reveal left → right like handwriting
  tl.to(signature, {
    opacity: 1,
    clipPath: 'inset(0 0% 0 0)',
    duration: 1.4,
    ease: 'power1.inOut'
  })
  // Hold signature
  .to({}, { duration: 1.2 })
  // Fade everything out
  .to(signature, {
    opacity: 0,
    duration: 0.5,
    ease: 'power2.in'
  })
  // Loader exit
  .to(loader, {
    opacity: 0,
    duration: 0.7,
    ease: 'power2.in'
  }, '-=0.2');
}
