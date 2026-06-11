/* ============================================
   NAVIGATION
   ============================================ */

const nav = document.querySelector('.nav');
const navToggle = document.querySelector('.nav-toggle');
const navMobile = document.querySelector('.nav-mobile');
const navLinks = document.querySelectorAll('.nav-links a, .nav-mobile a');

/* ---- Scroll state ---- */

const handleScroll = () => {
  if (window.scrollY > 60) {
    nav.classList.add('scrolled');
  } else {
    nav.classList.remove('scrolled');
  }
};

window.addEventListener('scroll', handleScroll, { passive: true });
handleScroll(); // Run on load

/* ---- Mobile toggle ---- */

navToggle?.addEventListener('click', () => {
  const isOpen = navToggle.classList.toggle('open');
  navMobile.classList.toggle('open', isOpen);
  navToggle.setAttribute('aria-expanded', isOpen);
  document.body.style.overflow = isOpen ? 'hidden' : '';
});

/* ---- Close mobile menu on link click ---- */

navMobile?.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navToggle.classList.remove('open');
    navMobile.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  });
});

/* ---- Active link highlighting ---- */

const currentPath = window.location.pathname.split('/').pop() || 'index.html';

navLinks.forEach(link => {
  const href = link.getAttribute('href');
  if (href === currentPath || (currentPath === '' && href === 'index.html')) {
    link.classList.add('active');
  }
});
