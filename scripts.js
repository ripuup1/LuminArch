/* ===== LUMINARCH — SHARED SCRIPTS ===== */

document.addEventListener('DOMContentLoaded', () => {
  // Page transition
  setTimeout(() => document.querySelector('.page-transition').classList.add('done'), 100);

  const nav = document.getElementById('nav');
  const heroLogo = document.getElementById('heroLogo');

  // Nav scroll + hero logo collapse
  let lastScroll = 0;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    nav.classList.toggle('scrolled', y > 50);
    if (heroLogo) {
      if (y > 150) { heroLogo.classList.add('collapsed'); }
      else { heroLogo.classList.remove('collapsed'); }
    }
    lastScroll = y;
  }, { passive: true });

  // Mobile menu
  const toggle = document.getElementById('navToggle');
  const menu = document.getElementById('mobileMenu');
  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('open');
      menu.classList.toggle('open');
      document.body.style.overflow = menu.classList.contains('open') ? 'hidden' : '';
    });
    menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      toggle.classList.remove('open');
      menu.classList.remove('open');
      document.body.style.overflow = '';
    }));
  }

  // Reveal on scroll
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: .15, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal,.reveal-line').forEach(el => obs.observe(el));

  // Custom cursor
  const dot = document.querySelector('.cursor-dot');
  if (dot && window.matchMedia('(pointer:fine)').matches) {
    let mx = 0, my = 0, dx = 0, dy = 0;
    document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
    (function animate() {
      dx += (mx - dx) * .2;
      dy += (my - dy) * .2;
      dot.style.left = dx + 'px';
      dot.style.top = dy + 'px';
      requestAnimationFrame(animate);
    })();
    document.querySelectorAll('a,button,.btn,.project-item,input,textarea,select').forEach(el => {
      el.addEventListener('mouseenter', () => dot.classList.add('hovering'));
      el.addEventListener('mouseleave', () => dot.classList.remove('hovering'));
    });
  } else if (dot) {
    dot.style.display = 'none';
  }

  // Hero stagger animation (only on pages with hero)
  const heroLines = document.querySelectorAll('.hero .reveal-line');
  const heroReveals = document.querySelectorAll('.hero .reveal');
  if (heroLines.length) {
    setTimeout(() => {
      heroLines.forEach((l, i) => setTimeout(() => l.classList.add('visible'), 300 + i * 150));
      heroReveals.forEach((l, i) => setTimeout(() => l.classList.add('visible'), 700 + i * 200));
    }, 400);
  }

  // Stats counter animation
  function animateCounter(el, target, dur) {
    const start = performance.now();
    function update(now) {
      const p = Math.min((now - start) / dur, 1);
      el.textContent = Math.floor((1 - Math.pow(1 - p, 3)) * target) + (el.dataset.suffix || '');
      if (p < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }
  const statsObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        animateCounter(e.target, parseInt(e.target.dataset.target), 1800);
        statsObs.unobserve(e.target);
      }
    });
  }, { threshold: .5 });
  document.querySelectorAll('.stat__number[data-target]').forEach(el => statsObs.observe(el));

  // Portfolio filter (work page)
  const filterBtns = document.querySelectorAll('.filter-btn');
  if (filterBtns.length) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.dataset.filter;
        document.querySelectorAll('.project-item[data-category]').forEach(item => {
          if (filter === 'all' || item.dataset.category.includes(filter)) {
            item.style.display = '';
          } else {
            item.style.display = 'none';
          }
        });
      });
    });
  }

  // Contact form validation
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', e => {
      e.preventDefault();
      const formData = new FormData(contactForm);
      const data = Object.fromEntries(formData);
      // Show success state
      contactForm.innerHTML = '<div class="reveal visible" style="text-align:center;padding:60px 0"><h2 class="h2" style="margin-bottom:16px">Message <em class="italic accent-text">sent</em></h2><p class="body-lg" style="color:var(--gray-light)">We\'ll get back to you within 24 hours.</p></div>';
    });
  }

  // Parallax grid lines (subtle effect)
  const gridLines = document.querySelector('.hero__grid-lines');
  if (gridLines) {
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      gridLines.style.transform = `translateY(${y * 0.1}px)`;
    }, { passive: true });
  }
});

// Addon toggle (services page)
function toggleAddon(id) {
  const el = document.getElementById(id);
  if (el) el.classList.toggle('open');
}
