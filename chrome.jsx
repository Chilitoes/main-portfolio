// ============ Chrome: Nav, SideMeta, Footer, Lightbox ============

function Nav({ route, go, theme, onToggleTheme }) {
  const links = [
    { id: "home", label: "Home" },
    { id: "archive", label: "Archive" },
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
        <a href="/personal/" className="nav-link nav-link-ext" data-cursor="hover" title="Digital portfolio">
          Code <span className="ext-arrow" aria-hidden="true">↗</span>
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
        <a href="/personal/" data-cursor="hover" className="nav-link-ext" title="Digital portfolio">Code <span aria-hidden="true">↗</span></a>
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
