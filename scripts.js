/* ===== LUMINARCH — SHARED SCRIPTS ===== */

(function () {
  'use strict';

  /* ---------- SESSION-AWARE LOADER ---------- */
  var loader = document.getElementById('pageLoader');
  var pageFade = document.querySelector('.page-fade');
  var isFirstVisit = !sessionStorage.getItem('la_visited');
  var LOADER_MIN = 1400; // Ensure loader stays at least ~1s after logo animation starts
  var loadStart = Date.now();
  var dismissed = false;

  // Mark session as visited
  sessionStorage.setItem('la_visited', '1');

  // Guard against double-dismiss
  function safeDismiss(fn) {
    if (dismissed) return;
    dismissed = true;
    fn();
  }

  if (isFirstVisit && loader) {
    // First visit: show full branded loader
    var doLoader = function () {
      safeDismiss(function () {
        var elapsed = Date.now() - loadStart;
        var remaining = Math.max(0, LOADER_MIN - elapsed);
        setTimeout(function () {
          loader.classList.add('done');
          // ALSO dismiss the page-fade sitting behind the loader
          if (pageFade) pageFade.classList.add('done');
          setTimeout(triggerHeroAnimation, 700);
        }, remaining);
      });
    };
    if (document.readyState === 'complete') doLoader();
    else {
      window.addEventListener('load', doLoader);
      // Failsafe: dismiss after max 4s even if load never fires
      setTimeout(doLoader, 4000);
    }
  } else {
    // Return visit (internal navigation): skip branded loader, quick fade
    if (loader) loader.classList.add('skip');

    var doFade = function () {
      safeDismiss(function () {
        if (pageFade) {
          pageFade.classList.add('done');
          setTimeout(triggerHeroAnimation, 300);
        } else {
          triggerHeroAnimation();
        }
      });
    };

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      setTimeout(doFade, 60);
    } else {
      document.addEventListener('DOMContentLoaded', function () { setTimeout(doFade, 60); });
    }
    window.addEventListener('load', function () { setTimeout(doFade, 60); });
    window.addEventListener('pageshow', function (e) { if (e.persisted) setTimeout(doFade, 60); });
    setTimeout(doFade, 2000);
  }

  /* ---------- HERO ENTRANCE SEQUENCE ---------- */
  function triggerHeroAnimation() {
    var logoImg = document.querySelector('.hero__logo-img');
    if (logoImg) logoImg.classList.add('logo-visible');

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

    /* ---------- SCROLL PROGRESS BAR ---------- */
    var progressBar = document.querySelector('.scroll-progress');
    function updateProgress() {
      if (!progressBar) return;
      var scrollTop = window.scrollY;
      var docHeight = document.documentElement.scrollHeight - window.innerHeight;
      var pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      progressBar.style.width = pct + '%';
    }

    /* ---------- BACK TO TOP BUTTON ---------- */
    var backBtn = document.querySelector('.back-to-top');

    /* Unified scroll handler (performant — single listener) */
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (!ticking) {
        requestAnimationFrame(function () {
          var y = window.scrollY;

          // Nav
          if (nav) nav.classList.toggle('scrolled', y > 50);

          // Hero logo — smooth parallax shrink (not binary snap)
          if (heroLogo) {
            var r = Math.min(1, Math.max(0, y / 300));
            heroLogo.style.opacity = 1 - r;
            heroLogo.style.transform = 'translateY(' + (-r * 50) + 'px) scale(' + (1 - r * 0.2) + ')';
            heroLogo.style.pointerEvents = r > 0.8 ? 'none' : '';
          }

          // Scroll progress
          updateProgress();

          // Back to top visibility
          if (backBtn) backBtn.classList.toggle('visible', y > 600);

          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });

    // Back to top click
    if (backBtn) {
      backBtn.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

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
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    document.querySelectorAll('.reveal,.reveal-line').forEach(function (el) { obs.observe(el); });

    /* ---------- SVG / SPECIAL ELEMENT ANIMATIONS ---------- */
    var specialObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          specialObs.unobserve(e.target);
        }
      });
    }, { threshold: 0.3, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.process-connector,.svg-divider').forEach(function (el) { specialObs.observe(el); });

    /* ---------- HORIZONTAL SCROLL SHOWCASE ---------- */
    (function initHScroll() {
      var wrap = document.getElementById('hscrollWrap');
      var track = document.getElementById('hscrollTrack');
      if (!wrap || !track) return;
      if (window.matchMedia('(max-width:768px)').matches) return;

      var slides = track.children.length;
      // Each slide gets 100vh of scroll space
      wrap.style.height = (slides * 100) + 'vh';

      var barFill = document.getElementById('hscrollBarFill');
      var counterEl = document.getElementById('hscrollCurrent');
      var prevBtn = document.getElementById('hscrollPrev');
      var nextBtn = document.getElementById('hscrollNext');
      var currentSlide = 0;

      function updateUI(progress) {
        var maxTx = track.scrollWidth - window.innerWidth;
        track.style.transform = 'translateX(' + (-progress * maxTx) + 'px)';
        if (barFill) barFill.style.width = (progress * 100) + '%';

        var idx = Math.min(slides, Math.floor(progress * slides + 0.5) + 1);
        if (idx < 1) idx = 1;
        currentSlide = idx - 1;
        if (counterEl) counterEl.textContent = idx < 10 ? '0' + idx : '' + idx;

        // Arrow disabled states
        if (prevBtn) prevBtn.disabled = (currentSlide <= 0);
        if (nextBtn) nextBtn.disabled = (currentSlide >= slides - 1);
      }

      // Direct scroll listener (no RAF wrapper — transform is cheap)
      function onScroll() {
        var rect = wrap.getBoundingClientRect();
        var scrollInWrap = -rect.top;
        var maxScroll = wrap.offsetHeight - window.innerHeight;
        if (maxScroll <= 0) return;
        var progress = Math.max(0, Math.min(1, scrollInWrap / maxScroll));
        updateUI(progress);
      }
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();

      // Arrow navigation — scroll to target slide
      function goToSlide(idx) {
        idx = Math.max(0, Math.min(slides - 1, idx));
        var wrapTop = wrap.getBoundingClientRect().top + window.scrollY;
        var maxScroll = wrap.offsetHeight - window.innerHeight;
        var targetScroll = wrapTop + (idx / (slides - 1)) * maxScroll;
        window.scrollTo({ top: targetScroll, behavior: 'smooth' });
      }

      if (prevBtn) prevBtn.addEventListener('click', function () {
        goToSlide(currentSlide - 1);
      });
      if (nextBtn) nextBtn.addEventListener('click', function () {
        goToSlide(currentSlide + 1);
      });

      // Keyboard: left/right arrows when section is in view
      document.addEventListener('keydown', function (e) {
        var rect = wrap.getBoundingClientRect();
        if (rect.top > window.innerHeight || rect.bottom < 0) return;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          goToSlide(currentSlide + 1);
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          goToSlide(currentSlide - 1);
        }
      });
    })();

    /* ---------- ROCKET ARC FLIGHT + FIREWORKS (Canvas-based) ---------- */
    (function initRocketArc() {
      var isMobile = window.matchMedia('(max-width:768px)').matches;
      var arc = document.getElementById(isMobile ? 'rocketArcMobile' : 'rocketArc');
      if (!arc) return;

      var pathEl = arc.querySelector('.rocket-arc__path');
      var ship = arc.querySelector('.rocket-arc__ship');
      var container = arc;

      function quadBezier(t, p0, p1, p2) {
        var mt = 1 - t;
        return {
          x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
          y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y
        };
      }

      function quadBezierAngle(t, p0, p1, p2) {
        var mt = 1 - t;
        return Math.atan2(
          2 * mt * (p1.y - p0.y) + 2 * t * (p2.y - p1.y),
          2 * mt * (p1.x - p0.x) + 2 * t * (p2.x - p1.x)
        );
      }

      function buildArcPath() {
        var w = container.offsetWidth;
        var h = container.offsetHeight;
        if (!w || !h) return null;

        var p0 = { x: w * 0.05, y: h * 0.9 };
        var p1 = { x: w * 0.35, y: h * -0.9 };
        var p2 = { x: w * 0.62, y: h * -0.05 };

        var svg = arc.querySelector('.rocket-arc__svg');
        svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);

        var d = 'M ' + p0.x + ' ' + p0.y + ' Q ' + p1.x + ' ' + p1.y + ' ' + p2.x + ' ' + p2.y;
        pathEl.setAttribute('d', d);

        var len = pathEl.getTotalLength();
        pathEl.style.strokeDasharray = len;
        pathEl.style.strokeDashoffset = len;

        return { p0: p0, p1: p1, p2: p2, len: len, w: w, h: h };
      }

      function runAnimation(pts) {
        // Canvas at 1x DPR — particles are small, retina not needed
        // This is the #1 perf optimization (4x fewer pixels to clear)
        var padTop = 200;
        var padBot = 200;
        var cw = container.offsetWidth;
        var ch = container.offsetHeight + padTop + padBot;

        var cvs = document.createElement('canvas');
        cvs.width = cw;
        cvs.height = ch;
        cvs.style.cssText = 'position:absolute;left:0;top:-' + padTop + 'px;width:' + cw + 'px;height:' + ch + 'px;pointer-events:none;z-index:10;';
        container.appendChild(cvs);
        var ctx = cvs.getContext('2d');

        var DURATION = 2200;
        var startTime = null;
        var exploded = false;
        var expPt = null;
        var lastOrbit = 0;
        var lastPuff = 0;

        var orbits = [];
        var puffs = [];
        var bursts = [];
        var rains = [];
        var ringR1 = 0, ringR2 = 0, ringLife1 = 0, ringLife2 = 0;
        var flashLife = 0;
        var GOLD = ['#F5D060', '#F5A623', '#D4AF37', '#FFF4D2'];

        ship.classList.add('flying');
        pathEl.classList.add('drawing');

        function step(ts) {
          if (!startTime) startTime = ts;
          var elapsed = ts - startTime;
          var t = Math.min(elapsed / DURATION, 1);
          var eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

          var pos = quadBezier(eased, pts.p0, pts.p1, pts.p2);
          var angle = quadBezierAngle(eased, pts.p0, pts.p1, pts.p2);

          if (!exploded) {
            ship.style.left = (pos.x - 36) + 'px';
            ship.style.top = (pos.y - 36) + 'px';
            ship.style.transform = 'rotate(' + (angle + Math.PI / 2) + 'rad)';
            pathEl.style.strokeDashoffset = pts.len * (1 - eased);
          }

          var cx = pos.x;
          var cy = pos.y + padTop;

          // Spawn orbits
          if (!exploded && elapsed - lastOrbit > 200) {
            orbits.push({
              a: Math.random() * 6.283, r: 20 + Math.random() * 30,
              s: (2.5 + Math.random() * 3) * (Math.random() > 0.5 ? 1 : -1),
              sz: 2 + Math.random() * 2.5, life: 1, d: 0.04,
              c: GOLD[Math.floor(Math.random() * 4)]
            });
            lastOrbit = elapsed;
          }

          // Spawn puffs
          if (!exploded && elapsed - lastPuff > 160 && t < 0.9) {
            puffs.push({ x: cx, y: cy, sz: 3 + Math.random() * 5, life: 1, d: 0.05 });
            lastPuff = elapsed;
          }

          // --- DRAW ---
          ctx.clearRect(0, 0, cw, ch);
          var i, p;

          // Puffs
          for (i = puffs.length - 1; i >= 0; i--) {
            p = puffs[i]; p.life -= p.d; p.sz += 0.3;
            if (p.life <= 0) { puffs.splice(i, 1); continue; }
            ctx.globalAlpha = p.life * 0.15;
            ctx.fillStyle = '#D4AF37';
            ctx.beginPath(); ctx.arc(p.x, p.y, p.sz, 0, 6.283); ctx.fill();
          }

          // Orbits
          var ocx = exploded ? expPt.x : cx;
          var ocy = exploded ? expPt.y : cy;
          for (i = orbits.length - 1; i >= 0; i--) {
            p = orbits[i]; p.a += p.s * 0.04; p.life -= p.d;
            if (p.life <= 0) { orbits.splice(i, 1); continue; }
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.c;
            ctx.beginPath();
            ctx.arc(ocx + Math.cos(p.a) * p.r, ocy + Math.sin(p.a) * p.r, p.sz, 0, 6.283);
            ctx.fill();
          }

          // Flash — two flat circles (no gradient = fast)
          if (flashLife > 0) {
            var fr = (1 - flashLife) * 140 + 10;
            // Outer glow
            ctx.globalAlpha = flashLife * 0.2;
            ctx.fillStyle = '#D4AF37';
            ctx.beginPath(); ctx.arc(expPt.x, expPt.y, fr, 0, 6.283); ctx.fill();
            // Inner core
            ctx.globalAlpha = flashLife * 0.55;
            ctx.fillStyle = '#F5D060';
            ctx.beginPath(); ctx.arc(expPt.x, expPt.y, fr * 0.4, 0, 6.283); ctx.fill();
            flashLife -= 0.04;
          }

          // Rings (inlined, no array overhead)
          if (ringLife1 > 0) {
            ringR1 += (180 - ringR1) * 0.08; ringLife1 -= 0.035;
            ctx.globalAlpha = ringLife1 * 0.35;
            ctx.strokeStyle = '#F5D060'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.arc(expPt.x, expPt.y, ringR1, 0, 6.283); ctx.stroke();
          }
          if (ringLife2 > 0) {
            ringR2 += (150 - ringR2) * 0.08; ringLife2 -= 0.03;
            ctx.globalAlpha = ringLife2 * 0.25;
            ctx.strokeStyle = '#D4AF37'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.arc(expPt.x, expPt.y, ringR2, 0, 6.283); ctx.stroke();
          }

          // Burst
          for (i = bursts.length - 1; i >= 0; i--) {
            p = bursts[i]; p.x += p.vx; p.y += p.vy;
            p.vx *= 0.95; p.vy *= 0.95; p.life -= p.d;
            if (p.life <= 0) { bursts.splice(i, 1); continue; }
            ctx.globalAlpha = p.life;
            ctx.fillStyle = '#F5D060';
            ctx.beginPath(); ctx.arc(p.x, p.y, p.sz * p.life, 0, 6.283); ctx.fill();
          }

          // Gold rain
          for (i = rains.length - 1; i >= 0; i--) {
            p = rains[i];
            if (p.wait > 0) { p.wait--; continue; }
            p.vy += p.g; p.x += p.vx; p.y += p.vy;
            p.vx *= 0.998; p.life -= p.d;
            if (p.life <= 0) { rains.splice(i, 1); continue; }
            ctx.globalAlpha = Math.min(1, p.life * 1.4);
            ctx.fillStyle = p.life > 0.5 ? '#FFF4D2' : '#F5D060';
            ctx.beginPath(); ctx.arc(p.x, p.y, p.sz * Math.max(0.3, p.life), 0, 6.283); ctx.fill();
          }

          ctx.globalAlpha = 1;

          // --- TRIGGER EXPLOSION ---
          if (t >= 1 && !exploded) {
            exploded = true;
            expPt = { x: cx, y: cy };

            ship.classList.remove('flying');
            ship.classList.add('crashed');
            setTimeout(function () {
              pathEl.classList.remove('drawing');
              pathEl.classList.add('fading');
            }, 100);

            flashLife = 1;
            ringLife1 = 1;
            ringLife2 = 0; // delayed start
            setTimeout(function () { ringLife2 = 1; }, 120);

            for (var bi = 0; bi < 10; bi++) {
              var ba = (6.283 / 10) * bi + (Math.random() - 0.5) * 0.3;
              bursts.push({
                x: cx, y: cy,
                vx: Math.cos(ba) * (1.5 + Math.random() * 2.5),
                vy: Math.sin(ba) * (1.5 + Math.random() * 2.5),
                sz: 1.5 + Math.random() * 2, life: 1, d: 0.04
              });
            }

            for (var ri = 0; ri < 12; ri++) {
              var ra = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.8;
              var rd = 0.4 + Math.random() * 1.6;
              rains.push({
                x: cx, y: cy,
                vx: Math.cos(ra) * rd + (Math.random() - 0.5) * 0.6,
                vy: Math.sin(ra) * rd,
                g: 0.025 + Math.random() * 0.02,
                sz: 1.5 + Math.random() * 2.5, life: 1,
                d: 0.012 + Math.random() * 0.006,
                wait: Math.floor(Math.random() * 6)
              });
            }

            // Illuminate keywords — wait until particles have mostly cleared
            setTimeout(function () {
              requestAnimationFrame(function () {
                var words = document.querySelectorAll('.glow-word');
                words.forEach(function (w, idx) {
                  setTimeout(function () { w.classList.add('lit'); }, idx * 90);
                });
                var texts = document.querySelectorAll('.story-text');
                texts.forEach(function (txt, idx) {
                  setTimeout(function () { txt.classList.add('illuminated'); }, 200 + idx * 150);
                });
                var label = document.querySelector('.story-grid__left .label');
                if (label) label.classList.add('illuminated');
              });
            }, 1100);
          }

          // Continue or clean up
          var alive = !exploded || orbits.length || puffs.length || bursts.length || rains.length || flashLife > 0 || ringLife1 > 0 || ringLife2 > 0;
          if (alive) {
            requestAnimationFrame(step);
          } else {
            if (cvs.parentNode) cvs.parentNode.removeChild(cvs);
          }
        }

        requestAnimationFrame(step);
      }

      // Trigger on scroll
      var triggered = false;
      var storyGrid = document.getElementById('storyGrid');
      if (storyGrid) {
        var arcObs = new IntersectionObserver(function (entries) {
          entries.forEach(function (e) {
            if (e.isIntersecting && !triggered) {
              triggered = true;
              setTimeout(function () {
                var pts = buildArcPath();
                if (pts) runAnimation(pts);
              }, 200);
              arcObs.unobserve(e.target);
            }
          });
        }, { threshold: 0.2, rootMargin: '0px 0px -40px 0px' });
        arcObs.observe(storyGrid);
      }
    })();

    /* ---------- LAZY IMAGE FADE-IN ---------- */
    document.querySelectorAll('img[loading="lazy"]').forEach(function (img) {
      if (img.complete) {
        img.classList.add('loaded');
      } else {
        img.addEventListener('load', function () { img.classList.add('loaded'); });
      }
    });

    /* ---------- CUSTOM CURSOR ---------- */
    var dot = document.querySelector('.cursor-dot');
    if (dot && window.matchMedia('(pointer:fine)').matches) {
      var mx = 0, my = 0, dx = 0, dy = 0;
      document.addEventListener('mousemove', function (e) { mx = e.clientX; my = e.clientY; });
      (function animate() {
        dx += (mx - dx) * 0.15;
        dy += (my - dy) * 0.15;
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
      var PARTICLE_COUNT = 65;

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
          r: Math.random() * 2.5 + 1,
          dx: (Math.random() - 0.5) * 0.35,
          dy: (Math.random() - 0.5) * 0.2 - 0.05,
          opacity: Math.random() * 0.4 + 0.15,
          hue: Math.random() < 0.3 ? '245,215,80' : '212,175,55'
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
          ctx.fillStyle = 'rgba(' + p.hue + ',' + p.opacity + ')';
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

/* In-page tab toggle (services page) */
(function () {
  var tabs = document.querySelectorAll('.page-tabs__btn[data-scroll-target]');
  if (!tabs.length) return;
  tabs.forEach(function (btn) {
    btn.addEventListener('click', function () {
      tabs.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      var target = document.getElementById(btn.getAttribute('data-scroll-target'));
      if (target) {
        var offset = 80; // nav height buffer
        var y = target.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    });
  });

  /* Update active tab on scroll */
  var pricingEl = document.getElementById('pricing');
  var servicesEl = document.getElementById('services-top');
  if (pricingEl && servicesEl) {
    window.addEventListener('scroll', function () {
      var scrollY = window.pageYOffset + 200;
      var pricingTop = pricingEl.getBoundingClientRect().top + window.pageYOffset;
      if (scrollY >= pricingTop) {
        tabs[0].classList.remove('active');
        tabs[1].classList.add('active');
      } else {
        tabs[1].classList.remove('active');
        tabs[0].classList.add('active');
      }
    }, { passive: true });
  }
})();
