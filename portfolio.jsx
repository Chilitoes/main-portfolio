// ============ Archive page ============

function Portfolio({ go, query, onOpenLightbox }) {
  // Country comes from the URL (#/archive?country=Japan — shareable, works in
  // new tabs) with the old sessionStorage handoff kept as a fallback.
  const urlCountry = query?.get("country");
  const initialCountry =
    (urlCountry && window.COUNTRIES.includes(urlCountry) ? urlCountry : null)
    || sessionStorage.getItem("archiveCountry")
    || "All";
  const [filter, setFilter] = React.useState(initialCountry);
  const [pillStyle, setPillStyle] = React.useState({});
  const pillsRef = React.useRef(null);

  // Clear the stored country after using it
  React.useEffect(() => {
    sessionStorage.removeItem("archiveCountry");
  }, []);

  // Follow query changes while already on the page (e.g. a country link
  // tapped from the footer or a back/forward step between filters).
  React.useEffect(() => {
    if (urlCountry && window.COUNTRIES.includes(urlCountry)) setFilter(urlCountry);
  }, [urlCountry]);

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
        <div className="label reveal in" style={{ color: "var(--ochre)" }}>Complete Collection</div>
        <h1 className="portfolio-title reveal in">Archive</h1>

        <div className="meta-row">
          <div className="filters" ref={pillsRef}>
            <div className="filters-bg" style={pillStyle} />
            {window.COUNTRIES.map((c) => {
              const countryPhotos = c === "All" ? items : items.filter(i => i.country === c);
              const hasPhotos = countryPhotos.length > 0;
              return (
                <button
                  key={c}
                  className={"filter-pill" + (filter === c ? " active" : "") + (!hasPhotos ? " disabled" : "")}
                  onClick={() => hasPhotos && setFilter(c)}
                  data-cursor={hasPhotos ? "hover" : "auto"}
                  disabled={!hasPhotos}
                  style={{
                    opacity: hasPhotos ? 1 : 0.5,
                    cursor: hasPhotos ? "pointer" : "default",
                  }}
                  title={!hasPhotos ? "Coming Soon" : ""}
                >
                  {c}
                </button>
              );
            })}
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

  // Staggered scroll reveal: tiles cascade in as they enter the viewport
  // (previously every tile was hardcoded ".in" and never animated). Once a
  // tile has revealed it stays revealed — filters and FLIP are unaffected.
  React.useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    grid.querySelectorAll(".tile-reveal:not(.in)").forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, [filter]);

  // Record positions BEFORE filter changes render (layout effect runs before paint)
  React.useLayoutEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    // Record new positions. Document coordinates (rect + scroll), not viewport
    // ones — scrolling between filter clicks would otherwise skew every delta.
    // Hidden tiles (display:none → 0×0 rect at the viewport origin) must not
    // be recorded: animating from those coords made newly revealed tiles fly
    // in from the page's top-left corner.
    const tiles = grid.querySelectorAll("[data-id]");
    const newPositions = {};
    tiles.forEach((t) => {
      const r = t.getBoundingClientRect();
      if (!r.width && !r.height) return;
      newPositions[t.getAttribute("data-id")] = {
        x: r.left + window.scrollX,
        y: r.top + window.scrollY,
      };
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
            className={"tile t-uniform tile-reveal" + (hidden ? " filtered-out" : "")}
            data-cursor="view"
            data-cursor-label="Open"
            onClick={() => !hidden && onOpenLightbox(i)}
            style={{ display: hidden ? "none" : "", "--d": `${(i % 6) * 0.07}s` }}
          >
            <div className="tile-img" style={{ backgroundImage: window.bgImage(item.src, 960) }} />
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
