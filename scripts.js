/* ===== LUMINARCH — SHARED SCRIPTS ===== */

(function () {
  'use strict';

  /* ---------- SESSION-AWARE LOADER ---------- */
  var loader = document.getElementById('pageLoader');
  var pageFade = document.querySelector('.page-fade');
  var isFirstVisit = !sessionStorage.getItem('la_visited');
  var LOADER_MIN = 1200;
  var loadStart = Date.now();

  // Mark session as visited
  sessionStorage.setItem('la_visited', '1');

  if (isFirstVisit && loader) {
    // First visit: show full branded loader
    function dismissLoader() {
      var elapsed = Date.now() - loadStart;
      var remaining = Math.max(0, LOADER_MIN - elapsed);
      setTimeout(function () {
        loader.classList.add('done');
        setTimeout(triggerHeroAnimation, 700);
      }, remaining);
    }
    if (document.readyState === 'complete') dismissLoader();
    else window.addEventListener('load', dismissLoader);
  } else {
    // Return visit: skip branded loader, quick fade
    if (loader) loader.classList.add('skip');
    if (pageFade) {
      // Quick fade dismissal
      function dismissFade() {
        setTimeout(function () {
          pageFade.classList.add('done');
          setTimeout(triggerHeroAnimation, 300);
        }, 80);
      }
      if (document.readyState === 'complete') dismissFade();
      else window.addEventListener('load', dismissFade);
    } else {
      // No fade element — just trigger hero
      if (document.readyState === 'complete') triggerHeroAnimation();
      else window.addEventListener('load', function () { setTimeout(triggerHeroAnimation, 100); });
    }
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

          // Hero logo collapse
          if (heroLogo) {
            if (y > 150) heroLogo.classList.add('collapsed');
            else heroLogo.classList.remove('collapsed');
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
    document.querySelectorAll('.process-connector').forEach(function (el) { specialObs.observe(el); });

    /* ---------- ROCKET ARC FLIGHT ---------- */
    (function initRocketArc() {
      // Pick the visible container (desktop vs mobile)
      var isMobile = window.matchMedia('(max-width:768px)').matches;
      var arc = document.getElementById(isMobile ? 'rocketArcMobile' : 'rocketArc');
      if (!arc) return;

      var pathEl = arc.querySelector('.rocket-arc__path');
      var ship = arc.querySelector('.rocket-arc__ship');
      var impact = arc.querySelector('.rocket-arc__impact');
      var container = arc;

      // Quadratic bezier helper: B(t) = (1-t)^2*P0 + 2*(1-t)*t*P1 + t^2*P2
      function quadBezier(t, p0, p1, p2) {
        var mt = 1 - t;
        return {
          x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
          y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y
        };
      }

      // Tangent angle at t for rotation
      function quadBezierAngle(t, p0, p1, p2) {
        var mt = 1 - t;
        var dx = 2 * mt * (p1.x - p0.x) + 2 * t * (p2.x - p1.x);
        var dy = 2 * mt * (p1.y - p0.y) + 2 * t * (p2.y - p1.y);
        return Math.atan2(dy, dx);
      }

      function buildArcPath() {
        var rect = container.getBoundingClientRect();
        var w = container.offsetWidth || rect.width;
        var h = container.offsetHeight || rect.height;
        if (w === 0 || h === 0) return null;

        // Arc control points (relative to container)
        var p0 = { x: w * 0.04, y: h * 0.85 };      // start: left column bottom
        var p1 = { x: w * 0.42, y: h * -0.15 };      // peak: above mid-left (fills dead space)
        var p2 = { x: w * 0.78, y: h * 1.08 };       // end: below the text column (avoids readability overlap)

        // Set the SVG viewBox to match container
        var svg = arc.querySelector('.rocket-arc__svg');
        svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);

        // Build the path d attribute
        var d = 'M ' + p0.x + ' ' + p0.y + ' Q ' + p1.x + ' ' + p1.y + ' ' + p2.x + ' ' + p2.y;
        pathEl.setAttribute('d', d);

        // Compute total path length for stroke-dashoffset animation
        var len = pathEl.getTotalLength();
        pathEl.style.strokeDasharray = len;
        pathEl.style.strokeDashoffset = len;

        return { p0: p0, p1: p1, p2: p2, len: len, w: w, h: h };
      }

      function spawnPuff(x, y, size) {
        var puff = document.createElement('span');
        puff.className = 'rocket-arc__puff';
        var s = size || (8 + Math.random() * 12);
        puff.style.width = s + 'px';
        puff.style.height = s + 'px';
        puff.style.left = (x - s / 2) + 'px';
        puff.style.top = (y - s / 2) + 'px';
        container.appendChild(puff);
        setTimeout(function () { if (puff.parentNode) puff.parentNode.removeChild(puff); }, 1300);
      }

      function runAnimation(pts) {
        var DURATION = 2500; // ms
        var startTime = null;
        var lastPuff = 0;
        var PUFF_INTERVAL = 80; // ms between puffs

        ship.classList.add('flying');
        pathEl.classList.add('drawing');

        function step(timestamp) {
          if (!startTime) startTime = timestamp;
          var elapsed = timestamp - startTime;
          var t = Math.min(elapsed / DURATION, 1);

          // Ease-in-out cubic
          var eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

          // Position along arc
          var pos = quadBezier(eased, pts.p0, pts.p1, pts.p2);
          var angle = quadBezierAngle(eased, pts.p0, pts.p1, pts.p2);

          // Move ship — rotate SVG 90deg (nose up) + arc tangent angle
          ship.style.left = (pos.x - 32) + 'px';
          ship.style.top = (pos.y - 32) + 'px';
          ship.style.transform = 'rotate(' + (angle + Math.PI / 2) + 'rad)';

          // Draw trail behind rocket
          var trailOffset = pts.len * (1 - eased);
          pathEl.style.strokeDashoffset = trailOffset;

          // Spawn smoke puffs periodically
          if (elapsed - lastPuff > PUFF_INTERVAL && t < 0.92) {
            spawnPuff(pos.x, pos.y, 6 + Math.random() * 14);
            lastPuff = elapsed;
          }

          if (t < 1) {
            requestAnimationFrame(step);
          } else {
            // --- CRASH ---
            ship.classList.remove('flying');
            ship.classList.add('crashed');

            // Position impact at crash point
            impact.style.left = pos.x + 'px';
            impact.style.top = pos.y + 'px';
            impact.classList.add('flash');

            // Fade trail out after crash
            setTimeout(function () {
              pathEl.classList.remove('drawing');
              pathEl.classList.add('fading');
            }, 200);

            // Illuminate ALL story text — brighter, faster cascade
            setTimeout(function () {
              var texts = document.querySelectorAll('.story-text');
              texts.forEach(function (txt, i) {
                setTimeout(function () { txt.classList.add('illuminated'); }, i * 120);
              });
              // Also illuminate the "Our Story" label
              var label = document.querySelector('.story-grid__left .label');
              if (label) label.classList.add('illuminated');
            }, 350);
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
              // Small delay so the grid is fully rendered
              setTimeout(function () {
                var pts = buildArcPath();
                if (pts) runAnimation(pts);
              }, 200);
              arcObs.unobserve(e.target);
            }
          });
        }, { threshold: 0.25, rootMargin: '0px 0px -40px 0px' });
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
