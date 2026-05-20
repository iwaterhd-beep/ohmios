/**
 * Preloader + reproducción del vídeo hero
 */

export function injectPreloader() {
  if (document.getElementById('preloader')) return;

  const el = document.createElement('div');
  el.id = 'preloader';
  el.className = 'preloader';
  el.innerHTML = `
    <div class="preloader__inner">
      <div class="preloader__logo">
        <img src="/assets/images/logo-ohmios.png" alt="OHMIOS energía" width="200" height="54">
      </div>
      <div class="preloader__bar"><span class="preloader__bar-fill"></span></div>
    </div>
  `;
  document.body.prepend(el);
}

export function hidePreloader() {
  const el = document.getElementById('preloader');
  if (!el) return;
  el.style.opacity = '0';
  el.style.pointerEvents = 'none';
  el.style.transition = 'opacity 0.5s ease';
  setTimeout(() => el.remove(), 500);
}

export function initHeroVideo() {
  const media = document.querySelector('.hero__media');
  const video = media?.querySelector('.hero__video');
  if (!video || video.dataset.heroMode !== 'video') return;

  const fallback = media.querySelector('.hero__image--fallback');
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReduced) {
    video.pause();
    video.style.display = 'none';
    media.classList.remove('is-video-active');
    if (fallback) fallback.style.display = '';
    return;
  }

  const showVideo = () => {
    video.style.display = 'block';
    media.classList.add('is-video-active');
    if (fallback) fallback.style.display = 'none';
  };

  const showFallback = () => {
    video.pause();
    video.style.display = 'none';
    media.classList.remove('is-video-active');
    if (fallback?.src) fallback.style.display = 'block';
  };

  let attempts = 0;

  const tryPlay = () => {
    attempts += 1;
    video.muted = true;
    video.defaultMuted = true;

    const playPromise = video.play();
    if (!playPromise) {
      showVideo();
      return;
    }

    playPromise.then(showVideo).catch(() => {
      if (attempts < 3 && video.readyState < HTMLMediaElement.HAVE_ENOUGH_DATA) {
        video.addEventListener('canplaythrough', tryPlay, { once: true });
        return;
      }

      if (fallback?.src) {
        showFallback();
      } else {
        showVideo();
      }
    });
  };

  video.addEventListener('error', () => {
    if (fallback?.src) showFallback();
  }, { once: true });

  if (video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
    tryPlay();
    return;
  }

  video.addEventListener('canplay', tryPlay, { once: true });
}
