/* ==========================================================
   COLOR SHIFT — Background transitions per cover
   ========================================================== */
function initColorShift() {
  var panels = document.querySelectorAll('.cover-panel');
  if (panels.length === 0) return;

  var defaultBg = getComputedStyle(document.documentElement)
    .getPropertyValue('--paper').trim();
  var defaultInk = getComputedStyle(document.documentElement)
    .getPropertyValue('--ink').trim();

  // Create a ScrollTrigger for each panel
  panels.forEach(function(panel) {
    var bg = panel.getAttribute('data-bg');
    var textType = panel.getAttribute('data-text');

    if (!bg) return;

    ScrollTrigger.create({
      trigger: panel,
      start: 'top 50%',
      end: 'bottom 50%',
      onEnter: function() { shiftTo(bg, textType); },
      onEnterBack: function() { shiftTo(bg, textType); }
    });
  });

  // Reset when above covers (hero)
  ScrollTrigger.create({
    trigger: '.covers-wrapper',
    start: 'top top',
    end: 'top 50%',
    onLeaveBack: function() { shiftTo(defaultBg, 'dark'); }
  });

  // Reset when below covers (colophon)
  ScrollTrigger.create({
    trigger: '.colophon',
    start: 'top 50%',
    onEnter: function() { shiftTo(defaultBg, 'dark'); },
    onLeaveBack: function() {
      // Shift back to last panel's color
      var lastPanel = panels[panels.length - 1];
      if (lastPanel) {
        shiftTo(
          lastPanel.getAttribute('data-bg'),
          lastPanel.getAttribute('data-text')
        );
      }
    }
  });

  function shiftTo(bg, textType) {
    document.body.style.backgroundColor = bg;

    if (textType === 'light') {
      document.body.style.color = '#F0EDE6';
    } else {
      document.body.style.color = '#111111';
    }

    if (typeof RollbackLog !== 'undefined') RollbackLog.capture('color shift → ' + bg + ' (' + textType + ')');
  }
}
