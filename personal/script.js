/* ═══════════════════════════════════════════════════════════════════════
   Alston Shi — Digital Portfolio v2 · script
   ═══════════════════════════════════════════════════════════════════════ */

/* ─── Mobile hamburger ──────────────────────────────────── */
const hamburger = document.getElementById('hamburger');
const navMobile = document.getElementById('nav-mobile');
if (hamburger && navMobile) {
  hamburger.addEventListener('click', () => navMobile.classList.toggle('open'));
  document.querySelectorAll('.mobile-link').forEach(link => {
    link.addEventListener('click', () => navMobile.classList.remove('open'));
  });
}

/* ─── Reveal on scroll (stagger by sibling index) ───────── */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    const customDelay = parseFloat(el.dataset.delay);
    if (!Number.isNaN(customDelay)) {
      el.style.transitionDelay = `${customDelay}s`;
    } else {
      const parent = el.closest('.skills-grid, .projects-grid, .photo-gallery, .about-grid, .timeline, .contact-grid');
      if (parent) {
        const all = Array.from(parent.querySelectorAll('.reveal:not(.visible)'));
        const idx = all.indexOf(el);
        if (idx >= 0) el.style.transitionDelay = `${idx * 80}ms`;
      }
    }
    el.classList.add('visible');
    revealObserver.unobserve(el);
  });
}, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

/* ─── Active nav link ───────────────────────────────────── */
const navLinks = document.querySelectorAll('.nav-links a[data-link]');
const sectionObs = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const id = entry.target.id;
    navLinks.forEach(link => {
      link.classList.toggle('active', link.dataset.link === id);
    });
  });
}, { threshold: 0.3 });
document.querySelectorAll('section[id]').forEach(s => sectionObs.observe(s));

/* ─── Hero floating particles ──────────────────────────── */
const particleHost = document.getElementById('hero-particles');
if (particleHost) {
  const frag = document.createDocumentFragment();
  for (let i = 0; i < 20; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = 2 + Math.random() * 4;
    p.style.left = `${Math.random() * 100}%`;
    p.style.top = `${Math.random() * 100}%`;
    p.style.width = `${size}px`;
    p.style.height = `${size}px`;
    p.style.opacity = (0.15 + Math.random() * 0.3).toFixed(2);
    p.style.setProperty('--dur', `${(15 + Math.random() * 25).toFixed(1)}s`);
    p.style.setProperty('--delay', `${(-Math.random() * 20).toFixed(1)}s`);
    frag.appendChild(p);
  }
  particleHost.appendChild(frag);
}

/* ─── Animated terminal (typing reveal) ────────────────── */
const termBody = document.getElementById('terminal-body');
const terminal = document.getElementById('terminal');
if (termBody && terminal) {
  const lines = [
    { prompt: true,  text: 'whoami' },
    { prompt: false, text: 'alston shi — infocomm & security grad · singapore' },
    { prompt: true,  text: 'cat skills.txt' },
    { prompt: false, text: 'python · javascript · figma · ceh · azure · grc' },
    { prompt: true,  text: 'ls projects/' },
    { prompt: false, text: 'sg-bus-ai/  dmo-wisdom/  dmo-yoga/  azure-fyp/' },
    { prompt: true,  text: 'echo $STATUS' },
    { prompt: false, text: '✓ open to new opportunities' },
  ];
  const totalChars = lines.reduce((s, l) => s + l.text.length + (l.prompt ? 2 : 0), 0);
  let started = false;
  let visibleChars = 0;
  let raf = null;

  const render = () => {
    let budget = visibleChars;
    let html = '';
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      if (budget <= 0) break;
      const fullLen = l.text.length + (l.prompt ? 2 : 0);
      const shown = budget >= fullLen ? l.text : l.text.slice(0, Math.max(0, budget - (l.prompt ? 2 : 0)));
      const isLast = budget < fullLen;
      const cursor = isLast ? '<span class="term-cursor">▎</span>' : '';
      const promptMark = l.prompt ? '<span class="term-prompt-mark">❯</span>' : '';
      html += `<div class="term-line ${l.prompt ? 'prompt' : 'output'}">${promptMark}${escapeHtml(shown)}${cursor}</div>`;
      budget -= fullLen;
    }
    if (visibleChars >= totalChars) {
      html += '<span class="term-cursor">▎</span>';
    }
    termBody.innerHTML = html;
  };

  const escapeHtml = (s) => s.replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));

  const tick = () => {
    visibleChars += 1;
    render();
    if (visibleChars < totalChars) {
      raf = setTimeout(tick, 28);
    }
  };

  const obs = new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !started) {
      started = true;
      obs.disconnect();
      tick();
    }
  }, { threshold: 0.3 });
  obs.observe(terminal);
}

/* ─── Animated stat counters ───────────────────────────── */
const stats = document.querySelectorAll('.stat');
const statObs = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    statObs.unobserve(el);
    const target = parseInt(el.dataset.stat, 10);
    const suffix = el.dataset.suffix || '';
    const numEl = el.querySelector('.stat-number');
    if (!numEl) return;
    const duration = 1200;
    const startTime = performance.now();
    const step = (now) => {
      const t = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      numEl.textContent = Math.round(target * eased) + suffix;
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}, { threshold: 0.5 });
stats.forEach(s => statObs.observe(s));

/* ─── Project filter ──────────────────────────────────── */
const filterPills = document.querySelectorAll('.filter-pill');
const projectCards = document.querySelectorAll('.project-card');
filterPills.forEach(pill => {
  pill.addEventListener('click', () => {
    filterPills.forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    const filter = pill.dataset.filter;
    projectCards.forEach(card => {
      const match = filter === 'All' || card.dataset.category === filter;
      card.classList.toggle('hidden', !match);
    });
  });
});

/* ─── Project modal ───────────────────────────────────── */
const modal       = document.getElementById('project-modal');
const modalClose  = document.getElementById('modal-close');
const modalImage  = document.getElementById('modal-image');
const modalTags   = document.getElementById('modal-tags');
const modalTitle  = document.getElementById('modal-title');
const modalDesc   = document.getElementById('modal-desc');
const modalHi     = document.getElementById('modal-highlights');
const modalStack  = document.getElementById('modal-stack');
const modalLink   = document.getElementById('modal-link');

function openProjectModal(data) {
  if (!modal) return;

  // Image vs styled placeholder
  modalImage.querySelectorAll('.modal-placeholder').forEach(n => n.remove());
  if (data.image) {
    modalImage.style.backgroundImage = `url('${data.image}')`;
    modalImage.classList.remove('proj-placeholder');
  } else {
    modalImage.style.backgroundImage = 'none';
    modalImage.classList.add('proj-placeholder');
    const ph = document.createElement('div');
    ph.className = 'modal-placeholder placeholder-inner';
    ph.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true">
        <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
      </svg>
      <span class="placeholder-label">${data.title || 'Project'}</span>
      <span class="placeholder-note">Internal · Not publicly deployed</span>
    `;
    modalImage.appendChild(ph);
  }

  modalTags.innerHTML = (data.tags || []).map(t => `<span class="proj-tag">${t}</span>`).join('');
  modalTitle.textContent = data.title || '';
  modalDesc.textContent = data.longDescription || data.description || '';
  modalHi.innerHTML = (data.highlights || []).map(h =>
    `<div class="modal-highlight"><span class="modal-highlight-mark">▸</span><span>${h}</span></div>`
  ).join('');
  modalStack.innerHTML = (data.stack || []).map(s =>
    `<span class="modal-stack-item">${s}</span>`
  ).join('');
  if (data.link) {
    modalLink.href = data.link;
    modalLink.style.display = '';
    const isGithub = /github\.com/i.test(data.link);
    modalLink.textContent = isGithub ? 'Source code →' : 'View live →';
  } else {
    modalLink.style.display = 'none';
  }
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeProjectModal() {
  if (!modal) return;
  modal.classList.remove('open');
  document.body.style.overflow = '';
}
projectCards.forEach(card => {
  card.addEventListener('click', () => {
    try {
      const data = JSON.parse(card.dataset.project || '{}');
      openProjectModal(data);
    } catch (err) { /* malformed dataset */ }
  });
});
if (modalClose) modalClose.addEventListener('click', closeProjectModal);
if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) closeProjectModal(); });

/* ─── Photo lightbox ──────────────────────────────────── */
const lightbox       = document.getElementById('lightbox');
const lightboxImg    = document.getElementById('lightbox-img');
const lightboxCap    = document.getElementById('lightbox-caption');
const lightboxClose  = document.getElementById('lightbox-close');

document.querySelectorAll('.photo-item').forEach(item => {
  item.addEventListener('click', () => {
    const img = item.querySelector('img');
    const cap = item.querySelector('.photo-overlay span');
    if (!img) return;
    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt;
    lightboxCap.textContent = cap ? cap.textContent : '';
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  });
});
function closeLightbox() {
  lightbox.classList.remove('open');
  document.body.style.overflow = '';
  lightboxImg.src = '';
}
if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
if (lightbox) lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeLightbox();
    closeProjectModal();
  }
});

/* ─── Contact form (Formspree backend + mailto fallback) ──
   SETUP: replace YOUR_FORM_ID after registering at formspree.io. Until
   then it falls back gracefully to mailto: so it still works. ────────── */
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/mzdwokqp';
const CONTACT_EMAIL = 'swnssoe@gmail.com';

const contactForm = document.getElementById('contact-form');
if (contactForm) {
  const btn = contactForm.querySelector('button[type="submit"]');
  const originalLabel = btn ? btn.textContent : '';
  let status = 'idle'; // idle | sending | sent | error

  // Honeypot: invisible field bots will fill in
  if (!contactForm.querySelector('input[name="_gotcha"]')) {
    const hp = document.createElement('input');
    hp.type = 'text';
    hp.name = '_gotcha';
    hp.tabIndex = -1;
    hp.autocomplete = 'off';
    hp.style.cssText = 'position:absolute;left:-9999px;opacity:0';
    contactForm.appendChild(hp);
  }

  const setLabel = (text, color) => {
    if (!btn) return;
    btn.textContent = text;
    if (color) btn.style.background = color;
  };

  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (status === 'sending' || status === 'sent') return;
    const name    = contactForm.name.value.trim();
    const email   = contactForm.email.value.trim();
    const message = contactForm.message.value.trim();

    // Fallback: if endpoint not configured, use mailto
    if (FORMSPREE_ENDPOINT.includes('YOUR_FORM_ID')) {
      const subject = encodeURIComponent(`Portfolio Contact from ${name}`);
      const body    = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`);
      window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
      status = 'sent';
      setLabel('Sent — thank you');
      return;
    }

    status = 'sending';
    setLabel('Sending…');
    try {
      const res = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        body: new FormData(contactForm),
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        status = 'sent';
        setLabel('Sent — thank you');
        contactForm.reset();
      } else {
        status = 'error';
        setLabel('Try again');
      }
    } catch (err) {
      status = 'error';
      setLabel('Try again');
    }

    // Reset button label after a delay if not sent successfully
    if (status === 'error') {
      setTimeout(() => { if (status !== 'sending') setLabel(originalLabel); }, 4000);
    }
  });
}

/* ─── Smooth scroll for anchor links ──────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    const href = anchor.getAttribute('href');
    if (href === '#' || href.length < 2) return;
    const target = document.querySelector(href);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

/* ─── 3D card tilt on project cards ───────────────────────────────── */
(function tiltProjectCards() {
  // Skip on touch / coarse-pointer devices
  if (window.matchMedia('(hover: none) and (pointer: coarse)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const MAX_TILT = 8;     // max rotation in degrees
  const LIFT = 8;         // upward translate in px
  const SCALE = 1.015;

  document.querySelectorAll('.project-card').forEach((card) => {
    let rafId = null;
    let tx = 0, ty = 0;     // target rotations
    let cx = 0, cy = 0;     // current (lerped)
    let active = false;

    const tick = () => {
      cx += (tx - cx) * 0.18;
      cy += (ty - cy) * 0.18;
      const lift = active ? LIFT : 0;
      const scale = active ? SCALE : 1;
      card.style.transform = `perspective(900px) rotateX(${cy.toFixed(2)}deg) rotateY(${cx.toFixed(2)}deg) translateY(${-lift}px) scale(${scale})`;
      // Shift the image a little within the frame for parallax
      const img = card.querySelector('.proj-image img');
      if (img) {
        img.style.transform = `translate(${(-cx * 0.4).toFixed(2)}px, ${(cy * 0.4).toFixed(2)}px) scale(${active ? 1.06 : 1})`;
      }
      // Animated highlight glare following cursor
      card.style.setProperty('--glare-x', `${50 + cx * 4}%`);
      card.style.setProperty('--glare-y', `${50 + cy * 4}%`);

      if (active || Math.abs(tx - cx) > 0.05 || Math.abs(ty - cy) > 0.05) {
        rafId = requestAnimationFrame(tick);
      } else {
        rafId = null;
        card.style.transform = '';
        if (img) img.style.transform = '';
      }
    };

    card.addEventListener('mouseenter', () => {
      active = true;
      card.classList.add('is-tilting');
      if (!rafId) rafId = requestAnimationFrame(tick);
    });
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      tx = px * MAX_TILT * 2;     // rotateY
      ty = -py * MAX_TILT * 2;    // rotateX (inverted)
    });
    card.addEventListener('mouseleave', () => {
      active = false;
      tx = 0;
      ty = 0;
      card.classList.remove('is-tilting');
      if (!rafId) rafId = requestAnimationFrame(tick);
    });
  });
})();
