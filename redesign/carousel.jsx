// ============ 3D Carousel with vertical wave ============
// Cards orbit on a ring with gentle vertical sine-wave bobbing.
// Translucent frosted glass cards. Scroll-driven.
// Adapted from the Claude Design handoff to use the local PORTFOLIO data.

function Cinematic3DCarousel({ onOpenLightbox }) {
  // Pick representative shots — keyed by file path so it stays stable across
  // data edits. Mix countries so the orbit feels like the whole archive.
  const items = React.useMemo(() => {
    const picks = [
      "Japan/IMG_6090.JPG",       // Sakura After Dark
      "China/DSCF8199.JPG",       // Hexagon Window
      "Taiwan/IMG_4112.jpeg",     // Taiwan, Taipei
      "Japan/IMG_5583.JPG",       // Dotonbori, Osaka
      "Malaysia/DSCF1062.JPG",    // KL Skyline
      "China/DSCF8511.JPG",       // Garden Pavilion
      "Singapore/IMG_6462.JPG",   // Tropical Garden
      "Brunei/IMG_7969.jpeg",     // Brunei
    ];
    return picks
      .map((p) => window.PORTFOLIO_BY_FILE && window.PORTFOLIO_BY_FILE[p])
      .filter(Boolean);
  }, []);

  const N = items.length;
  const SLICE = N > 0 ? 360 / N : 0;

  const sectionRef = React.useRef(null);
  const [angle, setAngle] = React.useState(0);
  const [expanded, setExpanded] = React.useState(null);
  const [expandAnim, setExpandAnim] = React.useState(false);

  // Scroll-driven angle: 1 full rotation across the section's scroll range
  React.useEffect(() => {
    const onScroll = () => {
      const sec = sectionRef.current;
      if (!sec) return;
      const r = sec.getBoundingClientRect();
      const vh = window.innerHeight;
      const scrollable = sec.offsetHeight - vh;
      if (scrollable <= 0) return;
      const p = Math.max(0, Math.min(1, -r.top / scrollable));
      setAngle(p * 360);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
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

  // Compute card style — ring with vertical bobbing
  const getCardStyle = (i) => {
    const cardAngle = i * SLICE;
    const totalAngle = cardAngle + angle;
    const rad = (totalAngle * Math.PI) / 180;

    const x = Math.sin(rad);
    const z = Math.cos(rad); // 1 = front, -1 = back
    const y = Math.sin(rad * 2) * 55; // ±55px vertical wave

    const RADIUS_X = 600;
    const RADIUS_Z = 420;

    const tx = x * RADIUS_X;
    const tz = z * RADIUS_Z;
    const ty = y;

    const depthT = (z + 1) / 2; // 0 back → 1 front
    const scale = 0.65 + depthT * 0.35;
    const opacity = 0.35 + depthT * 0.65;
    const zIdx = Math.round(depthT * 100);
    const rotY = -x * 12;

    return {
      transform: `translate3d(${tx}px, ${ty}px, 0) scale(${scale}) rotateY(${rotY}deg)`,
      opacity,
      zIndex: zIdx,
    };
  };

  // Whichever card is closest to the camera
  const frontIdx = (() => {
    let best = 0, bestZ = -Infinity;
    for (let i = 0; i < N; i++) {
      const rad = ((i * SLICE + angle) * Math.PI) / 180;
      const z = Math.cos(rad);
      if (z > bestZ) { bestZ = z; best = i; }
    }
    return best;
  })();
  const frontItem = items[frontIdx];

  if (N === 0) return null;

  const expandPortal = expanded !== null ? ReactDOM.createPortal(
    <div
      className={"c3d-expand-overlay" + (expandAnim ? " open" : "")}
      onClick={onClose}
    >
      <div className="c3d-expand-card" onClick={(e) => e.stopPropagation()}>
        <div className="c3d-expand-img" style={{ backgroundImage: `url(${items[expanded].src})` }} />
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

          {/* Carousel ring */}
          <div className="c3d-ring-stage">
            {items.map((item, i) => {
              const style = getCardStyle(i);
              const isFront = i === frontIdx;
              return (
                <div
                  key={item.id}
                  className={"c3d-card" + (isFront ? " front" : "")}
                  style={style}
                  onClick={() => onCardClick(i)}
                  data-cursor="view"
                  data-cursor-label="Expand"
                >
                  <div className="c3d-card-img" style={{ backgroundImage: `url(${item.src})` }} />
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

          {/* Vertical progress bar */}
          <div className="c3d-progress-bar">
            <div className="c3d-progress-fill" style={{ transform: `scaleY(${angle / 360})` }} />
          </div>
        </div>
      </section>
      {expandPortal}
    </React.Fragment>
  );
}

window.Cinematic3DCarousel = Cinematic3DCarousel;
