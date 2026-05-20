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

/** Fuerza reproducción del vídeo de fondo (autoplay + interacción + visibilidad) */
export function startHeroVideo(video) {
  if (!video || video.dataset.heroMode !== 'video') return;

  const media = video.closest('.hero__media');
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReduced) {
    video.pause();
    media?.classList.remove('is-video-active');
    return;
  }

  video.muted = true;
  video.defaultMuted = true;
  video.setAttribute('muted', '');
  video.playsInline = true;
  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', '');
  media?.classList.add('is-video-active');

  const play = () => {
    if (video.paused) {
      video.play().catch(() => {});
    }
  };

  ['loadedmetadata', 'loadeddata', 'canplay', 'canplaythrough'].forEach((event) => {
    video.addEventListener(event, play, { once: true });
  });

  play();

  if (!video.dataset.heroBound) {
    video.dataset.heroBound = '1';

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) play();
    });

    const resumeOnGesture = () => play();
    window.addEventListener('pointerdown', resumeOnGesture, { passive: true });
    window.addEventListener('touchstart', resumeOnGesture, { passive: true });
    window.addEventListener('scroll', resumeOnGesture, { passive: true });
  }
}

export function initHeroVideo() {
  startHeroVideo(document.querySelector('.hero__video'));
}
