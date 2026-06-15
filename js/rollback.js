/* ==========================================================
   ROLLBACK LOGFILE — State Snapshots & Error Recovery
   ==========================================================
   Captures application state snapshots on every significant
   change, stores them in a circular buffer + localStorage,
   and provides rollback/restore + a visual debug panel.

   API:
     RollbackLog.capture(label, stateData)   — record a snapshot
     RollbackLog.rollback(n)                  — go back n steps
     RollbackLog.getHistory()                 — array of snapshots
     RollbackLog.togglePanel()                — show/hide debug UI
     RollbackLog.clear()                      — purge all logs
   ========================================================== */

var RollbackLog = (function() {
  'use strict';

  /* ── CONFIG ─────────────────────────────────────────── */
  var MAX_SNAPSHOTS = 50;          // circular buffer size
  var LS_KEY        = 'lb_rollback_log';

  /* ── STATE ──────────────────────────────────────────── */
  var _buffer   = [];   // [{id, ts, label, data, scrollTop, bg, color}]
  var _counter  = 0;
  var _panelEl  = null;
  var _panelOpen = false;

  /* ── HELPERS ────────────────────────────────────────── */
  function _now() {
    var d = new Date();
    return (
      String(d.getHours()).padStart(2, '0') + ':' +
      String(d.getMinutes()).padStart(2, '0') + ':' +
      String(d.getSeconds()).padStart(2, '0') + '.' +
      String(d.getMilliseconds()).padStart(3, '0')
    );
  }

  function _persist() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(_buffer)); }
    catch(e) { /* quota exceeded — silently drop oldest */ }
  }

  function _loadFromStorage() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          _buffer   = parsed.slice(-MAX_SNAPSHOTS);
          _counter  = _buffer.length > 0 ? _buffer[_buffer.length - 1].id + 1 : 0;
        }
      }
    } catch(e) { /* corrupt data — ignore */ }
  }

  /* ── CAPTURE ────────────────────────────────────────── */
  function capture(label, extra) {
    var body = document.body;
    var snap = {
      id:        _counter++,
      ts:        _now(),
      label:     label || 'snapshot',
      scrollTop: window.pageYOffset || document.documentElement.scrollTop || 0,
      bg:        body.style.backgroundColor || '',
      textColor: body.style.color || '',
      data:      extra || null
    };

    // Push & trim
    _buffer.push(snap);
    if (_buffer.length > MAX_SNAPSHOTS) _buffer.shift();

    _persist();
    _renderPanel();

    // Auto-scroll debug panel to newest entry
    if (_panelEl && _panelOpen) {
      var entriesEl = document.getElementById('rbpEntries');
      if (entriesEl) entriesEl.scrollTop = 0;
    }

    return snap;
  }

  /* ── ROLLBACK ───────────────────────────────────────── */
  function rollback(steps) {
    steps = steps || 1;
    var targetIndex = _buffer.length - 1 - steps;
    if (targetIndex < 0) targetIndex = 0;

    var snap = _buffer[targetIndex];
    if (!snap) return null;

    // Restore body styles
    if (snap.bg)   document.body.style.backgroundColor = snap.bg;
    if (snap.textColor) document.body.style.color = snap.textColor;

    // Restore scroll
    if (window.lenis) {
      window.lenis.scrollTo(snap.scrollTop, { duration: 0.6 });
    } else {
      window.scrollTo({ top: snap.scrollTop, behavior: 'smooth' });
    }

    // Log the rollback itself
    capture('rollback → #' + snap.id + ' (' + snap.label + ')');

    return snap;
  }

  /* ── GETTERS ────────────────────────────────────────── */
  function getHistory() { return _buffer.slice(); }
  function getLatest()  { return _buffer.length > 0 ? _buffer[_buffer.length - 1] : null; }
  function getCount()   { return _buffer.length; }

  function clear() {
    _buffer = [];
    _persist();
    _renderPanel();
  }

  /* ── ERROR WRAPPER ──────────────────────────────────── */
  function wrapError(context, fn) {
    return function() {
      try {
        return fn.apply(this, arguments);
      } catch(err) {
        capture('ERROR: ' + context, {
          message: err.message,
          stack:   err.stack || '',
          args:    Array.prototype.slice.call(arguments).map(function(a) {
            try { return String(a); } catch(e) { return '[unserializable]'; }
          })
        });
        console.error('[RollbackLog] Caught in "' + context + '":', err);
      }
    };
  }

  /* ── DEBUG PANEL ────────────────────────────────────── */
  function _ensurePanel() {
    if (_panelEl) return;

    _panelEl = document.createElement('div');
    _panelEl.id = 'rollbackPanel';
    _panelEl.innerHTML =
      '<div class="rbp-header">' +
        '<span class="rbp-title">ROLLBACK LOG</span>' +
        '<span class="rbp-count" id="rbpCount">0 entries</span>' +
        '<span class="rbp-close" id="rbpClose">✕</span>' +
      '</div>' +
      '<div class="rbp-actions">' +
        '<button class="rbp-btn" id="rbpRollback1">↩ Undo 1</button>' +
        '<button class="rbp-btn" id="rbpRollback5">↩ Undo 5</button>' +
        '<button class="rbp-btn rbp-btn-danger" id="rbpClear">Clear</button>' +
        '<button class="rbp-btn" id="rbpExport">Export</button>' +
      '</div>' +
      '<div class="rbp-entries" id="rbpEntries"></div>';
    document.body.appendChild(_panelEl);

    // Event listeners
    document.getElementById('rbpClose').addEventListener('click', togglePanel);
    document.getElementById('rbpRollback1').addEventListener('click', function() {
      rollback(1);
      _renderPanel();
    });
    document.getElementById('rbpRollback5').addEventListener('click', function() {
      rollback(5);
      _renderPanel();
    });
    document.getElementById('rbpClear').addEventListener('click', function() {
      clear();
    });
    document.getElementById('rbpExport').addEventListener('click', _exportLog);
  }

  function _renderPanel() {
    if (!_panelEl) return;

    var entriesEl = document.getElementById('rbpEntries');
    var countEl   = document.getElementById('rbpCount');
    if (!entriesEl || !countEl) return;

    countEl.textContent = _buffer.length + ' entries';

    var html = '';
    // Show newest first
    for (var i = _buffer.length - 1; i >= 0; i--) {
      var s  = _buffer[i];
      var isError = s.label.indexOf('ERROR') === 0;
      var cls = isError ? 'rbp-entry rbp-entry-error' : 'rbp-entry';
      html +=
        '<div class="' + cls + '" data-idx="' + i + '">' +
          '<span class="rbp-ts">' + s.ts + '</span>' +
          '<span class="rbp-label">' + s.label + '</span>' +
          '<span class="rbp-pos">§' + Math.round(s.scrollTop) + '</span>' +
        '</div>';
    }
    entriesEl.innerHTML = html;
  }

  function _exportLog() {
    var output = _buffer.map(function(s) {
      return '[' + s.ts + '] ' + s.label +
        (s.data ? ' | ' + JSON.stringify(s.data) : '');
    }).join('\n');

    var blob = new Blob([output], { type: 'text/plain' });
    var a    = document.createElement('a');
    a.href     = URL.createObjectURL(blob);
    a.download = 'lookbook-rollback-log-' + Date.now() + '.txt';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function togglePanel() {
    _ensurePanel();
    _panelOpen = !_panelOpen;
    _panelEl.classList.toggle('rbp-visible', _panelOpen);
    if (_panelOpen) _renderPanel();
  }

  /* ── KEYBOARD SHORTCUT ──────────────────────────────── */
  document.addEventListener('keydown', function(e) {
    // Ctrl+Shift+L → toggle panel
    if (e.ctrlKey && e.shiftKey && e.key === 'l') {
      e.preventDefault();
      togglePanel();
    }
    // Ctrl+Shift+Z → rollback 1 (when panel is NOT focused)
    if (e.ctrlKey && e.shiftKey && e.key === 'z') {
      e.preventDefault();
      rollback(1);
    }
  });

  /* ── GLOBAL ERROR HANDLER ───────────────────────────── */
  window.addEventListener('error', function(evt) {
    capture('UNCAUGHT ERROR', {
      message: evt.message,
      source: evt.filename || '',
      lineno: evt.lineno,
      colno:  evt.colno
    });
  });

  window.addEventListener('unhandledrejection', function(evt) {
    capture('UNHANDLED REJECTION', {
      reason: evt.reason ? String(evt.reason) : 'unknown'
    });
  });

  /* ── INIT ───────────────────────────────────────────── */
  _loadFromStorage();
  capture('init — session started');

  /* ── PUBLIC API ─────────────────────────────────────── */
  return {
    capture:     capture,
    rollback:    rollback,
    getHistory:  getHistory,
    getLatest:   getLatest,
    getCount:    getCount,
    clear:       clear,
    togglePanel: togglePanel,
    wrapError:   wrapError
  };
})();
