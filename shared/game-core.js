/* DHA Learning Games: shared helpers.
   Load before your game script:  <script src="../../../shared/game-core.js"></script>
   Exposes window.DHA with: speak, stopSpeaking, tone, sfx, confetti, el, shuffle, store, teacherMenu.
   No dependencies. Everything fails quietly if the browser lacks speech or audio. */
(function () {
  var hasTTS = 'speechSynthesis' in window;
  var S = { voiceOn: true, soundOn: true, voice: null };
  var AC = null;

  /* ---------- speech (en-GB preferred) ---------- */
  function pickVoice() {
    if (!hasTTS) return;
    var vs = speechSynthesis.getVoices() || [];
    S.voice = vs.find(function (v) { return /en[-_]GB/i.test(v.lang); }) ||
              vs.find(function (v) { return /^en/i.test(v.lang); }) || null;
  }
  if (hasTTS) {
    pickVoice();
    if (speechSynthesis.addEventListener) speechSynthesis.addEventListener('voiceschanged', pickVoice);
  }
  function speak(text, opts) {
    if (!hasTTS || !S.voiceOn) return;
    opts = opts || {};
    try {
      speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      u.rate = opts.rate || 0.85;
      u.pitch = opts.pitch || 1.1;
      u.lang = 'en-GB';
      if (S.voice) u.voice = S.voice;
      speechSynthesis.speak(u);
    } catch (e) {}
  }
  function stopSpeaking() { try { if (hasTTS) speechSynthesis.cancel(); } catch (e) {} }

  /* ---------- sound ---------- */
  function tone(freq, start, dur, type, vol) {
    if (!S.soundOn) return;
    try {
      AC = AC || new (window.AudioContext || window.webkitAudioContext)();
      var o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime + start;
      o.type = type || 'sine'; o.frequency.value = freq;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vol || 0.15, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + dur + 0.05);
    } catch (e) {}
  }
  function sfx(kind) {
    if (kind === 'ok') { tone(659, 0, 0.15); tone(880, 0.12, 0.25); }
    else if (kind === 'no') { tone(220, 0, 0.25, 'triangle'); }
    else if (kind === 'win') { [523, 659, 784, 1047].forEach(function (f, i) { tone(f, i * 0.14, 0.3); }); }
    else if (kind === 'open') { tone(523, 0, 0.12); tone(659, 0.1, 0.12); tone(784, 0.2, 0.12); tone(1047, 0.3, 0.25); }
  }

  /* ---------- small utilities ---------- */
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function confetti() {
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var e = ['🎉', '⭐', '🎊', '🌟'];
    for (var i = 0; i < 24; i++) (function (i) {
      setTimeout(function () {
        var s = el('span', 'fall', e[i % e.length]);
        s.style.left = (Math.random() * 96) + 'vw';
        s.style.animationDuration = (2.6 + Math.random() * 2) + 's';
        document.body.appendChild(s);
        setTimeout(function () { s.remove(); }, 5500);
      }, i * 90);
    })(i);
  }

  /* localStorage that never throws. Namespace per game: var db = DHA.store('tlc'); db.get('best', 0); db.set('best', 12); */
  function store(ns) {
    return {
      get: function (k, d) { try { var v = localStorage.getItem(ns + '_' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
      set: function (k, v) { try { localStorage.setItem(ns + '_' + k, JSON.stringify(v)); } catch (e) {} }
    };
  }

  /* ---------- teacher menu (press T) ----------
     DHA.teacherMenu({ restart: fn, items: [['Button label', fn], ...] })
     Voice and sound toggles are always included. Pass `restart` to add a Restart button. */
  function teacherMenu(cfg) {
    cfg = cfg || {};
    var m = el('div'); m.id = 'teacher'; m.hidden = true;
    m.appendChild(el('strong', null, 'Teacher menu'));
    var bV = el('button', null), bS = el('button', null), info = el('span');
    bV.type = bS.type = 'button';
    m.appendChild(bV); m.appendChild(bS);
    (cfg.items || []).forEach(function (it) {
      var b = el('button', null, it[0]); b.type = 'button';
      b.onclick = function () { m.hidden = true; it[1](); };
      m.appendChild(b);
    });
    if (cfg.restart) {
      var r = el('button', null, 'Restart game'); r.type = 'button';
      r.onclick = function () { m.hidden = true; cfg.restart(); };
      m.appendChild(r);
    }
    m.appendChild(info);
    function refresh() {
      bV.textContent = 'Voice: ' + (S.voiceOn ? 'on' : 'off');
      bS.textContent = 'Sound effects: ' + (S.soundOn ? 'on' : 'off');
      info.textContent = hasTTS ? ('Speech: ' + (S.voice ? S.voice.name : 'default voice')) : 'Speech not supported on this browser';
    }
    bV.onclick = function () { S.voiceOn = !S.voiceOn; if (!S.voiceOn) stopSpeaking(); refresh(); };
    bS.onclick = function () { S.soundOn = !S.soundOn; refresh(); };
    document.body.appendChild(m);
    document.addEventListener('keydown', function (e) {
      var tag = (e.target && e.target.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 't' || e.key === 'T') { m.hidden = !m.hidden; pickVoice(); refresh(); }
    });
    refresh();
    return { show: function () { m.hidden = false; refresh(); }, hide: function () { m.hidden = true; }, refresh: refresh };
  }

  window.DHA = {
    hasTTS: hasTTS, state: S,
    speak: speak, stopSpeaking: stopSpeaking,
    tone: tone, sfx: sfx,
    el: el, shuffle: shuffle, confetti: confetti,
    store: store, teacherMenu: teacherMenu
  };
})();
