import { verifyToken } from './_lib/auth.js';
import {
  isSupabaseConfigured,
  downloadFromStorage,
  uploadJsonToStorage,
} from './_lib/supabase.js';
import { getFile, saveFile, isGitHubConfigured } from './_lib/github.js';

const ALLOWED = new Set(['settings', 'home', 'services', 'projects', 'nosotros']);
const CONTENT_BUCKET = 'content';

function getRequestOrigin(req) {
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || 'https';
  if (host) return `${proto}://${host}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'https://ohmios.vercel.app';
}

async function loadStaticDefaults(name, req) {
  if (isGitHubConfigured()) {
    try {
      const file = await getFile(`content/${name}.json`);
      if (file?.content) return JSON.parse(file.content);
    } catch {
      /* fallback */
    }
  }

  try {
    const origin = getRequestOrigin(req);
    const res = await fetch(`${origin}/content/${name}.json`, { cache: 'no-store' });
    if (res.ok) return res.json();
  } catch {
    /* fallback */
  }

  return null;
}

function mergeServicesWithDefaults(data, defaults) {
  if (!data?.services || !defaults?.services) return data;

  const byId = Object.fromEntries(defaults.services.map((s) => [s.id, s]));
  return {
    ...data,
    services: data.services.map((s) => {
      const d = byId[s.id];
      if (!d) return s;
      return {
        ...s,
        navLabel: s.navLabel || d.navLabel || s.title,
        image: s.image || d.image || '',
      };
    }),
  };
}

async function loadContent(name) {
  if (isSupabaseConfigured()) {
    try {
      const raw = await downloadFromStorage(CONTENT_BUCKET, `${name}.json`);
      return JSON.parse(raw);
    } catch {
      /* fallback */
    }
  }

  if (isGitHubConfigured()) {
    try {
      const file = await getFile(`content/${name}.json`);
      if (file?.content) return JSON.parse(file.content);
    } catch {
      /* fallback */
    }
  }

  throw new Error(`No se pudo cargar ${name}.json`);
}

async function saveContent(name, data) {
  if (isSupabaseConfigured()) {
    await uploadJsonToStorage(CONTENT_BUCKET, `${name}.json`, data);
    return { storage: 'supabase' };
  }

  if (isGitHubConfigured()) {
    const existing = await getFile(`content/${name}.json`);
    const pretty = JSON.stringify(data, null, 2) + '\n';
    await saveFile(
      `content/${name}.json`,
      pretty,
      `CMS: actualizar ${name}.json`,
      existing?.sha
    );
    return { storage: 'github' };
  }

  throw new Error('Configura Supabase o GITHUB_TOKEN en Vercel.');
}

export default async function handler(req, res) {
  const file = req.query.file;

  if (!file || !ALLOWED.has(file)) {
    return res.status(400).json({ error: 'Archivo no válido' });
  }

  if (req.method === 'GET') {
    try {
      let data = await loadContent(file);

      if (file === 'services' && data?.services?.some((s) => !s.image)) {
        const defaults = await loadStaticDefaults('services', req);
        if (defaults) data = mergeServicesWithDefaults(data, defaults);
      }

      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).json(data);
    } catch (err) {
      return res.status(404).json({ error: err.message });
    }
  }

  if (req.method === 'PUT') {
    if (!verifyToken(req)) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    try {
      const result = await saveContent(file, req.body);
      const msg = result.storage === 'supabase'
        ? 'Guardado en Supabase. Los cambios son instantáneos.'
        : 'Guardado. Vercel desplegará en ~1 min.';
      return res.status(200).json({ ok: true, message: msg });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Método no permitido' });
}
