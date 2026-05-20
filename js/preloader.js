/**
 * Preloader + reproducción del vídeo hero
 */

let heroWatchdog = null;

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

function clearHeroWatchdog() {
  if (heroWatchdog) {
    clearInterval(heroWatchdog);
    heroWatchdog = null;
  }
}

/** Fuerza reproducción del vídeo de fondo — optimizado para Chrome */
export function startHeroVideo(video) {
  if (!video || video.dataset.heroMode !== 'video') return;

  clearHeroWatchdog();

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
  video.setAttribute('disablepictureinpicture', '');
  media?.classList.add('is-video-active');

  let attempts = 0;

  const play = () => {
    attempts += 1;
    video.muted = true;

    const promise = video.play();
    if (!promise) return;

    promise.catch(() => {
      if (attempts < 12) {
        setTimeout(play, 200 * attempts);
      }
    });
  };

  if (video.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA) {
    play();
  } else {
    video.addEventListener('canplaythrough', play, { once: true });
    video.addEventListener('canplay', play, { once: true });
    video.addEventListener('loadeddata', play, { once: true });
  }

  let lastTime = -1;
  let stuckCount = 0;

  heroWatchdog = setInterval(() => {
    if (!document.contains(video)) {
      clearHeroWatchdog();
      return;
    }

    if (video.paused && video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
      play();
    }

    if (video.currentTime === lastTime && !video.paused && video.readyState >= 3) {
      stuckCount += 1;
      if (stuckCount >= 2) {
        video.currentTime = 0;
        play();
        stuckCount = 0;
      }
    } else {
      stuckCount = 0;
    }

    lastTime = video.currentTime;
  }, 800);

  if (!video.dataset.heroBound) {
    video.dataset.heroBound = '1';

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) play();
    });

    window.addEventListener('pointerdown', play, { passive: true });
    window.addEventListener('wheel', play, { passive: true });
  }
}

export function initHeroVideo() {
  startHeroVideo(document.querySelector('.hero__video'));
}

export function hasHeroVideo() {
  return Boolean(document.querySelector('.hero__video'));
}
