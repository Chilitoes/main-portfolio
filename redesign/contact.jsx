// ============ Contact page ============

function Field({ label, type = "text", name, placeholder, as = "input" }) {
  const [focused, setFocused] = React.useState(false);
  const [val, setVal] = React.useState("");
  const Tag = as;
  return (
    <div className={"field" + (focused || val ? " focused" : "")}>
      <label>{label}</label>
      <Tag
        type={type}
        name={name}
        placeholder={placeholder}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        data-cursor="hover"
      />
      <span className="underline"></span>
    </div>
  );
}

function MagneticButton({ children, onClick }) {
  const ref = React.useRef(null);
  window.useMagnetic(ref, 0.45);
  return (
    <button ref={ref} className="magnetic" onClick={onClick} data-cursor="hover">
      <span className="magnetic-inner">
        {children}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
      </span>
    </button>
  );
}

function Contact({ go }) {
  const [sent, setSent] = React.useState(false);
  return (
    <div className="page contact">
      <div className="contact-head">
        <div className="label reveal in" style={{ marginBottom: 24, color: "var(--ochre)" }}>Get in touch</div>
        <h1>Contact</h1>
        <p style={{ marginTop: 24, fontFamily: "var(--serif)", fontSize: "clamp(20px, 2vw, 28px)", color: "var(--fg-dim)" }}>
          Available for travel, editorial, and event shoots.
        </p>
      </div>

      <div className="contact-grid">
        <form className="contact-form" onSubmit={(e) => { e.preventDefault(); setSent(true); }}>
          <Field label="Name" name="name" placeholder="Your name" />
          <Field label="Email" name="email" type="email" placeholder="your@email.com" />
          <Field label="Project type" name="project" placeholder="Editorial · travel · personal · print · other" />
          <Field label="Message" name="message" placeholder="Tell me about your project — timeline, location, vision..." as="textarea" />
          <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
            <MagneticButton onClick={(e) => { e.preventDefault(); setSent(true); }}>
              {sent ? "Sent — thank you" : "Send message"}
            </MagneticButton>
            <div className="label dim">Replies within 48 hours.</div>
          </div>
        </form>

        <aside className="contact-side">
          <div className="group">
            <div className="label">Email</div>
            <a href="mailto:alstonjpeg@gmail.com" data-cursor="hover">
              <div className="v">alstonjpeg@gmail.com</div>
            </a>
          </div>
          <div className="group">
            <div className="label">Based in</div>
            <div className="v serif">Singapore — available worldwide</div>
          </div>
          <div className="group">
            <div className="label">Response time</div>
            <div className="v serif">Within 48 hours</div>
          </div>
          <div className="group">
            <div className="label">Find me on</div>
            <div className="socials">
              <a className="social-chip" href="https://instagram.com/alstonsjpeg" target="_blank" rel="noopener" data-cursor="hover">Instagram / @alstonsjpeg</a>
              <a className="social-chip" href="mailto:alstonjpeg@gmail.com" data-cursor="hover">Email</a>
            </div>
          </div>
        </aside>
      </div>

      <div style={{ marginTop: 40 }}>
        <Footer go={go} />
      </div>
    </div>
  );
}

window.Contact = Contact;
