/**
 * OHMIOS ENERGÍA — Preloader
 */

export function injectPreloader() {
  if (document.getElementById('preloader')) return;

  document.body.insertAdjacentHTML(
    'afterbegin',
    `<div class="preloader" id="preloader" aria-hidden="true">
      <div class="preloader__inner">
        <div class="preloader__logo">
          <img src="assets/images/logo-ohmios.png" alt="" width="200" height="54" decoding="async">
        </div>
        <div class="preloader__bar"><span class="preloader__bar-fill"></span></div>
      </div>
    </div>`
  );
}

export function hidePreloader() {
  const preloader = document.getElementById('preloader');
  if (!preloader) return;

  if (typeof gsap !== 'undefined') {
    gsap.to(preloader, {
      opacity: 0,
      duration: 0.6,
      ease: 'power2.inOut',
      onComplete: () => preloader.remove(),
    });
  } else {
    preloader.remove();
  }
}

/**
 * Hero video — play when ready, respect reduced motion
 */
export function initHeroVideo() {
  const video = document.querySelector('.hero__video');
  if (!video) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReduced) {
    video.pause();
    video.style.display = 'none';
    return;
  }

  video.play().catch(() => {
    video.style.display = 'none';
  });
}
