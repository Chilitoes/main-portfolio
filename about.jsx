// ============ About page ============
//
// Mirrors the live about.html: one short bio paragraph, gear list,
// CTAs (Get in Touch + Instagram), and a six-image photo strip below.

function About({ go, onOpenLightbox }) {
  // Same six shots as the live about page's strip, in the same order.
  const stripFiles = [
    "Japan/IMG_5583.JPG",       // Dotonbori
    "China/DSCF8511.JPG",       // Garden Pavilion
    "Japan/IMG_6090.JPG",       // Sakura After Dark
    "China/IMG_9089.JPG",       // Temple Incense
    "Japan/IMG_0393.JPG",       // Torii Gate, Hakone
    "China/DSCF8518.JPG",
  ];
  const strip = stripFiles
    .map((f) => window.PORTFOLIO_BY_FILE[f])
    .filter(Boolean);

  return (
    <div className="page">
      <section className="about-hero">
        <div className="about-portrait">
          <div className="about-portrait-img" style={{ backgroundImage: `url(${window.PORTRAIT_IMG})` }} />
          <div className="about-portrait-grain"></div>
        </div>
        <div className="about-body">
          <h1 className="reveal in">
            Alston <br /><span className="italic">Shi</span>
          </h1>
          <div className="label" style={{ color: "var(--ochre)" }}>Photographer</div>

          <div className="para">
            <p>
              I shoot travel, and people too — events, portraits, the moments worth holding onto. Different subjects, same instinct. Based in Singapore.
            </p>
          </div>

          <div className="about-gear-inline reveal">
            <div className="label" style={{ marginBottom: 14 }}>Gear</div>
            <div className="gear-tags">
              {window.GEAR.map((g, i) => (
                <span key={i} className="gear-tag">{g}</span>
              ))}
            </div>
          </div>

          <div className="about-ctas reveal">
            <a className="btn-arrow" href="#/contact" data-cursor="hover"
               onClick={(e) => { e.preventDefault(); go("contact"); }}>
              Get in Touch
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
            </a>
            <a className="about-social-link" href="https://instagram.com/alstonsjpeg"
               target="_blank" rel="noopener" data-cursor="hover">Instagram</a>
          </div>
        </div>
      </section>

      {/* Six-photo strip — matches the live site */}
      <section className="about-strip">
        {strip.map((item, i) => {
          const fullIdx = window.PORTFOLIO.findIndex((p) => p === item);
          return (
            <a key={i}
               className="about-strip-item"
               data-cursor="view"
               data-cursor-label="Open"
               onClick={() => onOpenLightbox && onOpenLightbox(fullIdx)}
               style={{ backgroundImage: `url(${item.src})` }}
               aria-label={item.title}
            />
          );
        })}
      </section>

      <Footer go={go} />
    </div>
  );
}

window.About = About;
