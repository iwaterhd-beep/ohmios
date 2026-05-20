/**
 * OHMIOS ENERGÍA — Google Analytics 4
 * Añade tu ID en js/config.js → gaId: 'G-XXXXXXXXXX'
 */

import { SITE } from './config.js';
import { getContent } from './content.js';

function getGaId() {
  const fromCms = getContent()?.settings?.gaId?.trim();
  if (fromCms) return fromCms;
  return SITE.gaId?.trim() || '';
}

export function initAnalytics() {
  const gaId = getGaId();
  if (!gaId) return;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', gaId, { anonymize_ip: true });
}
