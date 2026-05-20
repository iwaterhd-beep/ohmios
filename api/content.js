import { verifyToken } from './_lib/auth.js';
import { getFile, saveFile, isGitHubConfigured } from './_lib/github.js';

const ALLOWED = new Set(['settings', 'home', 'services', 'projects']);

export default async function handler(req, res) {
  const file = req.query.file;

  if (!file || !ALLOWED.has(file)) {
    return res.status(400).json({ error: 'Archivo no válido' });
  }

  const path = `content/${file}.json`;

  if (req.method === 'GET') {
    return res.status(405).json({ error: 'Usa /content/{file}.json directamente' });
  }

  if (req.method === 'PUT') {
    if (!verifyToken(req)) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    if (!isGitHubConfigured()) {
      return res.status(503).json({
        error: 'GITHUB_TOKEN no configurado en Vercel.',
      });
    }

    try {
      const existing = await getFile(path);
      const pretty = JSON.stringify(req.body, null, 2) + '\n';
      await saveFile(
        path,
        pretty,
        `CMS: actualizar ${file}.json`,
        existing?.sha
      );
      return res.status(200).json({ ok: true, message: 'Guardado. Vercel desplegará en ~1 min.' });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Método no permitido' });
}
