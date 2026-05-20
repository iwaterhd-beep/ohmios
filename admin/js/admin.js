/**
 * OHMIOS CMS — Admin Panel
 */

const TOKEN_KEY = 'ohmios_admin_token';
const TITLES = {
  settings: 'Configuración general',
  home: 'Página de inicio',
  services: 'Servicios',
  projects: 'Proyectos',
};

let state = {
  settings: null,
  home: null,
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

function logout() {
  sessionStorage.removeItem(TOKEN_KEY);
  if (adminApp) adminApp.hidden = true;
  if (loginScreen) loginScreen.hidden = false;
  clearLoginError();
  setLoginLoading(false);
}

async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(path, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Error de servidor');
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
    logout();
    showLoginError(err.message || 'No se pudo entrar. Inténtalo de nuevo.');
    setLoginLoading(false);
  }
});

document.getElementById('logoutBtn')?.addEventListener('click', logout);

// ── Boot ──
async function bootDashboard() {
  const [settings, home, services, projects] = await Promise.all([
    loadJSON('settings'),
    loadJSON('home'),
    loadJSON('services'),
    loadJSON('projects'),
  ]);

  state = { settings, home, services, projects };
  renderAll();

  if (loginScreen) loginScreen.hidden = true;
  if (adminApp) adminApp.hidden = false;
  setLoginLoading(false);
}

async function loadJSON(name) {
  const res = await fetch(`/content/${name}.json?v=${Date.now()}`);
  if (!res.ok) throw new Error(`No se pudo cargar ${name}.json`);
  return res.json();
}

if (getToken()) {
  setLoginLoading(true);
  bootDashboard().catch((err) => {
    logout();
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
    showStatus('success', '✓ Guardado. La web se actualizará en ~1 minuto.');
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
  renderSettings();
  renderHome();
  renderServices();
  renderProjects();
}

function field(label, id, value = '', type = 'text', full = false) {
  const cls = full ? 'admin-field admin-field--full' : 'admin-field';
  if (type === 'textarea') {
    return `<div class="${cls}"><label class="admin-label">${label}</label><textarea class="admin-textarea" data-field="${id}">${esc(value)}</textarea></div>`;
  }
  return `<div class="${cls}"><label class="admin-label">${label}</label><input class="admin-input" type="${type}" data-field="${id}" value="${esc(value)}"></div>`;
}

function imageField(label, id, url) {
  const previewId = id.replace(/\./g, '-');
  return `
    <div class="admin-field admin-field--full">
      <label class="admin-label">${label}</label>
      <div class="admin-image-field">
        <img class="admin-image-preview" id="${previewId}-preview" src="${esc(url || '')}" alt="">
        <div class="admin-image-controls">
          <input class="admin-input" type="url" data-field="${id}" value="${esc(url || '')}" placeholder="URL de imagen">
          <input type="file" accept="image/*" data-upload="${id}" style="margin-top:0.5rem">
          <small style="color:var(--muted);font-size:0.75rem">Sube una imagen o pega una URL</small>
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
    </div>`;
  bindFields('panel-settings');
}

function renderHome() {
  const h = state.home;
  const hero = h.hero;
  const about = h.about;

  document.getElementById('panel-home').innerHTML = `
    <div class="admin-card">
      <h3 class="admin-card__title">Hero (cabecera)</h3>
      <div class="admin-grid">
        ${field('Badge', 'hero.badge', hero.badge)}
        ${field('Título línea 1', 'hero.titleLines.0', hero.titleLines[0])}
        ${field('Título línea 2', 'hero.titleLines.1', hero.titleLines[1])}
        ${field('Título línea 3', 'hero.titleLines.2', hero.titleLines[2])}
        ${field('Título línea 4', 'hero.titleLines.3', hero.titleLines[3])}
        ${field('Subtítulo', 'hero.subtitle', hero.subtitle, 'textarea', true)}
        ${field('URL vídeo', 'hero.videoUrl', hero.videoUrl)}
        ${imageField('Imagen poster', 'hero.posterUrl', hero.posterUrl)}
      </div>
    </div>
    <div class="admin-card">
      <h3 class="admin-card__title">Estadísticas hero</h3>
      <div class="admin-grid">
        ${hero.stats.map((st, i) => `
          ${field(`Stat ${i+1} número`, `hero.stats.${i}.number`, st.number, 'number')}
          ${field(`Stat ${i+1} sufijo`, `hero.stats.${i}.suffix`, st.suffix)}
          ${field(`Stat ${i+1} etiqueta`, `hero.stats.${i}.label`, st.label, 'text', true)}
        `).join('')}
      </div>
    </div>
    <div class="admin-card">
      <h3 class="admin-card__title">Quiénes somos (home)</h3>
      <div class="admin-grid">
        ${field('Etiqueta', 'about.label', about.label)}
        ${field('Título', 'about.title', about.title)}
        ${field('Título destacado', 'about.titleHighlight', about.titleHighlight)}
        ${field('Párrafo 1', 'about.paragraphs.0', about.paragraphs[0], 'textarea', true)}
        ${field('Párrafo 2', 'about.paragraphs.1', about.paragraphs[1], 'textarea', true)}
        ${imageField('Imagen', 'about.image', about.image)}
      </div>
    </div>
    <div class="admin-card">
      <h3 class="admin-card__title">CTA final</h3>
      <div class="admin-grid">
        ${field('Etiqueta', 'cta.label', h.cta.label)}
        ${field('Título', 'cta.title', h.cta.title)}
        ${field('Destacado', 'cta.titleHighlight', h.cta.titleHighlight)}
        ${field('Texto', 'cta.text', h.cta.text, 'textarea', true)}
        ${imageField('Imagen fondo', 'cta.backgroundImage', h.cta.backgroundImage)}
      </div>
    </div>`;
  bindFields('panel-home');
}

function renderServices() {
  const items = state.services.services;
  const panel = document.getElementById('panel-services');

  panel.innerHTML = `
    <div class="admin-card">
      <h3 class="admin-card__title">Servicios (${items.length})</h3>
      ${items.map((s, i) => `
        <div class="admin-list-item" data-service-index="${i}">
          <div class="admin-list-item__header">
            <h4>${esc(s.title)}</h4>
            <label class="admin-checkbox">
              <input type="checkbox" data-svc="${i}.featured" ${s.featured !== false ? 'checked' : ''}> Visible en home
            </label>
          </div>
          <div class="admin-grid">
            ${field('Título', `svc.${i}.title`, s.title)}
            ${field('Número', `svc.${i}.number`, s.number)}
            ${field('Descripción', `svc.${i}.description`, s.description, 'textarea', true)}
            ${field('Enlace', `svc.${i}.link`, s.link)}
          </div>
        </div>
      `).join('')}
    </div>`;
  bindFields('panel-services');
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
        ${imageField('Imagen', `prj.${i}.image`, p.image)}
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
      const preview = el.closest('.admin-image-field')?.querySelector('.admin-image-preview');
      if (preview && el.type === 'url') preview.src = el.value;
    });
  });

  panel.querySelectorAll('[data-upload]').forEach((input) => {
    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      if (!file) return;
      const targetField = input.dataset.upload;
      const urlInput = document.querySelector(`[data-field="${targetField}"]`);
      const preview = document.getElementById(`${targetField.replace(/\./g, '-')}-preview`) 
        || urlInput?.closest('.admin-image-field')?.querySelector('.admin-image-preview');

      try {
        const dataUrl = await fileToDataUrl(file);
        const { url } = await api('/api/upload', {
          method: 'POST',
          body: JSON.stringify({ filename: file.name, dataUrl }),
        });
        if (urlInput) urlInput.value = url;
        if (preview) preview.src = url;
        showStatus('success', 'Imagen subida correctamente.');
      } catch (err) {
        showStatus('error', err.message);
      }
    });
  });
}

function collectFormData() {
  if (activeTab === 'settings') collectSettings();
  if (activeTab === 'home') collectHome();
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
}

function collectHome() {
  const h = state.home;
  h.hero.badge = val('hero.badge');
  h.hero.titleLines = [0,1,2,3].map((i) => val(`hero.titleLines.${i}`));
  h.hero.subtitle = val('hero.subtitle');
  h.hero.videoUrl = val('hero.videoUrl');
  h.hero.posterUrl = val('hero.posterUrl');
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

function collectServices() {
  state.services.services.forEach((s, i) => {
    s.title = val(`svc.${i}.title`);
    s.number = val(`svc.${i}.number`);
    s.description = val(`svc.${i}.description`);
    s.link = val(`svc.${i}.link`);
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

function esc(str) {
  if (str == null) return '';
  return String(str).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
}
