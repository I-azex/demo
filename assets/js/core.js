/* ═══════════════════════════════════════════════════════════════
   ПОДЪЕЗД №9 — ядро: состояние, звук, частицы, карман,
   достижения, вход, секреты
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var NEFOR = window.NEFOR = window.NEFOR || {};
  var $ = NEFOR.$ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = NEFOR.$$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var reduced = NEFOR.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SAVE_KEY = 'nefor9.state.v1';
  var ENTER_KEY = 'nefor.entered';

  /* ─────────────────────────── СОСТОЯНИЕ ─────────────────────────── */
  var DEFAULT_STATE = {
    draws: 0, lights: 0, beers: 0, snus: 0, walls: 0,
    tracks: [], ach: [], floors: [], quizDone: false, secret: false,
    sound: true, hudMin: false
  };
  var state = NEFOR.state = load();
  function load() {
    var s = {};
    for (var k in DEFAULT_STATE) s[k] = DEFAULT_STATE[k];
    try {
      var raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        var data = JSON.parse(raw);
        for (var key in DEFAULT_STATE) if (Object.prototype.hasOwnProperty.call(data, key)) s[key] = data[key];
        if (!Array.isArray(s.tracks)) s.tracks = [];
        if (!Array.isArray(s.ach)) s.ach = [];
        if (!Array.isArray(s.floors)) s.floors = [];
      }
    } catch (e) { /* приватный режим — живём без памяти */ }
    return s;
  }
  NEFOR.save = function () {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) {}
  };
  NEFOR.reset = function () {
    state.draws = 0; state.lights = 0; state.beers = 0; state.snus = 0; state.walls = 0;
    state.tracks = []; state.ach = []; state.floors = []; state.quizDone = false; state.secret = false;
    state.sound = true; state.hudMin = false;
    NEFOR.save(); renderCounters(); renderAch(); updateBasementVisibility();
  };

  /* ─────────────────────────── ЗВУК ─────────────────────────── */
  var Sfx = NEFOR.sfx = {
    ctx: null, master: null, noise: null,
    enabled: state.sound !== false,
    ensure: function () {
      if (this.ctx) {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        return this.ctx;
      }
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.55;
      this.master.connect(this.ctx.destination);
      var len = this.ctx.sampleRate * 2;
      var buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      var d = buf.getChannelData(0);
      for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.noise = buf;
      return this.ctx;
    },
    tone: function (freq, dur, type, gain, slideTo) {
      var ctx = this.ctx; if (!ctx) return;
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type || 'square';
      o.frequency.setValueAtTime(freq, ctx.currentTime);
      if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), ctx.currentTime + dur);
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(gain || 0.12, ctx.currentTime + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
      o.connect(g); g.connect(this.master);
      o.start(); o.stop(ctx.currentTime + dur + 0.02);
    },
    noiseHit: function (dur, type, freq, q, gain, slideTo) {
      var ctx = this.ctx; if (!ctx || !this.noise) return;
      var src = ctx.createBufferSource(); src.buffer = this.noise;
      var f = ctx.createBiquadFilter(); f.type = type || 'bandpass';
      f.frequency.setValueAtTime(freq || 1000, ctx.currentTime);
      if (slideTo) f.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + dur);
      f.Q.value = q || 1;
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(gain || 0.14, ctx.currentTime + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
      src.connect(f); f.connect(g); g.connect(this.master);
      src.start(); src.stop(ctx.currentTime + dur + 0.04);
    },
    play: function (name) {
      if (!this.enabled) return;
      if (!this.ensure()) return;
      var t = this.ctx.currentTime;
      switch (name) {
        case 'match':
          this.noiseHit(0.16, 'highpass', 2600, 0.9, 0.2, 900);
          this.tone(160, 0.09, 'triangle', 0.06, 70);
          break;
        case 'puff':
          this.noiseHit(0.55, 'lowpass', 900, 1.4, 0.09, 260);
          break;
        case 'spark':
          this.noiseHit(0.07, 'bandpass', 3800, 2, 0.09);
          this.tone(880, 0.04, 'square', 0.025, 420);
          break;
        case 'pop':
          this.tone(210, 0.14, 'sine', 0.22, 55);
          this.noiseHit(0.06, 'highpass', 2200, 1, 0.08);
          break;
        case 'fizz':
          this.noiseHit(0.8, 'highpass', 3400, 0.6, 0.055, 1400);
          break;
        case 'chime':
          this.tone(660, 0.16, 'triangle', 0.07);
          var self = this;
          setTimeout(function () { if (self.ctx) self.tone(990, 0.2, 'triangle', 0.055); }, 90);
          break;
        case 'thud':
          this.tone(64, 0.28, 'sine', 0.24, 42);
          break;
        case 'glitch':
          this.tone(120 + Math.random() * 600, 0.05, 'square', 0.03);
          this.noiseHit(0.05, 'highpass', 5000, 1, 0.04);
          break;
        case 'click':
          this.tone(320, 0.03, 'square', 0.02, 240);
          break;
        case 'whoosh':
          this.noiseHit(0.5, 'bandpass', 400, 0.8, 0.09, 2400);
          break;
        case 'wall':
          this.noiseHit(0.14, 'bandpass', 1400, 1.2, 0.08);
          break;
        default:
          this.tone(300, 0.04, 'square', 0.03);
      }
    }
  };
  NEFOR.setSound = function (on) {
    Sfx.enabled = !!on;
    state.sound = !!on; NEFOR.save();
    var btn = $('#sound-toggle');
    if (btn) {
      btn.setAttribute('aria-pressed', String(!!on));
      var label = $('.sound-toggle__label', btn);
      if (label) label.textContent = on ? 'ЗВУК ВКЛ' : 'ЗВУК ВЫКЛ';
    }
  };

  /* ─────────────────────────── ТОСТЫ ─────────────────────────── */
  var toastBox = null;
  NEFOR.toast = function (title, text, type) {
    if (!toastBox) toastBox = $('#toasts');
    if (!toastBox) return;
    var el = document.createElement('div');
    el.className = 'toast' + (type === 'bad' ? ' toast--bad' : '');
    var body = document.createElement('div');
    var b = document.createElement('b');
    b.textContent = title || '';
    body.appendChild(b);
    if (text) {
      var span = document.createElement('span');
      span.textContent = text;
      body.appendChild(span);
    }
    el.appendChild(body);
    toastBox.appendChild(el);
    while (toastBox.children.length > 3) toastBox.removeChild(toastBox.firstChild);
    setTimeout(function () {
      el.classList.add('is-out');
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 320);
    }, 4200);
  };

  /* ─────────────────────────── ДОСТИЖЕНИЯ ─────────────────────────── */
  var ACH = NEFOR.ACH = [
    { id: 'first-draw', name: 'ПЕРВАЯ ЗАТЯЖКА', desc: 'сделай затяжку', icon: 'st-cigarette' },
    { id: 'chain', name: 'ПЕРЕКУР', desc: '7 затяжек за визит', icon: 'st-cigarette-butt' },
    { id: 'opener', name: 'ОТКРЫВАШКА', desc: 'открой балтику', icon: 'st-bottle-cap' },
    { id: 'bottom', name: 'ПО ДОНЫШКУ', desc: '3 бутылки', icon: 'st-beer-bottle' },
    { id: 'under-lip', name: 'ПОД ГУБОЙ', desc: 'кинь накотик', icon: 'st-snus-can' },
    { id: 'overdose', name: 'ПЕРЕДОЗ', desc: '3 накотика подряд', icon: 'st-ashtray' },
    { id: 'dj', name: 'ДИДЖЕЙ', desc: 'включи все три трека', icon: 'st-cassette' },
    { id: 'hooligan', name: 'ХУЛИГАН', desc: 'оставь надпись на стене', icon: 'st-spray-splat' },
    { id: 'guide', name: 'ЭКСКУРСОВОД', desc: 'побывай на каждом этаже', icon: 'st-star' },
    { id: 'quiz', name: 'ЗНАТОК', desc: 'пройди тест до конца', icon: 'st-skull' },
    { id: 'basement', name: 'ПОДВАЛ', desc: 'найди то, чего нет', icon: 'st-cross' }
  ];
  NEFOR.unlockAch = function (id) {
    if (state.ach.indexOf(id) !== -1) return false;
    var def = null;
    for (var i = 0; i < ACH.length; i++) if (ACH[i].id === id) { def = ACH[i]; break; }
    if (!def) return false;
    state.ach.push(id);
    NEFOR.save();
    NEFOR.toast('ДОСТИЖЕНИЕ: ' + def.name, def.desc);
    if (NEFOR.sfx) NEFOR.sfx.play('chime');
    renderAch(true, id);
    return true;
  };
  NEFOR.checkAch = function () {
    if (state.draws >= 1) NEFOR.unlockAch('first-draw');
    if (state.draws >= 7) NEFOR.unlockAch('chain');
    if (state.beers >= 1) NEFOR.unlockAch('opener');
    if (state.beers >= 3) NEFOR.unlockAch('bottom');
    if (state.snus >= 1) NEFOR.unlockAch('under-lip');
    if (state.snus >= 3) NEFOR.unlockAch('overdose');
    if (state.tracks.length >= 3) NEFOR.unlockAch('dj');
    if (state.walls >= 1) NEFOR.unlockAch('hooligan');
    if (state.floors.length >= 8) NEFOR.unlockAch('guide');
    if (state.quizDone) NEFOR.unlockAch('quiz');
    if (state.secret) NEFOR.unlockAch('basement');
    renderAch();
  };
  function renderAch(newId) {
    var grid = $('#ach-grid');
    if (!grid) return;
    if (!grid.children.length) {
      ACH.forEach(function (a) {
        var el = document.createElement('div');
        el.className = 'badge';
        el.setAttribute('data-ach', a.id);
        el.innerHTML = '<span class="badge__ico"><svg class="ico" viewBox="0 0 120 120" aria-hidden="true"><use href="#' + a.icon + '"></use></svg></span>' +
          '<span><span class="badge__name"></span><span class="badge__desc"></span></span>';
        $('.badge__name', el).textContent = a.name;
        $('.badge__desc', el).textContent = a.desc;
        grid.appendChild(el);
      });
    }
    var on = 0;
    ACH.forEach(function (a) {
      var el = grid.querySelector('[data-ach="' + a.id + '"]');
      if (!el) return;
      var has = state.ach.indexOf(a.id) !== -1;
      el.classList.toggle('is-on', has);
      if (has) on++;
      if (has && newId === a.id) {
        el.classList.remove('is-new');
        void el.offsetWidth;
        el.classList.add('is-new');
      }
    });
    var countEl = $('#ach-count');
    if (countEl) countEl.textContent = String(on);
    var totalEl = $('#ach-total');
    if (totalEl) totalEl.textContent = String(ACH.length);
    var bar = $('#ach-bar');
    if (bar) bar.style.width = Math.round((on / ACH.length) * 100) + '%';
  }
  NEFOR.renderAch = renderAch;

  /* ─────────────────────────── СЧЁТЧИКИ ─────────────────────────── */
  function renderCounters() {
    var map = { sig: state.draws, lighter: state.lights, beer: state.beers, snus: state.snus };
    $$('[data-count]').forEach(function (el) {
      var k = el.getAttribute('data-count');
      if (k in map) el.textContent = String(map[k]);
    });
    $$('[data-stat]').forEach(function (el) {
      var k = el.getAttribute('data-stat');
      if (k === 'walls') el.textContent = String(state.walls);
      else if (k in map) el.textContent = String(map[k]);
    });
    var wc = $('#wall-count');
    if (wc) wc.textContent = String(state.walls);
  }
  NEFOR.renderCounters = renderCounters;

  /* ─────────────────────────── ЧАСТИЦЫ ─────────────────────────── */
  var FX = (function () {
    var canvas = null, ctx = null, W = 0, H = 0, DPR = 1;
    var parts = [], raf = 0, running = false;
    var MAX = 260;

    function resize() {
      if (!canvas) return;
      DPR = Math.min(2, window.devicePixelRatio || 1);
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = Math.floor(W * DPR); canvas.height = Math.floor(H * DPR);
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      if (ctx) ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    function init() {
      canvas = $('#fx-canvas');
      if (!canvas) return;
      ctx = canvas.getContext('2d');
      resize();
      window.addEventListener('resize', resize);
    }
    function spawn(p) {
      if (reduced) return;
      if (parts.length >= MAX) parts.shift();
      parts.push(p);
      start();
    }
    function start() {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(tick);
    }
    function tick() {
      raf = 0;
      if (!ctx) return;
      ctx.clearRect(0, 0, W, H);
      for (var i = parts.length - 1; i >= 0; i--) {
        var p = parts[i];
        p.life -= 1;
        if (p.life <= 0) { parts.splice(i, 1); continue; }
        p.vy += p.gravity || 0;
        p.vx *= p.drag || 0.985;
        p.vy *= p.drag || 0.985;
        p.x += p.vx; p.y += p.vy;
        var k = p.life / p.maxLife;
        ctx.globalAlpha = Math.max(0, k) * (p.alpha == null ? 1 : p.alpha);
        if (p.kind === 'smoke' || p.kind === 'flash') {
          var r = p.size * (p.grow ? (1 + (1 - k) * p.grow) : 1);
          var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, Math.max(1, r));
          g.addColorStop(0, p.color);
          g.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(1, r), 0, 6.2832); ctx.fill();
        } else if (p.kind === 'spark') {
          ctx.strokeStyle = p.color; ctx.lineWidth = p.width || 1.4;
          ctx.beginPath(); ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - p.vx * 2.4, p.y - p.vy * 2.4); ctx.stroke();
        } else {
          ctx.fillStyle = p.color;
          ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(0.4, p.size * k), 0, 6.2832); ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      if (parts.length) raf = requestAnimationFrame(tick);
      else running = false;
    }
    function smoke(x, y, n, colors) {
      if (reduced) return;
      for (var i = 0; i < n; i++) {
        spawn({
          kind: 'smoke', x: x + rand(-14, 14), y: y + rand(-10, 10),
          vx: rand(-0.7, 0.7), vy: rand(-1.9, -0.5),
          size: rand(14, 34), grow: 1.6, gravity: -0.004, drag: 0.99,
          life: 48 + Math.random() * 34, maxLife: 82,
          alpha: rand(0.1, 0.28),
          color: colors ? colors[Math.floor(Math.random() * colors.length)] : 'rgba(235,230,215,.55)'
        });
      }
    }
    function sparks(x, y, n) {
      if (reduced) return;
      for (var i = 0; i < n; i++) {
        var a = Math.random() * 6.2832, sp = rand(1.2, 5.2);
        spawn({
          kind: 'spark', x: x, y: y,
          vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 0.8,
          size: 1, width: rand(1, 2.2), gravity: 0.09, drag: 0.94,
          life: 20 + Math.random() * 22, maxLife: 42,
          alpha: 0.9, color: Math.random() > 0.4 ? 'rgba(255,214,120,1)' : 'rgba(255,120,40,.95)'
        });
      }
    }
    function foam(x, y, n) {
      if (reduced) return;
      for (var i = 0; i < n; i++) {
        spawn({
          kind: 'dot', x: x + rand(-10, 10), y: y + rand(-8, 8),
          vx: rand(-1.4, 1.4), vy: rand(-2.6, -0.4),
          size: rand(1.5, 4.4), gravity: 0.05, drag: 0.985,
          life: 40 + Math.random() * 40, maxLife: 80,
          alpha: 0.85, color: 'rgba(250,246,232,.9)'
        });
      }
    }
    function flash(x, y, radius, color) {
      if (reduced) return;
      spawn({
        kind: 'flash', x: x, y: y, vx: 0, vy: 0, size: radius || 90, grow: 0.6,
        gravity: 0, drag: 1, life: 22, maxLife: 22, alpha: 0.55,
        color: color || 'rgba(198,255,46,.55)'
      });
    }
    function ember(x, y) {
      if (reduced) return;
      spawn({
        kind: 'dot', x: x + rand(-4, 4), y: y + rand(-4, 4),
        vx: rand(-0.35, 0.35), vy: rand(-0.9, -0.25),
        size: rand(0.8, 2.1), gravity: -0.004, drag: 0.99,
        life: 26 + Math.random() * 24, maxLife: 50, alpha: rand(0.35, 0.8),
        color: Math.random() > 0.35 ? 'rgba(255,150,60,.9)' : 'rgba(198,255,46,.8)'
      });
    }
    return { init: init, smoke: smoke, sparks: sparks, foam: foam, flash: flash, ember: ember };
  })();
  NEFOR.fx = FX;
  function rand(a, b) { return a + Math.random() * (b - a); }
  NEFOR.rand = rand;

  /* ─────────────────────────── КУРСОР ─────────────────────────── */
  var cursor = null, cursorActive = false, lastEmber = 0;
  function initCursor() {
    if (reduced || window.matchMedia('(hover: none)').matches) return;
    cursor = document.createElement('div');
    cursor.className = 'cursor';
    cursor.setAttribute('aria-hidden', 'true');
    document.body.appendChild(cursor);
    document.body.classList.add('has-cursor');
    cursorActive = true;
    document.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      cursor.style.transform = 'translate3d(' + e.clientX + 'px,' + e.clientY + 'px,0)';
      var now = performance.now();
      if (now - lastEmber > 32) { lastEmber = now; FX.ember(e.clientX, e.clientY); }
    }, { passive: true });
    document.addEventListener('pointerdown', function () { cursor.classList.add('is-down'); }, { passive: true });
    document.addEventListener('pointerup', function () { cursor.classList.remove('is-down'); }, { passive: true });
    document.addEventListener('pointerleave', function () { cursor.style.opacity = '0'; });
    document.addEventListener('pointerenter', function () { cursor.style.opacity = '1'; });
    document.addEventListener('mouseover', function (e) {
      if (!cursor) return;
      var hot = e.target.closest && e.target.closest('a,button,input,textarea,label,summary,.tag,.frame,.slot');
      cursor.classList.toggle('is-hot', !!hot);
    });
  }

  /* ─────────────────────────── HUD / КАРМАН ─────────────────────────── */
  var ITEMS = {
    sig: {
      hint: 'СИГАРЕТА · кликни по стене — затяжка',
      tips: ['затянись. никто не смотрит', 'дым не считается, если не фоткать', 'ещё одну — и точно домой']
    },
    lighter: {
      hint: 'ЗАЖИГАЛКА · посвети по стенам, там есть надписи',
      tips: ['огонёк. не спали подъезд', 'чиркни ещё раз', 'свет держится недолго']
    },
    beer: {
      hint: 'БАЛТИКА · кликни, чтобы открыть',
      tips: ['открыл. это была последняя', 'пшшш. соседи всё слышали', 'пора домой, но сначала ещё одна']
    },
    snus: {
      hint: 'НАКОТИК · кликни, если готов',
      tips: ['под губой. держись', 'не жуй. просто стой', 'тебе нормально. наверное']
    }
  };
  var hudHint = null, hudTip = null, heroLitTimer = 0, lastPointer = { x: 0, y: 0 };
  var overdoseTimer = 0;

  function initHud() {
    hudHint = $('#hud-hint'); hudTip = $('#hud-tip');
    $$('.slot').forEach(function (slot) {
      slot.addEventListener('click', function () {
        var item = slot.getAttribute('data-item');
        var r = slot.getBoundingClientRect();
        selectTool(item, r.left + r.width / 2, r.top);
        act(item, r.left + r.width / 2, r.top);
      });
    });
    var hud = $('#hud'), toggle = $('#hud-toggle');
    function applyHudMin(min) {
      state.hudMin = !!min; NEFOR.save();
      if (hud) hud.classList.toggle('is-min', !!min);
      if (toggle) {
        toggle.setAttribute('aria-expanded', String(!min));
        toggle.setAttribute('aria-label', min ? 'Развернуть карман' : 'Свернуть карман');
        toggle.textContent = min ? '+' : '−';
      }
    }
    applyHudMin(!!state.hudMin);
    if (toggle) toggle.addEventListener('click', function () {
      applyHudMin(!state.hudMin);
      Sfx.play('click');
    });
    document.addEventListener('pointermove', function (e) {
      lastPointer.x = e.clientX; lastPointer.y = e.clientY;
      if (document.body.classList.contains('light-on')) updateLightPos(e.clientX, e.clientY);
    }, { passive: true });

    /* клик по странице активным предметом */
    document.addEventListener('click', function (e) {
      if (!state.tool) return;
      var t = e.target;
      if (!t || !t.closest) return;
      if (t.closest('button,a,input,textarea,select,label,summary,dialog,.hud,.topbar,.rail,.tag,.frame,.quiz,.guest__form,.basement,.lightbox,.street')) return;
      act(state.tool, e.clientX, e.clientY);
    });

    if (state.tool) selectTool(state.tool, 0, 0);
  }

  function selectTool(item, x, y) {
    if (!ITEMS[item]) return;
    state.tool = item;
    $$('.slot').forEach(function (s) {
      s.setAttribute('aria-pressed', String(s.getAttribute('data-item') === item));
    });
    document.body.classList.add('has-tool');
    if (hudHint) hudHint.textContent = ITEMS[item].hint;
    if (hudTip) hudTip.textContent = 'клавиши 1—4 переключают карман · кликни по странице';
  }

  var act = NEFOR.act = function (item, x, y) {
    if (!ITEMS[item]) return;
    x = (x == null) ? window.innerWidth / 2 : x;
    y = (y == null) ? window.innerHeight / 2 : y;
    if (item === 'sig') {
      state.draws++; NEFOR.save(); renderCounters(); NEFOR.checkAch();
      FX.smoke(x, y, 16);
      FX.ember(x, y);
      Sfx.play('puff');
      if (state.draws === 1) NEFOR.toast('ЗАТЯЖКА', 'вот так. дыши глубже');
      else if (state.draws === 7) NEFOR.toast('ПЕРЕКУР', 'пора выходить на улицу');
    } else if (item === 'lighter') {
      state.lights++; NEFOR.save(); renderCounters();
      FX.sparks(x, y, 26);
      FX.flash(x, y, 110, 'rgba(255,170,80,.45)');
      Sfx.play('match');
      lightUp(x, y);
    } else if (item === 'beer') {
      state.beers++; NEFOR.save(); renderCounters(); NEFOR.checkAch();
      FX.foam(x, y, 26);
      FX.flash(x, y, 60, 'rgba(240,161,60,.35)');
      Sfx.play('pop');
      setTimeout(function () { Sfx.play('fizz'); }, 130);
      NEFOR.toast('ПШШШ', ITEMS.beer.tips[Math.min(state.beers - 1, ITEMS.beer.tips.length - 1)]);
      if (state.beers === 3) { woozy(); }
    } else if (item === 'snus') {
      state.snus++; NEFOR.save(); renderCounters(); NEFOR.checkAch();
      Sfx.play('thud');
      document.body.classList.add('rush');
      setTimeout(function () { document.body.classList.remove('rush'); }, 900);
      if (state.snus === 1) NEFOR.toast('ПОД ГУБОЙ', 'не жуй. просто стой');
      if (state.snus >= 3 && !overdoseTimer) overdose();
    }
  };

  function woozy() {
    if (reduced) return;
    document.body.classList.add('woozy');
    setTimeout(function () { document.body.classList.remove('woozy'); }, 5200);
    NEFOR.toast('ПОРА ДОМОЙ?', 'мир слегка наклонился. это нормально');
  }
  function overdose() {
    if (reduced) return;
    overdoseTimer = 1;
    document.body.classList.add('overdose');
    Sfx.play('glitch');
    NEFOR.toast('ПЕРЕДОЗ (шутка)', 'сядь, попей воды, посмотри на кота', 'bad');
    setTimeout(function () {
      document.body.classList.remove('overdose');
      overdoseTimer = 0;
    }, 2400);
  }

  /* ─────────────────────────── СВЕТ ОТ ЗАЖИГАЛКИ ─────────────────────────── */
  var heroEl = null;
  function lightUp(x, y) {
    heroEl = heroEl || $('#floor-9');
    if (!heroEl) return;
    document.body.classList.add('light-on');
    heroEl.classList.add('is-lit');
    updateLightPos(x, y);
    clearTimeout(heroLitTimer);
    heroLitTimer = setTimeout(function () {
      document.body.classList.remove('light-on');
      if (heroEl) heroEl.classList.remove('is-lit');
    }, 6500);
    if (!state._litHint) {
      state._litHint = true;
      NEFOR.toast('СВЕТ', 'теперь кликни по стене подъезда');
    }
  }
  function updateLightPos(cx, cy) {
    if (!heroEl) return;
    var r = heroEl.getBoundingClientRect();
    heroEl.style.setProperty('--lx', (cx - r.left).toFixed(0) + 'px');
    heroEl.style.setProperty('--ly', (cy - r.top).toFixed(0) + 'px');
  }

  /* ─────────────────────────── ВХОД ─────────────────────────── */
  function initGate() {
    var gate = $('#gate');
    if (!gate) return;
    var already = false;
    try { already = sessionStorage.getItem(ENTER_KEY) === '1'; } catch (e) {}
    if (already) {
      gate.classList.add('is-open');
      document.body.classList.remove('gate-open');
      return;
    }
    document.body.classList.add('gate-open');
    var enterBtn = $('#gate-enter'), denyBtn = $('#gate-deny'), lieBtn = $('#gate-lie');
    function enter(skipped) {
      try { sessionStorage.setItem(ENTER_KEY, '1'); } catch (e) {}
      Sfx.ensure(); Sfx.play('match');
      var flash = $('#flash');
      if (flash) { flash.classList.remove('is-on'); void flash.offsetWidth; flash.classList.add('is-on'); }
      if (!skipped) { Sfx.play('whoosh'); }
      gate.classList.add('is-open');
      document.body.classList.remove('gate-open');
      setTimeout(function () {
        if (document.body.classList.contains('gate-open')) document.body.classList.remove('gate-open');
      }, 60);
      if (skipped) {
        NEFOR.toast('НУ ЛАДНО', 'проходи. только не шуми');
      } else {
        NEFOR.toast('ДОБРО ПОЖАЛОВАТЬ', 'лифт сломан. карман — внизу слева');
      }
      var heroTitle = $('#hero-title');
      if (heroTitle) { heroTitle.setAttribute('tabindex', '-1'); setTimeout(function () { heroTitle.focus({ preventScroll: true }); }, 350); }
    }
    if (enterBtn) enterBtn.addEventListener('click', function () { enter(false); });
    if (denyBtn) denyBtn.addEventListener('click', function () {
      gate.classList.add('is-joking');
      var joke = $('#gate-joke');
      if (joke) { joke.hidden = false; }
      if (lieBtn) setTimeout(function () { lieBtn.focus(); }, 50);
      Sfx.play('click');
    });
    if (lieBtn) lieBtn.addEventListener('click', function () { enter(true); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !gate.classList.contains('is-open') && document.body.classList.contains('gate-open')) {
        gate.classList.add('is-joking');
        var joke = $('#gate-joke');
        if (joke) joke.hidden = false;
      }
    });
  }

  /* ─────────────────────────── НАСТРОЙКИ ЗВУКА ─────────────────────────── */
  function initSoundToggle() {
    var btn = $('#sound-toggle');
    NEFOR.setSound(Sfx.enabled);
    if (!btn) return;
    btn.addEventListener('click', function () {
      NEFOR.setSound(!Sfx.enabled);
      if (Sfx.enabled) Sfx.play('click');
    });
  }

  /* ─────────────────────────── РЕЙЛ / ЭТАЖИ ─────────────────────────── */
  function initScrollStuff() {
    var topbar = $('#topbar');
    var onScroll = function () {
      if (topbar) topbar.classList.toggle('is-scrolled', window.scrollY > 40);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    var sections = $$('.floor[data-floor]');
    var railItems = {};
    $$('.rail__item[data-rail]').forEach(function (el) { railItems[el.getAttribute('data-rail')] = el; });
    var setActive = function (floor) {
      Object.keys(railItems).forEach(function (k) {
        railItems[k].classList.toggle('is-active', String(floor) === String(k));
      });
      var hud = $('#hud');
      if (hud) hud.classList.toggle('is-hiding', String(floor) === '1' || String(floor) === '0');
      var f = String(floor);
      if (sections.length && f !== '0' && state.floors.indexOf(f) === -1) {
        state.floors.push(f); NEFOR.save(); NEFOR.checkAch();
      }
    };
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) setActive(en.target.getAttribute('data-floor'));
        });
      }, { rootMargin: '-42% 0px -46% 0px', threshold: 0 });
      sections.forEach(function (s) { io.observe(s); });
    }
    var dead = $('.rail__item--dead');
    if (dead) dead.addEventListener('click', function () {
      Sfx.play('glitch');
      NEFOR.toast('НА ВТОРОЙ НЕЛЬЗЯ', 'там живёт Валера. он не любит гостей', 'bad');
    });
  }

  /* ─────────────────────────── ПОЯВЛЕНИЯ ─────────────────────────── */
  function initReveal() {
    if (!('IntersectionObserver' in window)) return;
    var els = $$('.sec-head, .lead, .wall__grid, .deck, .quiz, .rules, .wisdom, .guest__wall, .guest__form, .stats, .ach__head, .ach__grid, .exit__cols, .exit__bottom');
    els.forEach(function (el, i) {
      el.classList.add('reveal');
      el.style.transitionDelay = (Math.min(i % 4, 3) * 70) + 'ms';
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ─────────────────────────── ВЫХОД НА УЛИЦУ ─────────────────────────── */
  function initStreet() {
    var street = $('#street'), openBtn = $('#exit-btn'), stayBtn = $('#street-stay');
    if (!street || !openBtn) return;
    var lastFocus = null;
    function open() {
      lastFocus = document.activeElement;
      street.hidden = false;
      document.body.classList.add('is-locked');
      Sfx.play('whoosh');
      setTimeout(function () { if (stayBtn) stayBtn.focus(); }, 120);
    }
    function close() {
      street.hidden = true;
      document.body.classList.remove('is-locked');
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    openBtn.addEventListener('click', open);
    if (stayBtn) stayBtn.addEventListener('click', close);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !street.hidden) close();
    });
  }

  /* ─────────────────────────── ПОДВАЛ ─────────────────────────── */
  var basementDoorClicks = 0, badgeClicks = 0, badgeTimer = 0;
  function updateBasementVisibility() {
    var b = $('#basement');
    if (!b) return;
    if (state.secret) b.hidden = false;
  }
  NEFOR.openBasement = function (silent) {
    var b = $('#basement');
    if (!b) return;
    var first = !state.secret;
    state.secret = true; NEFOR.save(); NEFOR.checkAch();
    updateBasementVisibility();
    if (first) {
      Sfx.play('glitch');
      NEFOR.toast('ПОДВАЛ НАЙДЕН', 'здесь темно. напиши что-нибудь и отпусти', 'bad');
      setTimeout(function () { b.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' }); }, 220);
    } else if (silent !== true) {
      b.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    }
  };
  function initSecret() {
    var door = $('#basement-door');
    var badge = $('.badge-18');
    if (door) door.addEventListener('click', function () {
      if (state.secret) { NEFOR.openBasement(); return; }
      basementDoorClicks++;
      door.classList.remove('is-nudge'); void door.offsetWidth; door.classList.add('is-nudge');
      Sfx.play('thud');
      if (basementDoorClicks >= 5) NEFOR.openBasement();
      else if (basementDoorClicks === 2) NEFOR.toast('ЗАПЕРТО', 'но кто-то оставил ключ под ковриком');
    });
    if (badge) badge.addEventListener('click', function () {
      badgeClicks++; clearTimeout(badgeTimer);
      badgeTimer = setTimeout(function () { badgeClicks = 0; }, 1400);
      if (badgeClicks >= 3) {
        badgeClicks = 0;
        Sfx.play('glitch');
        NEFOR.toast('18+', 'внизу есть дверь. она не хочет открываться просто так');
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') return;
      if (e.target && /input|textarea|select/i.test(e.target.tagName)) return;
      var buf = (NEFOR._buf || '') + (e.key.length === 1 ? e.key.toLowerCase() : '');
      NEFOR._buf = buf.slice(-24);
      if (NEFOR._buf.indexOf('подвал') !== -1) { NEFOR._buf = ''; NEFOR.openBasement(); }
    });
  }

  /* ─────────────────────────── КЛАВИШИ / ПАСХАЛКИ ─────────────────────────── */
  function initKeys() {
    var konami = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    var pos = 0;
    document.addEventListener('keydown', function (e) {
      if (e.target && /input|textarea|select/i.test(e.target.tagName)) return;
      if (e.key === 'm' || e.key === 'M' || e.key === 'ь' || e.key === 'Ь') {
        NEFOR.setSound(!Sfx.enabled); if (Sfx.enabled) Sfx.play('click');
        return;
      }
      var n = parseInt(e.key, 10);
      if (n >= 1 && n <= 4) {
        var names = ['sig', 'lighter', 'beer', 'snus'];
        var item = names[n - 1];
        selectTool(item, lastPointer.x, lastPointer.y);
        act(item, lastPointer.x || window.innerWidth / 2, lastPointer.y || window.innerHeight / 2);
        return;
      }
      if (e.key === konami[pos] || e.key.toLowerCase() === konami[pos]) {
        pos++;
        if (pos === konami.length) {
          pos = 0;
          Sfx.play('glitch');
          document.body.classList.add('rush');
          setTimeout(function () { document.body.classList.remove('rush'); }, 700);
          NEFOR.toast('КОД ПРИНЯТ', 'ты точно из 2009-го');
        }
      } else { pos = 0; }
    });

    var words = [
      { w: 'снюс', run: function () { act('snus', window.innerWidth / 2, window.innerHeight / 2); } },
      { w: 'курить', run: function () { act('sig', window.innerWidth / 2, window.innerHeight / 2); } },
      { w: '228', run: function () { Sfx.play('glitch'); NEFOR.toast('СТАТЬЯ', 'шучу. у нас тут только сигареты', 'bad'); } },
      { w: 'лифт', run: function () { NEFOR.toast('ЛИФТ СЛОМАН', 'он сломан с 2009 года'); } }
    ];
    document.addEventListener('keydown', function (e) {
      if (e.target && /input|textarea|select/i.test(e.target.tagName)) return;
      if (e.key.length !== 1) return;
      var b = ((NEFOR._wordBuf || '') + e.key.toLowerCase()).slice(-12);
      NEFOR._wordBuf = b;
      words.forEach(function (item) {
        if (b.indexOf(item.w) !== -1) { NEFOR._wordBuf = ''; item.run(); }
      });
    });
  }

  /* ─────────────────────────── ЗВУК КНОПОК ─────────────────────────── */
  function initButtonSounds() {
    document.addEventListener('click', function (e) {
      var t = e.target.closest && e.target.closest('[data-sound]');
      if (!t) return;
      Sfx.play(t.getAttribute('data-sound') || 'click');
    });
  }

  /* ─────────────────────────── СЕКРЕТНАЯ НАДПИСЬ В ГЕРОЕ ─────────────────────────── */
  function initHeroSign() {
    var sign = $('#hero-sign');
    if (!sign) return;
    sign.addEventListener('click', function (e) {
      Sfx.play('spark');
      FX.sparks(e.clientX, e.clientY, 18);
      NEFOR.toast('НЕОН', 'табличка гудит уже двадцать лет');
      sign.classList.toggle('is-off');
    });
  }

  /* ─────────────────────────── СТАРТ ─────────────────────────── */
  function init() {
    NEFOR.renderCounters();
    NEFOR.renderAch();
    updateBasementVisibility();
    initGate();
    initSoundToggle();
    initCursor();
    FX.init();
    initHud();
    initScrollStuff();
    initReveal();
    initStreet();
    initSecret();
    initKeys();
    initButtonSounds();
    initHeroSign();
    NEFOR.checkAch();
    /* подсказка про карман */
    setTimeout(function () {
      if (!state.draws && !state.beers && !state.snus && !state.lights) {
        NEFOR.toast('КАРМАН', 'внизу слева лежит всё, что нужно для вечера');
      }
    }, 6000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
