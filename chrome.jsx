// ============ Chrome: Nav, SideMeta, Footer, Lightbox ============

function Nav({ route, go, theme, onToggleTheme }) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const progressRef = React.useRef(null);
  const links = [
    { id: "home", label: "Home" },
    { id: "archive", label: "Archive" },
    { id: "about", label: "About" },
    { id: "contact", label: "Contact" },
  ];

  // Close mobile menu on route change
  React.useEffect(() => { setMenuOpen(false); }, [route]);

  // Lock body scroll while mobile menu is open
  React.useEffect(() => {
    if (menuOpen) document.body.classList.add("nav-menu-open");
    else document.body.classList.remove("nav-menu-open");
    return () => document.body.classList.remove("nav-menu-open");
  }, [menuOpen]);

  // Scroll progress bar — width grows as user scrolls the page
  React.useEffect(() => {
    const bar = progressRef.current;
    if (!bar) return;
    let raf;
    const update = () => {
      const h = document.documentElement;
      const scrollable = (h.scrollHeight - h.clientHeight) || 1;
      const pct = Math.max(0, Math.min(1, h.scrollTop / scrollable));
      bar.style.transform = `scaleX(${pct})`;
      raf = null;
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [route]);

  return (
    <nav className={"nav" + (menuOpen ? " nav-open" : "")}>
      <div ref={progressRef} className="nav-progress" aria-hidden="true" />
      <a className="nav-brand" href="#/home" data-cursor="hover"
         onClick={(e) => { e.preventDefault(); go("home"); setMenuOpen(false); }}>
        Alston <span className="italic">Shi</span>
      </a>
      <button
        className={"nav-hamburger" + (menuOpen ? " open" : "")}
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen(!menuOpen)}
        data-cursor="hover">
        <span></span><span></span><span></span>
      </button>
      <div
        className="nav-backdrop"
        aria-hidden="true"
        onClick={() => setMenuOpen(false)}
      />
      <div className={"nav-links" + (menuOpen ? " open" : "")}>
        {links.map((l) => (
          <a key={l.id}
             href={"#/" + l.id}
             className={"nav-link" + (route === l.id ? " active" : "")}
             data-cursor="hover"
             onClick={(e) => { e.preventDefault(); go(l.id); setMenuOpen(false); }}>
            {l.label}
          </a>
        ))}
        <a href="/personal/" className="nav-link nav-link-ext" data-cursor="hover" title="Digital portfolio">
          Digital Portfolio <span className="ext-arrow" aria-hidden="true">↗</span>
        </a>
      </div>
    </nav>
  );
}

function SideMeta({ route }) {
  const idx = ({ home: "01", archive: "02", about: "03", contact: "04" })[route] || "01";
  const label = ({ home: "Index", archive: "Archive", about: "About", contact: "Contact" })[route] || "Index";
  return (
    <div className="side-meta">
      N° {idx} &nbsp;·&nbsp; {label} &nbsp;·&nbsp; MMXXV
    </div>
  );
}

function Footer({ go }) {
  return (
    <footer className="site-footer site-footer-simple">
      <a className="footer-brand-mark" href="#/home" data-cursor="hover"
         onClick={(e) => { e.preventDefault(); go("home"); }}>
        Alston <span className="italic">Shi</span>
      </a>
      <nav className="footer-nav" aria-label="Footer navigation">
        <a href="#/archive" data-cursor="hover" onClick={(e) => { e.preventDefault(); go("archive"); }}>Archive</a>
        <a href="#/about" data-cursor="hover" onClick={(e) => { e.preventDefault(); go("about"); }}>About</a>
        <a href="#/contact" data-cursor="hover" onClick={(e) => { e.preventDefault(); go("contact"); }}>Contact</a>
        <a href="/personal/" data-cursor="hover" className="nav-link-ext" title="Digital portfolio">Digital Portfolio <span aria-hidden="true">↗</span></a>
      </nav>
      <div className="footer-copy dim">© 2026 Alston Shi. All rights reserved.</div>
    </footer>
  );
}

// ---- Lightbox ----
function Lightbox({ items, index, onClose, onPrev, onNext }) {
  React.useEffect(() => {
    if (index == null) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [index, onClose, onPrev, onNext]);

  const item = index != null ? items[index] : null;

  return (
    <div className={"lightbox" + (index != null ? " open" : "")} onClick={onClose} data-cursor="hover">
      {item && (
        <React.Fragment>
          <div className="lightbox-counter">
            {String(index + 1).padStart(3, "0")} / {String(items.length).padStart(3, "0")}
          </div>
          <button className="lightbox-close" onClick={(e) => { e.stopPropagation(); onClose(); }} data-cursor="hover">
            <span>Close</span>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1"><path d="M1 1l12 12M13 1L1 13"/></svg>
          </button>

          <button className="lightbox-nav prev" onClick={(e) => { e.stopPropagation(); onPrev(); }} data-cursor="hover">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M15 5l-8 7 8 7"/></svg>
          </button>
          <button className="lightbox-nav next" onClick={(e) => { e.stopPropagation(); onNext(); }} data-cursor="hover">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M9 5l8 7-8 7"/></svg>
          </button>

          <div className="lightbox-img-wrap" onClick={(e) => e.stopPropagation()}>
            <img className="lightbox-img" src={item.src} alt={item.title} />
          </div>

          <div className="lightbox-strip">
            <div className="block">
              <div className="label ochre">{item.country} · {item.city}</div>
              <div className="title">{item.title}</div>
            </div>
            <div className="block" style={{ alignItems: "flex-end", textAlign: "right" }}>
              <div className="label">{item.camera}</div>
              <div className="label dim">{item.year} · Frame {String(index + 1).padStart(3, "0")}</div>
            </div>
          </div>
        </React.Fragment>
      )}
    </div>
  );
}

// ---- Custom animated cursor ----
// Small ring that follows the mouse, expands on interactive elements,
// reads data-cursor attributes scattered through the rest of the app.
function CustomCursor() {
  const dotRef = React.useRef(null);
  const ringRef = React.useRef(null);
  const stateRef = React.useRef({
    mx: -100, my: -100, dx: -100, dy: -100, rx: -100, ry: -100,
    mode: "default", label: "", visible: false,
  });

  React.useEffect(() => {
    // Skip on touch / coarse pointer devices entirely
    const coarse = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
    if (coarse) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    const s = stateRef.current;

    const onMove = (e) => {
      s.mx = e.clientX;
      s.my = e.clientY;
      if (!s.visible) {
        s.visible = true;
        dot.style.opacity = 1;
        ring.style.opacity = 1;
      }

      // Detect cursor mode from element under pointer
      const el = e.target instanceof Element ? e.target.closest("[data-cursor]") : null;
      const mode = el ? (el.getAttribute("data-cursor") || "default") : "default";
      const label = el ? (el.getAttribute("data-cursor-label") || "") : "";
      if (mode !== s.mode || label !== s.label) {
        s.mode = mode;
        s.label = label;
        ring.setAttribute("data-mode", mode);
        ring.querySelector(".cursor-label").textContent = label;
      }
    };

    const onLeave = () => {
      s.visible = false;
      dot.style.opacity = 0;
      ring.style.opacity = 0;
    };

    const onDown = () => ring.classList.add("is-down");
    const onUp   = () => ring.classList.remove("is-down");

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseleave", onLeave);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);

    let raf;
    const tick = () => {
      // Dot follows mouse 1:1
      s.dx += (s.mx - s.dx) * 0.6;
      s.dy += (s.my - s.dy) * 0.6;
      // Ring lerps with slight trail
      s.rx += (s.mx - s.rx) * 0.18;
      s.ry += (s.my - s.ry) * 0.18;
      dot.style.transform  = `translate3d(${s.dx}px, ${s.dy}px, 0) translate(-50%,-50%)`;
      ring.style.transform = `translate3d(${s.rx}px, ${s.ry}px, 0) translate(-50%,-50%)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    document.documentElement.classList.add("has-custom-cursor");

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      document.documentElement.classList.remove("has-custom-cursor");
    };
  }, []);

  return (
    <React.Fragment>
      <div ref={dotRef} className="cursor-dot" aria-hidden="true" />
      <div ref={ringRef} className="cursor-ring" data-mode="default" aria-hidden="true">
        <span className="cursor-label"></span>
      </div>
    </React.Fragment>
  );
}

Object.assign(window, { Nav, SideMeta, Footer, Lightbox, CustomCursor });
