// ============ Home page ============

function Home({ go, onOpenLightbox }) {
  const heroBgRef = React.useRef(null);
  const heroScrollRef = React.useRef(null);
  const heroZoomRef = React.useRef(null);
  const splitScrollRef = React.useRef(null);
  const splitImgRef = React.useRef(null);
  const splitZoomRef = React.useRef(null);
  const splitTextRef = React.useRef(null);
  const portTeaserScrollRef = React.useRef(null);
  const portTeaserPhotoRef = React.useRef(null);
  const portTeaserLabelRef = React.useRef(null);
  const portTeaserGridRef = React.useRef(null);
  const portTeaserCtaRef = React.useRef(null);
  window.useMouseParallax(heroBgRef, 14);

  React.useEffect(() => {
    // Hero: 1.2 → 1.0
    const zone = heroScrollRef.current;
    const zoom = heroZoomRef.current;
    if (!zone || !zoom) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.matchMedia('(max-width: 900px)').matches) return;
    const onScroll = () => {
      const progress = Math.max(0, Math.min(1, -zone.getBoundingClientRect().top / window.innerHeight));
      zoom.style.transform = `scale(${1.2 - 0.2 * progress})`;
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  React.useEffect(() => {
    // Split: card slides up + fades in, image has subtle ken-burns. Text and button reveal much later.
    const zone = splitScrollRef.current;
    const card = splitImgRef.current;
    const zoom = splitZoomRef.current;
    const text = splitTextRef.current;
    const quote = quoteRef.current;
    if (!zone || !card) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      card.style.opacity = '1';
      card.style.transform = 'none';
      if (zoom) zoom.style.transform = 'none';
      if (text) { text.style.opacity = '1'; text.style.transform = 'none'; }
      return;
    }
    if (window.matchMedia('(max-width: 900px)').matches) {
      card.style.opacity = '1';
      card.style.transform = 'none';
      if (zoom) zoom.style.transform = 'none';
      if (text) { text.style.opacity = '1'; text.style.transform = 'none'; }
      const btn = text?.querySelector('.btn-arrow');
      if (btn) { btn.style.opacity = '1'; btn.style.transform = 'none'; }
      return;
    }

    // Calculate when quote reaches 80% toward top (20% from top of viewport)
    let quoteScrollTrigger = 0;
    if (quote) {
      quoteScrollTrigger = quote.offsetTop - (window.innerHeight * 0.2);
    }

    const easeOut = (t) => 1 - Math.pow(1 - t, 3);
    const onScroll = () => {
      const scrolled = window.scrollY;

      // Card entrance: starts when quote reaches 80% to top, over next 55vh
      const cardStart = quoteScrollTrigger;
      const cardEnd = cardStart + (window.innerHeight * 0.55);
      const cardProg = easeOut(Math.max(0, Math.min(1, (scrolled - cardStart) / (cardEnd - cardStart))));
      card.style.opacity = cardProg;
      card.style.transform = `translateY(${(1 - cardProg) * 80}px) scale(${0.95 + 0.05 * cardProg})`;

      // Inner image ken-burns: 1.3 → 1.0 (fully zoomed out 100vh after card starts)
      if (zoom) {
        const kenStart = cardStart;
        const kenEnd = kenStart + (window.innerHeight * 1.0);
        const kenProg = Math.max(0, Math.min(1, (scrolled - kenStart) / (kenEnd - kenStart)));
        zoom.style.transform = `scale(${1.3 - 0.3 * kenProg})`;
      }

      if (text) {
        // Text reveals starting when image is ~80% zoomed out
        const textStart = quoteScrollTrigger + (window.innerHeight * 0.85);
        const textEnd = quoteScrollTrigger + (window.innerHeight * 1.25);
        const textProg = Math.max(0, Math.min(1, (scrolled - textStart) / (textEnd - textStart)));
        text.style.opacity = textProg;
        text.style.transform = `translateX(${(1 - textProg) * -120}px)`;

        // Button only appears during extra scroll after photo fully zoomed
        const btnStart = quoteScrollTrigger + (window.innerHeight * 1.2);
        const btnEnd = quoteScrollTrigger + (window.innerHeight * 1.7);
        const btnProg = Math.max(0, Math.min(1, (scrolled - btnStart) / (btnEnd - btnStart)));
        const btn = text.querySelector('.btn-arrow');
        if (btn) {
          btn.style.opacity = btnProg;
          btn.style.transform = `translateX(${(1 - btnProg) * -100}px)`;
        }
      }
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Portfolio teaser: torii gate zooms out to card, grid fades in
  React.useEffect(() => {
    const zone = portTeaserScrollRef.current;
    const photo = portTeaserPhotoRef.current;
    const label = portTeaserLabelRef.current;
    const grid = portTeaserGridRef.current;
    const cta = portTeaserCtaRef.current;
    if (!zone || !photo) return;
    if (window.matchMedia('(max-width: 900px)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      if (label) { label.style.opacity = '1'; label.style.transform = 'none'; }
      if (grid) { grid.querySelectorAll('.port-teaser-grid-item').forEach(el => { el.style.opacity = '1'; el.style.transform = 'none'; }); }
      if (cta) { cta.style.opacity = '1'; cta.style.transform = 'none'; }
      return;
    }

    const INIT_SCALE = 4.6;
    const easeOut = (t) => 1 - Math.pow(1 - t, 3);

    const onScroll = () => {
      const scrolled = window.scrollY;
      const zoneTop = zone.offsetTop;
      const zoneScrollable = zone.offsetHeight - window.innerHeight;
      if (zoneScrollable <= 0) return;
      const progress = Math.max(0, Math.min(1, (scrolled - zoneTop) / zoneScrollable));

      // Phase 0-30%: label fades in over full-screen photo, then fades out
      const labelInProg = easeOut(Math.max(0, Math.min(1, progress / 0.3)));
      const labelOutProg = Math.max(0, Math.min(1, (progress - 0.2) / 0.15));
      if (label) {
        label.style.opacity = Math.max(0, labelInProg - labelOutProg);
      }

      // Phase 0-55%: photo zooms from full-screen to card size
      const photoProg = easeOut(Math.max(0, Math.min(1, progress / 0.55)));
      const photoScale = INIT_SCALE - (INIT_SCALE - 1) * photoProg;
      photo.style.transform = `translate(-50%, -50%) scale(${photoScale})`;

      // Phase 30-100%: grid fades in as photo zooms out
      if (grid) {
        const gridProg = easeOut(Math.max(0, Math.min(1, (progress - 0.3) / 0.7)));
        grid.style.opacity = gridProg;
      }

      // Phase 90-100%: CTA appears at bottom
      if (cta) {
        const ctaProg = easeOut(Math.max(0, Math.min(1, (progress - 0.9) / 0.1)));
        cta.style.opacity = ctaProg;
        cta.style.transform = `translateY(${(1 - ctaProg) * 24}px)`;
      }
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Word-by-word pull quote
  const quoteRef = React.useRef(null);
  React.useEffect(() => {
    const el = quoteRef.current;
    if (!el) return;
    const words = el.querySelectorAll(".w");
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          el.classList.add("in");
          words.forEach((w, i) => {
            w.style.transitionDelay = (0.05 + i * 0.06) + "s";
          });
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div className="page">
      {/* Hero — scroll zone gives sticky room for zoom-out effect */}
      <div className="hero-scroll-zone" ref={heroScrollRef}>
      <section className="hero">
        <div ref={heroZoomRef} className="hero-bg-zoom">
          <div
            ref={heroBgRef}
            className="hero-bg"
            style={{ backgroundImage: `url(${window.HERO_IMG})` }}
          />
        </div>
        <div className="hero-content">
          <div className="stagger">
            <div className="hero-meta">
              <span className="label">Est. 2020</span>
            </div>
            <h1 className="hero-title">
              Alston <span className="last">Shi</span>
            </h1>
            <p className="hero-tagline">
              I photograph places. I photograph people. <span className="em">Sometimes both at once.</span>
            </p>
            <div style={{ marginTop: 36 }}>
              <a className="btn-arrow" href="#/portfolio" data-cursor="hover"
                 onClick={(e) => { e.preventDefault(); go("portfolio"); }}>
                View Portfolio
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
              </a>
            </div>
          </div>
        </div>
      </section>
      </div>{/* end hero-scroll-zone */}

      {/* 3D carousel ring (replaces the swirl gallery) */}
      <window.Cinematic3DCarousel onOpenLightbox={onOpenLightbox} />

      {/* Pull quote — same single line as the live site's philosophy block */}
      <section className="pull-quote" ref={quoteRef}>
        <p className="pull-quote-text">
          {"I don't look for extraordinary places."
            .split(" ")
            .map((w, i) => <span key={"a" + i} className="w">{w}&nbsp;</span>)}
          <br />
          <span className="italic">
          {"I look for ordinary places at extraordinary moments."
            .split(" ")
            .map((w, i) => <span key={"b" + i} className="w">{w}&nbsp;</span>)}
          </span>
        </p>
      </section>

      {/* About teaser */}
      <div className="split-scroll-zone" ref={splitScrollRef}>
      <section className="split">
        <div className="split-img reveal-img" ref={splitImgRef}>
          <div ref={splitZoomRef} className="split-img-zoom">
            <div className="split-img-inner" style={{ backgroundImage: `url(${window.PORTRAIT_IMG_HOME || window.PORTRAIT_IMG})` }} />
          </div>
        </div>
        <div className="split-text" ref={splitTextRef}>
          <div className="label" style={{ color: "var(--ochre)" }}>About the photographer</div>
          <h2>
            Stories from the road <br /><span className="italic">and closer to home.</span>
          </h2>
          <p>
            I travel with a camera the way other people keep a journal — to slow things down and pay attention. From temple courtyards in China to cherry-blossom streets in Japan, I photograph the moments most people walk past.
          </p>
          <p>
            My work is about proximity: getting close enough to a place that you stop being a tourist and start being a witness.
          </p>
          <a className="btn-arrow" href="#/about" data-cursor="hover"
             onClick={(e) => { e.preventDefault(); go("about"); }}>
            Read My Story
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
          </a>
        </div>
      </section>
      </div>{/* end split-scroll-zone */}

      {/* Portfolio teaser: torii gate zooms out to reveal gallery grid */}
      <div className="port-teaser-scroll-zone" ref={portTeaserScrollRef}>
        <section className="port-teaser">
          <div
            className="port-teaser-photo"
            ref={portTeaserPhotoRef}
            style={{ backgroundImage: `url(${window.PORTFOLIO_BY_FILE?.["Japan/IMG_0393.JPG"]?.src})` }}
          >
            <div className="port-teaser-overlay" />
          </div>

          <div className="port-teaser-hero-label" ref={portTeaserLabelRef}>
            <div className="label">Japan &nbsp;·&nbsp; Hakone</div>
            <h2>The <span className="italic">Portfolio.</span></h2>
          </div>

          <div className="port-teaser-grid" ref={portTeaserGridRef}>
            {(window.PORTFOLIO || []).map((item, i) => (
              <div
                key={item.id}
                className="port-teaser-grid-item"
                style={{ backgroundImage: `url(${item.src})` }}
              />
            ))}
          </div>

          <div className="port-teaser-cta" ref={portTeaserCtaRef}>
            <a className="btn-arrow" href="#/portfolio" data-cursor="hover"
               onClick={(e) => { e.preventDefault(); go("portfolio"); }}>
              View All Work
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
            </a>
          </div>
        </section>
      </div>{/* end port-teaser-scroll-zone */}

      <Footer go={go} />
    </div>
  );
}

window.Home = Home;
