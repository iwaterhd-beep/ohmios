/**
 * Utilidades para detectar y renderizar imagen o vídeo
 */

export function isVideoUrl(url) {
  if (!url) return false;
  return /\.(mp4|webm|mov|m4v|ogg)(\?|#|$)/i.test(url) || /\/video\//i.test(url);
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
