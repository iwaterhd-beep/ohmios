/**
 * OHMIOS ENERGÍA — Structured Data (JSON-LD)
 */

import { SITE } from './config.js';

export function initSchema() {
  const existing = document.getElementById('schema-org');
  if (existing) return;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ElectricalContractor',
    name: SITE.name,
    description: 'Instalaciones eléctricas, energías renovables, placas solares y reformas integrales en Sevilla.',
    url: SITE.url,
    email: SITE.email,
    telephone: SITE.phone,
    address: {
      '@type': 'PostalAddress',
      addressLocality: SITE.city,
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

  const script = document.createElement('script');
  script.id = 'schema-org';
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(schema);
  document.head.appendChild(script);
}
