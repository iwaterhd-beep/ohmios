/**
 * OHMIOS ENERGÍA — Navbar Module
 * Handles sticky header, mobile menu, and scroll behavior
 */

export function initNavbar() {
  const header = document.getElementById('header');
  const navToggle = document.getElementById('navToggle');
  const navOverlay = document.getElementById('navOverlay');

  if (!header) return;

  // Sticky header on scroll
  let lastScroll = 0;

  function handleScroll() {
    const currentScroll = window.scrollY;

    if (currentScroll > 80) {
      header.classList.add('header--scrolled');
    } else {
      header.classList.remove('header--scrolled');
    }

    lastScroll = currentScroll;
  }

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  // Mobile menu toggle
  if (navToggle && navOverlay) {
    navToggle.addEventListener('click', () => {
      const isOpen = navToggle.classList.toggle('nav__toggle--active');
      navOverlay.classList.toggle('nav__overlay--open', isOpen);
      navToggle.setAttribute('aria-expanded', isOpen);
      navOverlay.setAttribute('aria-hidden', !isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Close menu on link click
    navOverlay.querySelectorAll('.nav__link, .btn').forEach(link => {
      link.addEventListener('click', () => {
        navToggle.classList.remove('nav__toggle--active');
        navOverlay.classList.remove('nav__overlay--open');
        navToggle.setAttribute('aria-expanded', 'false');
        navOverlay.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      });
    });

    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navOverlay.classList.contains('nav__overlay--open')) {
        navToggle.click();
      }
    });
  }
}
