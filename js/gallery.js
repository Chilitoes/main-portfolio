/* ============================================
   GALLERY — Filter + Lightbox
   ============================================ */

/* ---- State ---- */

let currentIndex = 0;
let visibleItems = [];

/* ---- Elements ---- */

const filterBtns = document.querySelectorAll('.filter-btn');
const galleryItems = document.querySelectorAll('.gallery-item');
const galleryCount = document.querySelector('.gallery-count');
const galleryEmpty = document.querySelector('.gallery-empty');

/* ---- Filter logic ---- */

const updateCount = () => {
  visibleItems = [...galleryItems].filter(item => !item.hidden);
  if (galleryCount) {
    galleryCount.textContent = `${visibleItems.length} ${visibleItems.length === 1 ? 'photo' : 'photos'}`;
  }
  if (galleryEmpty) {
    galleryEmpty.classList.toggle('visible', visibleItems.length === 0);
  }
};

const filterGallery = (category) => {
  galleryItems.forEach((item, i) => {
    const cat = item.dataset.category;
    const show = category === 'all' || cat === category;

    if (show) {
      item.hidden = false;
      item.style.setProperty('--delay', `${(i % 9) * 40}ms`);
      // Trigger re-animation
      item.style.opacity = '0';
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          item.style.opacity = '';
        });
      });
    } else {
      item.hidden = true;
    }
  });

  updateCount();
};

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    filterGallery(btn.dataset.filter);
  });
});

updateCount(); // Initial count

/* ---- Lightbox ---- */

const lightbox = document.getElementById('lightbox');
const lightboxImg = lightbox?.querySelector('.lightbox-img');
const lightboxTitle = lightbox?.querySelector('.lightbox-caption-title');
const lightboxCat = lightbox?.querySelector('.lightbox-caption-cat');
const lightboxCounter = lightbox?.querySelector('.lightbox-counter');
const lightboxClose = lightbox?.querySelector('.lightbox-close');
const lightboxPrev = lightbox?.querySelector('.lightbox-prev');
const lightboxNext = lightbox?.querySelector('.lightbox-next');

const openLightbox = (index) => {
  if (!lightbox) return;
  visibleItems = [...galleryItems].filter(item => !item.hidden);
  currentIndex = index;
  loadLightboxImage(currentIndex);
  lightbox.classList.add('open');
  document.body.style.overflow = 'hidden';
  lightboxClose?.focus();
};

const closeLightbox = () => {
  lightbox?.classList.remove('open');
  document.body.style.overflow = '';
};

const loadLightboxImage = (index) => {
  const item = visibleItems[index];
  if (!item || !lightboxImg) return;

  const img = item.querySelector('img');
  const fullSrc = item.dataset.full || img?.src;
  const title = item.dataset.title || '';
  const cat = item.dataset.category || '';

  lightboxImg.style.opacity = '0';
  lightboxImg.src = fullSrc;
  lightboxImg.alt = title;

  lightboxImg.onload = () => {
    lightboxImg.style.opacity = '1';
  };

  if (lightboxTitle) lightboxTitle.textContent = title;
  if (lightboxCat) lightboxCat.textContent = cat;
  if (lightboxCounter) lightboxCounter.textContent = `${index + 1} / ${visibleItems.length}`;
};

const navigate = (dir) => {
  visibleItems = [...galleryItems].filter(item => !item.hidden);
  currentIndex = (currentIndex + dir + visibleItems.length) % visibleItems.length;
  loadLightboxImage(currentIndex);
};

/* ---- Event listeners ---- */

galleryItems.forEach((item, i) => {
  item.addEventListener('click', () => {
    visibleItems = [...galleryItems].filter(item => !item.hidden);
    const visIndex = visibleItems.indexOf(item);
    if (visIndex !== -1) openLightbox(visIndex);
  });
});

lightboxClose?.addEventListener('click', closeLightbox);
lightboxPrev?.addEventListener('click', () => navigate(-1));
lightboxNext?.addEventListener('click', () => navigate(1));

lightbox?.addEventListener('click', (e) => {
  if (e.target === lightbox) closeLightbox();
});

/* ---- Keyboard navigation ---- */

document.addEventListener('keydown', (e) => {
  if (!lightbox?.classList.contains('open')) return;

  switch (e.key) {
    case 'Escape':     closeLightbox(); break;
    case 'ArrowLeft':  navigate(-1); break;
    case 'ArrowRight': navigate(1); break;
  }
});

/* ---- Touch/swipe support ---- */

let touchStartX = 0;

lightbox?.addEventListener('touchstart', (e) => {
  touchStartX = e.touches[0].clientX;
}, { passive: true });

lightbox?.addEventListener('touchend', (e) => {
  const delta = touchStartX - e.changedTouches[0].clientX;
  if (Math.abs(delta) > 50) {
    navigate(delta > 0 ? 1 : -1);
  }
}, { passive: true });

/* ---- Lightbox image transition ---- */

if (lightboxImg) {
  lightboxImg.style.transition = 'opacity 200ms ease';
}
