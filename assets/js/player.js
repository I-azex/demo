/* ═══════════════════════════════════════════════════════════════
   ПОДЪЕЗД №9 — магнитофон: три трека, анализатор, кассета
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var NEFOR = window.NEFOR;
  if (!NEFOR) return;
  var $ = NEFOR.$;

  var TRACKS = [
    { file: 'assets/audio/andy-warhol.mp3', title: 'ANDY WARHOL', artist: 'KAI ANGEL', dur: '2:56', label: 'ПЛЁНКА · 01' },
    { file: 'assets/audio/dinastiya.mp3', title: 'ДИНАСТИЯ', artist: 'VILLIAN × MADK1D', dur: '2:30', label: 'ПЛЁНКА · 02' },
    { file: 'assets/audio/paris-love.mp3', title: 'PARISLOVE', artist: 'FORTUNA812', dur: '1:51', label: 'ПЛЁНКА · 03' }
  ];

  var audio = null, actx = null, analyser = null, source = null, freq = null, raf = 0;
  var current = 0, playing = false, userVolume = 0.82, deck = null, viz = null, vctx = null, vw = 0, vh = 0;
  var timeEl, durEl, seekEl, playBtn, prevBtn, nextBtn, trackListEl, titleEl, artistEl, volEl;
  var kLine = null, kPrev = null, kNext = null, kProgress = null, kStatus = null;
  var karaokeLines = [], karaokeIdx = -1;

  function fmt(sec) {
    if (!isFinite(sec) || sec < 0) return '0:00';
    var m = Math.floor(sec / 60), s = Math.floor(sec % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function setupAudioContext() {
    if (actx) { if (actx.state === 'suspended') actx.resume(); return; }
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      actx = new AC();
      source = actx.createMediaElementSource(audio);
      analyser = actx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.82;
      freq = new Uint8Array(analyser.frequencyBinCount);
      source.connect(analyser);
      analyser.connect(actx.destination);
    } catch (e) { actx = null; analyser = null; }
  }

  function drawIdle() {
    if (!vctx) return;
    vctx.clearRect(0, 0, vw, vh);
    var y = vh / 2;
    vctx.strokeStyle = 'rgba(198,255,46,.14)';
    vctx.lineWidth = 1;
    vctx.beginPath(); vctx.moveTo(0, y); vctx.lineTo(vw, y); vctx.stroke();
    /* редкие шумы, чтобы экран не был мёртвым */
    vctx.fillStyle = 'rgba(198,255,46,.2)';
    for (var i = 0; i < 26; i++) {
      var x = (i / 26) * vw + Math.random() * 6;
      var h = Math.random() * 3;
      vctx.fillRect(x, y - h, 2, h * 2);
    }
  }

  function drawViz() {
    raf = 0;
    if (!vctx) return;
    vctx.clearRect(0, 0, vw, vh);
    if (!analyser) { drawIdle(); karaokeTick(audio.currentTime); return; }
    analyser.getByteFrequencyData(freq);
    var bars = 56, gap = 2, bw = (vw - gap * (bars - 1)) / bars, mid = vh / 2;
    for (var i = 0; i < bars; i++) {
      var idx = Math.floor((i / bars) * (freq.length * 0.62)) + 2;
      var v = freq[idx] / 255;
      var h = Math.max(2, v * (vh * 0.46));
      var x = i * (bw + gap);
      var alpha = 0.25 + v * 0.75;
      vctx.fillStyle = 'rgba(198,255,46,' + alpha.toFixed(2) + ')';
      vctx.fillRect(x, mid - h, bw, h);
      vctx.fillStyle = 'rgba(198,255,46,' + (alpha * 0.32).toFixed(2) + ')';
      vctx.fillRect(x, mid, bw, h * 0.5);
    }
    /* волна поверх */
    analyser.getByteTimeDomainData(freq);
    vctx.strokeStyle = 'rgba(255,74,28,.6)';
    vctx.lineWidth = 1.4;
    vctx.beginPath();
    for (var j = 0; j < freq.length; j += 2) {
      var px = (j / freq.length) * vw;
      var py = mid + ((freq[j] - 128) / 128) * (vh * 0.42);
      if (j === 0) vctx.moveTo(px, py); else vctx.lineTo(px, py);
    }
    vctx.stroke();
    karaokeTick(audio.currentTime);
    if (playing) raf = requestAnimationFrame(drawViz);
  }

  /* ─────────────────────────── КАРАОКЕ ─────────────────────────── */
  function lyricsFor(track) {
    var all = window.NEFOR_LYRICS || {};
    return all[track.title] || null;
  }
  function setKaraoke(track) {
    karaokeLines = lyricsFor(track) || [];
    karaokeIdx = -2;
    if (!kLine) return;
    if (kStatus) kStatus.textContent = karaokeLines.length ? 'фрагменты · живой тайминг' : 'без текста';
    if (!karaokeLines.length) {
      kLine.textContent = 'текста нет. слушай сердцем';
      kLine.style.setProperty('--p', '0%');
      if (kPrev) kPrev.textContent = '';
      if (kNext) kNext.textContent = '';
      if (kProgress) kProgress.style.width = '0%';
      return;
    }
    kLine.textContent = '…';
    if (kPrev) kPrev.textContent = '';
    if (kNext) kNext.textContent = karaokeLines[0].text;
    karaokeTick(audio.currentTime || 0);
  }
  function renderKaraokeLine(idx) {
    var cur = idx >= 0 ? karaokeLines[idx] : null;
    var prev = idx > 0 ? karaokeLines[idx - 1] : null;
    var next = idx >= 0 ? karaokeLines[idx + 1] : (karaokeLines[0] || null);
    if (cur) {
      kLine.textContent = cur.text;
      kLine.classList.remove('is-bump');
      void kLine.offsetWidth;
      kLine.classList.add('is-bump');
    } else {
      kLine.textContent = '…';
    }
    if (kPrev) kPrev.textContent = prev ? prev.text : '';
    if (kNext) kNext.textContent = next ? next.text : '';
  }
  function karaokeTick(time) {
    if (!karaokeLines.length || !kLine) return;
    time = time || 0;
    var idx = -1;
    for (var i = karaokeLines.length - 1; i >= 0; i--) { if (time >= karaokeLines[i].t) { idx = i; break; } }
    if (idx !== karaokeIdx) { karaokeIdx = idx; renderKaraokeLine(idx); }
    var cur = idx >= 0 ? karaokeLines[idx] : null;
    var next = karaokeLines[idx + 1];
    var p = 0;
    if (cur) {
      var start = cur.t;
      var end = next ? next.t : (isFinite(audio.duration) ? audio.duration : start + 7);
      p = Math.max(0, Math.min(1, (time - start) / Math.max(0.5, end - start)));
    }
    var pct = (p * 100).toFixed(1) + '%';
    kLine.style.setProperty('--p', pct);
    if (kProgress) kProgress.style.width = pct;
  }

  function resizeViz() {
    if (!viz) return;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var rect = viz.getBoundingClientRect();
    vw = Math.max(200, rect.width); vh = Math.max(40, rect.height);
    // на случай, если контейнер скрыт
    if (!rect.width) { vw = 900; vh = 100; }
    viz.width = Math.floor(vw * dpr);
    viz.height = Math.floor(vh * dpr);
    if (vctx) vctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function renderTracks() {
    if (!trackListEl) return;
    trackListEl.innerHTML = '';
    TRACKS.forEach(function (t, i) {
      var li = document.createElement('li');
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'track' + (i === current ? ' is-active' : '');
      btn.setAttribute('data-track', String(i));
      btn.setAttribute('aria-label', 'Включить трек ' + t.title);
      btn.innerHTML = '<span class="track__body"><span class="track__title"></span><span class="track__artist"></span></span><span class="track__dur">--:--</span>';
      $('.track__title', btn).textContent = t.title;
      $('.track__artist', btn).textContent = t.artist;
      $('.track__dur', btn).textContent = t.dur;
      btn.addEventListener('click', function () {
        if (i === current && playing) { pause(); return; }
        setTrack(i, true);
      });
      li.appendChild(btn);
      trackListEl.appendChild(li);
    });
  }

  function setTrack(i, autoplay) {
    current = (i + TRACKS.length) % TRACKS.length;
    var t = TRACKS[current];
    audio.src = t.file;
    if (titleEl) titleEl.textContent = t.title;
    if (artistEl) artistEl.textContent = t.artist;
    setKaraoke(t);
    NEFOR.$$('.track').forEach(function (el) {
      el.classList.toggle('is-active', el.getAttribute('data-track') === String(current));
    });
    if (durEl) durEl.textContent = '0:00';
    if (timeEl) timeEl.textContent = '0:00';
    if (seekEl) { seekEl.value = 0; seekEl.style.setProperty('--fill', '0%'); }
    if (autoplay) play();
  }

  function play() {
    setupAudioContext();
    var p = audio.play();
    if (p && p.catch) p.catch(function () {
      NEFOR.toast('НЕ ИГРАЕТ', 'нажми ещё раз — браузер боится звука', 'bad');
    });
    playing = true;
    if (deck) deck.classList.add('is-playing');
    if (playBtn) { playBtn.setAttribute('aria-pressed', 'true'); playBtn.setAttribute('aria-label', 'Пауза'); }
    var t = TRACKS[current];
    var st = NEFOR.state;
    if (st && st.tracks.indexOf(t.title) === -1) {
      st.tracks.push(t.title); NEFOR.save(); NEFOR.checkAch();
    }
    if (!raf) raf = requestAnimationFrame(drawViz);
  }

  function pause() {
    audio.pause();
    playing = false;
    if (deck) deck.classList.remove('is-playing');
    if (playBtn) { playBtn.setAttribute('aria-pressed', 'false'); playBtn.setAttribute('aria-label', 'Играть'); }
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
    drawIdle();
  }

  function toggle() {
    if (playing) pause(); else play();
    NEFOR.sfx && NEFOR.sfx.play('click');
  }

  function init() {
    audio = new Audio();
    audio.preload = 'none';
    audio.volume = userVolume;
    deck = $('#deck');
    viz = $('#viz');
    playBtn = $('#play-btn');
    prevBtn = $('#prev-btn');
    nextBtn = $('#next-btn');
    timeEl = $('#t-cur');
    durEl = $('#t-dur');
    seekEl = $('#seek');
    trackListEl = $('#track-list');
    titleEl = $('#deck-title');
    artistEl = $('#deck-artist');
    volEl = $('#vol');
    kLine = $('#karaoke-line');
    kPrev = $('#karaoke-prev');
    kNext = $('#karaoke-next');
    kProgress = $('#karaoke-progress');
    kStatus = $('#karaoke-status');
    if (!deck || !viz) return;
    vctx = viz.getContext('2d');
    resizeViz();
    window.addEventListener('resize', function () { resizeViz(); if (!playing) drawIdle(); });

    if (volEl) {
      volEl.addEventListener('input', function () {
        userVolume = parseInt(volEl.value, 10) / 100;
        audio.volume = userVolume;
        volEl.style.setProperty('--fill', volEl.value + '%');
      });
      volEl.style.setProperty('--fill', volEl.value + '%');
    }

    if (playBtn) playBtn.addEventListener('click', toggle);
    if (prevBtn) prevBtn.addEventListener('click', function () { setTrack(current - 1, true); });
    if (nextBtn) nextBtn.addEventListener('click', function () { setTrack(current + 1, true); });

    audio.addEventListener('loadedmetadata', function () {
      if (durEl && isFinite(audio.duration)) durEl.textContent = fmt(audio.duration);
    });
    audio.addEventListener('timeupdate', function () {
      if (timeEl) timeEl.textContent = fmt(audio.currentTime);
      if (seekEl && isFinite(audio.duration) && audio.duration > 0) {
        var p = (audio.currentTime / audio.duration) * 100;
        seekEl.value = Math.round(p * 10);
        seekEl.style.setProperty('--fill', p.toFixed(1) + '%');
      }
      karaokeTick(audio.currentTime);
    });
    audio.addEventListener('ended', function () {
      setTrack(current + 1, true);
    });
    audio.addEventListener('pause', function () {
      playing = false;
      if (deck) deck.classList.remove('is-playing');
      if (playBtn) { playBtn.setAttribute('aria-pressed', 'false'); playBtn.setAttribute('aria-label', 'Играть'); }
    });
    audio.addEventListener('play', function () {
      playing = true;
      if (deck) deck.classList.add('is-playing');
      if (playBtn) { playBtn.setAttribute('aria-pressed', 'true'); playBtn.setAttribute('aria-label', 'Пауза'); }
      if (!raf) raf = requestAnimationFrame(drawViz);
    });

    if (seekEl) {
      seekEl.addEventListener('input', function () {
        if (isFinite(audio.duration) && audio.duration > 0) {
          audio.currentTime = (parseInt(seekEl.value, 10) / 1000) * audio.duration;
        }
      });
      seekEl.style.setProperty('--fill', '0%');
    }

    renderTracks();
    setTrack(0, false);
    drawIdle();
    NEFOR.audio = audio;
    NEFOR.player = { play: play, pause: pause, setTrack: setTrack, getTrack: function () { return TRACKS[current]; } };
    NEFOR.karaoke = {
      tick: function () { karaokeTick(audio.currentTime); },
      lines: function () { return karaokeLines; },
      idx: function () { return karaokeIdx; }
    };

    /* автопауза, если вкладка спрятана */
    document.addEventListener('visibilitychange', function () {
      if (document.hidden && playing) pause();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
