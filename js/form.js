/**
 * OHMIOS ENERGÍA — Contact Form Module
 * Validation and submission handling
 */

export function initForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  const fields = {
    name: form.querySelector('[name="name"]'),
    email: form.querySelector('[name="email"]'),
    message: form.querySelector('[name="message"]'),
  };

  // Clear errors on input
  Object.values(fields).forEach((input) => {
    input?.addEventListener('input', () => {
      clearFieldError(input);
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    let isValid = true;

    if (!fields.name?.value.trim()) {
      setFieldError(fields.name);
      isValid = false;
    }

    if (!fields.email?.value.trim() || !isValidEmail(fields.email.value)) {
      setFieldError(fields.email);
      isValid = false;
    }

    if (!fields.message?.value.trim()) {
      setFieldError(fields.message);
      isValid = false;
    }

    if (!isValid) return;

    const submitBtn = form.querySelector('[type="submit"]');
    const originalHTML = submitBtn.innerHTML;
    submitBtn.innerHTML = 'Enviado ✓';
    submitBtn.disabled = true;

    setTimeout(() => {
      submitBtn.innerHTML = originalHTML;
      submitBtn.disabled = false;
      form.reset();
    }, 3000);
  });
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function setFieldError(input) {
  if (!input) return;
  input.classList.add('is-error');
  input.closest('.form-group')?.classList.add('has-error');
}

function clearFieldError(input) {
  if (!input) return;
  input.classList.remove('is-error');
  input.closest('.form-group')?.classList.remove('has-error');
}
