/**
 * OHMIOS ENERGÍA — Parallax Module
 * Subtle parallax effects for sections (used in later steps)
 */

export function initParallax() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  const parallaxElements = document.querySelectorAll('[data-parallax]');

  parallaxElements.forEach((el) => {
    const speed = parseFloat(el.dataset.parallax) || 0.3;

    gsap.to(el, {
      yPercent: speed * 100,
      ease: 'none',
      scrollTrigger: {
        trigger: el.parentElement || el,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      },
    });
  });
}
