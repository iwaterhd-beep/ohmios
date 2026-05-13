(function () {
  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(pointer: fine)").matches;

  function initLoader() {
    var loader = document.getElementById("page-loader");
    var pct = document.getElementById("loader-pct");
    if (!loader) return;

    document.body.classList.add("is-loading");
    var progress = 0;
    var timer = window.setInterval(function () {
      progress = Math.min(progress + Math.random() * 18 + 8, 100);
      if (pct) pct.textContent = Math.round(progress) + "%";
      if (progress >= 100) window.clearInterval(timer);
    }, 120);

    window.setTimeout(function () {
      loader.classList.add("is-hidden");
      document.body.classList.remove("is-loading");
    }, prefersReducedMotion ? 0 : 1500);
  }

  function initNavbar() {
    var navbar = document.querySelector(".navbar");
    var hamburger = document.querySelector(".nav-hamburger");
    var mobileMenu = document.querySelector(".nav-mobile");
    if (!navbar) return;

    function updateNavbar() {
      navbar.classList.toggle("is-scrolled", window.scrollY > 24);
    }

    updateNavbar();
    window.addEventListener("scroll", updateNavbar, { passive: true });

    if (!hamburger || !mobileMenu) return;

    hamburger.addEventListener("click", function () {
      var isOpen = mobileMenu.classList.toggle("is-open");
      hamburger.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    mobileMenu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        mobileMenu.classList.remove("is-open");
        hamburger.setAttribute("aria-expanded", "false");
      });
    });
  }

  function initScrollProgress() {
    var bar = document.getElementById("scroll-progress");
    if (!bar) return;

    function update() {
      var scrollTop = window.scrollY;
      var height = document.documentElement.scrollHeight - window.innerHeight;
      var progress = height > 0 ? (scrollTop / height) * 100 : 0;
      bar.style.width = progress + "%";
    }

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
  }

  function initSmoothScroll() {
    if (prefersReducedMotion || typeof Lenis === "undefined") return;

    var lenis = new Lenis({
      duration: 1.1,
      smoothWheel: true
    });

    function raf(time) {
      lenis.raf(time);
      window.requestAnimationFrame(raf);
    }

    window.requestAnimationFrame(raf);
  }

  function initCursor() {
    if (!finePointer || prefersReducedMotion) return;

    var dot = document.getElementById("cursor-dot");
    var ring = document.getElementById("cursor-ring");
    if (!dot || !ring) return;

    document.body.classList.add("has-custom-cursor");

    var ringX = 0;
    var ringY = 0;
    var mouseX = 0;
    var mouseY = 0;

    window.addEventListener("mousemove", function (event) {
      mouseX = event.clientX;
      mouseY = event.clientY;
      dot.style.transform = "translate3d(" + mouseX + "px, " + mouseY + "px, 0)";
    });

    function animateRing() {
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;
      ring.style.transform = "translate3d(" + ringX + "px, " + ringY + "px, 0)";
      window.requestAnimationFrame(animateRing);
    }

    animateRing();

    document.querySelectorAll("a, button, .btn, input, textarea, select").forEach(function (element) {
      element.addEventListener("mouseenter", function () {
        ring.classList.add("is-hover");
      });
      element.addEventListener("mouseleave", function () {
        ring.classList.remove("is-hover");
      });
    });
  }

  function initReveal() {
    var items = document.querySelectorAll(".reveal");
    if (!items.length) return;

    if (prefersReducedMotion || typeof IntersectionObserver === "undefined") {
      items.forEach(function (item) {
        item.classList.add("is-visible");
      });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    items.forEach(function (item) {
      observer.observe(item);
    });
  }

  function initCounters() {
    var counters = document.querySelectorAll("[data-counter]");
    if (!counters.length) return;

    function animateCounter(element) {
      var target = Number(element.dataset.target || 0);
      var suffix = element.dataset.suffix || "";
      var duration = prefersReducedMotion ? 0 : 1400;
      var start = performance.now();

      function frame(now) {
        var progress = duration === 0 ? 1 : Math.min((now - start) / duration, 1);
        var value = Math.round(target * progress);
        element.textContent = value + suffix;
        if (progress < 1) window.requestAnimationFrame(frame);
      }

      window.requestAnimationFrame(frame);
    }

    if (typeof IntersectionObserver === "undefined") {
      counters.forEach(animateCounter);
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.35 });

    counters.forEach(function (counter) {
      observer.observe(counter);
    });
  }

  function initProjectFilters() {
    var groups = document.querySelectorAll("[data-filter-group]");
    groups.forEach(function (group) {
      var buttons = group.querySelectorAll("[data-filter]");
      var cards = document.querySelectorAll("[data-category]");
      if (!buttons.length || !cards.length) return;

      buttons.forEach(function (button) {
        button.addEventListener("click", function () {
          var filter = button.dataset.filter;
          buttons.forEach(function (item) {
            item.classList.toggle("active", item === button);
          });

          cards.forEach(function (card) {
            var match = filter === "all" || card.dataset.category === filter;
            card.classList.toggle("is-hidden", !match);
          });
        });
      });
    });
  }

  function initTestimonialSlider() {
    var track = document.querySelector(".testimonials-track");
    var dots = document.querySelectorAll(".slider-dot");
    var prev = document.querySelector(".slider-prev");
    var next = document.querySelector(".slider-next");
    if (!track || !dots.length) return;

    var index = 0;

    function update() {
      track.style.transform = "translateX(-" + index * 100 + "%)";
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("active", dotIndex === index);
      });
    }

    if (prev) {
      prev.addEventListener("click", function () {
        index = (index - 1 + dots.length) % dots.length;
        update();
      });
    }

    if (next) {
      next.addEventListener("click", function () {
        index = (index + 1) % dots.length;
        update();
      });
    }

    dots.forEach(function (dot, dotIndex) {
      dot.addEventListener("click", function () {
        index = dotIndex;
        update();
      });
    });
  }

  function initHeroLight() {
    var hero = document.querySelector(".hero");
    var light = document.querySelector(".hero-cursor-light");
    if (!hero || !light || !finePointer) return;

    hero.addEventListener("mousemove", function (event) {
      var rect = hero.getBoundingClientRect();
      var x = ((event.clientX - rect.left) / rect.width) * 100;
      var y = ((event.clientY - rect.top) / rect.height) * 100;
      light.style.background = "radial-gradient(circle at " + x + "% " + y + "%, rgba(0,212,120,0.08), transparent 45%)";
    });
  }

  function initContactForm() {
    var form = document.querySelector(".contact-form");
    if (!form) return;

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      var fields = form.querySelectorAll("input, select, textarea");
      var valid = true;

      fields.forEach(function (field) {
        if (!field.required) return;
        var isValid = field.value.trim() !== "";
        field.classList.toggle("is-invalid", !isValid);
        if (!isValid) valid = false;
      });

      var status = form.querySelector(".form-status");
      if (!status) {
        status = document.createElement("p");
        status.className = "form-status";
        form.appendChild(status);
      }

      if (!valid) {
        status.textContent = "Complete los campos obligatorios para continuar.";
        status.className = "form-status is-error";
        return;
      }

      status.textContent = "Gracias. Hemos registrado su solicitud; le contactaremos lo antes posible.";
      status.className = "form-status is-success";
      form.reset();
    });
  }

  function initNewsletter() {
    var forms = document.querySelectorAll(".newsletter-form");
    forms.forEach(function (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var input = form.querySelector(".newsletter-input");
        if (!input || !input.value.trim()) return;
        input.value = "";
        input.placeholder = "Gracias por suscribirte";
      });
    });
  }

  function initParticles() {
    var heroCanvas = document.getElementById("hero-canvas");
    var footerCanvas = document.getElementById("footer-canvas");
    if (window.ArkosParticles) {
      if (heroCanvas) window.ArkosParticles.init(heroCanvas);
      if (footerCanvas) window.ArkosParticles.init(footerCanvas);
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    initNavbar();
    initReveal();
    initProjectFilters();
    initContactForm();
  });
})();
