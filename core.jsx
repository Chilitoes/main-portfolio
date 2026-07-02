// ============ Core systems: cursor, reveal, loader, router, theme ============

// ---- Reveal on scroll (IntersectionObserver) ----
function useReveal(deps = []) {
  React.useEffect(() => {
    const els = document.querySelectorAll(".reveal, .reveal-img, .pull-quote, .about-body .para");
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -80px 0px" });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, deps);
}

// ---- Cinematic intro (shown once per session) ----
function hideLoader() {
  const el = document.getElementById("intro");
  if (!el) return;
  // Already seen this session — bail without playing
  if (sessionStorage.getItem("as-intro-seen")) {
    el.remove();
    return;
  }

  const dismiss = () => {
    if (el.classList.contains("gone")) return;
    el.classList.add("gone");
    sessionStorage.setItem("as-intro-seen", "1");
    document.documentElement.classList.add("intro-seen");
    setTimeout(() => el.remove(), 800);
  };

  // Auto-dismiss when the AS logo splits — bg fade overlaps the split
  const total = 7500;
  const autoTimer = setTimeout(dismiss, total);

  const skipNow = () => { clearTimeout(autoTimer); dismiss(); };
  const skipBtn = el.querySelector(".i-skip");
  if (skipBtn) skipBtn.addEventListener("click", skipNow, { once: true });
  const onKey = (e) => {
    if (e.key === "Escape" || e.key === "Enter") skipNow();
  };
  window.addEventListener("keydown", onKey);
  // Remove the key listener whenever the intro goes away (skip, key, or the
  // auto-timer) — previously it survived auto-dismiss for the whole session,
  // holding the removed #intro subtree via closure.
  el.addEventListener("transitionend", () => window.removeEventListener("keydown", onKey), { once: true });
  setTimeout(() => window.removeEventListener("keydown", onKey), total + 1000);
}

// ---- Router (hash-based multi-page) with fade transition ----
// Understands query strings in the hash (#/archive?country=Japan): the query
// is split off before route matching — previously such URLs fell through to
// Home — and exposed so pages can read their params.
function parseHash() {
  const raw = window.location.hash.replace(/^#\/?/, "");
  const [path, qs = ""] = raw.split("?");
  return { route: path.replace(/\/+$/, "") || "home", query: new URLSearchParams(qs) };
}

function useRouter() {
  const [state, setState] = React.useState(parseHash);
  const [leaving, setLeaving] = React.useState(false);
  const pendingTmr = React.useRef(null);

  React.useEffect(() => {
    const onHash = () => {
      const next = parseHash();
      // Cancel any in-flight transition first. Rapid back/forward inside the
      // 450 ms window could otherwise commit the OLD target after the URL had
      // already changed back, desyncing the page from the address bar (and
      // dead-locking the nav, since re-clicking writes an identical hash).
      if (pendingTmr.current) { clearTimeout(pendingTmr.current); pendingTmr.current = null; }
      if (next.route === state.route) {
        // Same page — only the query changed (or a cancelled transition
        // returned here). Commit instantly, no fade.
        setState(next);
        setLeaving(false);
        return;
      }
      setLeaving(true);
      pendingTmr.current = setTimeout(() => {
        pendingTmr.current = null;
        setState(next);
        setLeaving(false);
        window.scrollTo({ top: 0, behavior: "instant" });
      }, 450);
    };
    window.addEventListener("hashchange", onHash);
    return () => {
      window.removeEventListener("hashchange", onHash);
      if (pendingTmr.current) clearTimeout(pendingTmr.current);
    };
  }, [state.route]);

  const go = (r) => { window.location.hash = "#/" + r; };
  return { route: state.route, query: state.query, leaving, go };
}

// ---- Magnetic button ----
function useMagnetic(ref, strength = 0.4) {
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const inner = el.querySelector(".magnetic-inner") || el;
    let raf;
    let tx = 0, ty = 0, x = 0, y = 0;
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      tx = (e.clientX - cx) * strength;
      ty = (e.clientY - cy) * strength;
    };
    const onLeave = () => { tx = 0; ty = 0; };
    const tick = () => {
      x += (tx - x) * 0.15;
      y += (ty - y) * 0.15;
      el.style.transform = `translate(${x * 0.6}px, ${y * 0.6}px)`;
      inner.style.transform = `translate(${x * 0.35}px, ${y * 0.35}px)`;
      raf = requestAnimationFrame(tick);
    };
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    raf = requestAnimationFrame(tick);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, [ref, strength]);
}

// ---- Mouse parallax (for hero) ----
function useMouseParallax(ref, strength = 12) {
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf, tx = 0, ty = 0, x = 0, y = 0;
    const onMove = (e) => {
      const nx = (e.clientX / window.innerWidth - 0.5) * 2;
      const ny = (e.clientY / window.innerHeight - 0.5) * 2;
      tx = -nx * strength;
      ty = -ny * strength;
    };
    const tick = () => {
      x += (tx - x) * 0.06;
      y += (ty - y) * 0.06;
      el.style.setProperty("--mx", `${x}px`);
      el.style.setProperty("--my", `${y}px`);
      el.style.transform = `translate(${x}px, ${y}px) scale(1.12)`;
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener("mousemove", onMove);
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [ref, strength]);
}

Object.assign(window, {
  useReveal, hideLoader, useRouter, useMagnetic, useMouseParallax
});
