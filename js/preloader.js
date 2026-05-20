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

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReduced) {
    video.pause();
    media.classList.remove('is-video-active');
    return;
  }

  media.classList.add('is-video-active');
  video.muted = true;
  video.defaultMuted = true;

  const tryPlay = () => {
    video.play().catch(() => {
      video.addEventListener('canplaythrough', () => video.play().catch(() => {}), { once: true });
    });
  };

  if (video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
    tryPlay();
    return;
  }

  video.addEventListener('canplay', tryPlay, { once: true });
  video.addEventListener('loadeddata', tryPlay, { once: true });
}
