/**
 * OHMIOS ENERGÍA — Animations Module
 * GSAP-powered cinematic animations and counters
 */

export function initAnimations() {
  if (typeof gsap === 'undefined') return;

  initHeroAnimations();
  initRevealAnimations();
  initCounters();
  initServiceCards();
  initCtaParallax();
}

/**
 * Hero entrance animations
 */
function initHeroAnimations() {
  const heroElements = document.querySelectorAll('[data-animate="fade-up"]');

  if (heroElements.length === 0) return;

  gsap.set(heroElements, { opacity: 0, y: 60 });

  gsap.to(heroElements, {
    opacity: 1,
    y: 0,
    duration: 1,
    stagger: 0.12,
    ease: 'power3.out',
    delay: 0.3,
  });

  const hero = document.getElementById('hero');
  const heroMedia = hero?.querySelector('.hero__media');

  if (hero && heroMedia) {
    gsap.to(heroMedia, {
      yPercent: 15,
      ease: 'none',
      scrollTrigger: {
        trigger: hero,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      },
    });
  }
}

/**
 * Scroll-triggered reveal animations
 */
function initRevealAnimations() {
  const reveals = document.querySelectorAll('.reveal, [data-reveal]');

  reveals.forEach((el, index) => {
    gsap.fromTo(
      el,
      { opacity: 0, y: 50 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power3.out',
        delay: (index % 3) * 0.05,
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          toggleActions: 'play none none none',
        },
      }
    );
  });
}

/**
 * Animated number counters
 */
function initCounters() {
  const counters = document.querySelectorAll('[data-counter]');

  counters.forEach((counter) => {
    const target = parseInt(counter.dataset.counter, 10);
    const suffixEl = counter.querySelector('span');
    const suffix = suffixEl ? suffixEl.outerHTML : '';

    ScrollTrigger.create({
      trigger: counter,
      start: 'top 90%',
      once: true,
      onEnter: () => {
        gsap.to({ val: 0 }, {
          val: target,
          duration: 2,
          ease: 'power2.out',
          onUpdate: function () {
            counter.innerHTML = Math.round(this.targets()[0].val) + suffix;
          },
        });
      },
    });
  });
}

/**
 * Service card subtle tilt on hover
 */
function initServiceCards() {
  const cards = document.querySelectorAll('.service-card');

  cards.forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;

      gsap.to(card, {
        rotateY: x * 4,
        rotateX: -y * 4,
        duration: 0.4,
        ease: 'power2.out',
        transformPerspective: 800,
      });
    });

    card.addEventListener('mouseleave', () => {
      gsap.to(card, {
        rotateY: 0,
        rotateX: 0,
        duration: 0.6,
        ease: 'power2.out',
      });
    });
  });
}

/**
 * CTA background parallax
 */
function initCtaParallax() {
  const cta = document.querySelector('.cta');
  const ctaImage = cta?.querySelector('.cta__bg-image');

  if (cta && ctaImage) {
    gsap.to(ctaImage, {
      yPercent: 15,
      ease: 'none',
      scrollTrigger: {
        trigger: cta,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      },
    });
  }
}
