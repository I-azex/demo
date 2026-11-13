/* ═══════════════════════════════════════════════════════════════
   ПОДЪЕЗД №9 — секции: фото, тест, мудрость, надписи, подвал
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var NEFOR = window.NEFOR;
  if (!NEFOR) return;
  var $ = NEFOR.$, $$ = NEFOR.$$;
  var reduced = NEFOR.reduced;

  /* ─────────────────────────── ФОТО / СТЕНА ─────────────────────────── */
  function initPhotos() {
    var photos = (window.NEFOR_PHOTOS || []).slice();
    if (!photos.length) return;

    function bySlot(slot, fallbackIndex) {
      for (var i = 0; i < photos.length; i++) if (photos[i].slot === slot) return photos[i];
      return photos[fallbackIndex] || null;
    }
    function setSlot(sel, p) {
      if (!p || !p.file) return;
      var img = $(sel);
      if (!img) return;
      img.src = p.file;
      if (p.alt) img.alt = p.alt;
    }
    setSlot('[data-photo-slot="hero-a"]', bySlot('hero-a', 0));
    setSlot('[data-photo-slot="hero-b"]', bySlot('hero-b', 1));

    var wall = photos.filter(function (p) { return p.wall !== false; }).slice(0, 8);
    var grid = $('#wall-grid');
    if (grid && wall.length) {
      var noscript = $('.wall__noscript', grid);
      if (noscript) noscript.parentNode.removeChild(noscript);
      wall.forEach(function (p, i) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'frame frame--' + ((i % 8) + 1);
        btn.setAttribute('aria-label', 'Открыть фото: ' + (p.caption || p.title || ''));
        if (p.slot === 'hero-a' || p.slot === 'hero-b') { /* не дублируем героев */ }
        var img = document.createElement('img');
        img.src = p.file;
        img.alt = p.alt || p.caption || p.title || 'фотография из подъезда';
        img.loading = i < 2 ? 'eager' : 'lazy';
        img.decoding = 'async';
        btn.appendChild(img);
        var cap = document.createElement('span');
        cap.className = 'frame__cap';
        cap.textContent = p.caption || p.title || 'без подписи';
        btn.appendChild(cap);
        btn.style.animationDelay = (i * 60) + 'ms';
        btn.addEventListener('click', function () { openLightbox(p); });
        grid.appendChild(btn);
      });
    }

    var credits = $('#photo-credits');
    if (credits) {
      photos.forEach(function (p) {
        if (!p.creator && !p.title) return;
        var li = document.createElement('li');
        var text = (p.title || 'фото') + ' — ' + (p.creator || 'неизвестный автор') + ' · ' + (p.license || 'CC');
        li.appendChild(document.createTextNode(text + ' · '));
        if (p.sourceUrl) {
          var a = document.createElement('a');
          a.href = p.sourceUrl;
          a.target = '_blank';
          a.rel = 'noopener';
          a.textContent = 'источник';
          li.appendChild(a);
        }
        credits.appendChild(li);
      });
    }
  }

  function openLightbox(p) {
    var dlg = $('#lightbox');
    if (!dlg || !dlg.showModal) return;
    var img = $('#lb-img'), cap = $('#lb-caption'), cred = $('#lb-credit');
    img.src = p.file;
    img.alt = p.alt || p.caption || p.title || 'фото';
    if (cap) cap.textContent = p.caption || p.title || '';
    if (cred) {
      cred.innerHTML = '';
      var text = (p.creator || 'автор неизвестен') + ' · ' + (p.license || 'CC');
      cred.appendChild(document.createTextNode(text));
      if (p.sourceUrl) {
        cred.appendChild(document.createTextNode(' · '));
        var a = document.createElement('a');
        a.href = p.sourceUrl; a.target = '_blank'; a.rel = 'noopener';
        a.textContent = 'источник';
        cred.appendChild(a);
      }
    }
    dlg.showModal();
    if (NEFOR.sfx) NEFOR.sfx.play('click');
  }
  function initLightbox() {
    var dlg = $('#lightbox');
    if (!dlg) return;
    var closeBtn = $('#lb-close');
    if (closeBtn) closeBtn.addEventListener('click', function () { dlg.close(); });
    dlg.addEventListener('click', function (e) {
      if (e.target === dlg) dlg.close();
    });
  }

  /* ─────────────────────────── ТЕСТ ─────────────────────────── */
  var ARCH = {
    emo: {
      type: 'ЭМО-КИД <em>2009</em>',
      copy: 'ЭМО-КИД 2009',
      desc: 'У тебя всё ещё есть чёлка в паспорте и чувство вины на автопилоте. Ты умеешь любить так, что страшно, и молчать так, что слышно. Тебя обнимали на подоконнике, а ты говорил, что всё нормально. Тебе шло.',
      traits: ['чёлка', 'вина на автопилоте', 'плейлист на 400 треков']
    },
    gop: {
      type: 'ГОПНИК-<em>ФИЛОСОФ</em>',
      copy: 'ГОПНИК-ФИЛОСОФ',
      desc: 'Ты приседаешь на кортах и рассуждаешь о справедливости, будто пишешь диссертацию. У тебя всегда есть зажигалка, семки и мнение. Тебя боятся ровно до момента, пока не познакомятся.',
      traits: ['присед', 'семки', 'мнение по любому поводу']
    },
    snus: {
      type: 'СНЮС-<em>ИНТЕЛЛИГЕНТ</em>',
      copy: 'СНЮС-ИНТЕЛЛИГЕНТ',
      desc: 'Ты человек нового времени: загуба, наушники, слишком много мыслей. Ты знаешь, как красиво уйти, но не знаешь, куда. Ты на самом деле добрый — просто об этом не написано в описании.',
      traits: ['накотик', 'наушники', 'красивый уход']
    },
    keeper: {
      type: 'ТЁПЛЫЙ <em>ТАМБУР</em>',
      copy: 'ТЁПЛЫЙ ТАМБУР',
      desc: 'Ты тот, с кем всегда тепло. Ты помнишь дни рождения, приносишь зарядку и умеешь слушать так, что люди выдыхают. Про тебя не пишут на стенах, но именно тебя все ищут.',
      traits: ['чай в термосе', 'зарядка', 'помнит всех']
    }
  };
  var QUESTIONS = [
    {
      q: 'Ты заходишь в подъезд и видишь на полу чужую зажигалку. Что делаешь?',
      a: [
        { t: 'Поднимаю. Вдруг моя.', k: 'gop' },
        { t: 'Не поднимаю. У неё клеймо.', k: 'emo' },
        { t: 'Подниму и положу на подоконник. Пусть хозяин найдёт.', k: 'keeper' },
        { t: 'Ты её уже поднял. Ты всегда её поднимаешь.', k: 'snus' }
      ]
    },
    {
      q: 'У тебя в кармане последний накотик, а рядом друг просит. Что делаешь?',
      a: [
        { t: 'Делимся — это святое.', k: 'keeper' },
        { t: 'Скажу, что уже кинул.', k: 'gop' },
        { t: 'Отдам ему, а сам притворюсь, что мне не надо.', k: 'emo' },
        { t: 'Сначала спрошу, что у него случилось.', k: 'snus' }
      ]
    },
    {
      q: 'Время 4:56. Что происходит?',
      a: [
        { t: 'Я объясняю другу устройство вселенной.', k: 'snus' },
        { t: 'Я слушаю, как он объясняет устройство вселенной.', k: 'keeper' },
        { t: 'Я не помню. Честно.', k: 'gop' },
        { t: 'Я уже дома. Я почти всегда дома.', k: 'emo' }
      ]
    },
    {
      q: 'Что для тебя подъезд?',
      a: [
        { t: 'Тёплый тамбур, где можно постоять и не быть никем.', k: 'emo' },
        { t: 'Место преступления. Мама убьёт, если узнает.', k: 'gop' },
        { t: 'Сцена для лучшей музыки, которую никто не записал.', k: 'snus' },
        { t: 'Просто место, где мы были вместе.', k: 'keeper' }
      ]
    }
  ];
  var quiz = { index: 0, answers: [], result: null };

  function initQuiz() {
    var card = $('#quiz-card');
    if (!card) return;
    var body = $('#quiz-body'), counter = $('#quiz-counter'), dots = $('#quiz-dots');
    var form = $('#quiz-form'), next = $('#quiz-next'), resultBox = $('#quiz-result');
    var dotsEls = [];
    QUESTIONS.forEach(function () {
      var d = document.createElement('span');
      d.className = 'quiz__dot';
      if (dots) dots.appendChild(d);
      dotsEls.push(d);
    });
    function render() {
      var q = QUESTIONS[quiz.index];
      if (counter) counter.textContent = 'ВОПРОС ' + (quiz.index + 1) + ' / ' + QUESTIONS.length;
      dotsEls.forEach(function (d, i) {
        d.classList.toggle('is-active', i === quiz.index);
        d.classList.toggle('is-passed', i < quiz.index);
      });
      var letters = ['А', 'Б', 'В', 'Г'];
      var html = '<p class="quiz__q">' + q.q + '</p><div class="quiz__options">';
      q.a.forEach(function (opt, i) {
        html += '<label class="opt"><input type="radio" name="q' + quiz.index + '" value="' + opt.k + '">' +
          '<span class="opt__key">' + letters[i] + '</span><span>' + opt.t + '</span></label>';
      });
      html += '</div>';
      if (body) body.innerHTML = html;
      if (next) {
        next.disabled = true;
        next.textContent = quiz.index === QUESTIONS.length - 1 ? 'УЗНАТЬ РЕЗУЛЬТАТ' : 'ДАЛЬШЕ →';
      }
      $$('input[type="radio"]', body).forEach(function (input) {
        input.addEventListener('change', function () { if (next) next.disabled = false; NEFOR.sfx && NEFOR.sfx.play('click'); });
      });
    }
    if (form) form.addEventListener('submit', function (e) {
      e.preventDefault();
      var checked = $('input[type="radio"]:checked', body);
      if (!checked) { NEFOR.toast('НЕ ПРОЛИСТНУТЬ', 'выбери один вариант'); return; }
      quiz.answers[quiz.index] = checked.value;
      if (quiz.index < QUESTIONS.length - 1) {
        quiz.index++;
        render();
        NEFOR.sfx && NEFOR.sfx.play('click');
      } else {
        showResult();
      }
    });
    function showResult() {
      var score = { emo: 0, gop: 0, snus: 0, keeper: 0 };
      quiz.answers.forEach(function (k) { if (k in score) score[k]++; });
      var best = 'emo', bestVal = -1;
      Object.keys(score).forEach(function (k) { if (score[k] > bestVal) { bestVal = score[k]; best = k; } });
      quiz.result = best;
      var a = ARCH[best];
      if (form) form.hidden = true;
      if (resultBox) {
        resultBox.hidden = false;
        resultBox.innerHTML =
          '<div class="result">' +
          '<div class="result__stamp"><span>ПОДЪЕЗД<br>№9<br>УТВЕРЖДАЕТ</span></div>' +
          '<p class="result__eyebrow">РЕЗУЛЬТАТ ТЕСТА · ПОДЪЕЗД №9</p>' +
          '<h3 class="result__type">ТЫ — ' + a.type + '</h3>' +
          '<p class="result__desc">' + a.desc + '</p>' +
          '<div class="result__traits">' + a.traits.map(function (t) { return '<span class="result__trait">' + t + '</span>'; }).join('') + '</div>' +
          '<div class="result__actions">' +
          '<button class="btn btn--acid" type="button" id="quiz-again">ПРОЙТИ ЗАНОВО</button>' +
          '<button class="btn btn--ghost" type="button" id="quiz-share">СКОПИРОВАТЬ РЕЗУЛЬТАТ</button>' +
          '</div></div>';
        $('#quiz-again').addEventListener('click', function () {
          quiz.index = 0; quiz.answers = []; quiz.result = null;
          if (form) form.hidden = false;
          resultBox.hidden = true;
          render();
          NEFOR.sfx && NEFOR.sfx.play('click');
        });
        $('#quiz-share').addEventListener('click', function () {
          copyText('Я — ' + a.copy + '. Кто ты из подъезда №9? ' + location.origin + location.pathname);
        });
      }
      NEFOR.state.quizDone = true; NEFOR.save(); NEFOR.checkAch();
      NEFOR.sfx && NEFOR.sfx.play('chime');
      NEFOR.toast('ТЕСТ ПРОЙДЕН', 'правда оказалась с тобой');
    }
    render();
  }

  function copyText(text) {
    function done() { NEFOR.toast('СКОПИРОВАНО', 'отправь тому, кто поймёт'); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, fallback);
    } else fallback();
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); done(); } catch (e) { NEFOR.toast('НЕ ВЫШЛО', 'скопируй вручную, ладно?', 'bad'); }
      document.body.removeChild(ta);
    }
  }

  /* ─────────────────────────── МУДРОСТЬ ─────────────────────────── */
  var QUOTES = [
    ['Дом — это не место. Это люди, с которыми ты курил на лестнице.', 'стена между 6 и 7 этажом'],
    ['Не бывает бывших подъездов. Бывают запертые двери.', 'записка на 4 этаже'],
    ['Самое честное чувство — улыбнуться, вспоминая чужой двор.', 'пацан с балкона'],
    ['Ты не обязан быть удобным. Ты обязан вынести мусор.', 'объявление у лифта'],
    ['Плохое решение, принятое вместе, — уже хорошая история.', 'кто-то из 9-го'],
    ['Люди уходят. Записки на стене остаются.', 'карандаш, 2009'],
    ['Самый тёплый свет — у соседей. У тебя отключили.', '6 этаж, 2 квартира'],
    ['Если тебе холодно — это не повод возвращаться домой.', 'тёплый тамбур'],
    ['Не спрашивай, что было на площадке. Спрашивай, кто был рядом.', 'администратор стены'],
    ['Всё, что не сгорело в тамбуре, сгорает в памяти.', 'сигарета, дотлевшая до фильтра'],
    ['Мама узнает обо всём. Просто с опозданием на пятнадцать лет.', 'соседка с 3 этажа'],
    ['Свобода пахнет сыростью и дешёвым пивом. Так и запомним.', '2008 год']
  ];
  var lastQuote = -1;
  function initQuotes() {
    var text = $('#quote-text'), source = $('#quote-source');
    var next = $('#quote-next'), copy = $('#quote-copy');
    if (!text) return;
    function show(i) {
      lastQuote = i;
      text.classList.add('is-changing');
      if (source) source.classList.add('is-changing');
      setTimeout(function () {
        text.textContent = QUOTES[i][0];
        if (source) source.textContent = '— ' + QUOTES[i][1];
        text.classList.remove('is-changing');
        if (source) source.classList.remove('is-changing');
      }, reduced ? 0 : 200);
    }
    if (next) next.addEventListener('click', function () {
      var i = Math.floor(Math.random() * QUOTES.length);
      if (i === lastQuote) i = (i + 1) % QUOTES.length;
      show(i);
      NEFOR.sfx && NEFOR.sfx.play('click');
    });
    if (copy) copy.addEventListener('click', function () {
      copyText(text.textContent + ' — ' + (source ? source.textContent : '') + ' · подъезд №9');
    });
  }

  /* ─────────────────────────── НАДПИСИ ─────────────────────────── */
  var WALL_KEY = 'nefor9.wall.v1';
  var SEEDS = [
    { name: 'тут был', text: 'ВОВАН', color: 'acid', style: 'hand', x: 8, y: 12, rot: -6 },
    { name: 'любовь', text: 'КАТЯ + ЛЁША', color: 'milk', style: 'graff', x: 36, y: 9, rot: 3 },
    { name: 'снюс не решит', text: 'твои проблемы', color: 'sky', style: 'mono', x: 66, y: 14, rot: -3 },
    { name: 'я люблю тиму', text: '(он не читает)', color: 'pink', style: 'hand', x: 19, y: 35, rot: 4 },
    { name: '9 этаж', text: 'ЖДИТЕ', color: 'acid', style: 'graff', x: 52, y: 30, rot: -5 },
    { name: 'выход есть', text: 'ОН ЗА ТОБОЙ', color: 'ember', style: 'graff', x: 78, y: 38, rot: 6 },
    { name: 'вопрос', text: 'кто взял мою зажигалку — верни, прощу', color: 'milk', style: 'mono', x: 9, y: 60, rot: 2 },
    { name: 'тут тепло', text: 'если стоять вместе', color: 'sky', style: 'hand', x: 33, y: 57, rot: -4 },
    { name: 'не сдавайся', text: 'дурачок', color: 'acid', style: 'hand', x: 60, y: 62, rot: 5 },
    { name: '2009', text: 'НАВСЕГДА', color: 'pink', style: 'mono', x: 84, y: 68, rot: -2 },
    { name: 'балтика 9', text: 'И НИКТО НЕ УШЁЛ', color: 'ember', style: 'graff', x: 15, y: 82, rot: -3 },
    { name: 'Алла, 4 этаж', text: 'вы громкие, но я вас люблю', color: 'milk', style: 'mono', x: 46, y: 85, rot: 4 },
    { name: 'обними', text: 'кого-нибудь', color: 'acid', style: 'hand', x: 74, y: 84, rot: -6 }
  ];
  var wallMessages = [];
  function loadWall() {
    try {
      var raw = localStorage.getItem(WALL_KEY);
      if (raw) { wallMessages = JSON.parse(raw) || []; return; }
    } catch (e) {}
    wallMessages = SEEDS.map(function (s, i) {
      return { id: 'seed-' + i, seed: true, name: s.name, text: s.text, color: s.color, style: s.style, x: s.x, y: s.y, rot: s.rot };
    });
    saveWall();
  }
  function saveWall() {
    try { localStorage.setItem(WALL_KEY, JSON.stringify(wallMessages)); } catch (e) {}
  }
  var TAG_STYLES = ['hand', 'hand', 'mono', 'graff'];
  var TAG_COLORS = ['acid', 'milk', 'ember', 'sky', 'pink'];
  function renderWall() {
    var wall = $('#guest-wall');
    if (!wall) return;
    wall.innerHTML = '';
    if (!wallMessages.length) {
      var empty = document.createElement('p');
      empty.className = 'guest__empty';
      empty.textContent = 'стена чистая. пока что.';
      wall.appendChild(empty);
    }
    wallMessages.forEach(function (m) {
      var tag = document.createElement('div');
      tag.className = 'tag tag--' + (m.color || 'acid') + ' tag--' + (m.style || 'hand');
      tag.style.setProperty('--x', m.x + '%');
      tag.style.setProperty('--y', m.y + '%');
      tag.style.setProperty('--rot', (m.rot || 0) + 'deg');
      tag.setAttribute('data-id', m.id);
      var name = document.createElement('b');
      name.textContent = m.name || 'аноним';
      tag.appendChild(name);
      var txt = document.createElement('span');
      txt.textContent = m.text;
      tag.appendChild(txt);
      makeDraggable(tag, m);
      wall.appendChild(tag);
    });
    var count = $('#wall-count');
    if (count) count.textContent = String(wallMessages.filter(function (m) { return !m.seed; }).length);
  }
  function makeDraggable(tag, msg) {
    var drag = null;
    tag.addEventListener('pointerdown', function (e) {
      if (e.button !== undefined && e.button !== 0) return;
      var wall = $('#guest-wall');
      if (!wall) return;
      var wr = wall.getBoundingClientRect();
      var tr = tag.getBoundingClientRect();
      var cx = tr.left + tr.width / 2, cy = tr.top + tr.height / 2;
      drag = { offX: e.clientX - cx, offY: e.clientY - cy, wr: wr };
      tag.classList.add('is-dragging');
      try { tag.setPointerCapture(e.pointerId); } catch (err) {}
      e.preventDefault();
    });
    tag.addEventListener('pointermove', function (e) {
      if (!drag) return;
      var wr = drag.wr;
      var nx = e.clientX - drag.offX - wr.left;
      var ny = e.clientY - drag.offY - wr.top;
      nx = Math.max(16, Math.min(wr.width - 16, nx));
      ny = Math.max(16, Math.min(wr.height - 16, ny));
      tag.style.setProperty('--x', nx.toFixed(1) + 'px');
      tag.style.setProperty('--y', ny.toFixed(1) + 'px');
      tag.dataset.px = nx.toFixed(1); tag.dataset.py = ny.toFixed(1);
    });
    function end(e) {
      if (!drag) return;
      var wall = $('#guest-wall');
      var wr = drag.wr;
      if (tag.dataset.px && wall) {
        var x = parseFloat(tag.dataset.px), y = parseFloat(tag.dataset.py);
        msg.x = Math.round((x / wr.width) * 1000) / 10;
        msg.y = Math.round((y / wr.height) * 1000) / 10;
        tag.style.setProperty('--x', msg.x + '%');
        tag.style.setProperty('--y', msg.y + '%');
        saveWall();
      }
      tag.classList.remove('is-dragging');
      tag.dataset.px = ''; tag.dataset.py = '';
      drag = null;
      if (e && e.pointerId != null) { try { tag.releasePointerCapture(e.pointerId); } catch (err) {} }
    }
    tag.addEventListener('pointerup', end);
    tag.addEventListener('pointercancel', end);
  }
  function initGuestbook() {
    var form = $('#wall-form');
    if (!form) return;
    loadWall();
    renderWall();
    var clearBtn = $('#wall-clear');
    var clearArmed = false, clearTimer = 0;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = $('#wall-text'), nameInput = $('#wall-name');
      var text = (input ? input.value : '').trim();
      if (text.length < 2) {
        if (input) input.focus();
        NEFOR.toast('ПУСТО', 'напиши хотя бы два символа');
        return;
      }
      var colorEl = $('input[name="wall-color"]:checked');
      var color = colorEl ? colorEl.value : 'acid';
      var style = TAG_STYLES[Math.floor(Math.random() * TAG_STYLES.length)];
      var rot = Math.round((Math.random() * 14 - 7) * 10) / 10;
      var msg = {
        id: 'm-' + Date.now().toString(36) + Math.round(Math.random() * 999),
        name: (nameInput && nameInput.value.trim()) || 'аноним из 3 подъезда',
        text: text.slice(0, 90),
        color: color,
        style: style,
        x: Math.round((12 + Math.random() * 72) * 10) / 10,
        y: Math.round((12 + Math.random() * 72) * 10) / 10,
        rot: rot
      };
      wallMessages.push(msg);
      saveWall();
      renderWall();
      if (input) input.value = '';
      NEFOR.state.walls++;
      NEFOR.save();
      NEFOR.renderCounters();
      NEFOR.checkAch();
      NEFOR.sfx && NEFOR.sfx.play('wall');
      NEFOR.toast('НАПИСАНО', 'теперь это навсегда (пока не сотрёшь)');
      if (clearBtn) { clearArmed = false; clearBtn.textContent = 'СТЕРЕТЬ ВСЁ'; clearBtn.classList.remove('is-armed'); }
      var first = !NEFOR._wallHint;
      NEFOR._wallHint = true;
      if (first) setTimeout(function () { NEFOR.toast('МОЖНО ДВИГАТЬ', 'перетаскивай надписи, если мешают'); }, 1400);
    });
    if (clearBtn) clearBtn.addEventListener('click', function () {
      var mine = wallMessages.filter(function (m) { return !m.seed; }).length;
      if (!mine && clearArmed) { wallMessages = []; saveWall(); renderWall(); return; }
      if (!clearArmed) {
        clearArmed = true;
        clearBtn.textContent = 'ТОЧНО? ЖМИ ЕЩЁ';
        clearBtn.classList.add('is-armed');
        clearTimer = setTimeout(function () {
          clearArmed = false; clearBtn.textContent = 'СТЕРЕТЬ ВСЁ'; clearBtn.classList.remove('is-armed');
        }, 3000);
        NEFOR.sfx && NEFOR.sfx.play('click');
        return;
      }
      clearTimeout(clearTimer);
      clearArmed = false;
      clearBtn.textContent = 'СТЕРЕТЬ ВСЁ';
      clearBtn.classList.remove('is-armed');
      wallMessages = [];
      saveWall();
      renderWall();
      NEFOR.sfx && NEFOR.sfx.play('glitch');
      NEFOR.toast('СТЕНА ЧИСТАЯ', 'как будто нас тут и не было');
    });
  }

  /* ─────────────────────────── ПОДВАЛ ─────────────────────────── */
  function initBasement() {
    var form = $('#basement-form'), input = $('#basement-input'), msg = $('#basement-msg');
    var back = $('#basement-back');
    if (form) form.addEventListener('submit', function (e) {
      e.preventDefault();
      var text = (input ? input.value : '').trim();
      if (!text) { if (input) input.focus(); return; }
      if (input) input.value = '';
      if (msg) {
        msg.innerHTML = '';
        var span = document.createElement('span');
        span.className = 'basement__ghost';
        span.textContent = '«' + text.slice(0, 80) + '»';
        msg.appendChild(span);
        NEFOR.sfx && NEFOR.sfx.play('whoosh');
        setTimeout(function () { if (msg) msg.textContent = 'оно осталось.'; }, 2500);
        setTimeout(function () { if (msg) msg.textContent = ''; }, 7000);
      }
    });
    if (back) back.addEventListener('click', function () {
      var top = $('#floor-9');
      if (top) top.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    });
  }

  /* ─────────────────────────── СТАРТ ─────────────────────────── */
  function init() {
    initPhotos();
    initLightbox();
    initQuiz();
    initQuotes();
    initGuestbook();
    initBasement();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
