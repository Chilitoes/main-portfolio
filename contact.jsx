// ============ Contact page ============
//
// Real form delivery via Formspree (free tier: 50 submissions/month).
// SETUP — replace the endpoint below with your form ID after:
//   1. https://formspree.io  →  Sign up (use swnssoe@gmail.com)
//   2. New form  →  copy the unique 8-char ID (e.g. xqkrabcd)
//   3. Paste below in place of YOUR_FORM_ID
// Until then the form will fall back to a mailto: link so users can
// still reach you.
const FORMSPREE_ENDPOINT = "https://formspree.io/f/mzdwokqp";
const CONTACT_EMAIL = "swnssoe@gmail.com";

function Field({ label, type = "text", name, placeholder, as = "input", required = false, error = "" }) {
  const [focused, setFocused] = React.useState(false);
  const [val, setVal] = React.useState("");
  const Tag = as;
  const cls = "field"
    + (focused || val ? " focused" : "")
    + (error ? " has-error" : "");
  return (
    <div className={cls}>
      <label>
        {label}
        {required && <span className="field-req" aria-hidden="true">*</span>}
      </label>
      <Tag
        type={type}
        name={name}
        placeholder={placeholder}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={error ? `${name}-err` : undefined}
        data-cursor="hover"
      />
      <span className="underline"></span>
      {error && <span id={`${name}-err`} className="field-error" role="alert">{error}</span>}
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

// Reasonable email pattern — text@text.text, no spaces. Catches typos
// without rejecting valid but uncommon addresses (e.g. + aliases, .photo).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateContactForm(data) {
  const errs = {};
  const name = (data.get("name") || "").trim();
  const email = (data.get("email") || "").trim();
  const message = (data.get("message") || "").trim();

  if (!name) errs.name = "Please enter your name.";
  else if (name.length < 2) errs.name = "Name looks a bit short.";

  if (!email) errs.email = "Please enter your email.";
  else if (!EMAIL_RE.test(email)) errs.email = "That email doesn't look right.";

  if (!message) errs.message = "Tell me a bit about your project.";
  else if (message.length < 10) errs.message = "A few more words would help.";

  return errs;
}

function Contact({ go }) {
  const [status, setStatus] = React.useState("idle"); // idle | sending | sent | error
  const [errorDetail, setErrorDetail] = React.useState("");
  const [errors, setErrors] = React.useState({});
  const [attempted, setAttempted] = React.useState(false);
  const formRef = React.useRef(null);

  const sent = status === "sent";
  const sending = status === "sending";
  const errored = status === "error";

  // Re-validate on input changes once user has attempted to submit —
  // gives live feedback as they fix each error.
  const revalidate = () => {
    if (!attempted) return;
    const form = formRef.current;
    if (!form) return;
    setErrors(validateContactForm(new FormData(form)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (sending || sent) return;

    const form = formRef.current;
    const data = new FormData(form);

    // Block submission until inputs are valid
    const errs = validateContactForm(data);
    setErrors(errs);
    setAttempted(true);
    if (Object.keys(errs).length > 0) {
      // Focus the first field with an error
      const firstBad = Object.keys(errs)[0];
      const el = form.querySelector(`[name="${firstBad}"]`);
      if (el) el.focus();
      return;
    }

    // If endpoint isn't configured, gracefully fall back to mailto:
    if (FORMSPREE_ENDPOINT.includes("YOUR_FORM_ID")) {
      const subject = encodeURIComponent(`Inquiry — ${data.get("project") || "Photography"}`);
      const body = encodeURIComponent(
        `From: ${data.get("name") || ""} <${data.get("email") || ""}>\n` +
        `Project: ${data.get("project") || ""}\n\n` +
        `${data.get("message") || ""}`
      );
      window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
      setStatus("sent");
      return;
    }

    setStatus("sending");
    setErrorDetail("");
    try {
      const res = await fetch(FORMSPREE_ENDPOINT, {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" },
      });
      let bodyJson = null;
      try { bodyJson = await res.json(); } catch (_) {}
      if (res.ok) {
        setStatus("sent");
        form.reset();
      } else {
        console.error("[contact-form] Formspree", res.status, bodyJson);
        setErrorDetail(`HTTP ${res.status}${bodyJson && bodyJson.error ? " · " + bodyJson.error : ""}`);
        setStatus("error");
      }
    } catch (err) {
      console.error("[contact-form] network", err);
      setErrorDetail("Network error — request blocked or offline.");
      setStatus("error");
    }
  };

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
        <form ref={formRef} className="contact-form" onSubmit={handleSubmit} onChange={revalidate} noValidate>
          <Field label="Name" name="name" placeholder="Your name" required error={errors.name} />
          <Field label="Email" name="email" type="email" placeholder="your@email.com" required error={errors.email} />
          <Field label="Project type" name="project" placeholder="Editorial · travel · personal · print · other" />
          <Field label="Message" name="message" placeholder="Tell me about your project — timeline, location, vision..." as="textarea" required error={errors.message} />
          {/* Honeypot field — bots fill it, humans don't see it */}
          <input type="text" name="_gotcha" tabIndex="-1" autoComplete="off" style={{ position: "absolute", left: "-9999px", opacity: 0 }} />
          <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
            <MagneticButton onClick={handleSubmit}>
              {sending ? "Sending…" : sent ? "Sent — thank you" : errored ? "Try again" : "Send message"}
            </MagneticButton>
            <div className="label dim">
              {errored
                ? <span style={{ color: "#d97757" }}>
                    Send failed{errorDetail ? ` (${errorDetail})` : ""}. Email {CONTACT_EMAIL} directly.
                  </span>
                : sent
                  ? "I'll reply within 48 hours."
                  : "Replies within 48 hours."}
            </div>
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
