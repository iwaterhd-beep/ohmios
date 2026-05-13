(function () {
  function initParticles(canvas) {
    if (!canvas) return;

    var context = canvas.getContext("2d");
    if (!context) return;

    var particles = [];
    var width = 0;
    var height = 0;
    var animationId = 0;
    var count = 56;

    function resize() {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
      context.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    }

    function createParticle() {
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 2 + 0.6,
        speedX: (Math.random() - 0.5) * 0.35,
        speedY: (Math.random() - 0.5) * 0.35,
        alpha: Math.random() * 0.45 + 0.15,
        hue: Math.random() > 0.5 ? "0, 212, 120" : "30, 140, 255"
      };
    }

    function draw() {
      context.clearRect(0, 0, width, height);

      particles.forEach(function (particle, index) {
        particle.x += particle.speedX;
        particle.y += particle.speedY;

        if (particle.x < 0 || particle.x > width) particle.speedX *= -1;
        if (particle.y < 0 || particle.y > height) particle.speedY *= -1;

        context.beginPath();
        context.fillStyle = "rgba(" + particle.hue + ", " + particle.alpha + ")";
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        context.fill();

        for (var next = index + 1; next < particles.length; next += 1) {
          var target = particles[next];
          var distance = Math.hypot(particle.x - target.x, particle.y - target.y);

          if (distance < 120) {
            context.strokeStyle = "rgba(0, 212, 120, " + (0.12 * (1 - distance / 120)) + ")";
            context.beginPath();
            context.moveTo(particle.x, particle.y);
            context.lineTo(target.x, target.y);
            context.stroke();
          }
        }
      });

      animationId = window.requestAnimationFrame(draw);
    }

    resize();
    for (var i = 0; i < count; i += 1) {
      particles.push(createParticle());
    }
    draw();

    window.addEventListener("resize", resize);
    canvas.addEventListener("particles:destroy", function () {
      window.cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    });
  }

  window.ArkosParticles = {
    init: initParticles
  };
})();
