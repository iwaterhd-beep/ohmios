/**
 * Utilidades para detectar y renderizar imagen o vídeo
 */

export function isVideoUrl(url) {
  if (!url) return false;
  return /\.(mp4|webm|mov|m4v|ogg)(\?|#|$)/i.test(url) || /\/videos?\//i.test(url);
}

/** Separa vídeo de fondo e imagen poster según lo guardado en el CMS */
export function resolveHeroMedia(hero = {}) {
  const videoUrl = hero.videoUrl?.trim() || '';
  const posterUrl = hero.posterUrl?.trim() || '';

  if (isVideoUrl(videoUrl)) {
    return {
      mode: 'video',
      videoSrc: videoUrl,
      posterSrc: posterUrl && !isVideoUrl(posterUrl) ? posterUrl : '',
    };
  }

  if (isVideoUrl(posterUrl)) {
    return {
      mode: 'video',
      videoSrc: posterUrl,
      posterSrc: '',
    };
  }

  if (posterUrl) {
    return { mode: 'image', videoSrc: '', posterSrc: posterUrl };
  }

  if (videoUrl) {
    return { mode: 'image', videoSrc: '', posterSrc: videoUrl };
  }

  return { mode: 'none', videoSrc: '', posterSrc: '' };
}

export function normalizeHeroMedia(hero = {}) {
  const next = { ...hero };
  const videoUrl = next.videoUrl?.trim() || '';
  const posterUrl = next.posterUrl?.trim() || '';

  if (isVideoUrl(posterUrl) && !videoUrl) {
    next.videoUrl = posterUrl;
    next.posterUrl = '';
  } else if (isVideoUrl(posterUrl) && isVideoUrl(videoUrl) && posterUrl === videoUrl) {
    next.posterUrl = '';
  }

  return next;
}

export function bustMediaCache(url) {
  if (!url || url.startsWith('data:')) return url;
  const base = url.split('?')[0];
  return `${base}?cms=${Date.now()}`;
}

export function isVideoMime(mime) {
  return typeof mime === 'string' && mime.startsWith('video/');
}

export function mediaTag(url, alt = '', className = '', attrs = '') {
  if (!url) return '';
  if (isVideoUrl(url)) {
    return `<video class="${className}" src="${url}" ${attrs} muted loop playsinline autoplay aria-hidden="true"></video>`;
  }
  return `<img class="${className}" src="${url}" alt="${alt}" loading="lazy" ${attrs}>`;
}

export function setMediaContainer(container, url, alt = '') {
  if (!container || !url) return;

  if (isVideoUrl(url)) {
    container.innerHTML = `<video src="${url}" muted loop playsinline autoplay aria-hidden="true"></video>`;
    const video = container.querySelector('video');
    if (video) video.play().catch(() => {});
    return;
  }

  container.innerHTML = `<img src="${url}" alt="${alt}" loading="lazy">`;
}
