// ============ Core systems: cursor, reveal, loader, router, theme ============

// ---- Custom cursor ----
function useCustomCursor() {
  React.useEffect(() => {
    if (window.matchMedia("(hover: none)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const cursor = document.getElementById("cursor");
    if (!cursor) return;
    const label = cursor.querySelector(".cursor-label");

    let x = window.innerWidth / 2, y = window.innerHeight / 2;
    let tx = x, ty = y;
    let raf;

    const onMove = (e) => { tx = e.clientX; ty = e.clientY; };
    const tick = () => {
      x += (tx - x) * 0.22;
      y += (ty - y) * 0.22;
      cursor.style.transform = `translate(${x}px, ${y}px)`;
      raf = requestAnimationFrame(tick);
    };

    const onOver = (e) => {
      const t = e.target.closest("[data-cursor]");
      cursor.classList.remove("hovering", "view");
      if (t) {
        const mode = t.getAttribute("data-cursor");
        if (mode === "view") {
          cursor.classList.add("view");
          label.textContent = t.getAttribute("data-cursor-label") || "View";
        } else {
          cursor.classList.add("hovering");
          label.textContent = "";
        }
      } else {
        label.textContent = "";
      }
    };

    window.addEventListener("mousemove", onMove);
    document.addEventListener("mouseover", onOver);
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseover", onOver);
      cancelAnimationFrame(raf);
    };
  }, []);
}

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

// ---- Loader (shown once on first visit) ----
function hideLoader() {
  const el = document.getElementById("loader");
  if (!el) return;
  const counter = el.querySelector(".loader-counter");
  const start = performance.now();
  const total = 2400;
  const step = (t) => {
    const p = Math.min(1, (t - start) / total);
    if (counter) counter.textContent = String(Math.floor(p * 100)).padStart(3, "0");
    if (p < 1) requestAnimationFrame(step);
    else {
      setTimeout(() => el.classList.add("gone"), 280);
    }
  };
  requestAnimationFrame(step);
}

// ---- Theme toggle ----
function useTheme() {
  const [theme, setTheme] = React.useState(() =>
    localStorage.getItem("as-theme") || "dark"
  );
  React.useEffect(() => {
    document.body.classList.toggle("theme-dark", theme === "dark");
    document.body.classList.toggle("theme-light", theme === "light");
    localStorage.setItem("as-theme", theme);
  }, [theme]);
  return [theme, setTheme];
}

// ---- Router (hash-based multi-page) with fade transition ----
function useRouter() {
  const [route, setRoute] = React.useState(() => {
    const h = window.location.hash.replace(/^#\//, "");
    return h || "home";
  });
  const [leaving, setLeaving] = React.useState(false);

  React.useEffect(() => {
    const onHash = () => {
      const h = window.location.hash.replace(/^#\//, "") || "home";
      if (h === route) return;
      setLeaving(true);
      setTimeout(() => {
        setRoute(h);
        setLeaving(false);
        window.scrollTo({ top: 0, behavior: "instant" });
      }, 450);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [route]);

  const go = (r) => { window.location.hash = "#/" + r; };
  return { route, leaving, go };
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
  useCustomCursor, useReveal, hideLoader, useTheme, useRouter, useMagnetic, useMouseParallax
});
