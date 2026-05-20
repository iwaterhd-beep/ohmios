/**
 * OHMIOS ENERGÍA — Contact Form Module
 * Envío real vía FormSubmit → instalaciones.ohmios@gmail.com
 */

import { SITE } from './config.js';

export function initForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  const fields = {
    name: form.querySelector('[name="name"]'),
    email: form.querySelector('[name="email"]'),
    message: form.querySelector('[name="message"]'),
  };

  const statusEl = document.getElementById('formStatus');
  const submitBtn = form.querySelector('[type="submit"]');
  const originalHTML = submitBtn?.innerHTML || '';

  Object.values(fields).forEach((input) => {
    input?.addEventListener('input', () => clearFieldError(input));
  });

  form.addEventListener('submit', async (e) => {
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

    if (!isValid) {
      showStatus(statusEl, 'error', 'Revisa los campos marcados antes de enviar.');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Enviando…';
    showStatus(statusEl, '', '');

    const payload = {
      name: fields.name.value.trim(),
      email: fields.email.value.trim(),
      phone: form.querySelector('[name="phone"]')?.value.trim() || '—',
      service: form.querySelector('[name="service"]')?.value || '—',
      message: fields.message.value.trim(),
      _subject: `Nuevo contacto web — ${fields.name.value.trim()}`,
      _template: 'table',
      _captcha: 'false',
    };

    try {
      const response = await fetch(`https://formsubmit.co/ajax/${SITE.email}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Error de envío');

      form.reset();
      submitBtn.innerHTML = 'Enviado ✓';
      showStatus(statusEl, 'success', 'Mensaje enviado correctamente. Te responderemos en menos de 24 horas.');

      setTimeout(() => {
        submitBtn.innerHTML = originalHTML;
        submitBtn.disabled = false;
      }, 4000);
    } catch {
      submitBtn.innerHTML = originalHTML;
      submitBtn.disabled = false;
      showStatus(statusEl, 'error', 'No se pudo enviar. Escríbenos a ' + SITE.email + ' o llama al ' + SITE.phone + '.');
    }
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

function showStatus(el, type, message) {
  if (!el) return;
  el.className = 'form-status';
  if (type) el.classList.add(`form-status--${type}`);
  el.textContent = message;
  el.hidden = !message;
}
