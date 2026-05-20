/**
 * OHMIOS CMS — Admin Panel
 */

const TOKEN_KEY = 'ohmios_admin_token';
const TITLES = {
  settings: 'Configuración general',
  home: 'Página de inicio',
  nosotros: 'Página Nosotros',
  services: 'Servicios',
  projects: 'Proyectos',
};

let state = {
  settings: null,
  home: null,
  nosotros: null,
  services: null,
  projects: null,
};
let activeTab = 'settings';

// ── Auth ──
const loginScreen = document.getElementById('loginScreen');
const adminApp = document.getElementById('adminApp');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const loginSubmit = document.getElementById('loginSubmit');

function showLoginError(message) {
  if (!loginError) return;
  loginError.textContent = message;
  loginError.hidden = false;
}

function clearLoginError() {
  if (!loginError) return;
  loginError.textContent = '';
  loginError.hidden = true;
}

function setLoginLoading(isLoading) {
  if (!loginSubmit) return;
  loginSubmit.disabled = isLoading;
  loginSubmit.textContent = isLoading ? 'Entrando…' : 'Entrar al panel';
}

function getToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
  sessionStorage.setItem(TOKEN_KEY, token);
}

function logout(clearError = true) {
  sessionStorage.removeItem(TOKEN_KEY);
  showLoginView();
  if (clearError) clearLoginError();
  setLoginLoading(false);
}

function showLoginView() {
  if (adminApp) adminApp.setAttribute('hidden', '');
  if (loginScreen) loginScreen.removeAttribute('hidden');
}

function showDashboardView() {
  if (loginScreen) loginScreen.setAttribute('hidden', '');
  if (adminApp) adminApp.removeAttribute('hidden');
}

async function api(path, options = {}) {
  const headers = { ...options.headers };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const isFormData = options.body instanceof FormData;
  if (!isFormData && options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(path, { ...options, headers });
  const raw = await res.text();
  let data = {};
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    data = { error: raw?.slice(0, 200) || `HTTP ${res.status}` };
  }

  if (!res.ok) {
    throw new Error(data.error || `Error del servidor (HTTP ${res.status})`);
  }
  return data;
}

loginForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearLoginError();
  setLoginLoading(true);

  const email = document.getElementById('email')?.value.trim() || '';
  const password = document.getElementById('password')?.value || '';

  if (!email || !password) {
    showLoginError('Introduce email y contraseña.');
    setLoginLoading(false);
    return;
  }

  try {
    const { token } = await api('/api/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (!token) throw new Error('Respuesta inválida del servidor.');
    setToken(token);
    await bootDashboard();
  } catch (err) {
    logout(false);
    showLoginError(err.message || 'No se pudo entrar. Inténtalo de nuevo.');
    setLoginLoading(false);
  }
});

document.getElementById('logoutBtn')?.addEventListener('click', logout);

// ── Boot ──
async function bootDashboard() {
  const [settings, home, nosotros, services, projects] = await Promise.all([
    loadJSON('settings'),
    loadJSON('home'),
    loadJSON('nosotros'),
    loadJSON('services'),
    loadJSON('projects'),
  ]);

  state = { settings, home, nosotros, services, projects };
  renderAll();
  showDashboardView();
  setLoginLoading(false);
}

async function loadJSON(name) {
  const res = await fetch(`/api/content?file=${name}&v=${Date.now()}`);
  let data = null;
  if (res.ok) data = await res.json();

  let repo = null;
  try {
    const repoRes = await fetch(`/content/${name}.json?v=${Date.now()}`);
    if (repoRes.ok) repo = await repoRes.json();
  } catch {
    /* fallback */
  }

  if (!data && repo) return repo;
  if (!data) throw new Error(`No se pudo cargar ${name}.json`);
  if (name === 'home' && data.hero) {
    data.hero = migrateHeroFields({ ...data.hero });
  }
  if (repo && name === 'home') return mergeHomeContent(repo, data);
  return data;
}

function mergeHomeContent(repo, data) {
  return {
    ...repo,
    ...data,
    hero: { ...repo.hero, ...data.hero, titleLines: data.hero?.titleLines || repo.hero?.titleLines || ['', '', '', ''] },
    about: { ...repo.about, ...data.about },
    cta: { ...repo.cta, ...data.cta },
    servicesSection: { ...repo.servicesSection, ...data.servicesSection },
    projectsSection: { ...repo.projectsSection, ...data.projectsSection },
    valuesSection: { ...repo.valuesSection, ...data.valuesSection },
    values: data.values?.length ? data.values : repo.values,
  };
}

function migrateHeroFields(hero) {
  if (!hero.backgroundMedia) {
    hero.backgroundMedia = hero.videoUrl?.trim() || hero.posterUrl?.trim() || '';
  }
  return hero;
}

if (getToken()) {
  setLoginLoading(true);
  bootDashboard().catch((err) => {
    logout(false);
    showLoginError(err.message || 'Sesión expirada. Vuelve a entrar.');
  });
} else if (loginSubmit) {
  loginSubmit.disabled = false;
}

// ── Navigation ──
document.getElementById('adminNav')?.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-tab]');
  if (!btn) return;
  activeTab = btn.dataset.tab;

  document.querySelectorAll('.admin-nav__item').forEach((el) => {
    el.classList.toggle('is-active', el === btn);
  });
  document.querySelectorAll('.admin-panel').forEach((el) => {
    el.classList.toggle('is-active', el.dataset.panel === activeTab);
  });
  document.getElementById('panelTitle').textContent = TITLES[activeTab];
});

// ── Save ──
document.getElementById('saveBtn')?.addEventListener('click', async () => {
  const status = document.getElementById('adminStatus');
  const btn = document.getElementById('saveBtn');

  collectFormData();

  btn.disabled = true;
  btn.textContent = 'Guardando…';
  status.hidden = true;

  try {
    await api(`/api/content?file=${activeTab}`, {
      method: 'PUT',
      body: JSON.stringify(state[activeTab]),
    });
    showStatus('success', '✓ Guardado. Los cambios son instantáneos en la web.');
  } catch (err) {
    showStatus('error', err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Guardar cambios';
  }
});

function showStatus(type, msg) {
  const status = document.getElementById('adminStatus');
  status.className = `admin-status admin-status--${type}`;
  status.textContent = msg;
  status.hidden = false;
}

// ── Render ──
function renderAll() {
  try {
    renderSettings();
    renderHome();
    renderNosotros();
    renderServices();
    renderProjects();
  } catch (err) {
    throw new Error(`Error al cargar el panel: ${err.message}`);
  }
}

function field(label, id, value = '', type = 'text', full = false) {
  const cls = full ? 'admin-field admin-field--full' : 'admin-field';
  if (type === 'textarea') {
    return `<div class="${cls}"><label class="admin-label">${label}</label><textarea class="admin-textarea" data-field="${id}">${esc(value)}</textarea></div>`;
  }
  return `<div class="${cls}"><label class="admin-label">${label}</label><input class="admin-input" type="${type}" data-field="${id}" value="${esc(value)}"></div>`;
}

function isVideoUrl(url) {
  if (!url) return false;
  return /\.(mp4|webm|mov|m4v|ogg)(\?|#|$)/i.test(url) || /\/video\//i.test(url);
}

function mediaPreviewHTML(url) {
  if (!url) return '';
  if (isVideoUrl(url)) {
    return `<video class="admin-media-preview" src="${esc(url)}" muted loop playsinline autoplay></video>`;
  }
  return `<img class="admin-media-preview" src="${esc(url)}" alt="">`;
}

function updateMediaPreviewBox(box, url, placeholder = '') {
  if (!box) return;
  box.innerHTML = url
    ? mediaPreviewHTML(url)
    : `<span class="admin-media-placeholder">${placeholder || 'Ningún archivo — pulsa «Subir archivo»'}</span>`;
  const video = box.querySelector('video');
  if (video) video.play().catch(() => {});
}

function mediaField(label, id, url, placeholder = '') {
  const previewId = id.replace(/\./g, '-');
  const hasMedia = Boolean(url);
  return `
    <div class="admin-field admin-field--full">
      <label class="admin-label">${label}</label>
      <div class="admin-media-field">
        <div class="admin-media-preview-box" id="${previewId}-preview">
          ${hasMedia ? mediaPreviewHTML(url) : `<span class="admin-media-placeholder">${placeholder || 'Ningún archivo — pulsa «Subir archivo»'}</span>`}
        </div>
        <div class="admin-media-controls">
          <input type="hidden" data-field="${id}" value="${esc(url || '')}">
          <div class="admin-media-actions">
            <label class="admin-upload-btn">
              <input type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime" data-upload="${id}" hidden>
              Subir archivo
            </label>
            <button type="button" class="admin-upload-btn admin-upload-btn--ghost" data-clear-media="${id}" ${hasMedia ? '' : 'hidden'}>
              Quitar
            </button>
          </div>
          <small class="admin-media-hint">Imagen (JPG, PNG, WebP) o vídeo (MP4, WebM). Se sube automáticamente.</small>
        </div>
      </div>
    </div>`;
}

function renderSettings() {
  const s = state.settings;
  document.getElementById('panel-settings').innerHTML = `
    <div class="admin-card">
      <h3 class="admin-card__title">Datos de contacto</h3>
      <div class="admin-grid">
        ${field('Nombre del sitio', 'siteName', s.siteName)}
        ${field('Email', 'email', s.email, 'email')}
        ${field('Teléfono', 'phone', s.phone)}
        ${field('Teléfono (solo números)', 'phoneTel', s.phoneTel)}
        ${field('WhatsApp (solo números)', 'whatsapp', s.whatsapp)}
        ${field('Ciudad', 'city', s.city)}
        ${field('Horario', 'schedule', s.schedule, 'textarea', true)}
        ${field('Descripción footer', 'footerDescription', s.footerDescription, 'textarea', true)}
      </div>
    </div>
    <div class="admin-card">
      <h3 class="admin-card__title">Redes sociales y analítica</h3>
      <div class="admin-grid">
        ${field('Instagram (URL completa)', 'instagram', s.instagram || '', 'url')}
        ${field('LinkedIn (URL completa)', 'linkedin', s.linkedin || '', 'url')}
        ${field('Google Analytics 4 (ID)', 'gaId', s.gaId || '', 'text')}
      </div>
      <small style="color:var(--muted);font-size:0.75rem;display:block;margin-top:0.75rem">
        GA4: crea una propiedad en Google Analytics y pega el ID <code>G-XXXXXXXXXX</code>. Solo se activa tras aceptar cookies.
      </small>
    </div>`;
  bindFields('panel-settings');
}

function renderHome() {
  const h = state.home;
  const hero = h.hero || {};
  const about = h.about || {};
  const titleLines = hero.titleLines || ['', '', '', ''];
  const stats = hero.stats || [{ number: 0, suffix: '', label: '' }, { number: 0, suffix: '', label: '' }, { number: 0, suffix: '', label: '' }];
  const paragraphs = about.paragraphs || ['', ''];

  document.getElementById('panel-home').innerHTML = `
    <div class="admin-card">
      <h3 class="admin-card__title">Hero (cabecera)</h3>
      <div class="admin-grid">
        ${field('Badge', 'hero.badge', hero.badge || '')}
        ${field('Título línea 1', 'hero.titleLines.0', titleLines[0])}
        ${field('Título línea 2', 'hero.titleLines.1', titleLines[1])}
        ${field('Título línea 3', 'hero.titleLines.2', titleLines[2])}
        ${field('Título línea 4', 'hero.titleLines.3', titleLines[3])}
        ${field('Subtítulo', 'hero.subtitle', hero.subtitle || '', 'textarea', true)}
        ${mediaField('Fondo del hero (foto o vídeo)', 'hero.backgroundMedia', hero.backgroundMedia || hero.videoUrl || hero.posterUrl || '')}
      </div>
    </div>
    <div class="admin-card">
      <h3 class="admin-card__title">Estadísticas hero</h3>
      <div class="admin-grid">
        ${stats.map((st, i) => `
          ${field(`Stat ${i+1} número`, `hero.stats.${i}.number`, st.number, 'number')}
          ${field(`Stat ${i+1} sufijo`, `hero.stats.${i}.suffix`, st.suffix)}
          ${field(`Stat ${i+1} etiqueta`, `hero.stats.${i}.label`, st.label, 'text', true)}
        `).join('')}
      </div>
    </div>
    <div class="admin-card">
      <h3 class="admin-card__title">Quiénes somos (home)</h3>
      <div class="admin-grid">
        ${field('Etiqueta', 'about.label', about.label || '')}
        ${field('Título', 'about.title', about.title || '')}
        ${field('Título destacado', 'about.titleHighlight', about.titleHighlight || '')}
        ${field('Párrafo 1', 'about.paragraphs.0', paragraphs[0], 'textarea', true)}
        ${field('Párrafo 2', 'about.paragraphs.1', paragraphs[1], 'textarea', true)}
        ${mediaField('Imagen o vídeo', 'about.image', about.image || '')}
      </div>
    </div>
    <div class="admin-card">
      <h3 class="admin-card__title">CTA final</h3>
      <div class="admin-grid">
        ${field('Etiqueta', 'cta.label', h.cta?.label || '')}
        ${field('Título', 'cta.title', h.cta?.title || '')}
        ${field('Destacado', 'cta.titleHighlight', h.cta?.titleHighlight || '')}
        ${field('Texto', 'cta.text', h.cta?.text || '', 'textarea', true)}
        ${mediaField('Fondo imagen o vídeo', 'cta.backgroundImage', h.cta?.backgroundImage || '')}
      </div>
    </div>`;
  bindFields('panel-home');
}

function renderNosotros() {
  const n = state.nosotros;
  const hero = n.hero;
  const intro = n.intro;
  const mission = n.mission;
  const timeline = n.timeline;

  document.getElementById('panel-nosotros').innerHTML = `
    <div class="admin-card">
      <h3 class="admin-card__title">Cabecera de la página</h3>
      <div class="admin-grid">
        ${field('Etiqueta', 'nos.hero.label', hero.label)}
        ${field('Título', 'nos.hero.title', hero.title)}
        ${field('Título destacado', 'nos.hero.titleHighlight', hero.titleHighlight)}
        ${field('Subtítulo', 'nos.hero.subtitle', hero.subtitle, 'textarea', true)}
      </div>
    </div>
    <div class="admin-card">
      <h3 class="admin-card__title">Nuestra historia</h3>
      <div class="admin-grid">
        ${field('Etiqueta', 'nos.intro.label', intro.label)}
        ${field('Título', 'nos.intro.title', intro.title)}
        ${field('Párrafo 1', 'nos.intro.paragraphs.0', intro.paragraphs[0], 'textarea', true)}
        ${field('Párrafo 2', 'nos.intro.paragraphs.1', intro.paragraphs[1], 'textarea', true)}
        ${field('Párrafo 3', 'nos.intro.paragraphs.2', intro.paragraphs[2], 'textarea', true)}
        ${mediaField('Imagen o vídeo', 'nos.intro.image', intro.image)}
      </div>
    </div>
    <div class="admin-card">
      <h3 class="admin-card__title">Misión, visión y valores</h3>
      <div class="admin-grid">
        ${field('Etiqueta sección', 'nos.mission.label', mission.label)}
        ${field('Título sección', 'nos.mission.title', mission.title)}
        ${mission.items.map((item, i) => `
          ${field(`Tarjeta ${i + 1} título`, `nos.mission.${i}.title`, item.title)}
          ${field(`Tarjeta ${i + 1} texto`, `nos.mission.${i}.description`, item.description, 'textarea', true)}
        `).join('')}
      </div>
    </div>
    <div class="admin-card">
      <h3 class="admin-card__title">Línea de tiempo</h3>
      <div class="admin-grid">
        ${field('Etiqueta sección', 'nos.timeline.label', timeline.label)}
        ${field('Título sección', 'nos.timeline.title', timeline.title)}
        ${timeline.items.map((item, i) => `
          ${field(`Hito ${i + 1} año`, `nos.timeline.${i}.year`, item.year)}
          ${field(`Hito ${i + 1} título`, `nos.timeline.${i}.title`, item.title)}
          ${field(`Hito ${i + 1} texto`, `nos.timeline.${i}.description`, item.description, 'textarea', true)}
        `).join('')}
      </div>
    </div>
    <div class="admin-card">
      <h3 class="admin-card__title">Estadísticas</h3>
      <div class="admin-grid">
        ${n.stats.map((st, i) => `
          ${field(`Stat ${i + 1} número`, `nos.stats.${i}.number`, st.number, 'number')}
          ${field(`Stat ${i + 1} sufijo`, `nos.stats.${i}.suffix`, st.suffix)}
          ${field(`Stat ${i + 1} etiqueta`, `nos.stats.${i}.label`, st.label, 'text', true)}
        `).join('')}
      </div>
    </div>
    <div class="admin-card">
      <h3 class="admin-card__title">CTA final</h3>
      <div class="admin-grid">
        ${field('Título', 'nos.cta.title', n.cta.title)}
        ${field('Texto', 'nos.cta.text', n.cta.text, 'textarea', true)}
        ${field('Botón principal', 'nos.cta.primaryLabel', n.cta.primaryLabel)}
        ${field('Botón secundario', 'nos.cta.secondaryLabel', n.cta.secondaryLabel)}
      </div>
    </div>`;
  bindFields('panel-nosotros');
}

function renderServices() {
  const items = state.services.services;
  const panel = document.getElementById('panel-services');

  panel.innerHTML = `
    <div class="admin-card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
        <h3 class="admin-card__title" style="margin:0;border:0;padding:0">Servicios (${items.length})</h3>
        <button type="button" class="admin-btn admin-btn--ghost" id="addService">+ Añadir servicio</button>
      </div>
      <div id="servicesList">
        ${items.map((s, i) => serviceItemHTML(s, i)).join('')}
      </div>
    </div>`;

  bindFields('panel-services');
  bindServiceActions();
}

function serviceItemHTML(s, i) {
  return `
    <div class="admin-list-item" data-service-index="${i}">
      <div class="admin-list-item__header">
        <h4>${esc(s.title)}</h4>
        <div class="admin-list-actions">
          <label class="admin-checkbox">
            <input type="checkbox" data-svc="${i}.featured" ${s.featured !== false ? 'checked' : ''}> Visible en home
          </label>
          <button type="button" class="admin-btn admin-btn--danger" data-delete-service="${i}">Eliminar</button>
        </div>
      </div>
      <div class="admin-grid">
        ${field('ID (slug)', `svc.${i}.id`, s.id)}
        ${field('Etiqueta nav', `svc.${i}.navLabel`, s.navLabel || s.title)}
        ${field('Título', `svc.${i}.title`, s.title)}
        ${field('Número', `svc.${i}.number`, s.number)}
        ${field('Descripción', `svc.${i}.description`, s.description, 'textarea', true)}
        ${field('Enlace', `svc.${i}.link`, s.link)}
        ${mediaField('Imagen o vídeo', `svc.${i}.image`, s.image || '')}
      </div>
    </div>`;
}

function bindServiceActions() {
  document.getElementById('addService')?.addEventListener('click', () => {
    collectServices();
    const n = state.services.services.length + 1;
    state.services.services.push({
      id: `servicio-${Date.now()}`,
      number: String(n).padStart(2, '0'),
      navLabel: 'Nuevo servicio',
      title: 'Nuevo servicio',
      description: '',
      link: 'servicios.html',
      image: '',
      featured: true,
    });
    renderServices();
  });

  document.querySelectorAll('[data-delete-service]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const i = parseInt(btn.dataset.deleteService, 10);
      if (confirm('¿Eliminar este servicio?')) {
        collectServices();
        state.services.services.splice(i, 1);
        renderServices();
      }
    });
  });
}

function renderProjects() {
  const items = state.projects.projects;
  const panel = document.getElementById('panel-projects');

  panel.innerHTML = `
    <div class="admin-card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
        <h3 class="admin-card__title" style="margin:0;border:0;padding:0">Proyectos (${items.length})</h3>
        <button type="button" class="admin-btn admin-btn--ghost" id="addProject">+ Añadir proyecto</button>
      </div>
      <div id="projectsList">
        ${items.map((p, i) => projectItemHTML(p, i)).join('')}
      </div>
    </div>`;

  bindFields('panel-projects');
  bindProjectActions();
}

function projectItemHTML(p, i) {
  return `
    <div class="admin-list-item" data-project-index="${i}">
      <div class="admin-list-item__header">
        <h4>${esc(p.title)}</h4>
        <div class="admin-list-actions">
          <label class="admin-checkbox">
            <input type="checkbox" data-prj="${i}.featured" ${p.featured !== false ? 'checked' : ''}> Destacado
          </label>
          <button type="button" class="admin-btn admin-btn--danger" data-delete-project="${i}">Eliminar</button>
        </div>
      </div>
      <div class="admin-grid">
        ${field('Título', `prj.${i}.title`, p.title)}
        ${field('Ubicación', `prj.${i}.location`, p.location)}
        ${field('Categoría', `prj.${i}.categoryLabel`, p.categoryLabel)}
        ${field('Categoría filtro', `prj.${i}.category`, p.category)}
        ${field('Estado', `prj.${i}.statusLabel`, p.statusLabel)}
        ${field('Estado código', `prj.${i}.status`, p.status, 'text')}
        ${field('Cliente', `prj.${i}.client`, p.client)}
        ${field('Año', `prj.${i}.year`, p.year)}
        ${field('Superficie', `prj.${i}.area`, p.area)}
        ${field('Descripción', `prj.${i}.description`, p.description, 'textarea', true)}
        ${mediaField('Imagen o vídeo', `prj.${i}.image`, p.image)}
      </div>
    </div>`;
}

function bindProjectActions() {
  document.getElementById('addProject')?.addEventListener('click', () => {
    state.projects.projects.push({
      id: `proyecto-${Date.now()}`,
      title: 'Nuevo proyecto',
      category: 'electrico',
      categoryLabel: 'Instalación eléctrica',
      status: 'done',
      statusLabel: 'Finalizado',
      location: 'Sevilla',
      description: '',
      image: '',
      client: '',
      year: '2026',
      area: '',
      featured: true,
    });
    renderProjects();
  });

  document.querySelectorAll('[data-delete-project]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const i = parseInt(btn.dataset.deleteProject, 10);
      if (confirm('¿Eliminar este proyecto?')) {
        state.projects.projects.splice(i, 1);
        renderProjects();
      }
    });
  });
}

function bindFields(panelId) {
  const panel = document.getElementById(panelId);

  panel.querySelectorAll('[data-field]').forEach((el) => {
    el.addEventListener('input', () => {
      const box = el.closest('.admin-media-field')?.querySelector('.admin-media-preview-box');
      if (box && el.type === 'url') updateMediaPreviewBox(box, el.value);
    });
  });

  panel.querySelectorAll('[data-clear-media]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.clearMedia;
      const urlInput = panel.querySelector(`[data-field="${id}"]`);
      const previewBox = panel.querySelector(`#${id.replace(/\./g, '-')}-preview`)
        || urlInput?.closest('.admin-media-field')?.querySelector('.admin-media-preview-box');
      const fileInput = panel.querySelector(`[data-upload="${id}"]`);
      if (urlInput) urlInput.value = '';
      if (fileInput) fileInput.value = '';
      updateMediaPreviewBox(previewBox, '');
      btn.hidden = true;
    });
  });

  panel.querySelectorAll('[data-upload]').forEach((input) => {
    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      if (!file) return;
      const targetField = input.dataset.upload;
      const urlInput = panel.querySelector(`[data-field="${targetField}"]`);
      const previewBox = document.getElementById(`${targetField.replace(/\./g, '-')}-preview`)
        || urlInput?.closest('.admin-media-field')?.querySelector('.admin-media-preview-box');
      const clearBtn = urlInput?.closest('.admin-media-field')?.querySelector('[data-clear-media]');

      try {
        input.disabled = true;
        const url = await uploadMediaFile(file);
        if (urlInput) urlInput.value = url;
        updateMediaPreviewBox(previewBox, url);
        if (clearBtn) clearBtn.hidden = false;
        input.value = '';
        showStatus('success', isVideoUrl(url) ? 'Vídeo subido. Pulsa «Guardar cambios».' : 'Imagen subida. Pulsa «Guardar cambios».');
      } catch (err) {
        showStatus('error', err.message);
      } finally {
        input.disabled = false;
      }
    });
  });
}

function collectFormData() {
  if (activeTab === 'settings') collectSettings();
  if (activeTab === 'home') collectHome();
  if (activeTab === 'nosotros') collectNosotros();
  if (activeTab === 'services') collectServices();
  if (activeTab === 'projects') collectProjects();
}

function collectSettings() {
  const s = state.settings;
  s.siteName = val('siteName');
  s.email = val('email');
  s.phone = val('phone');
  s.phoneTel = val('phoneTel');
  s.whatsapp = val('whatsapp');
  s.city = val('city');
  s.schedule = val('schedule');
  s.footerDescription = val('footerDescription');
  s.instagram = val('instagram');
  s.linkedin = val('linkedin');
  s.gaId = val('gaId');
}

function collectHome() {
  const h = state.home;
  h.hero.badge = val('hero.badge');
  h.hero.titleLines = [0,1,2,3].map((i) => val(`hero.titleLines.${i}`));
  h.hero.subtitle = val('hero.subtitle');
  h.hero.backgroundMedia = val('hero.backgroundMedia');
  delete h.hero.videoUrl;
  delete h.hero.posterUrl;
  h.hero.stats.forEach((_, i) => {
    h.hero.stats[i].number = parseInt(val(`hero.stats.${i}.number`), 10) || 0;
    h.hero.stats[i].suffix = val(`hero.stats.${i}.suffix`);
    h.hero.stats[i].label = val(`hero.stats.${i}.label`);
  });
  h.about.label = val('about.label');
  h.about.title = val('about.title');
  h.about.titleHighlight = val('about.titleHighlight');
  h.about.paragraphs[0] = val('about.paragraphs.0');
  h.about.paragraphs[1] = val('about.paragraphs.1');
  h.about.image = val('about.image');
  h.cta.label = val('cta.label');
  h.cta.title = val('cta.title');
  h.cta.titleHighlight = val('cta.titleHighlight');
  h.cta.text = val('cta.text');
  h.cta.backgroundImage = val('cta.backgroundImage');
}

function collectNosotros() {
  const n = state.nosotros;
  n.hero.label = val('nos.hero.label');
  n.hero.title = val('nos.hero.title');
  n.hero.titleHighlight = val('nos.hero.titleHighlight');
  n.hero.subtitle = val('nos.hero.subtitle');
  n.intro.label = val('nos.intro.label');
  n.intro.title = val('nos.intro.title');
  n.intro.paragraphs = [0, 1, 2].map((i) => val(`nos.intro.paragraphs.${i}`));
  n.intro.image = val('nos.intro.image');
  n.mission.label = val('nos.mission.label');
  n.mission.title = val('nos.mission.title');
  n.mission.items.forEach((item, i) => {
    item.title = val(`nos.mission.${i}.title`);
    item.description = val(`nos.mission.${i}.description`);
  });
  n.timeline.label = val('nos.timeline.label');
  n.timeline.title = val('nos.timeline.title');
  n.timeline.items.forEach((item, i) => {
    item.year = val(`nos.timeline.${i}.year`);
    item.title = val(`nos.timeline.${i}.title`);
    item.description = val(`nos.timeline.${i}.description`);
  });
  n.stats.forEach((st, i) => {
    st.number = parseInt(val(`nos.stats.${i}.number`), 10) || 0;
    st.suffix = val(`nos.stats.${i}.suffix`);
    st.label = val(`nos.stats.${i}.label`);
  });
  n.cta.title = val('nos.cta.title');
  n.cta.text = val('nos.cta.text');
  n.cta.primaryLabel = val('nos.cta.primaryLabel');
  n.cta.secondaryLabel = val('nos.cta.secondaryLabel');
}

function collectServices() {
  state.services.services.forEach((s, i) => {
    s.id = val(`svc.${i}.id`);
    s.navLabel = val(`svc.${i}.navLabel`);
    s.title = val(`svc.${i}.title`);
    s.number = val(`svc.${i}.number`);
    s.description = val(`svc.${i}.description`);
    s.link = val(`svc.${i}.link`);
    s.image = val(`svc.${i}.image`);
    const cb = document.querySelector(`[data-svc="${i}.featured"]`);
    s.featured = cb?.checked ?? true;
  });
}

function collectProjects() {
  state.projects.projects.forEach((p, i) => {
    p.title = val(`prj.${i}.title`);
    p.location = val(`prj.${i}.location`);
    p.categoryLabel = val(`prj.${i}.categoryLabel`);
    p.category = val(`prj.${i}.category`);
    p.statusLabel = val(`prj.${i}.statusLabel`);
    p.status = val(`prj.${i}.status`);
    p.client = val(`prj.${i}.client`);
    p.year = val(`prj.${i}.year`);
    p.area = val(`prj.${i}.area`);
    p.description = val(`prj.${i}.description`);
    p.image = val(`prj.${i}.image`);
    const cb = document.querySelector(`[data-prj="${i}.featured"]`);
    p.featured = cb?.checked ?? true;
  });
}

function val(field) {
  return document.querySelector(`[data-field="${field}"]`)?.value ?? '';
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function uploadMediaFile(file) {
  const maxVideo = 50 * 1024 * 1024;
  const maxImage = 10 * 1024 * 1024;
  const isVideo = file.type.startsWith('video/');
  const maxSize = isVideo ? maxVideo : maxImage;

  if (file.size > maxSize) {
    const mb = Math.round(maxSize / (1024 * 1024));
    throw new Error(`Archivo demasiado grande (máx ${mb} MB).`);
  }

  try {
    const signed = await api('/api/sign-upload', {
      method: 'POST',
      body: JSON.stringify({
        filename: file.name,
        mimeType: file.type,
        size: file.size,
      }),
    });

    const uploadRes = await fetch(signed.signedUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
        Authorization: `Bearer ${signed.token}`,
        'x-upsert': 'true',
      },
      body: file,
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text().catch(() => '');
      throw new Error(errText || 'No se pudo subir el archivo.');
    }

    return signed.publicUrl;
  } catch (err) {
    if (!/503|Supabase no configurado/i.test(err.message) && file.size <= 4 * 1024 * 1024) {
      const dataUrl = await fileToDataUrl(file);
      const { url } = await api('/api/upload', {
        method: 'POST',
        body: JSON.stringify({ filename: file.name, dataUrl, mimeType: file.type }),
      });
      return url;
    }
    throw err;
  }
}

function esc(str) {
  if (str == null) return '';
  return String(str).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
}
