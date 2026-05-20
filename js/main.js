/**
 * OHMIOS ENERGÍA — Main Entry Point
 * Initializes all modules and loads HTML components
 */

import { initNavbar } from './navbar.js';
import { initCursor } from './cursor.js';
import { initScrollEffects } from './scroll-effects.js';
import { initAnimations } from './animations.js';
import { initProjects } from './projects.js';
import { initForm } from './form.js';
import { initSchema } from './schema.js';
import { initCookies } from './cookies.js';
import { injectPreloader, hidePreloader, initHeroVideo, hasHeroVideo } from './preloader.js';
import { initContent } from './content.js';

injectPreloader();

/**
 * Load HTML component into a placeholder element
 */
async function loadComponent(placeholderId, componentPath) {
  const placeholder = document.getElementById(placeholderId);
  if (!placeholder) return;

  try {
    const response = await fetch(componentPath);
    if (!response.ok) throw new Error(`Failed to load ${componentPath}`);
    const html = await response.text();
    placeholder.outerHTML = html;
  } catch (error) {
    console.warn(`Component load failed: ${componentPath}`, error);
  }
}

/**
 * Set active nav link based on current page
 */
function setActiveNavLink() {
  const currentPage = window.location.pathname.split('/').pop().replace('.html', '') || 'index';
  const pageKey = currentPage === 'index' || currentPage === '' ? 'index' : currentPage;

  document.querySelectorAll('.nav__link[data-page]').forEach(link => {
    if (link.dataset.page === pageKey) {
      link.classList.add('nav__link--active');
    }
  });
}

/**
 * Initialize Lenis smooth scroll
 */
function initLenis() {
  if (typeof Lenis === 'undefined') return null;

  // Lenis interfiere con autoplay de vídeo en Chrome
  if (hasHeroVideo()) return null;

  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    smoothWheel: true,
  });

  lenis.on('scroll', ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });

  gsap.ticker.lagSmoothing(0);

  return lenis;
}

/**
 * Highlight active service nav link on scroll
 */
function initServicesNav() {
  const navLinks = document.querySelectorAll('.services-nav__link');
  const sections = document.querySelectorAll('.service-detail[id]');

  if (navLinks.length === 0 || sections.length === 0) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navLinks.forEach((link) => {
            link.classList.toggle('is-active', link.getAttribute('href') === `#${id}`);
          });
        }
      });
    },
    { rootMargin: '-40% 0px -55% 0px' }
  );

  sections.forEach((section) => observer.observe(section));
}

/**
 * Load cookie consent banner
 */
async function loadCookieBanner() {
  if (document.getElementById('cookieBanner')) return;
  const wrapper = document.createElement('div');
  wrapper.id = 'cookie-placeholder';
  document.body.appendChild(wrapper);
  await loadComponent('cookie-placeholder', 'components/cookie-banner.html');
}

async function loadWhatsappFloat() {
  if (document.getElementById('whatsappFloat')) return;
  const wrapper = document.createElement('div');
  wrapper.id = 'whatsapp-placeholder';
  document.body.appendChild(wrapper);
  await loadComponent('whatsapp-placeholder', 'components/whatsapp-float.html');
}

/**
 * Main initialization
 */
async function init() {
  // Load shared components
  await loadComponent('header-placeholder', 'components/header.html');

  // Home page sections
  const isHome = document.getElementById('hero-placeholder');
  if (isHome) {
    await loadComponent('hero-placeholder', 'components/hero.html');
    await loadComponent('about-placeholder', 'components/about.html');
    await loadComponent('services-placeholder', 'components/services.html');
    await loadComponent('projects-placeholder', 'components/projects-preview.html');
    await loadComponent('values-placeholder', 'components/values.html');
    await loadComponent('cta-placeholder', 'components/cta.html');
  }

  await loadComponent('footer-placeholder', 'components/footer.html');
  await loadCookieBanner();
  await loadWhatsappFloat();

  // Cargar contenido CMS antes de animaciones
  await initContent();

  // Register GSAP plugins
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
  }

  // Initialize smooth scroll
  const lenis = initLenis();

  // Initialize modules
  initNavbar();
  initCursor();
  initScrollEffects(lenis);
  initAnimations();
  initProjects();
  initForm();
  initSchema();
  initCookies();
  initServicesNav();
  setActiveNavLink();

  hidePreloader();
  document.body.classList.add('is-loaded');
  initHeroVideo();
}

// Run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
