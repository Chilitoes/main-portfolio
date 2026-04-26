// ============ Chrome: Nav, SideMeta, Footer, Lightbox ============

function Nav({ route, go, theme, onToggleTheme }) {
  const links = [
    { id: "home", label: "Index" },
    { id: "portfolio", label: "Portfolio" },
    { id: "about", label: "About" },
    { id: "contact", label: "Contact" },
  ];
  return (
    <nav className="nav">
      <a className="nav-brand" href="#/home" data-cursor="hover" onClick={(e) => { e.preventDefault(); go("home"); }}>
        Alston <span className="italic">Shi</span>
      </a>
      <div className="nav-links">
        {links.map((l) => (
          <a key={l.id}
             href={"#/" + l.id}
             className={"nav-link" + (route === l.id ? " active" : "")}
             data-cursor="hover"
             onClick={(e) => { e.preventDefault(); go(l.id); }}>
            {l.label}
          </a>
        ))}
        <button className="theme-toggle" onClick={onToggleTheme} aria-label="Toggle theme" data-cursor="hover">
          {theme === "dark" ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
              <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
              <circle cx="12" cy="12" r="4"/>
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
            </svg>
          )}
        </button>
      </div>
    </nav>
  );
}

function SideMeta({ route }) {
  const idx = ({ home: "01", portfolio: "02", about: "03", contact: "04" })[route] || "01";
  const label = ({ home: "Index", portfolio: "Portfolio", about: "About", contact: "Contact" })[route] || "Index";
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
        <a href="#/portfolio" data-cursor="hover" onClick={(e) => { e.preventDefault(); go("portfolio"); }}>Portfolio</a>
        <a href="#/about" data-cursor="hover" onClick={(e) => { e.preventDefault(); go("about"); }}>About</a>
        <a href="#/contact" data-cursor="hover" onClick={(e) => { e.preventDefault(); go("contact"); }}>Contact</a>
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

Object.assign(window, { Nav, SideMeta, Footer, Lightbox });
