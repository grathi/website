/* ============================================================
   TeeStats — main.js
   ============================================================ */

(function () {
  'use strict';

  /* ----------------------------------------------------------
     Theme: dark / light toggle
     Persists in localStorage, respects prefers-color-scheme on
     first visit.
  ---------------------------------------------------------- */
  const THEME_KEY = 'teestats-theme';
  const html      = document.documentElement;

  function getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }

  function applyTheme(theme) {
    if (theme === 'light') {
      html.setAttribute('data-theme', 'light');
    } else {
      html.removeAttribute('data-theme');
    }
  }

  // On first visit use system preference; afterwards use saved choice
  const saved = localStorage.getItem(THEME_KEY);
  applyTheme(saved || getSystemTheme());

  const themeBtn = document.getElementById('themeToggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const current = html.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
      const next    = current === 'light' ? 'dark' : 'light';
      applyTheme(next);
      localStorage.setItem(THEME_KEY, next);
    });
  }

  // Keep in sync if user changes OS preference while on the page
  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
    if (!localStorage.getItem(THEME_KEY)) {
      applyTheme(e.matches ? 'light' : 'dark');
    }
  });

  /* ----------------------------------------------------------
     Navbar: add .scrolled class on scroll
  ---------------------------------------------------------- */
  const nav = document.querySelector('.nav');

  function onScroll() {
    if (nav) {
      nav.classList.toggle('scrolled', window.scrollY > 40);
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run once on load


  /* ----------------------------------------------------------
     Hamburger menu toggle
  ---------------------------------------------------------- */
  const hamburger  = document.getElementById('hamburger');
  const navMobile  = document.getElementById('navMobile');

  if (hamburger && navMobile) {
    hamburger.addEventListener('click', () => {
      const isOpen = navMobile.classList.toggle('open');
      hamburger.classList.toggle('open', isOpen);
      hamburger.setAttribute('aria-expanded', isOpen);
    });

    // Close menu when a link is tapped on mobile
    navMobile.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navMobile.classList.remove('open');
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', false);
      });
    });
  }


  /* ----------------------------------------------------------
     Smooth scroll for anchor links
  ---------------------------------------------------------- */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });


  /* ----------------------------------------------------------
     Scroll-reveal: [data-animate] → .visible
  ---------------------------------------------------------- */
  const animateEls = document.querySelectorAll('[data-animate]');

  if ('IntersectionObserver' in window && animateEls.length) {
    const revealObs = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // Staggered delay support via data-delay="Xms"
            const delay = entry.target.dataset.delay || '0ms';
            entry.target.style.transitionDelay = delay;
            entry.target.classList.add('visible');
            revealObs.unobserve(entry.target); // fire only once
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    animateEls.forEach(el => revealObs.observe(el));
  } else {
    // Fallback: show everything immediately
    animateEls.forEach(el => el.classList.add('visible'));
  }


  /* ----------------------------------------------------------
     Animated stat counters
     Targets elements like: <span class="stat-number" data-target="50000">0</span>
  ---------------------------------------------------------- */
  function animateCounter(el) {
    const target   = parseInt(el.dataset.target, 10);
    const suffix   = el.dataset.suffix || '';   // e.g. "K+" or "%"
    const duration = parseInt(el.dataset.duration, 10) || 2000;
    const start    = performance.now();

    function easeOutCubic(t) {
      return 1 - Math.pow(1 - t, 3);
    }

    function tick(now) {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const value    = Math.floor(easeOutCubic(progress) * target);
      el.textContent = value.toLocaleString() + suffix;
      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        el.textContent = target.toLocaleString() + suffix;
      }
    }

    requestAnimationFrame(tick);
  }

  const statEls = document.querySelectorAll('.stat-number[data-target]');

  if ('IntersectionObserver' in window && statEls.length) {
    const counterObs = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            counterObs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    statEls.forEach(el => counterObs.observe(el));
  }


  /* ----------------------------------------------------------
     Feature cards: subtle tilt on mouse move (desktop only)
  ---------------------------------------------------------- */
  if (window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.feature-card').forEach(card => {
      card.addEventListener('mousemove', function (e) {
        const rect   = card.getBoundingClientRect();
        const cx     = rect.left + rect.width  / 2;
        const cy     = rect.top  + rect.height / 2;
        const dx     = (e.clientX - cx) / (rect.width  / 2);
        const dy     = (e.clientY - cy) / (rect.height / 2);
        const tiltX  = (-dy * 6).toFixed(2);
        const tiltY  = ( dx * 6).toFixed(2);
        card.style.transform = `perspective(600px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(-4px)`;
      });

      card.addEventListener('mouseleave', function () {
        card.style.transform = '';
      });
    });
  }


  /* ----------------------------------------------------------
     OCR Demo: reveal rows when card enters viewport
  ---------------------------------------------------------- */
  const ocrCard = document.querySelector('.ocr-demo-card');
  if (ocrCard && 'IntersectionObserver' in window) {
    const ocrObs = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll('.ocr-grid-row').forEach((row, i) => {
              setTimeout(() => {
                row.style.opacity = '1';
                row.style.transform = 'none';
              }, i * 130);
            });
            ocrObs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    ocrObs.observe(ocrCard);
  }


  /* ----------------------------------------------------------
     Course Finder demo: tee chip selection
  ---------------------------------------------------------- */
  document.querySelectorAll('.cf-tee-chip').forEach(chip => {
    chip.addEventListener('click', function () {
      const siblings = this.closest('.cf-tee-chips').querySelectorAll('.cf-tee-chip');
      siblings.forEach(s => s.classList.remove('cf-tee-selected'));
      this.classList.add('cf-tee-selected');
    });
  });

  /* Course Finder demo: result row selection */
  document.querySelectorAll('.cf-result').forEach(result => {
    result.addEventListener('click', function () {
      const siblings = this.closest('.cf-result-list').querySelectorAll('.cf-result');
      siblings.forEach(s => s.classList.remove('cf-result-active'));
      this.classList.add('cf-result-active');
    });
  });


  /* ----------------------------------------------------------
     Start Round demo: tee chip selection
  ---------------------------------------------------------- */
  document.querySelectorAll('.sr-chip').forEach(chip => {
    chip.addEventListener('click', function () {
      const siblings = this.closest('.sr-tee-chips').querySelectorAll('.sr-chip');
      siblings.forEach(s => s.classList.remove('sr-chip-active'));
      this.classList.add('sr-chip-active');
    });
  });


  /* ----------------------------------------------------------
     App Store / Google Play buttons: ripple effect on click
  ---------------------------------------------------------- */
  document.querySelectorAll('.store-btn').forEach(btn => {
    btn.addEventListener('click', function (e) {
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      const rect = btn.getBoundingClientRect();
      ripple.style.cssText = `
        left: ${e.clientX - rect.left}px;
        top:  ${e.clientY - rect.top}px;
      `;
      btn.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove());
    });
  });


  /* ----------------------------------------------------------
     Floating notification cards: pause animation on hover
  ---------------------------------------------------------- */
  document.querySelectorAll('.float-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.style.animationPlayState = 'paused';
    });
    card.addEventListener('mouseleave', () => {
      card.style.animationPlayState = 'running';
    });
  });


  /* ----------------------------------------------------------
     Contact Modal
  ---------------------------------------------------------- */
  const modal      = document.getElementById('contactModal');
  const modalClose = document.getElementById('modalClose');
  const contactForm = document.getElementById('contactForm');

  function openModal() {
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    // Focus first input after transition
    setTimeout(() => {
      const first = modal.querySelector('input, select, textarea');
      if (first) first.focus();
    }, 350);
  }

  function closeModal() {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }

  // Open via footer Contact link
  document.querySelectorAll('.open-contact').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      openModal();
    });
  });

  // Close via X button or backdrop click
  if (modalClose) modalClose.addEventListener('click', closeModal);
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
  });

  // Form submission → builds mailto: link
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      // Validate
      let valid = true;
      contactForm.querySelectorAll('[required]').forEach(field => {
        const group = field.closest('.form-group');
        const isEmpty = !field.value.trim();
        const isInvalidEmail = field.type === 'email' && field.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value);
        if (isEmpty || isInvalidEmail) {
          group.classList.add('invalid');
          valid = false;
        } else {
          group.classList.remove('invalid');
        }
      });
      if (!valid) return;

      const name    = document.getElementById('cf-name').value.trim();
      const email   = document.getElementById('cf-email').value.trim();
      const subject = document.getElementById('cf-subject').value;
      const message = document.getElementById('cf-message').value.trim();

      const mailSubject = encodeURIComponent(`[TeeStats] ${subject} — from ${name}`);
      const mailBody    = encodeURIComponent(
        `Name: ${name}\nEmail: ${email}\n\n${message}`
      );
      const mailTo = `no-reply@teestats.app?subject=${mailSubject}&body=${mailBody}`;

      // Show success state
      contactForm.style.display = 'none';
      const note = modal.querySelector('.modal-note');
      if (note) note.style.display = 'none';

      let successEl = modal.querySelector('.modal-success');
      if (!successEl) {
        successEl = document.createElement('div');
        successEl.className = 'modal-success';
        successEl.innerHTML = `
          <div class="modal-success-icon">✅</div>
          <h3>Opening your mail app…</h3>
          <p>Your message has been prepared. Your default mail app will open with everything filled in.</p>
        `;
        modal.querySelector('.modal').appendChild(successEl);
      }
      successEl.classList.add('show');

      // Open mailto after a short delay so user sees the success state
      setTimeout(() => {
        window.location.href = `mailto:${mailTo}`;
      }, 600);

      // Auto-close modal after 3s and reset
      setTimeout(() => {
        closeModal();
        setTimeout(() => {
          contactForm.reset();
          contactForm.style.display = '';
          if (note) note.style.display = '';
          successEl.classList.remove('show');
          contactForm.querySelectorAll('.form-group').forEach(g => g.classList.remove('invalid'));
        }, 400);
      }, 3000);
    });

    // Clear invalid state on input
    contactForm.querySelectorAll('input, textarea').forEach(field => {
      field.addEventListener('input', () => {
        field.closest('.form-group').classList.remove('invalid');
      });
    });
  }

})();
