/* Ира Таскаева — лендинг. © 2026 Полунин Лев */
(function () {
  'use strict';
  var doc = document.documentElement;
  doc.classList.remove('no-js');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

  /* ---------- header on scroll ---------- */
  var top = document.getElementById('top');
  function onScroll() { top.classList.toggle('is-scrolled', window.pageYOffset > 30); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- burger ---------- */
  var burger = document.getElementById('burger');
  var nav = document.getElementById('nav');
  function setMenu(open) {
    nav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    document.body.classList.toggle('menu-open', open);
  }
  burger.addEventListener('click', function () { setMenu(!nav.classList.contains('is-open')); });
  nav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
  window.addEventListener('resize', function () { if (window.innerWidth > 900) setMenu(false); });

  /* ---------- hero spotlight follows pointer ---------- */
  var hero = document.getElementById('hero');
  if (hero && !reduce) {
    var raf = null, tx = 62, ty = 38;
    var fine = window.matchMedia('(pointer: fine)').matches;
    if (fine) {
      hero.addEventListener('pointermove', function (e) {
        var r = hero.getBoundingClientRect();
        tx = (e.clientX - r.left) / r.width * 100;
        ty = (e.clientY - r.top) / r.height * 100;
        if (!raf) raf = requestAnimationFrame(function () {
          hero.style.setProperty('--x', tx + '%');
          hero.style.setProperty('--y', ty + '%');
          raf = null;
        });
      });
    } else {
      /* на телефонах луч софита медленно гуляет сам */
      var t0 = performance.now();
      (function wander(now) {
        var t = (now - t0) / 1000;
        hero.style.setProperty('--x', (50 + Math.sin(t * 0.5) * 28) + '%');
        hero.style.setProperty('--y', (30 + Math.cos(t * 0.4) * 14) + '%');
        if (hero.getBoundingClientRect().bottom > 0) requestAnimationFrame(wander);
        else setTimeout(function () { requestAnimationFrame(wander); }, 600);
      })(t0);
    }
  }

  /* ---------- reveal ---------- */
  var reveals = document.querySelectorAll('[data-reveal]');
  if (hasIO && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el, i) {
      el.style.transitionDelay = (i % 3) * 0.08 + 's';
      io.observe(el);
    });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- manifesto: words light up on scroll ---------- */
  var mt = document.getElementById('manifestTxt');
  if (mt) {
    var html = mt.innerHTML.replace(/&nbsp;/g, ' ');
    var words = html.split(/ (?![^<]*>)/);
    mt.innerHTML = words.map(function (w) { return '<span class="w">' + w + '</span>'; }).join(' ');
    var ws = mt.querySelectorAll('.w');
    if (reduce) { ws.forEach(function (w) { w.classList.add('on'); }); }
    else {
      var ticking = false;
      var paint = function () {
        var r = mt.getBoundingClientRect();
        var vh = window.innerHeight;
        var p = (vh * 0.85 - r.top) / (r.height + vh * 0.35);
        p = Math.max(0, Math.min(1, p));
        var n = Math.round(p * ws.length);
        for (var i = 0; i < ws.length; i++) ws[i].classList.toggle('on', i < n);
        ticking = false;
      };
      window.addEventListener('scroll', function () {
        if (!ticking) { ticking = true; requestAnimationFrame(paint); }
      }, { passive: true });
      paint();
    }
  }

  /* ---------- lazy videos: load & play only when visible ---------- */
  var vids = document.querySelectorAll('video.lazy-video');
  function loadVideo(v) {
    if (v.dataset.loaded) return;
    v.querySelectorAll('source[data-src]').forEach(function (s) { s.src = s.dataset.src; });
    v.load();
    v.dataset.loaded = '1';
  }
  function play(v) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
  if (hasIO) {
    var vio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var v = en.target;
        if (en.isIntersecting) { loadVideo(v); if (!reduce) play(v); }
        else if (!v.paused) v.pause();
      });
    }, { rootMargin: '200px 0px', threshold: 0.01 });
    vids.forEach(function (v) { v.muted = true; vio.observe(v); });
  } else {
    vids.forEach(function (v) { loadVideo(v); });
  }

  /* ---------- reviews slider ---------- */
  var track = document.getElementById('track');
  var dotsBox = document.getElementById('dots');
  if (track) {
    var slides = track.children;
    var dots = [];
    for (var i = 0; i < slides.length; i++) {
      (function (idx) {
        var b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('role', 'tab');
        b.setAttribute('aria-label', 'Отзыв ' + (idx + 1));
        b.addEventListener('click', function () { goTo(idx); });
        dotsBox.appendChild(b);
        dots.push(b);
      })(i);
    }
    function step() { return slides.length > 1 ? slides[1].offsetLeft - slides[0].offsetLeft : track.clientWidth; }
    function current() { return Math.round(track.scrollLeft / step()); }
    function goTo(idx) {
      idx = Math.max(0, Math.min(slides.length - 1, idx));
      track.scrollTo({ left: idx * step(), behavior: reduce ? 'auto' : 'smooth' });
    }
    function sync() {
      var atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
      var c = atEnd ? slides.length - 1 : current();
      dots.forEach(function (d, k) { d.setAttribute('aria-selected', k === c ? 'true' : 'false'); });
    }
    document.querySelectorAll('.sbtn').forEach(function (b) {
      b.addEventListener('click', function () {
        var dir = +b.dataset.dir;
        var atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
        if (dir > 0 && atEnd) goTo(0);
        else if (dir < 0 && track.scrollLeft <= 4) goTo(slides.length - 1);
        else goTo(current() + dir);
      });
    });
    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); goTo(current() + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(current() - 1); }
    });
    var st;
    track.addEventListener('scroll', function () { clearTimeout(st); st = setTimeout(sync, 60); }, { passive: true });
    window.addEventListener('resize', sync);
    sync();
  }
})();
