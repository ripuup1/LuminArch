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
        var DURATION = 2200;
        var startTime = null;
        var exploded = false;
        var impact = arc.querySelector('.rocket-arc__impact');

        ship.classList.add('flying');
        pathEl.classList.add('drawing');

        function step(ts) {
          if (!startTime) startTime = ts;
          var elapsed = ts - startTime;
          var t = Math.min(elapsed / DURATION, 1);
          var eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

          var pos = quadBezier(eased, pts.p0, pts.p1, pts.p2);
          var angle = quadBezierAngle(eased, pts.p0, pts.p1, pts.p2);

          ship.style.left = (pos.x - 36) + 'px';
          ship.style.top = (pos.y - 36) + 'px';
          ship.style.transform = 'rotate(' + (angle + Math.PI / 2) + 'rad)';
          pathEl.style.strokeDashoffset = pts.len * (1 - eased);

          if (t >= 1 && !exploded) {
            exploded = true;

            // Hide rocket, fade trail
            ship.classList.remove('flying');
            ship.classList.add('crashed');
            setTimeout(function () {
              pathEl.classList.remove('drawing');
              pathEl.classList.add('fading');
            }, 100);

            // Position impact at crash point and trigger CSS explosion
            impact.style.left = pos.x + 'px';
            impact.style.top = pos.y + 'px';
            impact.classList.add('exploding');

            // Enable firework orb clicks now that rocket is done
            if (typeof fireworksReady !== 'undefined') fireworksReady = true;

            // Illuminate keywords — after CSS explosion visually peaks (~700ms)
            setTimeout(function () {
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
            }, 700);

            return; // Animation complete — no more rAF needed
          }

          requestAnimationFrame(step);
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

    /* ---------- STATS COUNTER — SLOT MACHINE ---------- */
    function slotMachine(el) {
      var target = parseInt(el.dataset.target);
      var suffix = el.dataset.suffix || '';
      var digits = String(target).split('');
      el.textContent = '';

      digits.forEach(function (digit, idx) {
        var wrap = document.createElement('span');
        wrap.className = 'stat__digit-wrap';
        var reel = document.createElement('span');
        reel.className = 'stat__digit-reel';

        /* Build reel: 0-9 then the target digit on top */
        var totalSlots = 10 + parseInt(digit);
        for (var n = 0; n <= totalSlots; n++) {
          var s = document.createElement('span');
          s.textContent = n % 10;
          reel.appendChild(s);
        }

        reel.style.transform = 'translateY(0)';
        wrap.appendChild(reel);
        el.appendChild(wrap);

        /* Stagger each digit's roll */
        (function (r, slots, delay) {
          setTimeout(function () {
            r.style.transition = 'transform ' + (0.6 + slots * 0.04) + 's cubic-bezier(.2,.8,.3,1)';
            r.style.transform = 'translateY(-' + (slots) + 'em)';
          }, delay);
        })(reel, totalSlots, 100 + idx * 200);
      });

      /* Add suffix after last digit */
      if (suffix) {
        var suffixSpan = document.createElement('span');
        suffixSpan.textContent = suffix;
        suffixSpan.style.verticalAlign = 'bottom';
        el.appendChild(suffixSpan);
      }
    }

    var statsObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          slotMachine(e.target);
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

    /* ---------- GOLD PARTICLE BACKGROUND + FIREWORKS ---------- */
    var canvas = document.getElementById('particles');
    if (canvas) {
      var ctx = canvas.getContext('2d');
      var orbs = [];
      var sparkles = [];
      var ORB_COUNT = 65;
      var isMobile = window.innerWidth < 768 || 'ontouchstart' in window;
      var fireworksReady = !document.getElementById('rocketArc') && !document.getElementById('rocketArcMobile'); /* gate: false on about page until rocket finishes */

      /* Color palettes for fireworks */
      var warmColors = [
        [255,180,60], [255,120,50], [255,80,80], [255,160,200], [245,215,80], [212,175,55]
      ];
      var coolColors = [
        [80,160,255], [120,80,255], [60,220,200], [180,140,255], [100,200,255], [200,200,255]
      ];

      function pickFireworkColor() {
        var palette = Math.random() < 0.5 ? warmColors : coolColors;
        return palette[Math.floor(Math.random() * palette.length)];
      }

      function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
      resize();
      window.addEventListener('resize', resize);

      /* Create orbs — 50% are interactive (staggered: every other one) */
      for (var i = 0; i < ORB_COUNT; i++) {
        var interactive = !isMobile && (i % 2 === 0);
        orbs.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          r: interactive ? (Math.random() * 2 + 3.5) : (Math.random() * 2.5 + 1),
          dx: (Math.random() - 0.5) * 0.35,
          dy: (Math.random() - 0.5) * 0.2 - 0.05,
          opacity: interactive ? (Math.random() * 0.35 + 0.35) : (Math.random() * 0.4 + 0.15),
          baseOpacity: 0,
          hue: interactive
            ? (Math.random() < 0.4 ? '255,200,60' : '230,190,50')
            : (Math.random() < 0.3 ? '245,215,80' : '212,175,55'),
          interactive: interactive,
          pulsePhase: Math.random() * Math.PI * 2,
          alive: true,
          fadingIn: true,
          fadeProgress: Math.random()
        });
      }

      /* Spawn a sparkle burst at position */
      function spawnFirework(x, y) {
        var count = Math.floor(Math.random() * 11) + 20; /* 20-30 sparkles */
        var baseColor = pickFireworkColor();
        for (var i = 0; i < count; i++) {
          var angle = (Math.PI * 2 / count) * i + (Math.random() - 0.5) * 0.4;
          var speed = Math.random() * 3 + 1.5;
          /* Slight color variation per sparkle */
          var cr = Math.min(255, Math.max(0, baseColor[0] + (Math.random() - 0.5) * 40));
          var cg = Math.min(255, Math.max(0, baseColor[1] + (Math.random() - 0.5) * 40));
          var cb = Math.min(255, Math.max(0, baseColor[2] + (Math.random() - 0.5) * 40));
          sparkles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 1.5,
            r: Math.random() * 2 + 1,
            color: [Math.round(cr), Math.round(cg), Math.round(cb)],
            life: 1.0,
            decay: Math.random() * 0.015 + 0.012,
            trail: [] /* glow trail positions */
          });
        }
      }

      /* Respawn an orb at a random location far from existing interactive orbs */
      function respawnOrb(orb) {
        var attempts = 0;
        var newX, newY, tooClose;
        do {
          newX = Math.random() * canvas.width;
          newY = Math.random() * canvas.height;
          tooClose = false;
          for (var j = 0; j < orbs.length; j++) {
            if (orbs[j].interactive && orbs[j].alive && orbs[j] !== orb) {
              var ddx = orbs[j].x - newX;
              var ddy = orbs[j].y - newY;
              if (Math.sqrt(ddx * ddx + ddy * ddy) < 120) { tooClose = true; break; }
            }
          }
          attempts++;
        } while (tooClose && attempts < 15);
        orb.x = newX;
        orb.y = newY;
        orb.alive = true;
        orb.fadingIn = true;
        orb.fadeProgress = 0;
        orb.r = Math.random() * 2 + 3.5;
      }

      /* Click handler — listen on document so clicks work through content layers */
      if (!isMobile) {
        var interactiveTags = { A:1, BUTTON:1, INPUT:1, TEXTAREA:1, SELECT:1, LABEL:1 };
        document.addEventListener('click', function (e) {
          /* Skip if fireworks not yet enabled (about page: wait for rocket) */
          if (!fireworksReady) return;
          /* Skip if user clicked an actual interactive element */
          var tag = e.target.tagName;
          if (interactiveTags[tag] || e.target.closest('a, button, input, textarea, select, .nav, .btn')) return;
          var mx = e.clientX;
          var my = e.clientY;
          for (var i = 0; i < orbs.length; i++) {
            var o = orbs[i];
            if (!o.interactive || !o.alive) continue;
            var hitRadius = o.r + 14; /* generous hit area */
            var ddx = o.x - mx;
            var ddy = o.y - my;
            if (ddx * ddx + ddy * ddy < hitRadius * hitRadius) {
              spawnFirework(o.x, o.y);
              o.alive = false;
              /* Respawn after 2-4 seconds at new location */
              (function (ref) {
                setTimeout(function () { respawnOrb(ref); }, 2000 + Math.random() * 2000);
              })(o);
              break; /* only one orb per click */
            }
          }
        });
      }

      /* Main render loop */
      function drawFrame() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        /* Draw orbs */
        for (var i = 0; i < orbs.length; i++) {
          var o = orbs[i];
          if (!o.alive && !o.fadingIn) continue;

          o.x += o.dx;
          o.y += o.dy;
          if (o.x < -10) o.x = canvas.width + 10;
          if (o.x > canvas.width + 10) o.x = -10;
          if (o.y < -10) o.y = canvas.height + 10;
          if (o.y > canvas.height + 10) o.y = -10;

          /* Fade in */
          if (o.fadingIn) {
            o.fadeProgress += 0.01;
            if (o.fadeProgress >= 1) { o.fadeProgress = 1; o.fadingIn = false; }
          }

          var displayOpacity = o.opacity * o.fadeProgress;

          /* Pulse for interactive orbs — bigger, more colorful */
          var radius = o.r;
          if (o.interactive && o.alive) {
            o.pulsePhase += 0.035;
            var pulse = Math.sin(o.pulsePhase);
            radius += pulse * 1.2;
            /* Outer glow halo */
            ctx.beginPath();
            ctx.arc(o.x, o.y, radius + 8, 0, 6.283);
            ctx.fillStyle = 'rgba(' + o.hue + ',' + (displayOpacity * 0.08) + ')';
            ctx.fill();
            /* Inner glow */
            ctx.beginPath();
            ctx.arc(o.x, o.y, radius + 4, 0, 6.283);
            ctx.fillStyle = 'rgba(' + o.hue + ',' + (displayOpacity * 0.2) + ')';
            ctx.fill();
          }

          ctx.beginPath();
          ctx.arc(o.x, o.y, radius, 0, 6.283);
          ctx.fillStyle = 'rgba(' + o.hue + ',' + displayOpacity + ')';
          ctx.fill();
        }

        /* Draw sparkles (firework particles) */
        for (var i = sparkles.length - 1; i >= 0; i--) {
          var s = sparkles[i];

          /* Store trail position */
          s.trail.push({ x: s.x, y: s.y, life: s.life });
          if (s.trail.length > 4) s.trail.shift();

          /* Physics: gravity + velocity */
          s.vy += 0.06; /* gravity */
          s.vx *= 0.985; /* air friction */
          s.vy *= 0.985;
          s.x += s.vx;
          s.y += s.vy;
          s.life -= s.decay;

          if (s.life <= 0) {
            sparkles.splice(i, 1);
            continue;
          }

          /* Draw glow trail */
          for (var t = 0; t < s.trail.length; t++) {
            var tr = s.trail[t];
            var trailAlpha = (t / s.trail.length) * s.life * 0.3;
            ctx.beginPath();
            ctx.arc(tr.x, tr.y, s.r * 0.6, 0, 6.283);
            ctx.fillStyle = 'rgba(' + s.color[0] + ',' + s.color[1] + ',' + s.color[2] + ',' + trailAlpha + ')';
            ctx.fill();
          }

          /* Draw main sparkle */
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r * s.life, 0, 6.283);
          ctx.fillStyle = 'rgba(' + s.color[0] + ',' + s.color[1] + ',' + s.color[2] + ',' + s.life + ')';
          ctx.fill();

          /* Bright center */
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r * s.life * 0.4, 0, 6.283);
          ctx.fillStyle = 'rgba(255,255,255,' + (s.life * 0.6) + ')';
          ctx.fill();
        }

        requestAnimationFrame(drawFrame);
      }
      drawFrame();

      /* ---------- INTRO FIREWORKS — 3 auto-bursts on homepage only ---------- */
      var isHomePage = !!document.querySelector('.hero');
      if (!isMobile && fireworksReady && isHomePage) {
        var introOrbs = orbs.filter(function (o) { return o.interactive && o.alive; });
        /* Pick 3 random interactive orbs spaced apart */
        for (var ib = 0; ib < Math.min(3, introOrbs.length); ib++) {
          (function (idx, delay) {
            setTimeout(function () {
              /* Re-pick a random alive interactive orb each time */
              var candidates = orbs.filter(function (o) { return o.interactive && o.alive; });
              if (candidates.length === 0) return;
              var pick = candidates[Math.floor(Math.random() * candidates.length)];
              spawnFirework(pick.x, pick.y);
              pick.alive = false;
              (function (ref) {
                setTimeout(function () { respawnOrb(ref); }, 2000 + Math.random() * 2000);
              })(pick);
            }, delay);
          })(ib, 1200 + ib * 1000); /* first at 1.2s (after page loads), then 1s apart */
        }
      }
    }
    /* ---------- CIRCUIT BOARD PULSE ---------- */
    (function initCircuitPulse() {
      var circuit = document.getElementById('circuitDivider');
      if (!circuit) return;
      var svg = circuit.querySelector('.svg-divider__svg');
      var paths = circuit.querySelectorAll('.svgd');
      var nodes = circuit.querySelectorAll('.svgd-n');

      /* Wait for draw-in to finish (~3s after visible) then start pulsing */
      var pulseStarted = false;
      var pulseObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting && !pulseStarted) {
            pulseStarted = true;
            setTimeout(startPulse, 3200); /* after draw-in animation */
            pulseObs.unobserve(circuit);
          }
        });
      }, { threshold: 0.3 });
      pulseObs.observe(circuit);

      function startPulse() {
        /* Pulse along each path sequentially */
        function pulseOnePath(pathIdx) {
          if (pathIdx >= paths.length) {
            /* Pause then restart */
            setTimeout(function () { pulseOnePath(0); }, 2000);
            return;
          }
          var path = paths[pathIdx];
          var len = path.getTotalLength();
          if (!len || len < 10) { pulseOnePath(pathIdx + 1); return; }

          var dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          dot.setAttribute('r', '3');
          dot.setAttribute('class', 'svgd-pulse');
          svg.appendChild(dot);

          var duration = Math.max(600, len * 1.5);
          var startTime = null;
          function animateDot(ts) {
            if (!startTime) startTime = ts;
            var t = Math.min((ts - startTime) / duration, 1);
            var pt = path.getPointAtLength(t * len);
            dot.setAttribute('cx', pt.x);
            dot.setAttribute('cy', pt.y);
            dot.style.opacity = t < 0.1 ? t * 10 : (t > 0.85 ? (1 - t) / 0.15 : 1);

            /* Flash nearby nodes */
            nodes.forEach(function (n) {
              var nx = parseFloat(n.getAttribute('cx'));
              var ny = parseFloat(n.getAttribute('cy'));
              var dist = Math.sqrt((pt.x - nx) * (pt.x - nx) + (pt.y - ny) * (pt.y - ny));
              if (dist < 20) {
                n.style.fill = '#F5D060';
                n.style.filter = 'drop-shadow(0 0 4px rgba(245,215,80,.8))';
                n.style.opacity = '0.9';
              }
            });

            if (t < 1) {
              requestAnimationFrame(animateDot);
            } else {
              svg.removeChild(dot);
              /* Reset node styles after a brief glow */
              setTimeout(function () {
                nodes.forEach(function (n) {
                  n.style.fill = '';
                  n.style.filter = '';
                  n.style.opacity = '';
                });
              }, 300);
              setTimeout(function () { pulseOnePath(pathIdx + 1); }, 150);
            }
          }
          requestAnimationFrame(animateDot);
        }
        pulseOnePath(0);
      }
    })();

    /* ---------- ARCHITECTURAL DIVIDER — WINDOW LIGHTS ---------- */
    (function initWindowLights() {
      var arch = document.getElementById('archDivider');
      if (!arch) return;
      var windows = arch.querySelectorAll('.svgd-win');
      var spire = arch.querySelector('line[x1="690"][y1="22"]'); /* tower antenna */

      var lightsStarted = false;
      var lightObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting && !lightsStarted) {
            lightsStarted = true;
            setTimeout(lightUpWindows, 3000); /* after draw-in */
            lightObs.unobserve(arch);
          }
        });
      }, { threshold: 0.3 });
      lightObs.observe(arch);

      function lightUpWindows() {
        /* Shuffle window order for random lighting */
        var indices = [];
        for (var i = 0; i < windows.length; i++) indices.push(i);
        for (var i = indices.length - 1; i > 0; i--) {
          var j = Math.floor(Math.random() * (i + 1));
          var tmp = indices[i]; indices[i] = indices[j]; indices[j] = tmp;
        }

        indices.forEach(function (idx, order) {
          setTimeout(function () {
            windows[idx].classList.add('lit');
          }, order * 400 + Math.random() * 200);
        });

        /* Blink the tower spire light */
        if (spire) {
          setTimeout(function () {
            var blinkOn = true;
            setInterval(function () {
              spire.style.stroke = blinkOn ? '#ff4040' : '';
              spire.style.filter = blinkOn ? 'drop-shadow(0 0 3px rgba(255,60,60,.7))' : '';
              spire.style.opacity = blinkOn ? '0.9' : '';
              blinkOn = !blinkOn;
            }, 1200);
          }, indices.length * 400 + 500);
        }

        /* Subtle flicker on random windows */
        setTimeout(function () {
          setInterval(function () {
            var pick = Math.floor(Math.random() * windows.length);
            var w = windows[pick];
            if (!w.classList.contains('lit')) return;
            w.style.opacity = '0.25';
            setTimeout(function () { w.style.opacity = ''; }, 150 + Math.random() * 200);
          }, 3000 + Math.random() * 2000);
        }, indices.length * 400 + 1000);
      }
    })();

    /* ---------- FOOTER CONSTELLATION ---------- */
    (function initConstellation() {
      var footer = document.querySelector('.footer');
      var cvs = document.getElementById('constellation');
      if (!footer || !cvs) return;
      var ctx2 = cvs.getContext('2d');
      var stars = [];
      var STAR_COUNT = 25;
      var CONNECT_DIST = 140;
      var animating = false;

      function resizeCanvas() {
        cvs.width = footer.offsetWidth;
        cvs.height = footer.offsetHeight;
      }
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);

      for (var i = 0; i < STAR_COUNT; i++) {
        stars.push({
          x: Math.random() * footer.offsetWidth,
          y: Math.random() * footer.offsetHeight,
          dx: (Math.random() - 0.5) * 0.2,
          dy: (Math.random() - 0.5) * 0.15,
          r: Math.random() * 1.5 + 0.8,
          opacity: Math.random() * 0.3 + 0.15
        });
      }

      function drawConstellation() {
        if (!animating) return;
        ctx2.clearRect(0, 0, cvs.width, cvs.height);
        var w = cvs.width, h = cvs.height;

        /* Move stars */
        for (var i = 0; i < stars.length; i++) {
          var s = stars[i];
          s.x += s.dx;
          s.y += s.dy;
          if (s.x < 0) s.x = w;
          if (s.x > w) s.x = 0;
          if (s.y < 0) s.y = h;
          if (s.y > h) s.y = 0;
        }

        /* Draw connecting lines */
        for (var i = 0; i < stars.length; i++) {
          for (var j = i + 1; j < stars.length; j++) {
            var ddx = stars[i].x - stars[j].x;
            var ddy = stars[i].y - stars[j].y;
            var dist = Math.sqrt(ddx * ddx + ddy * ddy);
            if (dist < CONNECT_DIST) {
              var alpha = (1 - dist / CONNECT_DIST) * 0.12;
              ctx2.beginPath();
              ctx2.moveTo(stars[i].x, stars[i].y);
              ctx2.lineTo(stars[j].x, stars[j].y);
              ctx2.strokeStyle = 'rgba(212,175,55,' + alpha + ')';
              ctx2.lineWidth = 0.6;
              ctx2.stroke();
            }
          }
        }

        /* Draw stars */
        for (var i = 0; i < stars.length; i++) {
          var s = stars[i];
          ctx2.beginPath();
          ctx2.arc(s.x, s.y, s.r, 0, 6.283);
          ctx2.fillStyle = 'rgba(212,175,55,' + s.opacity + ')';
          ctx2.fill();
        }

        requestAnimationFrame(drawConstellation);
      }

      /* Only animate when footer is in view — saves GPU */
      var footerObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            if (!animating) { animating = true; drawConstellation(); }
          } else {
            animating = false;
          }
        });
      }, { threshold: 0.05 });
      footerObs.observe(footer);
    })();

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
