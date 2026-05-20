/**
 * OHMIOS ENERGÍA — Google Analytics 4
 * Añade tu ID en js/config.js → gaId: 'G-XXXXXXXXXX'
 */

import { SITE } from './config.js';

export function initAnalytics() {
  if (!SITE.gaId) return;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${SITE.gaId}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', SITE.gaId, { anonymize_ip: true });
}
