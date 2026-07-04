// ============ Home page ============

// ---- Contact-sheet film strip — vertical scroll pulls the roll sideways ----
// A sticky stage where scroll progress drags a horizontal strip of frames
// through the viewport, styled as a film negative: sprocket holes, frame
// numbers, grease-pencil circles on the editor's selects. Same smoothing
// pattern as the carousel: scroll moves a target, a rAF loop lerps the strip
// and writes the transform directly (no per-frame React render).
function FilmStrip({ onOpenLightbox }) {
  const zoneRef = React.useRef(null);
  const stripRef = React.useRef(null);
  const [current, setCurrent] = React.useState(0);

  const frames = React.useMemo(() => {
    const picks = [
      "Japan/IMG_0893.JPG",    // Great Buddha, Kamakura
      "China/DSCF7118.JPG",    // Night Market Dumplings
      "Japan/_MG_5886.JPG",    // Daruma Dolls
      "China/IMG_3181.JPG",    // Canal, Suzhou
      "Japan/IMG_5768 3.JPG",  // Kanoko Train
      "Malaysia/DSCF1078.JPG", // KL Skyline
      "China/DSCF6798.JPG",    // Golden Campfire
      "Japan/IMG_6143.JPG",    // Night Traffic
    ];
    return picks
      .map((f) => window.PORTFOLIO_BY_FILE && window.PORTFOLIO_BY_FILE[f])
      .filter(Boolean);
  }, []);

  React.useLayoutEffect(() => {
    const zone = zoneRef.current;
    const strip = stripRef.current;
    if (!zone || !strip || !frames.length) return;
    // Reduced motion: CSS turns the stage into a native horizontal scroller.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let target = 0, display = 0, raf = null, inView = true, lastIdx = -1;
    let travel = 0;

    // Runway sized so vertical scroll maps ~1:1 onto horizontal travel.
    const size = () => {
      travel = Math.max(0, strip.scrollWidth - zone.clientWidth);
      zone.style.height = `${window.innerHeight + travel}px`;
    };
    const read = () => {
      const runway = zone.offsetHeight - window.innerHeight;
      if (runway <= 0) return;
      const p = Math.max(0, Math.min(1, -zone.getBoundingClientRect().top / runway));
      target = p * travel;
    };
    const apply = () => {
      strip.style.transform = `translate3d(${-display}px, 0, 0)`;
      const idx = Math.min(frames.length - 1,
        Math.round((display / Math.max(1, travel)) * (frames.length - 1)));
      if (idx !== lastIdx) { lastIdx = idx; setCurrent(idx); }
    };
    const step = () => {
      if (!inView) { raf = null; return; }
      display += (target - display) * 0.14;
      if (Math.abs(target - display) < 0.5) display = target;
      apply();
      if (display === target) { raf = null; return; }
      raf = requestAnimationFrame(step);
    };
    const kick = () => { if (inView && raf == null) raf = requestAnimationFrame(step); };

    const io = new IntersectionObserver(([e]) => {
      inView = e.isIntersecting;
      if (inView) { read(); kick(); }
      else if (raf != null) { cancelAnimationFrame(raf); raf = null; }
    }, { rootMargin: "80px" });
    io.observe(zone);

    const onScroll = () => { read(); kick(); };
    const onResize = () => { size(); read(); kick(); };
    size();
    read();
    display = target;
    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      if (raf != null) cancelAnimationFrame(raf);
    };
  }, [frames]);

  if (!frames.length) return null;
  const marked = new Set([2, 5]); // the editor's grease-pencil selects

  return (
    <section className="flm-zone" ref={zoneRef} aria-label="Contact sheet">
      <div className="flm-sticky">
        <div className="flm-head">
          <div>
            <div className="label reveal" style={{ color: "var(--ochre)" }}>Contact Sheet</div>
            <h2 className="section-title reveal">Straight off <span className="italic">the roll.</span></h2>
          </div>
          <div className="label dim flm-count" aria-live="off">
            FRAME {String(current + 1).padStart(2, "0")} / {String(frames.length).padStart(2, "0")}
          </div>
        </div>
        <div className="flm-mask">
          <div className="flm-strip" ref={stripRef}>
            {frames.map((item, i) => {
              const fullIdx = window.PORTFOLIO.findIndex((p) => p === item);
              return (
                <button
                  key={i}
                  className="flm-frame"
                  onClick={() => onOpenLightbox && onOpenLightbox(fullIdx)}
                  data-cursor="view"
                  data-cursor-label="Open"
                  aria-label={`Open photo: ${item.title}`}
                >
                  <span className="flm-no">{String(i + 1).padStart(2, "0")}A</span>
                  <span className="flm-img" style={{ backgroundImage: window.bgImage(item.src, 960) }} />
                  {marked.has(i) && (
                    <svg className="flm-mark" viewBox="0 0 100 70" preserveAspectRatio="none" aria-hidden="true">
                      <ellipse cx="50" cy="35" rx="45" ry="28" fill="none"
                        stroke="var(--ochre)" strokeWidth="2.4"
                        strokeDasharray="168 40" strokeLinecap="round"
                        opacity="0.9" transform="rotate(-4 50 35)" />
                    </svg>
                  )}
                  <span className="flm-cap">{item.country} · {item.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

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
    // Hero: zoom 1.2 → 1.0; content drifts up and fades as it hands over to
    // the next section (rather than being abruptly covered).
    const zone = heroScrollRef.current;
    const zoom = heroZoomRef.current;
    if (!zone || !zoom) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.matchMedia('(max-width: 900px)').matches) return;
    const content = zone.querySelector('.hero-content');
    const onScroll = () => {
      const progress = Math.max(0, Math.min(1, -zone.getBoundingClientRect().top / window.innerHeight));
      zoom.style.transform = `scale(${1.2 - 0.2 * progress})`;
      if (content) {
        content.style.opacity = String(Math.max(0, 1 - progress * 1.6));
        content.style.transform = `translateY(${progress * -46}px)`;
      }
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
    if (window.matchMedia('(max-width: 900px)').matches) {
      card.style.opacity = '1';
      card.style.transform = 'none';
      if (zoom) zoom.style.transform = 'none';
      if (text) { text.style.opacity = '1'; text.style.transform = 'none'; }
      const btn = text?.querySelector('.btn-arrow');
      if (btn) { btn.style.opacity = '1'; btn.style.transform = 'none'; }
      return;
    }

    const quoteEl = quoteRef.current;
    const easeOut = (t) => 1 - Math.pow(1 - t, 3);

    const getPositions = () => {
      const scrolled = window.scrollY;
      const zoneTop = zone.getBoundingClientRect().top + scrolled;
      const stickyRange = zone.offsetHeight - window.innerHeight;
      // Card starts when the quote is 60% scrolled past (well before split zone)
      const quoteBottom = quoteEl
        ? quoteEl.getBoundingClientRect().top + scrolled + quoteEl.offsetHeight
        : zoneTop;
      const cardStart = quoteBottom - window.innerHeight * 0.6;
      const cardEnd = zoneTop; // fully in by the time split zone starts
      return { zoneTop, stickyRange, cardStart, cardEnd };
    };

    const onScroll = () => {
      const scrolled = window.scrollY;
      const { zoneTop, stickyRange, cardStart, cardEnd } = getPositions();

      // p goes 0 → 1 across the sticky range
      const p = Math.max(0, Math.min(1, (scrolled - zoneTop) / stickyRange));

      // Card: starts as quote scrolls off, finishes when split zone begins
      const cardProg = easeOut(Math.max(0, Math.min(1, (scrolled - cardStart) / (cardEnd - cardStart))));
      card.style.opacity = cardProg;
      card.style.transform = `translateY(${(1 - cardProg) * 80}px) scale(${0.95 + 0.05 * cardProg})`;

      // Ken-burns: same start as card, finishes at 40% into sticky range
      if (zoom) {
        const kenEnd = zoneTop + stickyRange * 0.4;
        const kenProg = Math.max(0, Math.min(1, (scrolled - cardStart) / (kenEnd - cardStart)));
        zoom.style.transform = `scale(${1.3 - 0.3 * kenProg})`;
      }

      if (text) {
        // Text reveals 20% → 55% of sticky
        const textProg = easeOut(Math.max(0, Math.min(1, (p - 0.2) / 0.35)));
        text.style.opacity = textProg;
        text.style.transform = `translateX(${(1 - textProg) * -120}px)`;

        // Button reveals 45% → 80% of sticky — fully out before split slides off
        const btnProg = easeOut(Math.max(0, Math.min(1, (p - 0.45) / 0.35)));
        const btn = text.querySelector('.btn-arrow');
        if (btn) {
          btn.style.opacity = btnProg;
          btn.style.transform = `translateX(${(1 - btnProg) * -100}px)`;
        }
      }
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
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
          <div className="hero-bg-kb">
            <div
              ref={heroBgRef}
              className="hero-bg"
              style={{ backgroundImage: window.bgImage(window.HERO_IMG, 1920) }}
            />
          </div>
        </div>
        <div className="hero-content">
          <div className="stagger">
            <div className="hero-meta">
              <span className="label">Est. 2020</span>
            </div>
            <h1 className="hero-title" aria-label="Alston Shi">
              {/* Per-character cascade — each letter rises with its own delay.
                  aria-label keeps the split invisible to screen readers. */}
              {"Alston".split("").map((c, i) => (
                <span key={"f" + i} className="ch" aria-hidden="true" style={{ "--chd": `${0.25 + i * 0.045}s` }}>{c}</span>
              ))}
              <span className="ch-space" aria-hidden="true"> </span>
              <span className="last">
                {"Shi".split("").map((c, i) => (
                  <span key={"l" + i} className="ch" aria-hidden="true" style={{ "--chd": `${0.55 + i * 0.055}s` }}>{c}</span>
                ))}
              </span>
            </h1>
            <p className="hero-tagline">
              I photograph places. I photograph people. <span className="em">Sometimes both at once.</span>
            </p>
            <div style={{ marginTop: 36 }}>
              <a className="btn-arrow" href="#/archive" data-cursor="hover"
                 onClick={(e) => { e.preventDefault(); go("archive"); }}>
                View Archive
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
              </a>
            </div>
          </div>
        </div>
      </section>
      </div>{/* end hero-scroll-zone */}

      <window.SectionDivider numeral="I" label="Selected Work" />

      {/* 3D carousel ring (replaces the swirl gallery) */}
      <window.Cinematic3DCarousel onOpenLightbox={onOpenLightbox} />

      {/* Featured stories — sticky editorial captions */}
      <window.FeaturedStories onOpenLightbox={onOpenLightbox} />

      <window.SectionDivider numeral="II" label="Philosophy" />

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

      {/* Camera anatomy — Three.js pinned scene */}
      <window.Camera3D />

      {/* Contact sheet — scroll pulls the roll sideways */}
      <FilmStrip onOpenLightbox={onOpenLightbox} />

      {/* About teaser */}
      <div className="split-scroll-zone" ref={splitScrollRef}>
      <section className="split">
        <div className="split-img reveal-img" ref={splitImgRef}>
          <div ref={splitZoomRef} className="split-img-zoom">
            <div className="split-img-inner" style={{ backgroundImage: window.bgImage(window.PORTRAIT_IMG_HOME || window.PORTRAIT_IMG, 960) }} />
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

      <window.SectionDivider numeral="III" label="The Archive" />

      {/* Archive CTA with Country Browse */}
      <section style={{ padding: "120px 40px 80px" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "80px" }}>
            <h2 style={{ fontSize: "48px", fontFamily: "var(--serif)", fontWeight: "300", marginBottom: "20px" }}>
              Browse by <span style={{ fontStyle: "italic", color: "var(--ochre)" }}>Country</span>
            </h2>
            <p style={{ color: "var(--fg-dim)", fontSize: "14px", letterSpacing: "0.1em" }}>
              Explore the complete archive of travel photography
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "60px" }}>
            {(window.COUNTRIES || []).filter(c => c !== "All").map((country) => {
              const countryPhotos = (window.PORTFOLIO || []).filter(p => p.country === country);
              const firstPhoto = countryPhotos[0];
              const hasPhotos = countryPhotos.length > 0;

              if (!hasPhotos) {
                return (
                  <div
                    key={country}
                    style={{
                      position: "relative",
                      aspectRatio: "2/1",
                      background: "rgba(200, 162, 101, 0.08)",
                      borderRadius: "8px",
                      overflow: "hidden",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "1px solid rgba(200, 162, 101, 0.2)",
                    }}
                  >
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "24px", fontFamily: "var(--serif)", fontWeight: "300", marginBottom: "8px", color: "var(--ochre)" }}>
                        {country}
                      </div>
                      <div style={{ fontSize: "11px", letterSpacing: "0.15em", color: "var(--fg-dim)", textTransform: "uppercase" }}>
                        Coming Soon
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <a
                  key={country}
                  className="country-card"
                  href={`#/archive?country=${encodeURIComponent(country)}`}
                  data-cursor="hover"
                  style={{
                    position: "relative",
                    aspectRatio: "2/1",
                    backgroundImage: window.bgImage(firstPhoto.src, 480),
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    borderRadius: "8px",
                    overflow: "hidden",
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }} />
                  <div style={{ position: "relative", zIndex: 2, textAlign: "center" }}>
                    <div style={{ fontSize: "24px", fontFamily: "var(--serif)", fontWeight: "300", marginBottom: "8px", color: "#F3ECDE" }}>
                      {country}
                    </div>
                    <div style={{ fontSize: "12px", letterSpacing: "0.1em", color: "var(--fg-dim)" }}>
                      {String(countryPhotos.length).padStart(2, "0")} PHOTOS
                    </div>
                  </div>
                </a>
              );
            })}
          </div>

          <div style={{ textAlign: "center" }}>
            <a className="btn-arrow" href="#/archive" data-cursor="hover"
               onClick={(e) => { e.preventDefault(); go("archive"); }}>
              View All
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
            </a>
          </div>
        </div>
      </section>

      <Footer go={go} />
    </div>
  );
}

window.Home = Home;
