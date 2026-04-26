// ============ App root ============

function App() {
  const { route, leaving, go } = window.useRouter();
  const [theme, setTheme] = window.useTheme();
  const [t, setTweak] = window.useTweaks(window.TWEAK_DEFAULTS);

  // Apply font tweaks via CSS vars on :root
  React.useEffect(() => {
    const r = document.documentElement.style;
    r.setProperty("--serif", `"${t.serifFamily}", Georgia, "Times New Roman", serif`);
    r.setProperty("--sans", `"${t.sansFamily}", -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif`);
    r.setProperty("--mono", `"${t.monoFamily}", ui-monospace, SFMono-Regular, Menlo, monospace`);
    r.setProperty("--headline-weight", String(t.headlineWeight));
    r.setProperty("--headline-tracking", t.headlineTracking + "em");
  }, [t.serifFamily, t.sansFamily, t.monoFamily, t.headlineWeight, t.headlineTracking]);

  window.useCustomCursor();

  // Lightbox state (shared across pages)
  const [lbIndex, setLbIndex] = React.useState(null);

  // Re-run reveal observer whenever route changes
  window.useReveal([route, leaving]);

  // Hide loader on first paint
  React.useEffect(() => {
    const t = setTimeout(() => window.hideLoader(), 50);
    return () => clearTimeout(t);
  }, []);

  const onToggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  const onOpenLightbox = (i) => setLbIndex(i);
  const onCloseLightbox = () => setLbIndex(null);
  const onPrev = () => setLbIndex((i) => (i == null ? null : (i - 1 + window.PORTFOLIO.length) % window.PORTFOLIO.length));
  const onNext = () => setLbIndex((i) => (i == null ? null : (i + 1) % window.PORTFOLIO.length));

  let Page = null;
  if (route === "home") Page = window.Home;
  else if (route === "portfolio") Page = window.Portfolio;
  else if (route === "about") Page = window.About;
  else if (route === "contact") Page = window.Contact;
  else Page = window.Home;

  return (
    <React.Fragment>
      <window.Nav route={route} go={go} theme={theme} onToggleTheme={onToggleTheme} />

      <div className={leaving ? "route-leaving" : "route-entering"} style={{ opacity: leaving ? 0 : 1, transition: "opacity 0.45s cubic-bezier(0.22,1,0.36,1)" }}>
        <Page go={go} onOpenLightbox={onOpenLightbox} />
      </div>

      <window.Lightbox
        items={window.PORTFOLIO}
        index={lbIndex}
        onClose={onCloseLightbox}
        onPrev={onPrev}
        onNext={onNext}
      />

      <window.TweaksPanel title="Tweaks">
        <window.TweakSection label="Typography" />
        <window.TweakSelect
          label="Headline serif"
          value={t.serifFamily}
          options={[
            "Cormorant Garamond",
            "EB Garamond",
            "Libre Caslon Text",
            "Lora",
            "Crimson Pro",
            "Playfair Display",
            "Fraunces",
            "Georgia",
          ]}
          onChange={(v) => setTweak("serifFamily", v)}
        />
        <window.TweakSelect
          label="Body sans"
          value={t.sansFamily}
          options={["Inter", "Work Sans", "Nunito Sans", "Helvetica Neue", "Georgia"]}
          onChange={(v) => setTweak("sansFamily", v)}
        />
        <window.TweakSelect
          label="Label mono"
          value={t.monoFamily}
          options={["JetBrains Mono", "Inter", "Work Sans", "Georgia"]}
          onChange={(v) => setTweak("monoFamily", v)}
        />
        <window.TweakSlider
          label="Headline weight"
          value={t.headlineWeight}
          min={300} max={500} step={100}
          onChange={(v) => setTweak("headlineWeight", v)}
        />
        <window.TweakSlider
          label="Headline tracking"
          value={t.headlineTracking}
          min={-0.05} max={0} step={0.005} unit="em"
          onChange={(v) => setTweak("headlineTracking", v)}
        />
      </window.TweaksPanel>
    </React.Fragment>
  );
}

const root = ReactDOM.createRoot(document.getElementById("app"));
root.render(<App />);
