/**
 * OHMIOS ENERGÍA — Cookie consent banner
 */

import { initAnalytics } from './analytics.js';

const STORAGE_KEY = 'ohmios-cookie-consent';

export function initCookies() {
  const banner = document.getElementById('cookieBanner');
  const acceptBtn = document.getElementById('cookieAccept');

  if (!banner || !acceptBtn) return;

  if (localStorage.getItem(STORAGE_KEY)) {
    initAnalytics();
    return;
  }

  banner.classList.add('cookie-banner--visible');
  banner.setAttribute('aria-hidden', 'false');

  acceptBtn.addEventListener('click', () => {
    localStorage.setItem(STORAGE_KEY, 'accepted');
    banner.classList.remove('cookie-banner--visible');
    banner.setAttribute('aria-hidden', 'true');
    initAnalytics();
  });
}
