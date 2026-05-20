import { verifyToken } from './_lib/auth.js';
import {
  isSupabaseConfigured,
  uploadToStorage,
} from './_lib/supabase.js';
import { getFile, saveFile, isGitHubConfigured } from './_lib/github.js';

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const VIDEO_TYPES = new Set(['video/mp4', 'video/webm', 'video/quicktime']);
const MAX_IMAGE = 10 * 1024 * 1024;
const MAX_VIDEO = 50 * 1024 * 1024;

function parseDataUrl(dataUrl) {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  return { mime: match[1], buffer: Buffer.from(match[2], 'base64') };
}

function extFromMime(mime) {
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  if (mime === 'image/gif') return 'gif';
  if (mime === 'video/webm') return 'webm';
  if (mime === 'video/quicktime') return 'mov';
  if (mime === 'video/mp4') return 'mp4';
  return 'jpg';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  if (!verifyToken(req)) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  try {
    const { filename, dataUrl, mimeType } = req.body || {};
    const parsed = parseDataUrl(dataUrl);

    if (!filename || !parsed) {
      return res.status(400).json({ error: 'Archivo no válido' });
    }

    const mime = mimeType || parsed.mime;
    const isImage = IMAGE_TYPES.has(mime) || mime.startsWith('image/');
    const isVideo = VIDEO_TYPES.has(mime) || mime.startsWith('video/');

    if (!isImage && !isVideo) {
      return res.status(400).json({ error: 'Formato no permitido. Usa imagen (JPG, PNG, WebP) o vídeo (MP4, WebM).' });
    }

    const maxSize = isVideo ? MAX_VIDEO : MAX_IMAGE;
    if (parsed.buffer.length > maxSize) {
      const mb = Math.round(maxSize / (1024 * 1024));
      return res.status(400).json({ error: `Archivo demasiado grande (máx ${mb}MB)` });
    }

    const safeName = filename
      .toLowerCase()
      .replace(/[^a-z0-9.-]/g, '-')
      .replace(/-+/g, '-');
    const ext = extFromMime(mime);
    const folder = isVideo ? 'videos' : 'images';
    const path = `${folder}/${Date.now()}-${safeName}.${ext}`;

    if (isSupabaseConfigured()) {
      const url = await uploadToStorage('media', path, parsed.buffer, mime);
      return res.status(200).json({ url, type: isVideo ? 'video' : 'image' });
    }

    if (!isGitHubConfigured()) {
      return res.status(503).json({ error: 'Configura Supabase o GITHUB_TOKEN en Vercel.' });
    }

    const githubPath = `assets/${folder}/uploads/${path.split('/').pop()}`;
    let sha = null;
    try {
      const existing = await getFile(githubPath);
      sha = existing?.sha;
    } catch {
      /* new file */
    }

    await saveFile(
      githubPath,
      parsed.buffer.toString('base64'),
      `CMS: subir ${folder} ${githubPath}`,
      sha,
      true
    );

    return res.status(200).json({
      url: `/${githubPath}`,
      type: isVideo ? 'video' : 'image',
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
