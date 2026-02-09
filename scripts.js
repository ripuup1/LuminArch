/* ===== LUMINARCH — SHARED SCRIPTS ===== */

(function () {
  'use strict';

  /* ---------- SESSION-AWARE LOADER ---------- */
  var loader = document.getElementById('pageLoader');
  var pageFade = document.querySelector('.page-fade');
  var isFirstVisit = !sessionStorage.getItem('la_visited');
  var LOADER_MIN = 1200;
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
    // Return visit: skip branded loader, quick fade
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

    // Try multiple strategies to ensure dismissal
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      // Page is already ready or DOM is built
      setTimeout(doFade, 50);
    } else {
      document.addEventListener('DOMContentLoaded', function () { setTimeout(doFade, 50); });
    }
    // Also listen for load as backup
    window.addEventListener('load', function () { setTimeout(doFade, 50); });
    // Handle bfcache (back/forward navigation)
    window.addEventListener('pageshow', function (e) {
      if (e.persisted) setTimeout(doFade, 50);
    });
    // Absolute failsafe: dismiss after 2s no matter what
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

    /* ---------- ROCKET ARC FLIGHT + FIREWORKS EXPLOSION ---------- */
    (function initRocketArc() {
      var isMobile = window.matchMedia('(max-width:768px)').matches;
      var arc = document.getElementById(isMobile ? 'rocketArcMobile' : 'rocketArc');
      if (!arc) return;

      var pathEl = arc.querySelector('.rocket-arc__path');
      var ship = arc.querySelector('.rocket-arc__ship');
      var impact = arc.querySelector('.rocket-arc__impact');
      var container = arc;

      // Quadratic bezier: B(t) = (1-t)^2*P0 + 2(1-t)t*P1 + t^2*P2
      function quadBezier(t, p0, p1, p2) {
        var mt = 1 - t;
        return {
          x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
          y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y
        };
      }

      function quadBezierAngle(t, p0, p1, p2) {
        var mt = 1 - t;
        var dx = 2 * mt * (p1.x - p0.x) + 2 * t * (p2.x - p1.x);
        var dy = 2 * mt * (p1.y - p0.y) + 2 * t * (p2.y - p1.y);
        return Math.atan2(dy, dx);
      }

      /* --- Orbiting particles (swirl around rocket like Dan Palmer gif) --- */
      var orbitDots = [];
      function spawnOrbit() {
        var dot = document.createElement('span');
        dot.className = 'orbit-dot';
        var size = 3 + Math.random() * 5;
        dot.style.width = size + 'px';
        dot.style.height = size + 'px';
        var hues = ['rgba(245,208,96,0.9)', 'rgba(245,166,35,0.8)', 'rgba(212,175,55,0.85)', 'rgba(255,244,210,0.7)'];
        dot.style.background = hues[Math.floor(Math.random() * hues.length)];
        container.appendChild(dot);
        orbitDots.push({
          el: dot,
          angle: Math.random() * Math.PI * 2,
          radius: 22 + Math.random() * 40,
          speed: (3 + Math.random() * 4) * (Math.random() > 0.5 ? 1 : -1),
          born: Date.now(),
          life: 500 + Math.random() * 500
        });
      }

      function updateOrbits(cx, cy) {
        var now = Date.now();
        orbitDots.forEach(function (d) {
          d.angle += d.speed * 0.04;
          d.el.style.left = (cx + Math.cos(d.angle) * d.radius) + 'px';
          d.el.style.top = (cy + Math.sin(d.angle) * d.radius) + 'px';
          var age = now - d.born;
          var life = age / d.life;
          d.el.style.opacity = life < 0.15 ? life / 0.15 : Math.max(0, 1 - (life - 0.15) / 0.85);
        });
        orbitDots = orbitDots.filter(function (d) {
          if (Date.now() - d.born > d.life) {
            if (d.el.parentNode) d.el.parentNode.removeChild(d.el);
            return false;
          }
          return true;
        });
      }

      function clearOrbits() {
        orbitDots.forEach(function (d) { if (d.el.parentNode) d.el.parentNode.removeChild(d.el); });
        orbitDots = [];
      }

      /* --- Build path --- */
      function buildArcPath() {
        var rect = container.getBoundingClientRect();
        var w = container.offsetWidth || rect.width;
        var h = container.offsetHeight || rect.height;
        if (w === 0 || h === 0) return null;

        // HIGH arc: launches bottom-left, peaks far above grid, ends above the text
        var p0 = { x: w * 0.05, y: h * 0.9 };
        var p1 = { x: w * 0.35, y: h * -0.9 };    // control: way above
        var p2 = { x: w * 0.62, y: h * -0.05 };   // explosion: just above text

        var svg = arc.querySelector('.rocket-arc__svg');
        svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);

        var d = 'M ' + p0.x + ' ' + p0.y + ' Q ' + p1.x + ' ' + p1.y + ' ' + p2.x + ' ' + p2.y;
        pathEl.setAttribute('d', d);

        var len = pathEl.getTotalLength();
        pathEl.style.strokeDasharray = len;
        pathEl.style.strokeDashoffset = len;

        return { p0: p0, p1: p1, p2: p2, len: len, w: w, h: h };
      }

      function spawnPuff(x, y, size) {
        var puff = document.createElement('span');
        puff.className = 'rocket-arc__puff';
        var s = size || (6 + Math.random() * 12);
        puff.style.width = s + 'px';
        puff.style.height = s + 'px';
        puff.style.left = (x - s / 2) + 'px';
        puff.style.top = (y - s / 2) + 'px';
        container.appendChild(puff);
        setTimeout(function () { if (puff.parentNode) puff.parentNode.removeChild(puff); }, 1400);
      }

      /* --- Fireworks explosion + gold rain --- */
      function spawnExplosion(x, y) {
        // 1) Shockwave rings
        var ring = document.createElement('span');
        ring.className = 'burst-ring';
        ring.style.left = x + 'px';
        ring.style.top = y + 'px';
        container.appendChild(ring);
        setTimeout(function () { if (ring.parentNode) ring.parentNode.removeChild(ring); }, 1200);

        setTimeout(function () {
          var ring2 = document.createElement('span');
          ring2.className = 'burst-ring burst-ring--delayed';
          ring2.style.left = x + 'px';
          ring2.style.top = y + 'px';
          container.appendChild(ring2);
          setTimeout(function () { if (ring2.parentNode) ring2.parentNode.removeChild(ring2); }, 1200);
        }, 120);

        // 2) Central flash
        impact.style.left = x + 'px';
        impact.style.top = y + 'px';
        impact.classList.add('flash');

        // 3) Radial burst particles
        var burstCount = 40;
        for (var i = 0; i < burstCount; i++) {
          var angle = (Math.PI * 2 / burstCount) * i + (Math.random() - 0.5) * 0.4;
          var dist = 60 + Math.random() * 150;
          var bp = document.createElement('span');
          bp.className = 'burst-particle';
          bp.style.left = x + 'px';
          bp.style.top = y + 'px';
          bp.style.setProperty('--bx', (Math.cos(angle) * dist) + 'px');
          bp.style.setProperty('--by', (Math.sin(angle) * dist) + 'px');
          var bsize = 2 + Math.random() * 4;
          bp.style.width = bsize + 'px';
          bp.style.height = bsize + 'px';
          container.appendChild(bp);
          (function (el) { setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 1000); })(bp);
        }

        // 4) Gold rain — fireworks cascade (erupts up then falls down)
        var rainCount = 65;
        for (var j = 0; j < rainCount; j++) {
          (function (idx) {
            var delay = Math.random() * 500;
            setTimeout(function () {
              var rain = document.createElement('span');
              rain.className = 'gold-rain';
              rain.style.left = x + 'px';
              rain.style.top = y + 'px';
              // Burst upward/outward first, then gravity pulls down
              var burstAngle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.9;
              var burstDist = 30 + Math.random() * 90;
              var dxUp = Math.cos(burstAngle) * burstDist;
              var dyUp = Math.sin(burstAngle) * burstDist;
              var dxDrift = (Math.random() - 0.5) * 200;
              var dyFall = 180 + Math.random() * 380;
              rain.style.setProperty('--dx-up', dxUp + 'px');
              rain.style.setProperty('--dy-up', dyUp + 'px');
              rain.style.setProperty('--dx-drift', (dxUp * 0.5 + dxDrift) + 'px');
              rain.style.setProperty('--dy-fall', dyFall + 'px');
              var dur = 1.6 + Math.random() * 1.6;
              rain.style.animationDuration = dur + 's';
              var rsize = 2 + Math.random() * 5;
              rain.style.width = rsize + 'px';
              rain.style.height = rsize + 'px';
              container.appendChild(rain);
              setTimeout(function () { if (rain.parentNode) rain.parentNode.removeChild(rain); }, (dur + 0.6) * 1000);
            }, delay);
          })(j);
        }

        // 5) Illuminate keywords as gold rain cascades
        setTimeout(function () {
          var words = document.querySelectorAll('.glow-word');
          words.forEach(function (w, i) {
            setTimeout(function () { w.classList.add('lit'); }, i * 90);
          });
          // Also illuminate story text and label
          var texts = document.querySelectorAll('.story-text');
          texts.forEach(function (txt, i) {
            setTimeout(function () { txt.classList.add('illuminated'); }, 200 + i * 150);
          });
          var label = document.querySelector('.story-grid__left .label');
          if (label) label.classList.add('illuminated');
        }, 500);
      }

      /* --- Main flight animation --- */
      function runAnimation(pts) {
        var DURATION = 2200;
        var startTime = null;
        var lastPuff = 0;
        var lastOrbit = 0;
        var PUFF_INTERVAL = 70;
        var ORBIT_INTERVAL = 140;

        ship.classList.add('flying');
        pathEl.classList.add('drawing');

        function step(timestamp) {
          if (!startTime) startTime = timestamp;
          var elapsed = timestamp - startTime;
          var t = Math.min(elapsed / DURATION, 1);
          var eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

          var pos = quadBezier(eased, pts.p0, pts.p1, pts.p2);
          var angle = quadBezierAngle(eased, pts.p0, pts.p1, pts.p2);

          ship.style.left = (pos.x - 36) + 'px';
          ship.style.top = (pos.y - 36) + 'px';
          ship.style.transform = 'rotate(' + (angle + Math.PI / 2) + 'rad)';

          pathEl.style.strokeDashoffset = pts.len * (1 - eased);

          // Smoke puffs
          if (elapsed - lastPuff > PUFF_INTERVAL && t < 0.92) {
            spawnPuff(pos.x, pos.y, 5 + Math.random() * 10);
            lastPuff = elapsed;
          }

          // Orbit particles
          if (elapsed - lastOrbit > ORBIT_INTERVAL && t < 0.88) {
            spawnOrbit();
            lastOrbit = elapsed;
          }
          updateOrbits(pos.x, pos.y);

          if (t < 1) {
            requestAnimationFrame(step);
          } else {
            // --- EXPLOSION ---
            ship.classList.remove('flying');
            ship.classList.add('crashed');
            clearOrbits();

            // Fade trail
            setTimeout(function () {
              pathEl.classList.remove('drawing');
              pathEl.classList.add('fading');
            }, 100);

            // Fire the explosion + gold rain
            spawnExplosion(pos.x, pos.y);
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
