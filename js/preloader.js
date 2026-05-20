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

/** Reproduce el vídeo de fondo del hero */
export function startHeroVideo(video) {
  if (!video || video.dataset.heroMode !== 'video') return;

  const media = video.closest('.hero__media');
  media?.classList.add('is-video-active');

  video.muted = true;
  video.defaultMuted = true;
  video.setAttribute('muted', '');
  video.playsInline = true;
  video.loop = true;
  video.autoplay = true;

  const play = () => {
    const result = video.play();
    if (result && typeof result.catch === 'function') {
      result.catch(() => {});
    }
  };

  if (video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
    play();
  } else {
    video.addEventListener('canplay', play, { once: true });
    video.addEventListener('loadeddata', play, { once: true });
  }

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) play();
  }, { passive: true });
}

export function initHeroVideo() {
  startHeroVideo(document.getElementById('hero-bg-video'));
}

export function hasHeroVideo() {
  const v = document.getElementById('hero-bg-video');
  return Boolean(v && v.dataset.heroMode === 'video' && !v.hidden);
}
