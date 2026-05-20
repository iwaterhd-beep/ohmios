import { verifyToken } from './_lib/auth.js';
import { getSupabase, getPublicUrl, isSupabaseConfigured } from './_lib/supabase.js';

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const VIDEO_TYPES = new Set(['video/mp4', 'video/webm', 'video/quicktime']);
const MAX_IMAGE = 10 * 1024 * 1024;
const MAX_VIDEO = 50 * 1024 * 1024;

function extFromMime(mime) {
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  if (mime === 'image/gif') return 'gif';
  if (mime === 'video/webm') return 'webm';
  if (mime === 'video/quicktime') return 'mov';
  if (mime === 'video/mp4') return 'mp4';
  return 'jpg';
}

function stripFileExt(name) {
  return name.replace(/\.(mp4|webm|mov|m4v|jpe?g|png|webp|gif)$/i, '');
}

function safeUploadName(filename) {
  return stripFileExt(filename)
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, '-')
    .replace(/-+/g, '-');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  if (!verifyToken(req)) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  if (!isSupabaseConfigured()) {
    return res.status(503).json({ error: 'Supabase no configurado en el servidor.' });
  }

  try {
    const { filename, mimeType, size } = req.body || {};
    const mime = mimeType || 'application/octet-stream';
    const isImage = IMAGE_TYPES.has(mime) || mime.startsWith('image/');
    const isVideo = VIDEO_TYPES.has(mime) || mime.startsWith('video/');

    if (!filename || (!isImage && !isVideo)) {
      return res.status(400).json({ error: 'Formato no permitido. Usa imagen (JPG, PNG, WebP) o vídeo (MP4, WebM).' });
    }

    const maxSize = isVideo ? MAX_VIDEO : MAX_IMAGE;
    if (size && size > maxSize) {
      const mb = Math.round(maxSize / (1024 * 1024));
      return res.status(400).json({ error: `Archivo demasiado grande (máx ${mb} MB).` });
    }

    const safeName = safeUploadName(filename);
    const folder = isVideo ? 'videos' : 'images';
    const path = `${folder}/${Date.now()}-${safeName}.${extFromMime(mime)}`;

    const supabase = getSupabase();
    const { data, error } = await supabase.storage.from('media').createSignedUploadUrl(path);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({
      signedUrl: data.signedUrl,
      token: data.token,
      path,
      publicUrl: getPublicUrl('media', path),
      type: isVideo ? 'video' : 'image',
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Error al preparar la subida' });
  }
}
