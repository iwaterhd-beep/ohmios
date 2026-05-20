/**
 * Hero video — play when ready, respect reduced motion
 */
export function initHeroVideo() {
  const video = document.querySelector('.hero__video');
  if (!video) return;

  const media = video.closest('.hero__media');
  const fallback = document.querySelector('.hero__image--fallback');
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReduced) {
    video.pause();
    video.style.display = 'none';
    media?.classList.remove('is-video-active');
    return;
  }

  const showVideo = () => {
    video.style.display = '';
    media?.classList.add('is-video-active');
  };

  const showFallback = () => {
    video.pause();
    video.style.display = 'none';
    media?.classList.remove('is-video-active');
  };

  const tryPlay = () => {
    video.play().then(showVideo).catch(showFallback);
  };

  video.addEventListener('error', showFallback, { once: true });

  if (video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
    tryPlay();
    return;
  }

  video.addEventListener('canplay', tryPlay, { once: true });
  video.load();
}
