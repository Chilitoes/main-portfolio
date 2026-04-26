// ============ Home page ============

function Home({ go, onOpenLightbox }) {
  const heroBgRef = React.useRef(null);
  const heroScrollRef = React.useRef(null);
  const heroZoomRef = React.useRef(null);
  const splitScrollRef = React.useRef(null);
  const splitImgRef = React.useRef(null);
  const splitZoomRef = React.useRef(null);
  const splitTextRef = React.useRef(null);
  window.useMouseParallax(heroBgRef, 14);

  React.useEffect(() => {
    // Hero: 1.2 → 1.0
    const zone = heroScrollRef.current;
    const zoom = heroZoomRef.current;
    if (!zone || !zoom) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
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
    if (!zone || !card) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      card.style.opacity = '1';
      card.style.transform = 'none';
      if (zoom) zoom.style.transform = 'none';
      if (text) { text.style.opacity = '1'; text.style.transform = 'none'; }
      return;
    }
    const easeOut = (t) => 1 - Math.pow(1 - t, 3);
    const onScroll = () => {
      const scrolled = -zone.getBoundingClientRect().top;

      // Card entrance: 0-80vh of scroll. Slides up + fades in with subtle scale.
      const cardProg = easeOut(Math.max(0, Math.min(1, scrolled / (window.innerHeight * 0.8))));
      card.style.opacity = cardProg;
      card.style.transform = `translateY(${(1 - cardProg) * 80}px) scale(${0.95 + 0.05 * cardProg})`;

      // Inner image ken-burns: subtle 1.15 → 1.0 over a longer range
      if (zoom) {
        const kenProg = Math.max(0, Math.min(1, scrolled / (window.innerHeight * 1.5)));
        zoom.style.transform = `scale(${1.15 - 0.15 * kenProg})`;
      }

      if (text) {
        // Text reveals slowly: 110vh-180vh of scroll (70vh range)
        const textProg = Math.max(0, Math.min(1, (scrolled - 110) / 70));
        text.style.opacity = textProg;
        text.style.transform = `translateX(${(1 - textProg) * -120}px)`;

        // Button reveals very slowly and much later: 220vh-320vh (100vh range)
        const btnProg = Math.max(0, Math.min(1, (scrolled - 220) / 100));
        const btn = text.querySelector('.btn-arrow');
        if (btn) {
          btn.style.opacity = btnProg;
          btn.style.transform = `translateY(${(1 - btnProg) * 28}px)`;
        }
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

      <Footer go={go} />
    </div>
  );
}

window.Home = Home;
