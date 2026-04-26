// ============ Portfolio page ============

function Portfolio({ go, onOpenLightbox }) {
  const [filter, setFilter] = React.useState("All");
  const [pillStyle, setPillStyle] = React.useState({});
  const pillsRef = React.useRef(null);

  // Position moving pill background
  React.useEffect(() => {
    const wrap = pillsRef.current;
    if (!wrap) return;
    const active = wrap.querySelector(".filter-pill.active");
    if (!active) return;
    const r = active.getBoundingClientRect();
    const pr = wrap.getBoundingClientRect();
    setPillStyle({
      transform: `translateX(${r.left - pr.left - 6}px)`,
      width: r.width + "px",
    });
  }, [filter]);

  const items = window.PORTFOLIO;

  return (
    <div className="page">
      <header className="portfolio-head">
        <div className="label reveal in" style={{ color: "var(--ochre)" }}>Selected Work</div>
        <h1 className="portfolio-title reveal in">Portfolio</h1>

        <div className="meta-row">
          <div className="filters" ref={pillsRef}>
            <div className="filters-bg" style={pillStyle} />
            {window.COUNTRIES.map((c) => (
              <button
                key={c}
                className={"filter-pill" + (filter === c ? " active" : "")}
                onClick={() => setFilter(c)}
                data-cursor="hover"
              >
                {c}
              </button>
            ))}
          </div>
          <div className="label">
            {filter === "All"
              ? String(items.length).padStart(2, "0")
              : String(items.filter((i) => i.country === filter).length).padStart(2, "0")
            } / {String(items.length).padStart(2, "0")} Shown
          </div>
        </div>
      </header>

      <PortfolioGrid items={items} filter={filter} onOpenLightbox={onOpenLightbox} />

      <Footer go={go} />
    </div>
  );
}

// Grid with FLIP-style animation on filter change
function PortfolioGrid({ items, filter, onOpenLightbox }) {
  const gridRef = React.useRef(null);
  const prevPositions = React.useRef({});

  // Record positions BEFORE filter changes render (layout effect runs before paint)
  React.useLayoutEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    // Record new positions
    const tiles = grid.querySelectorAll("[data-id]");
    const newPositions = {};
    tiles.forEach((t) => {
      const r = t.getBoundingClientRect();
      newPositions[t.getAttribute("data-id")] = { x: r.left, y: r.top };
    });

    // Animate from old to new via FLIP
    tiles.forEach((t) => {
      const id = t.getAttribute("data-id");
      const oldP = prevPositions.current[id];
      const newP = newPositions[id];
      if (oldP && newP) {
        const dx = oldP.x - newP.x;
        const dy = oldP.y - newP.y;
        if (dx || dy) {
          t.style.transition = "none";
          t.style.transform = `translate(${dx}px, ${dy}px)`;
          requestAnimationFrame(() => {
            t.style.transition = "transform 0.7s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.5s cubic-bezier(0.22, 1, 0.36, 1)";
            t.style.transform = "";
          });
        }
      }
    });

    prevPositions.current = newPositions;
  }, [filter]);

  // Uniform: one tile class, consistent aspect ratio
  return (
    <div className="port-grid uniform" ref={gridRef}>
      {items.map((item, i) => {
        const hidden = filter !== "All" && item.country !== filter;
        return (
          <div
            key={item.id}
            data-id={item.id}
            className={"tile t-uniform reveal-img in" + (hidden ? " filtered-out" : "")}
            data-cursor="view"
            data-cursor-label="Open"
            onClick={() => !hidden && onOpenLightbox(i)}
            style={{ display: hidden ? "none" : "" }}
          >
            <div className="tile-img" style={{ backgroundImage: `url(${item.src})` }} />
            <div className="tile-idx label">{String(i + 1).padStart(3, "0")}</div>
            <div className="tile-cap">
              <div className="label tile-cap-label">{item.country} · {item.city}</div>
              <div className="tile-cap-title">{item.title}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

window.Portfolio = Portfolio;
