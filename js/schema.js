/**
 * OHMIOS ENERGÍA — Structured Data (JSON-LD)
 */

import { SITE } from './config.js';

const PAGE_LABELS = {
  index: 'Inicio',
  'sobre-nosotros': 'Nosotros',
  servicios: 'Servicios',
  proyectos: 'Proyectos',
  contacto: 'Contacto',
  'aviso-legal': 'Aviso legal',
  privacidad: 'Privacidad',
  cookies: 'Cookies',
};

export function initSchema() {
  if (document.getElementById('schema-org')) return;

  const graph = [getLocalBusinessSchema()];

  const breadcrumbs = getBreadcrumbSchema();
  if (breadcrumbs) graph.push(breadcrumbs);

  if (document.getElementById('hero')) {
    graph.push({
      '@type': 'WebSite',
      '@id': `${SITE.url}/#website`,
      name: SITE.name,
      url: SITE.url,
      publisher: { '@id': `${SITE.url}/#organization` },
      inLanguage: 'es-ES',
    });
  }

  const faq = getFaqSchema();
  if (faq) graph.push(faq);

  const script = document.createElement('script');
  script.id = 'schema-org';
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': graph,
  });
  document.head.appendChild(script);
}

function getLocalBusinessSchema() {
  return {
    '@type': 'ElectricalContractor',
    '@id': `${SITE.url}/#organization`,
    name: SITE.name,
    legalName: SITE.legalName,
    description: 'Instalaciones eléctricas, energías renovables, placas solares y reformas integrales en Sevilla.',
    url: SITE.url,
    logo: `${SITE.url}${SITE.logo}`,
    image: SITE.ogImage,
    email: SITE.email,
    telephone: SITE.phone,
    address: {
      '@type': 'PostalAddress',
      addressLocality: SITE.city,
      addressRegion: 'Andalucía',
      addressCountry: 'ES',
    },
    areaServed: {
      '@type': 'City',
      name: 'Sevilla',
    },
    priceRange: '€€',
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '08:00',
        closes: '19:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: 'Saturday',
        opens: '09:00',
        closes: '14:00',
      },
    ],
    sameAs: [],
  };
}

function getCurrentPageKey() {
  const page = window.location.pathname.split('/').pop().replace('.html', '') || 'index';
  return page === '' ? 'index' : page;
}

function getBreadcrumbSchema() {
  const pageKey = getCurrentPageKey();
  if (pageKey === 'index') return null;

  const label = PAGE_LABELS[pageKey] || document.title.split('|')[0]?.trim() || pageKey;
  const pageUrl = pageKey === 'index' ? `${SITE.url}/` : `${SITE.url}/${pageKey}`;

  return {
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Inicio',
        item: `${SITE.url}/`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: label,
        item: pageUrl,
      },
    ],
  };
}

function getFaqSchema() {
  const items = document.querySelectorAll('.contact-faq .faq-item');
  if (!items.length) return null;

  return {
    '@type': 'FAQPage',
    mainEntity: [...items].map((item) => ({
      '@type': 'Question',
      name: item.querySelector('.faq-item__question')?.textContent?.trim(),
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.querySelector('.faq-item__answer')?.textContent?.trim(),
      },
    })),
  };
}
