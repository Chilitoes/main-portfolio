// ============ 3D Carousel with vertical wave ============
// Cards orbit on a ring with gentle vertical sine-wave bobbing.
// Translucent frosted glass cards. Scroll-driven.
// Adapted from the Claude Design handoff to use the local PORTFOLIO data.

function Cinematic3DCarousel({ onOpenLightbox }) {
  // Pick representative shots — keyed by file path so it stays stable across
  // data edits. Japan-heavy per photographer preference.
  const items = React.useMemo(() => {
    const picks = [
      "Japan/IMG_0393.JPG",       // Torii Gate, Hakone
      "Japan/IMG_0496.JPG",       // Skytree & Sakura
      "Japan/IMG_1282.JPG",       // Cherry Blossom Crossing
      "China/IMG_7694.JPG",       // Shanghai Night
      "Japan/IMG_5936.JPG",       // Neon Alley
      "Japan/IMG_8970.JPG",       // Sakura Canal
      "Taiwan/IMG_4112.jpeg",     // Taiwan
      "Japan/IMG_6229 2.JPG",     // Shibuya Crossing
    ];
    return picks
      .map((p) => window.PORTFOLIO_BY_FILE && window.PORTFOLIO_BY_FILE[p])
      .filter(Boolean);
  }, []);

  const N = items.length;
  const SLICE = N > 0 ? 360 / N : 0;

  const sectionRef = React.useRef(null);
  const stageRef = React.useRef(null);
  const progressRef = React.useRef(null);
  const [frontIdx, setFrontIdx] = React.useState(0);
  const [expanded, setExpanded] = React.useState(null);
  const [expandAnim, setExpandAnim] = React.useState(false);

  // Scroll-driven rotation on EVERY device, smoothed in a single rAF loop.
  // Scroll events only move a TARGET angle; each frame the displayed angle
  // eases toward it and card styles are written straight to the DOM. Two
  // reasons this is the shape it is:
  //  1. Wheel/touch scrolling arrives in chunky steps — mapping them 1:1
  //     makes the ring jump between positions. The lerp turns those steps
  //     into one continuous glide.
  //  2. Writing styles imperatively avoids a React re-render of every card
  //     per frame, and lets CSS keep NO transition on the card transform —
  //     a CSS transition retargeted every scroll event is what made the
  //     motion smear ("fuzzy") instead of tracking crisply.
  React.useLayoutEffect(() => {
    const sec = sectionRef.current;
    const stage = stageRef.current;
    if (!sec || !stage || N === 0) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Ring radius shrinks on narrow screens so the neighbouring cards peek
    // in from the edges instead of orbiting entirely off-screen.
    let radius = Math.min(600, window.innerWidth * 0.78);
    let target = 0;
    let display = 0;
    let raf = null;
    let inView = true;
    let lastFront = -1;

    const readScroll = () => {
      const r = sec.getBoundingClientRect();
      const scrollable = sec.offsetHeight - window.innerHeight;
      if (scrollable <= 0) return;
      target = Math.max(0, Math.min(1, -r.top / scrollable)) * 360;
    };

    const apply = () => {
      const cards = stage.children;
      for (let i = 0; i < cards.length; i++) {
        const rad = ((i * SLICE + display) * Math.PI) / 180;
        const x = Math.sin(rad);
        const z = Math.cos(rad); // 1 = front, -1 = back
        const depthT = (z + 1) / 2;
        const el = cards[i];
        el.style.transform =
          `translate3d(${x * radius}px, ${Math.sin(rad * 2) * 55}px, 0) ` +
          `scale(${0.65 + depthT * 0.35}) rotateY(${-x * 12}deg)`;
        el.style.opacity = String(0.35 + depthT * 0.65);
        el.style.zIndex = String(Math.round(depthT * 100));
      }
      if (progressRef.current) {
        progressRef.current.style.transform = `scaleY(${display / 360})`;
      }
      let best = 0, bestZ = -Infinity;
      for (let i = 0; i < N; i++) {
        const z = Math.cos(((i * SLICE + display) * Math.PI) / 180);
        if (z > bestZ) { bestZ = z; best = i; }
      }
      if (best !== lastFront) { lastFront = best; setFrontIdx(best); }
    };

    const step = () => {
      if (!inView) { raf = null; return; }
      display += (target - display) * (reduce ? 1 : 0.16);
      if (Math.abs(target - display) < 0.02) display = target;
      apply();
      if (display === target) { raf = null; return; } // settled — kick() rearms
      raf = requestAnimationFrame(step);
    };
    const kick = () => { if (inView && raf == null) raf = requestAnimationFrame(step); };

    // Pause all work while the section is off-screen.
    const io = new IntersectionObserver(([e]) => {
      inView = e.isIntersecting;
      if (inView) { readScroll(); kick(); }
      else if (raf != null) { cancelAnimationFrame(raf); raf = null; }
    }, { rootMargin: "80px" });
    io.observe(sec);

    const onScroll = () => { readScroll(); kick(); };
    const onResize = () => {
      radius = Math.min(600, window.innerWidth * 0.78);
      readScroll();
      kick();
    };

    // First paint: land directly on the scroll position, no swoop-in.
    readScroll();
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
  }, []);

  const onCardClick = (i) => {
    setExpanded(i);
    requestAnimationFrame(() => requestAnimationFrame(() => setExpandAnim(true)));
  };
  const onClose = () => {
    setExpandAnim(false);
    setTimeout(() => setExpanded(null), 500);
  };
  React.useEffect(() => {
    if (expanded !== null) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [expanded]);

  // Card transforms/opacity/z-index are written imperatively by the rAF loop
  // above; the caption + .front class are the only angle-dependent things
  // React renders.
  const frontItem = items[frontIdx] || items[0];

  if (N === 0) return null;

  const expandPortal = expanded !== null ? ReactDOM.createPortal(
    <div
      className={"c3d-expand-overlay" + (expandAnim ? " open" : "")}
      onClick={onClose}
    >
      <div className="c3d-expand-card" onClick={(e) => e.stopPropagation()}>
        <div className="c3d-expand-img" style={{ backgroundImage: window.bgImage(items[expanded].src, 1920) }} />
        <div className="c3d-expand-info">
          <div className="label ochre">{items[expanded].country} · {items[expanded].city}</div>
          <h3 className="c3d-expand-title serif">{items[expanded].title}</h3>
        </div>
        <button className="c3d-expand-close" onClick={onClose} data-cursor="hover" aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <React.Fragment>
      <section className="c3d" ref={sectionRef}>
        {/* Background */}
        <div className="c3d-bg" aria-hidden="true">
          <div className="c3d-bg-grad" />
          <div className="c3d-nebula n1" />
          <div className="c3d-nebula n2" />
          <div className="c3d-nebula n3" />
          <div className="c3d-stars">
            {Array.from({ length: 80 }).map((_, i) => (
              <span key={i} className="c3d-star" style={{
                left: `${(i * 37 + 13) % 100}%`,
                top: `${(i * 53 + 7) % 100}%`,
                animationDelay: `${(i % 11) * 0.6}s`,
                animationDuration: `${4 + (i % 5) * 2}s`,
                width: `${1.5 + (i % 3)}px`,
                height: `${1.5 + (i % 3)}px`,
              }} />
            ))}
          </div>
        </div>

        <div className="c3d-sticky">
          <div className="c3d-head">
            <div className="label ochre">Selected Work</div>
            <h2 className="section-title">
              From the <span className="italic">archive.</span>
            </h2>
            <div className="label dim">Scroll to orbit · click to expand</div>
          </div>

          {/* Carousel ring — per-card transforms are driven by the rAF loop */}
          <div className="c3d-ring-stage" ref={stageRef}>
            {items.map((item, i) => {
              const isFront = i === frontIdx;
              return (
                <div
                  key={item.id}
                  className={"c3d-card" + (isFront ? " front" : "")}
                  onClick={() => onCardClick(i)}
                  data-cursor="view"
                  data-cursor-label="Expand"
                >
                  <div className="c3d-card-img" style={{ backgroundImage: window.bgImage(item.src, 480) }} />
                  <div className="c3d-card-glass" />
                  <div className="c3d-card-border" />
                  <div className="c3d-card-meta">
                    <div className="c3d-meta-top">
                      <span className="label">{item.country}</span>
                      <span className="label dim">{String(i + 1).padStart(2, "0")}</span>
                    </div>
                    <div className="c3d-meta-bot">
                      <div className="c3d-card-city serif">{item.city}</div>
                      <div className="label dim">{item.title}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Live caption mirroring whichever card faces the camera */}
          <div className="c3d-caption">
            <div className="c3d-caption-inner" key={frontItem.id}>
              <span className="label ochre">{frontItem.country}</span>
              <span className="c3d-caption-dot" />
              <span className="serif italic">{frontItem.city}</span>
              <span className="c3d-caption-dot" />
              <span className="label dim">{frontItem.title}</span>
            </div>
          </div>

          {/* Vertical progress bar — fill driven by the rAF loop */}
          <div className="c3d-progress-bar">
            <div className="c3d-progress-fill" ref={progressRef} />
          </div>
        </div>
      </section>
      {expandPortal}
    </React.Fragment>
  );
}

window.Cinematic3DCarousel = Cinematic3DCarousel;
