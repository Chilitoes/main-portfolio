// ============ Home page ============

function Home({ go, onOpenLightbox }) {
  const heroBgRef = React.useRef(null);
  window.useMouseParallax(heroBgRef, 14);

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
      {/* Hero */}
      <section className="hero">
        <div
          ref={heroBgRef}
          className="hero-bg"
          style={{ backgroundImage: `url(${window.HERO_IMG})` }}
        />
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
      <section className="split">
        <div className="split-img reveal-img">
          <div className="split-img-inner" style={{ backgroundImage: `url(${window.PORTRAIT_IMG_HOME || window.PORTRAIT_IMG})` }} />
        </div>
        <div className="split-text reveal">
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

      <Footer go={go} />
    </div>
  );
}

window.Home = Home;
