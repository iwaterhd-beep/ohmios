/**
 * OHMIOS ENERGÍA — Content Loader
 * Carga JSON del CMS y actualiza la web
 */

import { isVideoUrl } from './media-utils.js';

const ICONS = {
  electrico: '<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>',
  renovables: '<circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>',
  solar: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>',
  reformas: '<path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4"/>',
  recarga: '<path d="M5 18h14M12 8v4"/>',
  iluminacion: '<circle cx="12" cy="12" r="5"/>',
  default: '<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>',
};

const VALUE_ICONS = [
  '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  '<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>',
  '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
  '<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>',
  '<path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M9 12l2 2 4-4"/>',
];

let contentCache = null;

export async function initContent() {
  try {
    const [settings, home, services, projects] = await Promise.all([
      fetchJSON('content/settings.json'),
      fetchJSON('content/home.json'),
      fetchJSON('content/services.json'),
      fetchJSON('content/projects.json'),
    ]);

    contentCache = { settings, home, services, projects };
    window.__OHMIOS_CONTENT__ = contentCache;

    applySettings(settings);
    if (document.getElementById('hero')) applyHome(home, services, projects);
    if (document.querySelector('.about-page-intro')) {
      const nosotros = await fetchJSON('content/nosotros.json');
      applyNosotrosPage(nosotros);
    }
    if (document.querySelector('.projects-page__grid')) applyProjectsPage(projects);
    if (document.querySelector('.service-detail')) applyServicesPage(services);

    return contentCache;
  } catch (err) {
    console.warn('CMS content load failed, using static HTML', err);
    return null;
  }
}

export function getContent() {
  return contentCache;
}

async function fetchJSON(path) {
  const name = path.replace(/^content\//, '').replace(/\.json$/, '');

  try {
    const apiRes = await fetch(`/api/content?file=${name}&v=${Date.now()}`);
    if (apiRes.ok) return apiRes.json();
  } catch {
    /* fallback estático */
  }

  const res = await fetch(`/content/${name}.json?v=${Date.now()}`);
  if (!res.ok) throw new Error(`Failed ${path}`);
  return res.json();
}

function mediaElementHTML(url, alt, className = '') {
  if (!url) return '';
  if (isVideoUrl(url)) {
    return `<video class="${className}" src="${esc(url)}" muted loop playsinline autoplay aria-hidden="true"></video>`;
  }
  return `<img class="${className}" src="${esc(url)}" alt="${esc(alt)}" loading="lazy">`;
}

function applySettings(s) {
  document.querySelectorAll('[data-cms="email"]').forEach((el) => {
    el.href = `mailto:${s.email}`;
    if (el.tagName === 'A' && !el.querySelector('svg')) el.textContent = s.email;
  });
  document.querySelectorAll('[data-cms="phone"]').forEach((el) => {
    el.href = `tel:+${s.phoneTel}`;
    if (!el.querySelector('svg')) el.textContent = s.phone;
  });
  document.querySelectorAll('[data-cms="phone-text"]').forEach((el) => {
    el.textContent = s.phone;
  });
  const waText = encodeURIComponent('Hola, me gustaría solicitar información sobre un proyecto.');
  document.querySelectorAll('[data-cms="whatsapp"]').forEach((el) => {
    el.href = `https://wa.me/${s.whatsapp}?text=${waText}`;
  });
  const footerDesc = document.querySelector('.footer__description');
  if (footerDesc && s.footerDescription) footerDesc.textContent = s.footerDescription;
  const schedule = document.querySelector('[data-cms="schedule"]');
  if (schedule && s.schedule) schedule.innerHTML = s.schedule.replace(/\n/g, '<br>');
}

function applyHome(home, services, projects) {
  applyHero(home.hero);
  applyAbout(home.about);
  applyServicesSection(home.servicesSection, services.services);
  applyProjectsSection(home.projectsSection, projects.projects);
  applyValuesSection(home.valuesSection, home.values);
  applyCta(home.cta);
}

function applyHero(hero) {
  const section = document.getElementById('hero');
  if (!section || !hero) return;

  const badge = section.querySelector('.hero__badge');
  if (badge) badge.lastChild.textContent = ` ${hero.badge}`;

  const lines = section.querySelectorAll('.hero__title-word');
  hero.titleLines?.forEach((text, i) => {
    if (lines[i]) {
      lines[i].textContent = text;
      lines[i].classList.toggle('text-gradient', i >= (hero.gradientFromLine ?? 2));
    }
  });

  const subtitle = section.querySelector('.hero__subtitle');
  if (subtitle) subtitle.textContent = hero.subtitle;

  const videoEl = section.querySelector('.hero__video');
  const source = videoEl?.querySelector('source');
  if (videoEl && hero.videoUrl) {
    if (source) source.src = hero.videoUrl;
    else videoEl.src = hero.videoUrl;
    videoEl.load();
    videoEl.play().catch(() => {});
  }
  const fallback = section.querySelector('.hero__image--fallback');
  if (videoEl && hero.posterUrl && !isVideoUrl(hero.posterUrl)) {
    videoEl.poster = hero.posterUrl;
  }
  if (fallback && hero.posterUrl && !isVideoUrl(hero.posterUrl)) {
    fallback.src = hero.posterUrl;
  }

  const stats = section.querySelectorAll('.hero__stat');
  hero.stats?.forEach((stat, i) => {
    const num = stats[i]?.querySelector('[data-counter]');
    if (num) {
      num.dataset.counter = stat.number;
      num.innerHTML = `0<span>${stat.suffix || ''}</span>`;
    }
    const label = stats[i]?.querySelector('.hero__stat-label');
    if (label) label.textContent = stat.label;
  });
}

function applyAbout(about) {
  const section = document.getElementById('nosotros');
  if (!section || !about) return;

  const label = section.querySelector('.section__label');
  if (label) label.textContent = about.label;

  const title = section.querySelector('#about-title');
  if (title) title.innerHTML = `${about.title} <span class="text-gradient">${about.titleHighlight}</span>`;

  const texts = section.querySelectorAll('.about__text');
  about.paragraphs?.forEach((p, i) => { if (texts[i]) texts[i].textContent = p; });

  const wrapper = section.querySelector('.about__image-wrapper');
  if (wrapper && about.image) {
    const overlay = '<div class="about__image-overlay" aria-hidden="true"></div>';
    wrapper.innerHTML = mediaElementHTML(about.image, about.imageAlt || '', 'about__image') + overlay;
  }

  const badgeNum = section.querySelector('.about__badge-number');
  if (badgeNum) {
    badgeNum.dataset.counter = about.badgeNumber;
    badgeNum.innerHTML = `0<span>${about.badgeSuffix || '+'}</span>`;
  }
  const badgeText = section.querySelector('.about__badge-text');
  if (badgeText) badgeText.textContent = about.badgeText;

  const stats = section.querySelectorAll('.about__stat');
  about.stats?.forEach((stat, i) => {
    const num = stats[i]?.querySelector('[data-counter]');
    if (num) {
      num.dataset.counter = stat.number;
      num.innerHTML = `0<span>${stat.suffix || ''}</span>`;
    }
    const label = stats[i]?.querySelector('.about__stat-label');
    if (label) label.textContent = stat.label;
  });
}

function applyServicesSection(meta, items) {
  const section = document.getElementById('servicios');
  if (!section) return;

  if (meta) {
    const label = section.querySelector('.section__label');
    if (label) label.textContent = meta.label;
    const title = section.querySelector('.section__title');
    if (title) title.innerHTML = `${meta.title} <span class="text-gradient">${meta.titleHighlight}</span>`;
    const sub = section.querySelector('.services__subtitle');
    if (sub) sub.textContent = meta.subtitle;
  }

  const grid = section.querySelector('.services__grid');
  if (!grid || !items) return;

  const featured = items.filter((s) => s.featured !== false);
  grid.innerHTML = featured.map((s) => serviceCardHTML(s)).join('');
}

function serviceCardHTML(s) {
  const icon = ICONS[s.id] || ICONS.default;
  return `
    <article class="service-card" data-reveal data-cursor="hover">
      <div class="service-card__glow" aria-hidden="true"></div>
      <div class="service-card__icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">${icon}</svg>
      </div>
      <h3 class="service-card__title">${esc(s.title)}</h3>
      <p class="service-card__desc">${esc(s.description)}</p>
      <a href="${esc(s.link)}" class="service-card__link">Saber más
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </a>
      <span class="service-card__number" aria-hidden="true">${esc(s.number)}</span>
    </article>`;
}

function applyProjectsSection(meta, items) {
  const section = document.getElementById('proyectos');
  if (!section) return;

  if (meta) {
    const label = section.querySelector('.section__label');
    if (label) label.textContent = meta.label;
    const title = section.querySelector('#projects-title');
    if (title) title.innerHTML = `${meta.title} <span class="text-gradient">${meta.titleHighlight}</span>`;
  }

  const grid = section.querySelector('.projects-preview__grid');
  if (!grid || !items) return;

  const featured = items.filter((p) => p.featured !== false);
  grid.innerHTML = featured.map((p) => projectCardHTML(p)).join('');
}

function projectCardHTML(p) {
  const statusClass = p.status === 'progress' ? 'project-card__status--progress' : 'project-card__status--done';
  return `
    <article class="project-card" data-category="${esc(p.category)}" data-reveal data-cursor="hover">
      <div class="project-card__image">
        ${mediaElementHTML(p.image, p.title)}
        <div class="project-card__overlay"></div>
      </div>
      <div class="project-card__content">
        <div class="project-card__meta">
          <span class="project-card__category">${esc(p.categoryLabel)}</span>
          <span class="project-card__status ${statusClass}">${esc(p.statusLabel)}</span>
        </div>
        <h3 class="project-card__title">${esc(p.title)}</h3>
        <p class="project-card__location">${esc(p.location)}</p>
        <p class="project-card__desc">${esc(p.description)}</p>
      </div>
      <div class="project-card__arrow" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
      </div>
    </article>`;
}

function applyValuesSection(meta, values) {
  const section = document.getElementById('valores');
  if (!section) return;

  if (meta) {
    const label = section.querySelector('.section__label');
    if (label) label.textContent = meta.label;
    const title = section.querySelector('#values-title');
    if (title) title.innerHTML = `${meta.title} <span class="text-gradient">${meta.titleHighlight}</span>`;
    const sub = section.querySelector('.values__subtitle');
    if (sub) sub.textContent = meta.subtitle;
  }

  const grid = section.querySelector('.values__grid');
  if (!grid || !values) return;

  grid.innerHTML = values.map((v, i) => {
    const wide = v.wide ? ' value-card--wide' : '';
    const icon = VALUE_ICONS[i] || VALUE_ICONS[0];
    const wideContent = v.wide ? `<div class="value-card__wide-content"><h3 class="value-card__title">${esc(v.title)}</h3><p class="value-card__desc">${esc(v.description)}</p></div>` : `<h3 class="value-card__title">${esc(v.title)}</h3><p class="value-card__desc">${esc(v.description)}</p>`;
    return `
      <article class="value-card${wide}" data-reveal data-cursor="hover">
        <div class="value-card__icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">${icon}</svg></div>
        ${wideContent}
        <div class="value-card__line" aria-hidden="true"></div>
      </article>`;
  }).join('');
}

function applyCta(cta) {
  const section = document.getElementById('contacto-cta');
  if (!section || !cta) return;

  const label = section.querySelector('.section__label');
  if (label) label.textContent = cta.label;

  const title = section.querySelector('#cta-title');
  if (title) title.innerHTML = `${esc(cta.title)}<br>tu <span class="text-gradient">${esc(cta.titleHighlight)}</span>${esc(cta.titleEnd || '?')}`;

  const text = section.querySelector('.cta__text');
  if (text) text.textContent = cta.text;

  const bg = section.querySelector('.cta__bg');
  if (bg && cta.backgroundImage) {
    const overlay = bg.querySelector('.cta__bg-overlay');
    bg.querySelector('.cta__bg-image, .cta__bg-video')?.remove();

    if (isVideoUrl(cta.backgroundImage)) {
      const video = document.createElement('video');
      video.className = 'cta__bg-video';
      video.src = cta.backgroundImage;
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.autoplay = true;
      video.setAttribute('aria-hidden', 'true');
      bg.insertBefore(video, overlay);
      video.play().catch(() => {});
    } else {
      const img = document.createElement('img');
      img.className = 'cta__bg-image';
      img.src = cta.backgroundImage;
      img.alt = '';
      img.loading = 'lazy';
      bg.insertBefore(img, overlay);
    }
  }
}

function applyProjectsPage(projectsData) {
  const grid = document.querySelector('.projects-page__grid');
  if (!grid || !projectsData?.projects) return;

  grid.innerHTML = projectsData.projects.map((p) => projectItemHTML(p)).join('');
}

function projectItemHTML(p) {
  const statusClass = p.status === 'progress' ? 'project-item__status--progress' : 'project-item__status--done';
  return `
    <article class="project-item" data-category="${esc(p.category)}" data-reveal data-cursor="hover"
      data-project-title="${esc(p.title)}" data-project-location="${esc(p.location)}"
      data-project-category="${esc(p.categoryLabel)}" data-project-status="${esc(p.statusLabel)}"
      data-project-desc="${esc(p.description)}" data-project-image="${esc(p.image)}"
      data-project-client="${esc(p.client)}" data-project-year="${esc(p.year)}"
      data-project-area="${esc(p.area)}">
      <div class="project-item__image">
        ${mediaElementHTML(p.image, p.title)}
        <div class="project-item__overlay"></div>
      </div>
      <div class="project-item__view" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h6v6M14 10l6.1-6.1M9 21H3v-6M10 14l-6.1 6.1"/></svg>
      </div>
      <div class="project-item__body">
        <div class="project-item__meta">
          <span class="project-item__category">${esc(p.categoryLabel)}</span>
          <span class="project-item__status ${statusClass}">${esc(p.statusLabel)}</span>
        </div>
        <h3 class="project-item__title">${esc(p.title)}</h3>
        <p class="project-item__location">${esc(p.location)}</p>
      </div>
    </article>`;
}

function applyServicesPage(servicesData) {
  /* Página servicios mantiene HTML estático; el panel edita services.json para la home */
}

const MISSION_ICONS = [
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
];

function applyNosotrosPage(data) {
  if (!data) return;

  const hero = document.querySelector('.page-hero');
  if (hero && data.hero) {
    const label = hero.querySelector('.section__label');
    if (label) label.textContent = data.hero.label;
    const title = hero.querySelector('.page-hero__title');
    if (title) title.innerHTML = `${esc(data.hero.title)} <span class="text-gradient">${esc(data.hero.titleHighlight)}</span>`;
    const subtitle = hero.querySelector('.section__subtitle');
    if (subtitle) subtitle.textContent = data.hero.subtitle;
  }

  const intro = document.querySelector('.about-page-intro');
  if (intro && data.intro) {
    const textCol = intro.querySelector('.about-page-intro__text');
    if (textCol) {
      const label = textCol.querySelector('.section__label');
      if (label) label.textContent = data.intro.label;
      const title = textCol.querySelector('.section__title');
      if (title) title.textContent = data.intro.title;
      const paragraphs = textCol.querySelectorAll('p');
      data.intro.paragraphs?.forEach((p, i) => {
        if (paragraphs[i]) paragraphs[i].textContent = p;
      });
    }
    const visual = intro.querySelector('.about-page-intro__image');
    if (visual && data.intro.image) {
      visual.innerHTML = mediaElementHTML(data.intro.image, data.intro.imageAlt || '');
    }
  }

  const missionGrid = document.querySelector('.about-mission__grid');
  const missionHeader = document.querySelector('.about-mission__header');
  if (data.mission) {
    if (missionHeader) {
      const label = missionHeader.querySelector('.section__label');
      if (label) label.textContent = data.mission.label;
      const title = missionHeader.querySelector('.section__title');
      if (title) title.textContent = data.mission.title;
    }
    if (missionGrid && data.mission.items) {
      missionGrid.innerHTML = data.mission.items.map((item, i) => `
        <article class="mission-card" data-reveal data-cursor="hover">
          <div class="mission-card__icon">${MISSION_ICONS[i] || MISSION_ICONS[0]}</div>
          <h3 class="mission-card__title">${esc(item.title)}</h3>
          <p class="mission-card__desc">${esc(item.description)}</p>
        </article>`).join('');
    }
  }

  const timelineSection = document.querySelector('.about-timeline');
  if (timelineSection && data.timeline) {
    const header = timelineSection.querySelector('.container > div');
    if (header) {
      const label = header.querySelector('.section__label');
      if (label) label.textContent = data.timeline.label;
      const title = header.querySelector('.section__title');
      if (title) title.textContent = data.timeline.title;
    }
    const track = timelineSection.querySelector('.about-timeline__track');
    if (track && data.timeline.items) {
      track.innerHTML = data.timeline.items.map((item) => `
        <article class="timeline-item" data-reveal>
          <span class="timeline-item__year">${esc(item.year)}</span>
          <h3 class="timeline-item__title">${esc(item.title)}</h3>
          <p class="timeline-item__desc">${esc(item.description)}</p>
        </article>`).join('');
    }
  }

  const statsGrid = document.querySelector('.about-stats-banner__grid');
  if (statsGrid && data.stats) {
    statsGrid.innerHTML = data.stats.map((stat) => `
      <div class="about-stats-banner__item" data-reveal>
        <span class="about-stats-banner__number" data-counter="${stat.number}">0<span>${esc(stat.suffix || '')}</span></span>
        <span class="about-stats-banner__label">${esc(stat.label)}</span>
      </div>`).join('');
  }

  const cta = document.querySelector('.page-cta');
  if (cta && data.cta) {
    const title = cta.querySelector('.page-cta__title');
    if (title) title.textContent = data.cta.title;
    const text = cta.querySelector('.page-cta__text');
    if (text) text.textContent = data.cta.text;
    const buttons = cta.querySelectorAll('.page-cta__actions a');
    if (buttons[0]) {
      buttons[0].textContent = data.cta.primaryLabel;
      if (data.cta.primaryLink) buttons[0].href = data.cta.primaryLink;
    }
    if (buttons[1]) {
      buttons[1].textContent = data.cta.secondaryLabel;
      if (data.cta.secondaryLink) buttons[1].href = data.cta.secondaryLink;
    }
  }
}

function esc(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
