/* ============================================
   THEME TOGGLE — dark / light
   ============================================ */

(function () {
  const STORAGE_KEY = 'theme';

  // Apply saved theme immediately to avoid flash
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'light') document.documentElement.setAttribute('data-theme', 'light');

  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.querySelector('.theme-toggle');
    if (!btn) return;

    btn.addEventListener('click', () => {
      const isLight = document.documentElement.getAttribute('data-theme') === 'light';
      if (isLight) {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem(STORAGE_KEY, 'dark');
      } else {
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem(STORAGE_KEY, 'light');
      }
    });
  });
})();
