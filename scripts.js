/* ===== LUMINARCH — SHARED SCRIPTS ===== */

(function () {
  'use strict';

  /* ---------- BRANDED LOADER ---------- */
  var loader = document.getElementById('pageLoader');
  var LOADER_MIN = 1200; // minimum splash display (ms)
  var loadStart = Date.now();

  function dismissLoader() {
    var elapsed = Date.now() - loadStart;
    var remaining = Math.max(0, LOADER_MIN - elapsed);
    setTimeout(function () {
      if (loader) loader.classList.add('done');
      // After fade completes, trigger hero sequence
      setTimeout(triggerHeroAnimation, 700);
    }, remaining);
  }

  // Wait for ALL assets (images, fonts, SVGs) before revealing
  if (document.readyState === 'complete') {
    dismissLoader();
  } else {
    window.addEventListener('load', dismissLoader);
  }

  /* ---------- HERO ENTRANCE SEQUENCE ---------- */
  function triggerHeroAnimation() {
    // Logo entrance — dramatic scale + glow
    var logoImg = document.querySelector('.hero__logo-img');
    if (logoImg) {
      logoImg.classList.add('logo-visible');
    }

    // Stagger text lines after logo
    var heroLines = document.querySelectorAll('.hero .reveal-line');
    var heroReveals = document.querySelectorAll('.hero .reveal');
    heroLines.forEach(function (l, i) {
      setTimeout(function () { l.classList.add('visible'); }, 400 + i * 150);
    });
    heroReveals.forEach(function (l, i) {
      setTimeout(function () { l.classList.add('visible'); }, 800 + i * 200);
    });
  }

  /* ---------- DOM READY ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    var nav = document.getElementById('nav');
    var heroLogo = document.getElementById('heroLogo');

    /* Nav scroll + hero logo collapse */
    window.addEventListener('scroll', function () {
      var y = window.scrollY;
      if (nav) nav.classList.toggle('scrolled', y > 50);
      if (heroLogo) {
        if (y > 150) heroLogo.classList.add('collapsed');
        else heroLogo.classList.remove('collapsed');
      }
    }, { passive: true });

    /* Mobile menu */
    var toggle = document.getElementById('navToggle');
    var menu = document.getElementById('mobileMenu');
    if (toggle && menu) {
      toggle.addEventListener('click', function () {
        toggle.classList.toggle('open');
        menu.classList.toggle('open');
        document.body.style.overflow = menu.classList.contains('open') ? 'hidden' : '';
      });
      menu.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', function () {
          toggle.classList.remove('open');
          menu.classList.remove('open');
          document.body.style.overflow = '';
        });
      });
    }

    /* Reveal on scroll */
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.reveal,.reveal-line').forEach(function (el) { obs.observe(el); });

    /* ---------- CUSTOM CURSOR ---------- */
    var dot = document.querySelector('.cursor-dot');
    if (dot && window.matchMedia('(pointer:fine)').matches) {
      var mx = 0, my = 0, dx = 0, dy = 0;
      document.addEventListener('mousemove', function (e) { mx = e.clientX; my = e.clientY; });
      (function animate() {
        dx += (mx - dx) * 0.2;
        dy += (my - dy) * 0.2;
        dot.style.left = dx + 'px';
        dot.style.top = dy + 'px';
        requestAnimationFrame(animate);
      })();
      document.querySelectorAll('a,button,.btn,.project-item,.project-full,input,textarea,select').forEach(function (el) {
        el.addEventListener('mouseenter', function () { dot.classList.add('hovering'); });
        el.addEventListener('mouseleave', function () { dot.classList.remove('hovering'); });
      });
    } else if (dot) {
      dot.style.display = 'none';
    }

    /* ---------- MAGNETIC CURSOR ON BUTTONS ---------- */
    if (window.matchMedia('(pointer:fine)').matches) {
      document.querySelectorAll('.magnetic').forEach(function (el) {
        el.addEventListener('mousemove', function (e) {
          var rect = el.getBoundingClientRect();
          var cx = rect.left + rect.width / 2;
          var cy = rect.top + rect.height / 2;
          var ddx = (e.clientX - cx) * 0.25;
          var ddy = (e.clientY - cy) * 0.25;
          el.style.transform = 'translate(' + ddx + 'px,' + ddy + 'px)';
        });
        el.addEventListener('mouseleave', function () {
          el.style.transform = '';
        });
      });
    }

    /* ---------- 3D TILT CARDS ---------- */
    if (window.matchMedia('(pointer:fine)').matches) {
      document.querySelectorAll('.tilt-card').forEach(function (card) {
        card.addEventListener('mousemove', function (e) {
          var rect = card.getBoundingClientRect();
          var x = (e.clientX - rect.left) / rect.width;
          var y = (e.clientY - rect.top) / rect.height;
          var rotateY = (x - 0.5) * 8;
          var rotateX = (0.5 - y) * 6;
          card.style.transform = 'perspective(800px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg)';
        });
        card.addEventListener('mouseleave', function () {
          card.style.transform = '';
        });
      });
    }

    /* ---------- STATS COUNTER ---------- */
    function animateCounter(el, target, dur) {
      var start = performance.now();
      function update(now) {
        var p = Math.min((now - start) / dur, 1);
        el.textContent = Math.floor((1 - Math.pow(1 - p, 3)) * target) + (el.dataset.suffix || '');
        if (p < 1) requestAnimationFrame(update);
      }
      requestAnimationFrame(update);
    }
    var statsObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          animateCounter(e.target, parseInt(e.target.dataset.target), 1800);
          statsObs.unobserve(e.target);
        }
      });
    }, { threshold: 0.5 });
    document.querySelectorAll('.stat__number[data-target]').forEach(function (el) { statsObs.observe(el); });

    /* ---------- PORTFOLIO FILTER (work page) ---------- */
    var filterBtns = document.querySelectorAll('.filter-btn');
    if (filterBtns.length) {
      filterBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          filterBtns.forEach(function (b) { b.classList.remove('active'); });
          btn.classList.add('active');
          var filter = btn.dataset.filter;
          document.querySelectorAll('.project-item[data-category]').forEach(function (item) {
            item.style.display = (filter === 'all' || item.dataset.category.includes(filter)) ? '' : 'none';
          });
        });
      });
    }

    /* ---------- CONTACT FORM ---------- */
    var contactForm = document.getElementById('contactForm');
    if (contactForm) {
      contactForm.addEventListener('submit', function (e) {
        e.preventDefault();
        contactForm.innerHTML = '<div class="reveal visible" style="text-align:center;padding:60px 0"><h2 class="h2" style="margin-bottom:16px">Message <em class="italic accent-text">sent</em></h2><p class="body-lg" style="color:var(--gray-light)">We\'ll get back to you within 24 hours.</p></div>';
      });
    }

    /* ---------- PARALLAX GRID LINES ---------- */
    var gridLines = document.querySelector('.hero__grid-lines');
    if (gridLines) {
      window.addEventListener('scroll', function () {
        gridLines.style.transform = 'translateY(' + (window.scrollY * 0.1) + 'px)';
      }, { passive: true });
    }

    /* ---------- GOLD PARTICLE BACKGROUND ---------- */
    var canvas = document.getElementById('particles');
    if (canvas) {
      var ctx = canvas.getContext('2d');
      var particles = [];
      var PARTICLE_COUNT = 55;

      function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
      resize();
      window.addEventListener('resize', resize);

      for (var i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          r: Math.random() * 2 + 0.8,
          dx: (Math.random() - 0.5) * 0.4,
          dy: (Math.random() - 0.5) * 0.25 - 0.05,
          opacity: Math.random() * 0.35 + 0.1
        });
      }

      function drawParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (var i = 0; i < particles.length; i++) {
          var p = particles[i];
          p.x += p.dx;
          p.y += p.dy;
          if (p.x < -10) p.x = canvas.width + 10;
          if (p.x > canvas.width + 10) p.x = -10;
          if (p.y < -10) p.y = canvas.height + 10;
          if (p.y > canvas.height + 10) p.y = -10;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, 6.283);
          ctx.fillStyle = 'rgba(212,175,55,' + p.opacity + ')';
          ctx.fill();
        }
        requestAnimationFrame(drawParticles);
      }
      drawParticles();
    }
  }); // end DOMContentLoaded
})();

/* Addon toggle (services page) */
function toggleAddon(id) {
  var el = document.getElementById(id);
  if (el) el.classList.toggle('open');
}
