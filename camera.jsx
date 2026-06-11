// ============ Camera Anatomy — continuous 3D scroll scene ============
// Canon R6 Mark III + RF 24-70mm f/2.8 L IS USM. Built from 13 SVG layers,
// each in a wrapper div with its own scroll-driven translateZ. The container
// has perspective + preserve-3d, so when the assembly rotates the lens
// visibly parallaxes in front of the body — real depth, not painted-on.
//
// Animation is continuous (smooth interpolation throughout the scroll runway).
// On top of a constant slow rotateY oscillation, layers separate in waves:
//   0.15–0.32  lens barrel slides forward as one unit
//   0.30–0.55  lens elements fan apart from each other
//   0.55–0.75  body front detaches, top plate lifts, lens mount drifts
//   0.65–0.82  sensor + internals fade in behind the opening
//   0.65–0.80  card door swings open on its hinge
//   0.90–1.00  everything smoothly reassembles into a final pose
//
// Captions carry philosophy, not specs — this scene is about the photographer,
// not the gear.

function CameraAnatomy() {
  const sectionRef = React.useRef(null);
  const cameraRef  = React.useRef(null);
  const layersRef  = React.useRef({});
  const [phase, setPhase] = React.useState(0);

  const setLayer = (name) => (el) => { if (el) layersRef.current[name] = el; };

  const PHILOSOPHY = [
    { kicker: "I",  title: "Slow looking." },
    { kicker: "II", title: "Composition by instinct." },
    { kicker: "III", title: "Ordinary places, extraordinary moments." },
    { kicker: "IV", title: "And what stays." },
  ];

  // Per-layer choreography. baseZ = at rest, expZ = fully exploded.
  // expY adds a vertical lift (used to raise the top plate).
  // expRotY rotates around Y (used to swing the card door open on its hinge).
  // baseOpacity/expOpacity used for layers hidden when assembled (sensor,
  // internals — they only fade in as the body opens).
  // Lens elements get a vertical fan as well as forward Z — so the chain
  // reads as a visible staircase from front-up-back instead of an overlapping
  // stack. expY varies from 0 (front) to -120 (rear) so the rear elements
  // rise above the front ones.
  // Layer choreography. Pushed magnitudes much harder so the explosion
  // genuinely reads. Notable: sensor flies OUT IN FRONT of the body (z=110)
  // and slightly down so it's unmistakably the camera's eye laid bare,
  // not just a faint hint inside the cavity. Card slots + battery + DIGIC
  // also fly forward instead of staying hidden behind the body face.
  const LAYERS = [
    // Deepest first — body internals
    { name: 'body-back',   baseZ: -8,  expZ: -64 },
    { name: 'internals',   baseZ:  0,  expZ:  56, expY:  40, baseOpacity: 0, expOpacity: 1, time: [0.55, 0.80] },
    { name: 'sensor',      baseZ:  2,  expZ: 110, expY:  30, baseOpacity: 0, expOpacity: 1, time: [0.50, 0.78] },
    // Body face & top
    { name: 'body-front',  baseZ: 10,  expZ:  78, time: [0.48, 0.74] },
    { name: 'top-plate',   baseZ: 15,  expZ:  52, expY: -170, time: [0.52, 0.78] },
    { name: 'card-door',   baseZ: 12,  expZ:  42, expRotY: -100, time: [0.55, 0.78] },
    // Lens mount drifts forward as the lens leaves
    { name: 'lens-mount',  baseZ: 22,  expZ:  90, time: [0.48, 0.72] },
    // Lens elements fan forward AND upward — wider staircase
    { name: 'lens-rear',   baseZ: 36,  expZ: 160, expY: -190, time: [0.12, 0.55] },
    { name: 'lens-4',      baseZ: 40,  expZ: 210, expY: -148, time: [0.15, 0.55] },
    { name: 'lens-3',      baseZ: 44,  expZ: 260, expY: -104, time: [0.18, 0.55] },
    { name: 'lens-2',      baseZ: 48,  expZ: 310, expY:  -56, time: [0.21, 0.55] },
    { name: 'lens-1',      baseZ: 52,  expZ: 360, expY:  -10, time: [0.24, 0.55] },
    // Frontmost — L-ring + brand engraving travels with the front element
    { name: 'l-ring',      baseZ: 56,  expZ: 372, expY:  -10, time: [0.24, 0.55] },
  ];
  LAYERS.forEach(l => { if (!l.time) l.time = [0.48, 0.74]; });

  React.useEffect(() => {
    const sec = sectionRef.current;
    if (!sec) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.matchMedia('(max-width: 760px)').matches;

    if (reduce) {
      if (cameraRef.current) cameraRef.current.style.transform = `rotateX(8deg) rotateY(-18deg)`;
      LAYERS.forEach((cfg) => {
        const el = layersRef.current[cfg.name];
        if (!el) return;
        el.style.transform = `translateZ(${cfg.baseZ}px)`;
        if (cfg.baseOpacity !== undefined) el.style.opacity = cfg.baseOpacity;
      });
      return;
    }

    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    const lerp  = (a, b, t)   => a + (b - a) * t;
    const rangep = (v, lo, hi) => (hi === lo ? (v >= hi ? 1 : 0) : clamp((v - lo) / (hi - lo), 0, 1));
    const smoothstep = (t) => t * t * (3 - 2 * t);

    let raf = null;

    const update = () => {
      const r = sec.getBoundingClientRect();
      const runway = sec.offsetHeight - window.innerHeight;
      if (runway <= 0) return;
      const p = clamp(-r.top / runway, 0, 1);

      // Reassemble in the last 10%: multiplies every layer's explode by (1 - reassemble)
      const reassemble = smoothstep(rangep(p, 0.90, 1.00));
      const mobileK = isMobile ? 0.55 : 1;

      // Continuous oscillating rotation throughout the entire scroll.
      // Big peak Y (~55°) so we genuinely see around the camera and the
      // optical-element chain parallaxes wide. X tilt up to ~28° during
      // the open phase so we look down inside the body cavity.
      const damping = 1 - smoothstep(rangep(p, 0.88, 1.0)) * 0.6;
      const rotY = ((Math.sin(p * Math.PI) * 55) - 10 + Math.sin(p * Math.PI * 2.4) * 4) * damping * mobileK;
      const rotX = (12 + Math.sin(p * Math.PI * 0.85) * 18 * (1 - reassemble)) * mobileK;

      if (cameraRef.current) {
        cameraRef.current.style.transform =
          `rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg)`;
      }

      // Drive each layer.
      for (const cfg of LAYERS) {
        const el = layersRef.current[cfg.name];
        if (!el) continue;
        const t = smoothstep(rangep(p, cfg.time[0], cfg.time[1]));
        const effective = t * (1 - reassemble);
        const z  = lerp(cfg.baseZ, cfg.expZ, effective) * (isMobile ? 0.65 : 1);
        const y  = lerp(0, cfg.expY  || 0, effective);
        const ry = lerp(0, cfg.expRotY || 0, effective);
        el.style.transform = `translate3d(0, ${y.toFixed(1)}px, ${z.toFixed(1)}px) rotateY(${ry.toFixed(2)}deg)`;
        if (cfg.baseOpacity !== undefined) {
          el.style.opacity = lerp(cfg.baseOpacity, cfg.expOpacity, effective).toFixed(3);
        }
      }

      // Caption phase. Slight overlap into the previous phase to avoid jitter.
      const np = p < 0.27 ? 0 : p < 0.57 ? 1 : p < 0.86 ? 2 : 3;
      if (np !== phase) setPhase(np);
    };

    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => { raf = null; update(); });
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [phase]);

  const cur = PHILOSOPHY[phase];

  return (
    <section className="cam-anatomy" ref={sectionRef}>
      <div className="cam-sticky">
        <div className="cam-grid">
          <div className="cam-cap">
            <div className="cam-cap-kicker">{cur.kicker}</div>
            <h2 className="cam-cap-title" key={"t" + phase}>{cur.title}</h2>
            <div className="cam-cap-progress" aria-hidden="true">
              {PHILOSOPHY.map((_, i) => (
                <span key={i} className={"cap-dot" + (i === phase ? " on" : (i < phase ? " past" : ""))} />
              ))}
            </div>
          </div>

          <div className="cam-stage">
            <div className="cam-floor" aria-hidden="true" />
            <div className="cam-perspective">
              <div className="cam-3d" ref={cameraRef}>

                <div className="cam-layer cam-l-body-back"   ref={setLayer('body-back')}>{BodyBack()}</div>
                <div className="cam-layer cam-l-internals"   ref={setLayer('internals')}>{Internals()}</div>
                <div className="cam-layer cam-l-sensor"      ref={setLayer('sensor')}>{Sensor()}</div>
                <div className="cam-layer cam-l-body-front"  ref={setLayer('body-front')}>{BodyFront()}</div>
                <div className="cam-layer cam-l-top-plate"   ref={setLayer('top-plate')}>{TopPlate()}</div>
                <div className="cam-layer cam-l-card-door"   ref={setLayer('card-door')}>{CardDoor()}</div>
                <div className="cam-layer cam-l-lens-mount"  ref={setLayer('lens-mount')}>{LensMount()}</div>
                <div className="cam-layer cam-l-lens-rear"   ref={setLayer('lens-rear')}>{LensElement(5)}</div>
                <div className="cam-layer cam-l-lens-4"      ref={setLayer('lens-4')}>{LensElement(4)}</div>
                <div className="cam-layer cam-l-lens-3"      ref={setLayer('lens-3')}>{LensElement(3)}</div>
                <div className="cam-layer cam-l-lens-2"      ref={setLayer('lens-2')}>{LensElement(2)}</div>
                <div className="cam-layer cam-l-lens-1"      ref={setLayer('lens-1')}>{LensElement(1)}</div>
                <div className="cam-layer cam-l-l-ring"      ref={setLayer('l-ring')}>{LRing()}</div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────── SVG sub-renders ───────────────────────────────────────────────
   All SVGs use the same viewBox so layer positions align in screen space.
   Lens centred at (230, 200); body roughly 60–400 horizontally; top plate
   floats above the body in y. */
const VBOX = "0 0 660 380";

function BodyBack() {
  return (
    <svg viewBox={VBOX} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bbGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2a2520" />
          <stop offset="100%" stopColor="#0a0908" />
        </linearGradient>
      </defs>
      {/* Drop shadow under camera */}
      <ellipse cx="240" cy="350" rx="220" ry="8" fill="#000" opacity="0.5" />
      {/* Back chassis — slightly inset, dimmer than front */}
      <rect x="58" y="78" width="346" height="244" rx="11" fill="url(#bbGrad)" stroke="#2a2520" strokeWidth="0.8" />
      {/* Hint of LCD bezel showing through (interior side) */}
      <rect x="86" y="118" width="190" height="156" rx="3" fill="#0a0908" opacity="0.7" />
      <rect x="92" y="122" width="178" height="148" rx="2" fill="none" stroke="#1a1714" strokeWidth="0.5" />
      {/* Multi-controller hint */}
      <circle cx="315" cy="180" r="9" fill="#0a0908" />
      <circle cx="315" cy="180" r="6" fill="#1a1714" />
      <circle cx="315" cy="180" r="1.5" fill="#3a3530" />
      {/* Right-side buttons */}
      <circle cx="315" cy="210" r="3" fill="#1a1714" />
      <circle cx="338" cy="210" r="3" fill="#1a1714" />
      <circle cx="315" cy="230" r="3" fill="#1a1714" />
      <circle cx="338" cy="230" r="3" fill="#1a1714" />
      <circle cx="315" cy="250" r="3" fill="#1a1714" />
      <circle cx="338" cy="250" r="3" fill="#1a1714" />
    </svg>
  );
}

function Internals() {
  return (
    <svg viewBox={VBOX} xmlns="http://www.w3.org/2000/svg">
      {/* Right-shoulder card-slot bay — visible when card door swings out */}
      <g transform="translate(380, 160)">
        <rect x="0" y="0" width="22" height="76" rx="2" fill="#070605" stroke="#2a2520" strokeWidth="0.5" />
        {/* CFexpress slot */}
        <rect x="3" y="6"  width="16" height="28" rx="1.5" fill="#15110d" stroke="#3a2515" strokeWidth="0.4" />
        <text x="11" y="18" textAnchor="middle" fill="#C8A265" fontSize="3" letterSpacing="0.3" opacity="0.85">CFe</text>
        <text x="11" y="24" textAnchor="middle" fill="#666"    fontSize="2.4" opacity="0.7">TYPE B</text>
        {/* SD slot */}
        <rect x="3" y="40" width="16" height="28" rx="1.5" fill="#15110d" stroke="#3a3530" strokeWidth="0.4" />
        <text x="11" y="52" textAnchor="middle" fill="#aaa" fontSize="3" letterSpacing="0.3" opacity="0.85">SD</text>
        <text x="11" y="58" textAnchor="middle" fill="#666" fontSize="2.4" opacity="0.7">UHS-II</text>
      </g>
      {/* Battery bay hint inside grip */}
      <g transform="translate(70, 220)">
        <rect x="0" y="0" width="42" height="88" rx="3" fill="#0a0908" stroke="#2a2520" strokeWidth="0.5" />
        <rect x="3" y="4" width="36" height="80" rx="2" fill="#15110d" />
        <text x="21" y="50" textAnchor="middle" fill="#C8A265" fontSize="4" letterSpacing="0.4" opacity="0.85">LP-E6P</text>
        {/* Battery contacts */}
        <rect x="6" y="8" width="3" height="2" fill="#C8A265" />
        <rect x="11" y="8" width="3" height="2" fill="#C8A265" />
        <rect x="16" y="8" width="3" height="2" fill="#C8A265" />
      </g>
      {/* DIGIC X processor hint above sensor area */}
      <g transform="translate(165, 100)">
        <rect x="0" y="0" width="34" height="22" rx="1.2" fill="#0e1218" stroke="#2a2520" strokeWidth="0.4" />
        <text x="17" y="9"  textAnchor="middle" fill="#7FB5E0" fontSize="3" letterSpacing="0.3" opacity="0.85">DIGIC</text>
        <text x="17" y="16" textAnchor="middle" fill="#aaa"    fontSize="2.6" letterSpacing="0.3">X</text>
        {/* trace lines */}
        <line x1="0"  y1="11" x2="-12" y2="11" stroke="#666" strokeWidth="0.3" />
        <line x1="34" y1="11" x2="46"  y2="11" stroke="#666" strokeWidth="0.3" />
      </g>
    </svg>
  );
}

function Sensor() {
  return (
    <svg viewBox={VBOX} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sensorGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"  stopColor="#2a4a66" />
          <stop offset="50%" stopColor="#3a6a92" />
          <stop offset="100%" stopColor="#2a4a66" />
        </linearGradient>
        <pattern id="photosites" x="0" y="0" width="2.4" height="2.4" patternUnits="userSpaceOnUse">
          <rect width="2.4" height="2.4" fill="#1a3a55" />
          <rect width="1.2" height="1.2" fill="#5a8db5" opacity="0.55" />
        </pattern>
        <filter id="sensorGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g transform="translate(230, 200)">
        {/* IBIS suspension frame */}
        <rect x="-82" y="-62" width="164" height="124" rx="5" fill="#070605" stroke="#5a5550" strokeWidth="0.8" />
        {/* IBIS spring arms — five-axis suspension */}
        <g stroke="#8a8073" strokeWidth="0.9" fill="none" opacity="0.85">
          <path d="M-72,-52 L-58,-44 L-50,-52 M-58,-44 L-50,-34" />
          <path d="M 72,-52 L 58,-44 L 50,-52 M 58,-44 L 50,-34" />
          <path d="M-72, 52 L-58, 44 L-50, 52 M-58, 44 L-50, 34" />
          <path d="M 72, 52 L 58, 44 L 50, 52 M 58, 44 L 50, 34" />
        </g>
        {/* Outer ochre halo to make the sensor REVEAL pop */}
        <rect x="-66" y="-46" width="132" height="92" rx="2"
              fill="none" stroke="#C8A265" strokeWidth="0.6" opacity="0.5" filter="url(#sensorGlow)" />
        {/* The CMOS sensor — full-frame 3:2 */}
        <rect x="-60" y="-40" width="120" height="80" fill="url(#sensorGrad)" stroke="#7FB5E0" strokeWidth="0.7" />
        <rect x="-60" y="-40" width="120" height="80" fill="url(#photosites)" opacity="0.95" />
        {/* Specular sheen */}
        <ellipse cx="-14" cy="-14" rx="46" ry="16" fill="#9ED5F0" opacity="0.35" />
        <ellipse cx="-26" cy="-22" rx="16" ry="6" fill="#E8E0D0" opacity="0.55" />
        {/* Sensor label */}
        <text x="0" y="56" textAnchor="middle" fill="#C8A265" fontSize="4.6" letterSpacing="0.6" opacity="0.95">FULL-FRAME CMOS · 26.1 MP · IBIS</text>
      </g>
    </svg>
  );
}

function BodyFront() {
  return (
    <svg viewBox={VBOX} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bfGrad" x1="0" y1="0" x2="0.5" y2="1">
          <stop offset="0%"  stopColor="#3a3530" />
          <stop offset="55%" stopColor="#252220" />
          <stop offset="100%" stopColor="#15110d" />
        </linearGradient>
        <pattern id="grip" x="0" y="0" width="3.4" height="3.4" patternUnits="userSpaceOnUse">
          <circle cx="1.7" cy="1.7" r="0.7" fill="#5a5550" />
        </pattern>
        <mask id="frontMask">
          <rect width="660" height="380" fill="#fff" />
          {/* Cut the lens-mount opening so the sensor + lens behind are visible */}
          <circle cx="230" cy="200" r="78" fill="#000" />
        </mask>
      </defs>
      <g mask="url(#frontMask)">
        {/* Main chassis */}
        <rect x="60" y="80" width="340" height="240" rx="11" fill="url(#bfGrad)" stroke="#2a2520" strokeWidth="1" />
        {/* Grip — bulges out on camera's right (image left), top-to-bottom */}
        <path d="M60,90 q-14,0 -14,16 v60 q0,12 6,18 q-6,12 -6,28 v68 q0,16 14,20 v-210 z"
              fill="url(#bfGrad)" stroke="#2a2520" strokeWidth="0.7" />
        {/* Leather grip texture */}
        <rect x="48" y="98" width="74" height="200" rx="3" fill="url(#grip)" opacity="0.55" />
        <rect x="140" y="98" width="78" height="118" rx="2" fill="url(#grip)" opacity="0.35" />
        {/* AF assist beam (small lens with orange tint) */}
        <circle cx="115" cy="120" r="5.5" fill="#0a0908" stroke="#2a2520" strokeWidth="0.4" />
        <circle cx="115" cy="120" r="3" fill="#3a2515" opacity="0.85" />
        <circle cx="113" cy="118" r="1" fill="#C8A265" opacity="0.5" />
        {/* DOF preview button (small) */}
        <circle cx="135" cy="240" r="3" fill="#0a0908" />
        <circle cx="135" cy="240" r="1.6" fill="#1a1714" />
        {/* Lens release button */}
        <circle cx="155" cy="290" r="3.5" fill="#0a0908" />
        <circle cx="155" cy="290" r="2" fill="#1a1714" />
        {/* EOS R6 Mark III label, lower body */}
        <text x="270" y="290" fill="#E8E0D0" fontSize="7" fontWeight="700" letterSpacing="1.8" opacity="0.95">EOS R6</text>
        <text x="270" y="302" fill="#aaa" fontSize="5" letterSpacing="1.4" opacity="0.9">Mark III</text>
        {/* Canon red dot (signature accent) */}
        <circle cx="376" cy="120" r="4" fill="#E03A3E" />
        <circle cx="376" cy="120" r="4" fill="none" stroke="#070605" strokeWidth="0.5" />
        {/* Microphone holes (rows of tiny dots above lens) */}
        <g fill="#0a0908">
          <circle cx="170" cy="92" r="0.8" />
          <circle cx="175" cy="92" r="0.8" />
          <circle cx="180" cy="92" r="0.8" />
          <circle cx="185" cy="92" r="0.8" />
          <circle cx="190" cy="92" r="0.8" />
          <circle cx="280" cy="92" r="0.8" />
          <circle cx="285" cy="92" r="0.8" />
          <circle cx="290" cy="92" r="0.8" />
          <circle cx="295" cy="92" r="0.8" />
          <circle cx="300" cy="92" r="0.8" />
        </g>
        {/* Strap lugs */}
        <g>
          <circle cx="62" cy="100" r="4" fill="#070605" />
          <circle cx="62" cy="100" r="2" fill="#1a1714" />
          <circle cx="396" cy="100" r="4" fill="#070605" />
          <circle cx="396" cy="100" r="2" fill="#1a1714" />
        </g>
        {/* Subtle wear */}
        <line x1="90" y1="280" x2="106" y2="278" stroke="#3a2515" strokeWidth="0.3" opacity="0.4" />
      </g>
    </svg>
  );
}

function TopPlate() {
  return (
    <svg viewBox={VBOX} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="tpGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor="#2a2520" />
          <stop offset="100%" stopColor="#15110d" />
        </linearGradient>
        <radialGradient id="dialFace" cx="40%" cy="35%">
          <stop offset="0%" stopColor="#2a2520" />
          <stop offset="100%" stopColor="#0e0c0a" />
        </radialGradient>
      </defs>
      {/* Top-plate strip across body width */}
      <rect x="60" y="62" width="340" height="22" rx="3" fill="url(#tpGrad)" stroke="#2a2520" strokeWidth="0.6" />
      {/* EVF prism hump, centred */}
      <path d="M200,32 q12,-8 30,-8 h60 q18,0 30,8 v32 h-120 z" fill="url(#tpGrad)" stroke="#2a2520" strokeWidth="0.6" />
      {/* "Canon" branding on the hump (white, italic-ish) */}
      <text x="260" y="50" textAnchor="middle" fill="#E8E0D0" fontSize="8" fontWeight="700" letterSpacing="0.4" fontStyle="italic">Canon</text>
      {/* Hot shoe centred just below hump */}
      <rect x="240" y="64" width="42" height="14" rx="1.6" fill="#070605" />
      <rect x="244" y="68" width="34" height="1.4" fill="#1a1714" />
      <rect x="244" y="72" width="34" height="1.4" fill="#1a1714" />
      <circle cx="261" cy="71" r="0.9" fill="#3a3530" />
      {/* Mode dial — top left */}
      <g transform="translate(130, 70)">
        <circle r="13" fill="#070605" />
        <circle r="10.5" fill="url(#dialFace)" stroke="#3a3530" strokeWidth="0.4" />
        {[0,1,2,3,4,5,6,7].map(i => (
          <line key={i} y1="-10" y2="-7" stroke="#C8A265" strokeWidth="0.6" opacity={i===0?0.9:0.5} transform={`rotate(${i*45})`} />
        ))}
        <text y="2" textAnchor="middle" fill="#E8E0D0" fontSize="4.5" fontWeight="600">M</text>
      </g>
      {/* Top-plate LCD — right shoulder */}
      <g transform="translate(320, 60)">
        <rect x="0" y="0" width="58" height="22" rx="2" fill="#15110d" stroke="#3a3530" strokeWidth="0.4" />
        <rect x="2" y="2" width="54" height="18" rx="1" fill="#1a2520" />
        {/* Faux LCD readout */}
        <text x="6"  y="11" fill="#C8A265" fontSize="4.5" letterSpacing="0.3" opacity="0.95">1/250</text>
        <text x="32" y="11" fill="#C8A265" fontSize="4.5" letterSpacing="0.3" opacity="0.95">ƒ2.8</text>
        <text x="6"  y="18" fill="#888"    fontSize="3.5" letterSpacing="0.3">ISO 400</text>
        <text x="38" y="18" fill="#888"    fontSize="3.5" letterSpacing="0.3">RAW</text>
      </g>
      {/* Shutter button + control dial, top right above grip */}
      <g transform="translate(98, 66)">
        <circle r="9" fill="#070605" />
        <circle r="6.5" fill="#1a1714" stroke="#3a3530" strokeWidth="0.4" />
        <circle r="4.5" fill="#C8A265" />
        <circle cx="-1.6" cy="-1.6" r="1.2" fill="#E8E0D0" opacity="0.7" />
      </g>
      {/* Multi-function bar (faux) */}
      <rect x="160" y="68" width="26" height="6" rx="2" fill="#070605" />
      <rect x="162" y="70" width="22" height="2" fill="#1a1714" />
      {/* On/off switch */}
      <rect x="370" y="68" width="20" height="8" rx="3" fill="#0a0908" stroke="#2a2520" strokeWidth="0.4" />
      <text x="374" y="74" fill="#aaa" fontSize="3" letterSpacing="0.3">OFF</text>
      <text x="385" y="74" fill="#C8A265" fontSize="3" letterSpacing="0.3">ON</text>
    </svg>
  );
}

function CardDoor() {
  return (
    <svg viewBox={VBOX} xmlns="http://www.w3.org/2000/svg">
      {/* Small rectangular door on the right edge of the body */}
      <g transform="translate(382, 156) " style={{ transformOrigin: '0 50%' }}>
        <rect x="0" y="0" width="22" height="84" rx="3" fill="#1a1714" stroke="#2a2520" strokeWidth="0.7" />
        {/* Latch / release lever */}
        <rect x="2" y="68" width="18" height="6" rx="1" fill="#0a0908" />
        <rect x="6" y="70" width="3" height="2" fill="#C8A265" opacity="0.7" />
        {/* "CARD" engraving */}
        <text x="11" y="30" textAnchor="middle" fill="#666" fontSize="3" letterSpacing="0.4" transform="rotate(90 11 30)">CARD</text>
      </g>
    </svg>
  );
}

function LensMount() {
  return (
    <svg viewBox={VBOX} xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(230, 200)">
        {/* RF mount ring — the physical interface where the lens locks */}
        <circle r="90" fill="#070605" />
        <circle r="86" fill="#1a1714" stroke="#3a3530" strokeWidth="0.6" />
        <circle r="82" fill="#0e0c0a" />
        {/* Mount bayonet tabs */}
        {[0, 60, 120, 180, 240, 300].map(deg => (
          <rect key={deg} x="-4" y="-92" width="8" height="6" fill="#C8A265" opacity="0.5" transform={`rotate(${deg})`} />
        ))}
        {/* "EOS R" alignment dot */}
        <circle cx="0" cy="-86" r="2.5" fill="#C42B2F" />
        {/* Mount index marks */}
        <g stroke="#C8A265" strokeWidth="0.5" opacity="0.6">
          <line y1="-90" y2="-85" />
          <line y1="-90" y2="-85" transform="rotate(60)" />
          <line y1="-90" y2="-85" transform="rotate(120)" />
          <line y1="-90" y2="-85" transform="rotate(180)" />
          <line y1="-90" y2="-85" transform="rotate(240)" />
          <line y1="-90" y2="-85" transform="rotate(300)" />
        </g>
        {/* "EOS R" engraved label */}
        <text y="80" textAnchor="middle" fill="#C8A265" fontSize="4" letterSpacing="0.6" opacity="0.85">EOS R · MOUNT</text>
      </g>
    </svg>
  );
}

// Five lens elements, sized from frontmost (1, biggest) to rear (5, smallest).
// Each is drawn at the same centre with different radii so the cumulative
// effect at angle reads as a chain of optical elements stacked in a barrel.
function LensElement(idx) {
  // 1 = front, 5 = rear
  const radii   = [82, 76, 70, 62, 54];        // glass radius
  const rings   = [88, 82, 76, 68, 60];        // metal mount frame radius
  const tints   = ['#243245', '#1e323a', '#2a3a2a', '#1a2840', '#1e2a30']; // coating colour
  const r       = radii[idx - 1];
  const rim     = rings[idx - 1];
  const tint    = tints[idx - 1];
  const isFront = idx === 1;
  return (
    <svg viewBox={VBOX} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id={`glass${idx}`} cx="34%" cy="28%">
          <stop offset="0%"  stopColor="#3a4a5a" stopOpacity={isFront ? 0.75 : 0.55} />
          <stop offset="40%" stopColor="#0a1018" stopOpacity="1" />
          <stop offset="100%" stopColor="#000" />
        </radialGradient>
        <radialGradient id={`hi${idx}`} cx="28%" cy="22%">
          <stop offset="0%"  stopColor="#E8E0D0" stopOpacity={isFront ? 0.55 : 0.35} />
          <stop offset="70%" stopColor="#E8E0D0" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g transform="translate(230, 200)">
        {/* Metal mount frame for this element */}
        <circle r={rim} fill="#070605" />
        <circle r={rim - 2} fill="#1a1714" />
        <circle r={rim - 4} fill="none" stroke="#2a2520" strokeWidth="0.5" />
        {/* Glass */}
        <circle r={r} fill={`url(#glass${idx})`} />
        {/* Coating tint */}
        <circle r={r - 3} fill={tint} opacity={isFront ? 0.18 : 0.32} />
        {isFront && (
          <>
            {/* Aperture blade silhouette only on front element */}
            <polygon points="0,-50 43,-22 27,38 -27,38 -43,-22" fill="#000" opacity="0.45" />
            <polygon points="0,-44 38,-19 24,33 -24,33 -38,-19" fill="#192534" opacity="0.3" />
          </>
        )}
        {/* Specular reflection */}
        <ellipse cx={-r * 0.27} cy={-r * 0.34} rx={r * 0.34} ry={r * 0.17} fill={`url(#hi${idx})`} />
        {isFront && (
          <ellipse cx="-32" cy="-32" rx="10" ry="5" fill="#E8E0D0" opacity="0.55" />
        )}
        {/* Pupil */}
        <circle r={isFront ? 6 : 4} fill="#000" />
      </g>
    </svg>
  );
}

function LRing() {
  return (
    <svg viewBox={VBOX} xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(230, 200)">
        {/* The red L-ring just outside the front element */}
        <circle r="94" fill="none" stroke="#C42B2F" strokeWidth="3.5" />
        <circle r="94" fill="none" stroke="#070605" strokeWidth="0.6" />
        {/* "L" badge */}
        <g transform="translate(0, -94)">
          <circle r="6" fill="#070605" />
          <text y="3" textAnchor="middle" fill="#C42B2F" fontSize="7" fontWeight="700" fontStyle="italic">L</text>
        </g>
        {/* Brand engraving along the bottom of the lens */}
        <text y="116" textAnchor="middle" fill="#E8E0D0" fontSize="5.2" letterSpacing="1.0" opacity="0.95">RF 24-70mm  F2.8  L IS USM</text>
        <text y="126" textAnchor="middle" fill="#666"    fontSize="3" letterSpacing="0.6" opacity="0.85">CANON LENS MADE IN JAPAN</text>
        {/* Knurled grip indication (focus/zoom ring hint) */}
        <g stroke="#3a3530" strokeWidth="0.5" opacity="0.55">
          {Array.from({ length: 48 }).map((_, i) => (
            <line key={i} y1="-100" y2="-96" transform={`rotate(${i * 7.5})`} />
          ))}
        </g>
      </g>
    </svg>
  );
}

window.CameraAnatomy = CameraAnatomy;
