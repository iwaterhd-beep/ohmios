import { verifyToken } from './_lib/auth.js';
import { getFile, saveFile, isGitHubConfigured } from './_lib/github.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  if (!verifyToken(req)) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  if (!isGitHubConfigured()) {
    return res.status(503).json({ error: 'GITHUB_TOKEN no configurado' });
  }

  try {
    const { filename, dataUrl } = req.body || {};

    if (!filename || !dataUrl?.startsWith('data:image/')) {
      return res.status(400).json({ error: 'Imagen no válida' });
    }

    const safeName = filename
      .toLowerCase()
      .replace(/[^a-z0-9.-]/g, '-')
      .replace(/-+/g, '-');
    const ext = dataUrl.includes('image/png') ? 'png' : 'jpg';
    const path = `assets/images/uploads/${Date.now()}-${safeName}.${ext}`;

    const base64 = dataUrl.split(',')[1];
    const binary = Buffer.from(base64, 'base64');

    if (binary.length > 5 * 1024 * 1024) {
      return res.status(400).json({ error: 'Imagen demasiado grande (máx 5MB)' });
    }

    let sha = null;
    try {
      const existing = await getFile(path);
      sha = existing?.sha;
    } catch {
      /* new file */
    }

    await saveFile(path, binary.toString('base64'), `CMS: subir imagen ${path}`, sha, true);

    const publicUrl = `/${path}`;
    return res.status(200).json({ url: publicUrl });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
