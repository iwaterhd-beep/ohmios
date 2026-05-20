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
          <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <rect width="40" height="40" rx="8" fill="url(#preloaderGrad)"/>
            <path d="M12 28V12h4.5l3.5 9.5L23.5 12H28v16h-3.5V18.5L21 28h-2L15.5 18.5V28H12z" fill="#0B0B0B"/>
            <defs>
              <linearGradient id="preloaderGrad" x1="0" y1="0" x2="40" y2="40">
                <stop stop-color="#00AEEF"/>
                <stop offset="1" stop-color="#00D084"/>
              </linearGradient>
            </defs>
          </svg>
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
