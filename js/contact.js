/* ============================================
   CONTACT FORM — Validation
   ============================================ */

const form = document.querySelector('.contact-form');
if (!form) throw new Error('Contact form not found');

const fields = {
  name:    form.querySelector('#name'),
  email:   form.querySelector('#email'),
  subject: form.querySelector('#subject'),
  message: form.querySelector('#message'),
};

const errorFor = (field) => form.querySelector(`[data-error="${field}"]`);

const showError = (field, msg) => {
  const el = errorFor(field);
  const input = fields[field];
  if (el) el.textContent = msg;
  input?.setAttribute('aria-invalid', 'true');
  input?.classList.add('invalid');
};

const clearError = (field) => {
  const el = errorFor(field);
  const input = fields[field];
  if (el) el.textContent = '';
  input?.removeAttribute('aria-invalid');
  input?.classList.remove('invalid');
};

const validateEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const validate = () => {
  let valid = true;

  if (!fields.name?.value.trim()) {
    showError('name', 'Please enter your name.');
    valid = false;
  } else {
    clearError('name');
  }

  if (!fields.email?.value.trim()) {
    showError('email', 'Please enter your email.');
    valid = false;
  } else if (!validateEmail(fields.email.value)) {
    showError('email', 'Please enter a valid email address.');
    valid = false;
  } else {
    clearError('email');
  }

  if (!fields.message?.value.trim()) {
    showError('message', 'Please enter a message.');
    valid = false;
  } else {
    clearError('message');
  }

  return valid;
};

/* ---- Live validation ---- */

Object.entries(fields).forEach(([name, input]) => {
  input?.addEventListener('blur', () => {
    if (input.value.trim()) clearError(name);
  });
});

/* ---- Submit ---- */

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!validate()) return;

  const submitBtn = form.querySelector('.form-submit');
  const successMsg = form.querySelector('.form-success');

  submitBtn.disabled = true;
  submitBtn.textContent = 'Sending...';

  // Simulate send (replace with actual Formspree / backend call)
  await new Promise(resolve => setTimeout(resolve, 1200));

  form.style.opacity = '0';
  form.style.transition = 'opacity 400ms ease';

  setTimeout(() => {
    form.style.display = 'none';
    if (successMsg) {
      successMsg.hidden = false;
    }
  }, 400);
});
