/* =========================================================================
   OldACBuySell — script.js
   Vanilla JavaScript only. No frameworks, no build step.

   Contents
   1.  Business configuration (single source of truth)
   2.  Small helpers
   3.  Apply business config to the DOM
   4.  Icon setup
   5.  Sticky header shadow
   6.  Mobile navigation
   7.  FAQ accordion
   8.  Quote form validation + WhatsApp message
   9.  Scroll-reveal animations (IntersectionObserver)
   10. Marquee duplicate-link cleanup
   11. Image error fallback
   12. Init
   ========================================================================= */

(function () {
  'use strict';

  /* =======================================================================
     1. BUSINESS CONFIGURATION
     -----------------------------------------------------------------------
     Change the business details in this ONE object.

     IMPORTANT: `whatsapp` must be in international format WITHOUT the "+"
     sign, spaces or brackets. Example: 919076425356
     ======================================================================= */
  const BUSINESS = {
    name: 'OldACBuySell',
    phoneDisplay: '+91 90764 25356',
    phoneDial: '+919076425356',
    whatsapp: '919076425356',
    location: 'Mumbai, Maharashtra, India'
  };

  /* Default WhatsApp message used by every generic WhatsApp link. */
  const DEFAULT_WA_MESSAGE =
    'Hi ' + BUSINESS.name + ', I would like to enquire about selling my old AC.';

  /* =======================================================================
     2. SMALL HELPERS
     ======================================================================= */

  /**
   * Build a WhatsApp deep link with a pre-filled message.
   * @param {string} [message]
   * @returns {string}
   */
  function buildWhatsAppUrl(message) {
    const text = (message && String(message).trim()) || DEFAULT_WA_MESSAGE;
    return 'https://wa.me/' + BUSINESS.whatsapp + '?text=' + encodeURIComponent(text);
  }

  /** Safe querySelectorAll -> array */
  function qsa(selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  }

  /* =======================================================================
     3. APPLY BUSINESS CONFIG TO THE DOM
     ======================================================================= */
  function applyBusinessConfig() {
    // tel: links
    qsa('[data-phone-link]').forEach(function (el) {
      el.setAttribute('href', 'tel:' + BUSINESS.phoneDial);
    });

    // Displayed phone number text
    qsa('[data-phone-text]').forEach(function (el) {
      el.textContent = BUSINESS.phoneDisplay;
    });

    // WhatsApp links
    qsa('[data-whatsapp-link]').forEach(function (el) {
      const message = el.getAttribute('data-wa-message') || DEFAULT_WA_MESSAGE;
      el.setAttribute('href', buildWhatsAppUrl(message));
      el.setAttribute('target', '_blank');
      el.setAttribute('rel', 'noopener noreferrer');
    });

    // Automatic copyright year
    const yearEl = document.getElementById('year');
    if (yearEl) {
      yearEl.textContent = String(new Date().getFullYear());
    }
  }

  /* =======================================================================
     4. ICON SETUP (Lucide)
     ======================================================================= */
  function initIcons() {
    if (typeof window.lucide === 'undefined' || !window.lucide.createIcons) {
      return; // CDN blocked or offline — layout still works without icons.
    }

    try {
      window.lucide.createIcons();
    } catch (error) {
      console.warn('Lucide icons could not be rendered:', error);
      return;
    }

    qsa('svg.lucide').forEach(function (svg) {
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('focusable', 'false');
    });
  }

  /* =======================================================================
     5. STICKY HEADER SHADOW
     ======================================================================= */
  function initHeaderScroll() {
    const header = document.getElementById('siteHeader');
    if (!header) return;

    let ticking = false;

    function update() {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });

    update();
  }

  /* =======================================================================
     6. MOBILE NAVIGATION
     ======================================================================= */
  function initNavigation() {
    const toggle = document.getElementById('navToggle');
    const nav = document.getElementById('primaryNav');
    if (!toggle || !nav) return;

    const DESKTOP_BREAKPOINT = 992;

    function isOpen() { return nav.classList.contains('is-open'); }

    function openNav() {
      nav.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Close navigation menu');
    }

    function closeNav() {
      if (!isOpen()) return;
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open navigation menu');
    }

    toggle.addEventListener('click', function () {
      isOpen() ? closeNav() : openNav();
    });

    nav.addEventListener('click', function (event) {
      if (event.target.closest('a')) closeNav();
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && isOpen()) {
        closeNav();
        toggle.focus();
      }
    });

    document.addEventListener('click', function (event) {
      if (!isOpen()) return;
      if (nav.contains(event.target) || toggle.contains(event.target)) return;
      closeNav();
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth >= DESKTOP_BREAKPOINT) closeNav();
    });
  }

  /* =======================================================================
     7. FAQ ACCORDION (accessible, single-open)
     ======================================================================= */
  function initFaq() {
    const buttons = qsa('.faq-btn');
    if (!buttons.length) return;

    buttons.forEach(function (button) {
      button.addEventListener('click', function () {
        const panelId = button.getAttribute('aria-controls');
        const panel = panelId ? document.getElementById(panelId) : null;
        const currentlyOpen = button.getAttribute('aria-expanded') === 'true';

        buttons.forEach(function (other) {
          if (other === button) return;
          other.setAttribute('aria-expanded', 'false');
          const otherPanelId = other.getAttribute('aria-controls');
          const otherPanel = otherPanelId ? document.getElementById(otherPanelId) : null;
          if (otherPanel) otherPanel.hidden = true;
        });

        button.setAttribute('aria-expanded', currentlyOpen ? 'false' : 'true');
        if (panel) panel.hidden = currentlyOpen;
      });
    });
  }

  /* =======================================================================
     8. QUOTE FORM — VALIDATION + WHATSAPP MESSAGE
     ======================================================================= */
  function initQuoteForm() {
    const form = document.getElementById('quoteForm');
    if (!form) return;

    const statusEl = document.getElementById('formStatus');

    const validators = {
      fullName: function (value) {
        const v = String(value).trim();
        if (!v) return 'Please enter your full name.';
        if (v.length < 2) return 'Name must be at least 2 characters long.';
        if (!/^[A-Za-z\u0900-\u097F][A-Za-z\u0900-\u097F\s.'-]*$/.test(v)) {
          return 'Please enter a valid name.';
        }
        return '';
      },

      mobile: function (value) {
        const raw = String(value).trim();
        if (!raw) return 'Please enter your mobile number.';

        let digits = raw.replace(/\D/g, '');

        if (digits.length === 12 && digits.indexOf('91') === 0) {
          digits = digits.slice(2);
        } else if (digits.length === 11 && digits.charAt(0) === '0') {
          digits = digits.slice(1);
        }

        if (!/^[6-9]\d{9}$/.test(digits)) {
          return 'Enter a valid 10-digit Indian mobile number.';
        }
        return '';
      },

      acType: function (value) {
        return String(value).trim() ? '' : 'Please select the AC type.';
      },

      acCondition: function (value) {
        return String(value).trim() ? '' : 'Please select the AC condition.';
      },

      location: function (value) {
        const v = String(value).trim();
        if (!v) return 'Please enter your location in Mumbai.';
        if (v.length < 2) return 'Please enter a valid location.';
        return '';
      }
    };

    const fieldNames = Object.keys(validators);

    function setFieldError(name, message) {
      const input = document.getElementById(name);
      const errorEl = document.getElementById('err-' + name);
      const field = input ? input.closest('.field') : null;

      if (errorEl) errorEl.textContent = message || '';

      if (input) {
        if (message) {
          input.setAttribute('aria-invalid', 'true');
        } else {
          input.removeAttribute('aria-invalid');
        }
      }

      if (field) field.classList.toggle('has-error', Boolean(message));
    }

    function validateField(name) {
      const input = document.getElementById(name);
      if (!input) return true;
      const message = validators[name](input.value);
      setFieldError(name, message);
      return !message;
    }

    fieldNames.forEach(function (name) {
      const input = document.getElementById(name);
      if (!input) return;

      input.addEventListener('blur', function () { validateField(name); });

      input.addEventListener('input', function () {
        const field = input.closest('.field');
        if (field && field.classList.contains('has-error')) validateField(name);
      });
    });

    function buildMessage(data) {
      return [
        'New AC Selling Enquiry — ' + BUSINESS.name,
        '',
        'Name: ' + data.fullName,
        'Mobile: ' + data.mobile,
        'AC Type: ' + data.acType,
        'AC Condition: ' + data.acCondition,
        'Location in Mumbai: ' + data.location,
        'Additional Details: ' + (data.details || '—')
      ].join('\n');
    }

    function showStatus(url) {
      if (!statusEl) return;
      statusEl.hidden = false;
      statusEl.textContent = 'Opening WhatsApp with your AC details… ';

      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = 'Tap here if WhatsApp did not open.';
      statusEl.appendChild(link);
    }

    function hideStatus() {
      if (!statusEl) return;
      statusEl.hidden = true;
      statusEl.textContent = '';
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      hideStatus();

      let firstInvalid = null;

      fieldNames.forEach(function (name) {
        const isValid = validateField(name);
        if (!isValid && !firstInvalid) {
          firstInvalid = document.getElementById(name);
        }
      });

      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }

      const data = {
        fullName: document.getElementById('fullName').value.trim(),
        mobile: document.getElementById('mobile').value.trim(),
        acType: document.getElementById('acType').value,
        acCondition: document.getElementById('acCondition').value,
        location: document.getElementById('location').value.trim(),
        details: document.getElementById('details')
          ? document.getElementById('details').value.trim()
          : ''
      };

      const url = buildWhatsAppUrl(buildMessage(data));

      const opened = window.open(url, '_blank', 'noopener,noreferrer');
      if (opened) opened.opener = null;

      showStatus(url);
    });
  }

  /* =======================================================================
     9. SCROLL-REVEAL ANIMATIONS
     Adds .is-visible to [data-reveal] elements once they enter the viewport.
     Falls back to showing everything if IntersectionObserver is unavailable.
     ======================================================================= */
  function initScrollReveal() {
    const elements = qsa('[data-reveal]');
    if (!elements.length) return;

    const prefersReduced =
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // No observer or user prefers reduced motion: just show everything.
    if (!('IntersectionObserver' in window) || prefersReduced) {
      elements.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -60px 0px'
    });

    elements.forEach(function (el) { observer.observe(el); });
  }

  /* =======================================================================
     10. MARQUEE DUPLICATE-LINK CLEANUP
     The second set of service cards exists only for the seamless visual
     loop. It is marked aria-hidden in HTML — here we also remove its links
     from the keyboard tab order so keyboard users are not sent through the
     same four links twice.
     ======================================================================= */
  function initMarqueeAccessibility() {
    const marquee = document.querySelector('[data-marquee]');
    if (!marquee) return;

    // The duplicate set is the second half of the track.
    const track = marquee.querySelector('.services-track');
    if (!track) return;

    const cards = Array.prototype.slice.call(track.children);
    const half = Math.floor(cards.length / 2);

    cards.slice(half).forEach(function (card) {
      card.setAttribute('aria-hidden', 'true');
      qsa('a, button', card).forEach(function (el) {
        el.setAttribute('tabindex', '-1');
      });
    });
  }

  /* =======================================================================
     11. IMAGE ERROR FALLBACK
     Keeps the layout intact if an external image fails to load.
     ======================================================================= */
  function initImageFallback() {
    qsa('img').forEach(function (img) {
      img.addEventListener('error', function () {
        img.style.visibility = 'hidden';
      });
    });
  }

  /* =======================================================================
     12. INIT
     ======================================================================= */
  function init() {
    applyBusinessConfig();
    initIcons();
    initHeaderScroll();
    initNavigation();
    initFaq();
    initQuoteForm();
    initScrollReveal();
    initMarqueeAccessibility();
    initImageFallback();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();