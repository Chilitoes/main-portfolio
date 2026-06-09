// ============ Camera Anatomy — pinned 3D scroll scene ============
// Stylized X100V-ish camera built from 4 layered SVGs (body / viewfinder /
// dials / lens), each at a different translateZ. Container has perspective
// + preserve-3d so rotating the assembly produces true parallax depth.

function CameraAnatomy() {
  const sectionRef = React.useRef(null);
  const sceneRef   = React.useRef(null);
  const cameraRef  = React.useRef(null);
  const [phase, setPhase] = React.useState(0);

  const PHASES = [
    {
      key: "lens",
      kicker: "I · The Glass",
      title: "23mm  ƒ2",
      meta: "FUJINON ASPHERICAL · Singapore, daily",
      desc: "The eye. Wide enough to take a street in, sharp enough to read a hand-painted sign at thirty paces. Manual aperture ring, click stops in thirds.",
      rx: 8,  ry: -28,
    },
    {
      key: "viewfinder",
      kicker: "II · The Frame",
      title: "Hybrid OVF / EVF",
      meta: "0.52× magnification · 95% coverage",
      desc: "Where the shot is composed. Optical for when the moment asks you to feel, electronic for when it asks you to measure.",
      rx: 18, ry: -10,
    },
    {
      key: "shutter",
      kicker: "III · The Decision",
      title: "1/4000s mechanical",
      meta: "1/32000s electronic · leaf shutter",
      desc: "The instant before the picture exists. Analogue top-plate dial, mechanical click, full manual override even when the meter has an opinion.",
      rx: 14, ry: 20,
    },
    {
      key: "frame",
      kicker: "IV · And the picture made.",
      title: "1/250  ƒ2  ISO 400",
      meta: "+0.3 EV · daylight · raw",
      desc: "The settings that took the photograph at the top of this page. Wedded Rocks, Ise, sunrise — held for one two-hundred-and-fiftieth of a second.",
      rx: 0,  ry: 0,
    },
  ];

  // Scroll-jack: progress 0→1 maps across the four phases, lerping
  // rotateX / rotateY between consecutive targets with a smoothstep ease.
  React.useEffect(() => {
    const sec = sectionRef.current;
    const cam = cameraRef.current;
    if (!sec || !cam) return;

    const isMobile = window.matchMedia('(max-width: 760px)').matches;
    const reduce   = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduce) {
      cam.style.transform = `rotateX(0deg) rotateY(0deg)`;
      return;
    }

    const smoothstep = (t) => t * t * (3 - 2 * t);

    const onScroll = () => {
      const r = sec.getBoundingClientRect();
      const scrollable = sec.offsetHeight - window.innerHeight;
      if (scrollable <= 0) return;
      const p = Math.max(0, Math.min(1, -r.top / scrollable));

      // Map 0–1 → phase index + local progress within that phase
      const n = PHASES.length;
      const raw = p * (n - 1);
      const idx = Math.min(n - 2, Math.floor(raw));
      const local = smoothstep(Math.max(0, Math.min(1, raw - idx)));

      const cur = PHASES[idx];
      const nxt = PHASES[idx + 1];
      const rx = cur.rx + (nxt.rx - cur.rx) * local;
      const ry = cur.ry + (nxt.ry - cur.ry) * local;

      // Mobile = smaller angles, no Z-explode (perf + a flat phone display
      // can't sell extreme 3D anyway)
      const k = isMobile ? 0.55 : 1;
      cam.style.transform = `rotateX(${(rx * k).toFixed(2)}deg) rotateY(${(ry * k).toFixed(2)}deg)`;

      // "Explode" the layers on the final approach (final phase = sensor / frame)
      // → multiplies each layer's translateZ via a CSS var
      const explode = idx >= n - 2 ? local : 0;
      cam.style.setProperty('--explode', explode.toFixed(3));

      // Active phase drives the active component highlight + caption
      const showIdx = Math.round(p * (n - 1));
      if (showIdx !== phase) setPhase(showIdx);
      sec.dataset.active = PHASES[showIdx].key;
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [phase]);

  const cur = PHASES[phase];

  return (
    <section className="cam-anatomy" ref={sectionRef} data-active="lens">
      <div className="cam-sticky">
        <div className="cam-grid">

          {/* ── Caption panel ── */}
          <div className="cam-cap">
            <div className="cam-cap-kicker">{cur.kicker}</div>
            <h2 className="cam-cap-title" key={"t"+phase}>{cur.title}</h2>
            <div className="cam-cap-meta" key={"m"+phase}>{cur.meta}</div>
            <p className="cam-cap-desc" key={"d"+phase}>{cur.desc}</p>
            <div className="cam-cap-progress" aria-hidden="true">
              {PHASES.map((p, i) => (
                <span key={i} className={"cap-dot" + (i === phase ? " on" : (i < phase ? " past" : ""))} />
              ))}
            </div>
          </div>

          {/* ── 3D stage ── */}
          <div className="cam-stage" ref={sceneRef}>
            <div className="cam-floor" aria-hidden="true" />
            <div className="cam-perspective">
              <div className="cam-3d" ref={cameraRef}>

                {/* L1 · BODY (z=0) ── chassis, grip, hot shoe, strap lugs, labels */}
                <div className="cam-layer cam-l-body">
                  <svg viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#1a1714" />
                        <stop offset="55%" stopColor="#15110d" />
                        <stop offset="100%" stopColor="#0b0908" />
                      </linearGradient>
                      <pattern id="leather" x="0" y="0" width="3.4" height="3.4" patternUnits="userSpaceOnUse">
                        <circle cx="1.7" cy="1.7" r="0.55" fill="#2a2520" />
                      </pattern>
                    </defs>
                    {/* Drop shadow under camera */}
                    <ellipse cx="200" cy="238" rx="170" ry="6" fill="#000" opacity="0.55" />
                    {/* Top viewfinder hump */}
                    <rect x="20" y="22" width="105" height="22" rx="4" fill="url(#bodyGrad)" stroke="#2a2520" strokeWidth="0.5" />
                    {/* Hot shoe */}
                    <rect x="178" y="24" width="50" height="14" rx="2" fill="#070605" />
                    <rect x="184" y="29" width="38" height="1.4" fill="#1a1714" />
                    <rect x="184" y="33" width="38" height="1.4" fill="#1a1714" />
                    {/* Main body */}
                    <rect x="20" y="40" width="360" height="180" rx="8" fill="url(#bodyGrad)" stroke="#2a2520" strokeWidth="1" />
                    {/* Leather grip texture (left half) */}
                    <rect x="25" y="48" width="115" height="166" rx="3" fill="url(#leather)" opacity="0.55" />
                    {/* Right-hand raised grip */}
                    <path d="M308,42 q18,0 18,16 v140 q0,16 -18,16 v-172 z" fill="#0e0c0a" stroke="#2a2520" strokeWidth="0.6" />
                    <g opacity="0.45">
                      <line x1="313" y1="60" x2="313" y2="200" stroke="#000" strokeWidth="0.5" />
                      <line x1="318" y1="60" x2="318" y2="200" stroke="#000" strokeWidth="0.5" />
                      <line x1="323" y1="60" x2="323" y2="200" stroke="#000" strokeWidth="0.5" />
                    </g>
                    {/* AF illuminator */}
                    <circle cx="105" cy="105" r="3.5" fill="#070605" />
                    <circle cx="105" cy="105" r="1.7" fill="#3a2515" opacity="0.7" />
                    {/* Brand label, top-right */}
                    <text x="240" y="55" fill="#C8A265" fontSize="9" fontFamily="serif" fontStyle="italic" opacity="0.9">Alston Shi</text>
                    {/* Strap lugs */}
                    <g>
                      <circle cx="14" cy="80" r="4.5" fill="#070605" />
                      <circle cx="14" cy="80" r="2.2" fill="#1a1714" />
                      <circle cx="386" cy="80" r="4.5" fill="#070605" />
                      <circle cx="386" cy="80" r="2.2" fill="#1a1714" />
                    </g>
                    {/* Bottom serial */}
                    <text x="35" y="210" fill="#3a3530" fontSize="5.5" fontFamily="monospace" letterSpacing="0.5">FUJINON · LENS MADE IN JAPAN</text>
                    <text x="270" y="210" fill="#3a3530" fontSize="5.5" fontFamily="monospace" letterSpacing="0.5">N° 04 · MMXXVI</text>
                    {/* Subtle wear */}
                    <line x1="60" y1="180" x2="78" y2="178" stroke="#3a2515" strokeWidth="0.4" opacity="0.4" />
                  </svg>
                </div>

                {/* L2 · VIEWFINDER (z=8) */}
                <div className="cam-layer cam-l-vf" data-part="viewfinder">
                  <svg viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg">
                    <g>
                      <rect x="32" y="52" width="52" height="34" rx="2.5" fill="#070605" stroke="#2a2520" strokeWidth="0.5" />
                      <rect x="36" y="56" width="44" height="26" rx="1" fill="#15202b" />
                      <rect x="36" y="56" width="44" height="26" rx="1" fill="url(#vfGlass)" />
                      <circle cx="58" cy="69" r="3.5" fill="#7FB5E0" opacity="0.35" />
                      <text x="92" y="62" fill="#C8A265" fontSize="5" opacity="0.85" letterSpacing="0.5">OVF</text>
                      <text x="92" y="71" fill="#666" fontSize="4" letterSpacing="0.5">0.52×</text>
                      <text x="92" y="79" fill="#666" fontSize="4" letterSpacing="0.5">3.69M</text>
                    </g>
                    <defs>
                      <radialGradient id="vfGlass" cx="35%" cy="30%">
                        <stop offset="0%" stopColor="#E8E0D0" stopOpacity="0.18" />
                        <stop offset="65%" stopColor="#E8E0D0" stopOpacity="0" />
                      </radialGradient>
                    </defs>
                  </svg>
                </div>

                {/* L3 · DIALS (z=14) — shutter dial, exposure comp, shutter button */}
                <div className="cam-layer cam-l-dials" data-part="shutter">
                  <svg viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <radialGradient id="dialFace" cx="40%" cy="35%">
                        <stop offset="0%" stopColor="#2a2520" />
                        <stop offset="100%" stopColor="#0e0c0a" />
                      </radialGradient>
                    </defs>
                    {/* Shutter speed dial */}
                    <g transform="translate(290, 63)">
                      <circle r="23" fill="#070605" />
                      <circle r="20" fill="url(#dialFace)" stroke="#3a3530" strokeWidth="0.5" />
                      {/* tick marks every 30deg */}
                      {Array.from({ length: 12 }).map((_, i) => (
                        <line key={i} y1="-18" y2="-15" stroke="#C8A265" strokeWidth="0.7" opacity={i % 3 === 0 ? 0.85 : 0.4} transform={`rotate(${i * 30})`} />
                      ))}
                      <text y="3" textAnchor="middle" fill="#E8E0D0" fontSize="7.5" letterSpacing="0.5">1000</text>
                      <text y="14" textAnchor="middle" fill="#666" fontSize="3.6" letterSpacing="0.8">SHUTTER</text>
                    </g>
                    {/* Exposure compensation */}
                    <g transform="translate(240, 63)">
                      <circle r="14" fill="#070605" />
                      <circle r="11" fill="url(#dialFace)" stroke="#3a3530" strokeWidth="0.4" />
                      <text y="3" textAnchor="middle" fill="#C8A265" fontSize="6">+0.3</text>
                    </g>
                    {/* Shutter button */}
                    <g transform="translate(352, 60)">
                      <circle r="11" fill="#070605" />
                      <circle r="8" fill="#1a1714" stroke="#3a3530" strokeWidth="0.4" />
                      <circle r="5.5" fill="#C8A265" />
                      <circle cx="-2" cy="-2" r="1.5" fill="#E8E0D0" opacity="0.75" />
                    </g>
                  </svg>
                </div>

                {/* L4 · LENS (z=38) — protrudes furthest forward */}
                <div className="cam-layer cam-l-lens" data-part="lens">
                  <svg viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <radialGradient id="lensGlass" cx="38%" cy="34%">
                        <stop offset="0%"  stopColor="#3a4a5a" stopOpacity="0.7" />
                        <stop offset="40%" stopColor="#0a0e15" stopOpacity="1" />
                        <stop offset="100%" stopColor="#000" />
                      </radialGradient>
                      <radialGradient id="lensHi" cx="30%" cy="25%">
                        <stop offset="0%"  stopColor="#E8E0D0" stopOpacity="0.55" />
                        <stop offset="70%" stopColor="#E8E0D0" stopOpacity="0" />
                      </radialGradient>
                      <radialGradient id="lensRimGrad" cx="50%" cy="50%">
                        <stop offset="80%" stopColor="#1a1714" />
                        <stop offset="100%" stopColor="#000" />
                      </radialGradient>
                    </defs>
                    <g transform="translate(180, 140)">
                      {/* Shadow halo */}
                      <circle r="84" fill="#000" opacity="0.45" />
                      {/* Mount ring */}
                      <circle r="78" fill="#070605" />
                      <circle r="76" fill="url(#lensRimGrad)" stroke="#2a2520" strokeWidth="1" />
                      {/* Aperture ring */}
                      <circle r="71" fill="#15110d" stroke="#3a3530" strokeWidth="0.5" />
                      {/* Aperture ring tick marks */}
                      {Array.from({ length: 8 }).map((_, i) => (
                        <line key={i} y1="-72" y2="-67" stroke="#C8A265" strokeWidth="0.6" opacity="0.75" transform={`rotate(${i * 45})`} />
                      ))}
                      {/* Aperture values */}
                      <text y="-58" textAnchor="middle" fill="#C8A265" fontSize="4.5" opacity="0.95">2</text>
                      <text y="-58" textAnchor="middle" fill="#aaa"    fontSize="4"   opacity="0.7" transform="rotate(45)">2.8</text>
                      <text y="-58" textAnchor="middle" fill="#aaa"    fontSize="4"   opacity="0.7" transform="rotate(90)">4</text>
                      <text y="-58" textAnchor="middle" fill="#aaa"    fontSize="4"   opacity="0.7" transform="rotate(135)">5.6</text>
                      <text y="-58" textAnchor="middle" fill="#aaa"    fontSize="4"   opacity="0.7" transform="rotate(180)">8</text>
                      <text y="-58" textAnchor="middle" fill="#aaa"    fontSize="4"   opacity="0.7" transform="rotate(225)">11</text>
                      <text y="-58" textAnchor="middle" fill="#aaa"    fontSize="4"   opacity="0.7" transform="rotate(270)">16</text>
                      <text y="-58" textAnchor="middle" fill="#aaa"    fontSize="4"   opacity="0.7" transform="rotate(315)">22</text>
                      {/* Focus ring (knurled) */}
                      <circle r="62" fill="#070605" />
                      <circle r="60" fill="none" stroke="#3a3530" strokeWidth="0.3" />
                      {Array.from({ length: 36 }).map((_, i) => (
                        <line key={i} y1="-62" y2="-58.5" stroke="#666" strokeWidth="0.3" opacity="0.55" transform={`rotate(${i * 10})`} />
                      ))}
                      {/* Front element rim */}
                      <circle r="52" fill="#070605" />
                      {/* Glass */}
                      <circle r="48" fill="url(#lensGlass)" />
                      {/* Aperture blade hint */}
                      <polygon points="0,-34 29,-15 19,24 -19,24 -29,-15" fill="#000" opacity="0.55" />
                      <polygon points="0,-29 25,-13 16,20 -16,20 -25,-13" fill="#16243a" opacity="0.35" />
                      {/* Specular highlight */}
                      <ellipse cx="-13" cy="-18" rx="20" ry="9.5" fill="url(#lensHi)" />
                      <ellipse cx="-22" cy="-22" rx="6" ry="3" fill="#E8E0D0" opacity="0.45" />
                      {/* Pupil */}
                      <circle r="5.5" fill="#000" />
                      {/* Engraved spec */}
                      <text y="54" textAnchor="middle" fill="#C8A265" fontSize="4.2" opacity="0.95" letterSpacing="0.8">FUJINON · ASPHERICAL · 23mm 1:2</text>
                    </g>
                  </svg>
                </div>

              </div>{/* /.cam-3d */}
            </div>{/* /.cam-perspective */}
          </div>{/* /.cam-stage */}

        </div>
      </div>
    </section>
  );
}

window.CameraAnatomy = CameraAnatomy;
