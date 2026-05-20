import { verifyToken } from './_lib/auth.js';
import {
  isSupabaseConfigured,
  downloadFromStorage,
  uploadJsonToStorage,
} from './_lib/supabase.js';
import { getFile, saveFile, isGitHubConfigured } from './_lib/github.js';

const ALLOWED = new Set(['settings', 'home', 'services', 'projects']);
const CONTENT_BUCKET = 'content';

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
      const data = await loadContent(file);
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
