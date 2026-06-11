/* ============================================
   SCROLL ANIMATIONS — IntersectionObserver
   ============================================ */

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target); // Animate once
    }
  });
}, {
  threshold: 0.12,
  rootMargin: '0px 0px -40px 0px'
});

document.querySelectorAll('[data-animate]').forEach(el => {
  observer.observe(el);
});
