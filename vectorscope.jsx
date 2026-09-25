// ============ Vectorscope — browse the archive by color ============
//
// A hue/saturation scope (angle = hue, distance from centre = saturation),
// in the spirit of a video vectorscope or DaVinci Resolve's color-grading
// tools: one dot per photo, plotted at its dominant color (computed at
// build time by scripts/extract-colors.js into color-data.js). Drag the
// crosshair anywhere in the circle to set a target color; the archive grid
// below re-sorts to bring the closest-matching photos first (see
// vsColorDistance). Click a dot directly to jump straight to that photo.
//
// Hue-wheel orientation: red (0deg) at 12 o'clock, increasing clockwise
// (yellow, green, cyan, blue, magenta) — the layout most people already
// know from color pickers, not literal broadcast-vectorscope geometry.

const VS_SIZE = 200;       // SVG viewBox units (square)
const VS_CENTER = 100;
const VS_MAX_R = 80;       // radius of the 100%-saturation ring
const VS_LABEL_R = 92;     // R/Y/G/C/B/M ring — must stay inside the 100-unit
                            // half-width (viewBox edge) with margin for glyphs
const VS_HUE_TOL = 30;     // degrees either side of target hue counted as a match
const VS_SAT_TOL = 24;     // saturation points either side counted as a match

function vsCircDist(a, b) {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

// hue/sat (0-360, 0-100) -> viewBox xy. Inverse of vsXyToHueSat below.
//
// Radius uses sqrt(sat) rather than sat directly. Most of this archive sits
// at fairly low real-world saturation (moody, desaturated grading), which
// under a linear mapping bunched nearly every dot within the inner quarter
// of the circle — indistinguishable from each other and from the "no
// color" center. The sqrt curve spreads that common low-sat range across
// much more of the radius while still landing fully-saturated colors on
// the outer ring, so the actual hue variety in the collection is visible
// at a glance instead of collapsed into one grey clump.
function vsHueSatToXy(h, s) {
  const theta = ((90 - h) * Math.PI) / 180;
  const r = Math.sqrt(Math.min(Math.max(s, 0), 100) / 100) * VS_MAX_R;
  return { x: VS_CENTER + r * Math.cos(theta), y: VS_CENTER - r * Math.sin(theta) };
}

function vsXyToHueSat(x, y) {
  const dx = x - VS_CENTER, dy = VS_CENTER - y;
  const r = Math.min(Math.hypot(dx, dy), VS_MAX_R);
  let theta = (Math.atan2(dy, dx) * 180) / Math.PI;
  let h = (((90 - theta) % 360) + 360) % 360;
  const norm = r / VS_MAX_R;
  return { h, s: norm * norm * 100 };
}

function vsIsMatch(color, target) {
  if (!color || !target) return false;
  return vsCircDist(color.h, target.h) <= VS_HUE_TOL && Math.abs(color.s - target.s) <= VS_SAT_TOL;
}

// Continuous closeness (0 = identical, larger = further) for sorting the
// grid by "most like this color" rather than a hard match/no-match cutoff.
// Hue and saturation are both normalized to 0-1 before combining, since raw
// hue distance (0-180) and saturation distance (0-100) aren't comparable.
function vsColorDistance(color, target) {
  if (!color || !target) return Infinity;
  const hueDist = vsCircDist(color.h, target.h) / 180;
  const satDist = Math.abs(color.s - target.s) / 100;
  return Math.hypot(hueDist, satDist);
}

// A photo's relative path, matching the keys extract-colors.js writes to
// color-data.js — decode the per-segment URI-encoding IMG() applied and
// drop the "images/" prefix.
function vsRelPath(src) {
  return decodeURIComponent(src.replace(/^images\//, ""));
}

function vsGetColor(item) {
  return (window.PHOTO_COLORS && window.PHOTO_COLORS[vsRelPath(item.src)]) || null;
}

// Readout values are zero-padded to a constant 3 digits so the text never
// changes width (and nudges the layout) as the numbers change mid-drag.
function vsPad3(n) {
  return String(Math.round(n)).padStart(3, "0");
}

function hslToCss(h, s, l) {
  return `hsl(${h}deg ${s}% ${l}%)`;
}

function Vectorscope({ items, target, onTargetChange, onOpenLightbox }) {
  const svgRef = React.useRef(null);
  const dragging = React.useRef(false);
  const pendingTarget = React.useRef(null);
  const rafId = React.useRef(null);

  // Precompute {item, index, color} once per items identity — items is
  // window.PORTFOLIO, which never changes at runtime, so this is
  // effectively a one-time cost.
  const dots = React.useMemo(() => {
    return items
      .map((item, index) => ({ item, index, color: vsGetColor(item) }))
      .filter((d) => d.color);
  }, [items]);

  const commit = React.useCallback((next) => {
    pendingTarget.current = next;
    if (rafId.current) return;
    rafId.current = requestAnimationFrame(() => {
      rafId.current = null;
      onTargetChange(pendingTarget.current);
    });
  }, [onTargetChange]);

  const pointToTarget = (clientX, clientY) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * VS_SIZE;
    const y = ((clientY - rect.top) / rect.height) * VS_SIZE;
    return vsXyToHueSat(x, y);
  };

  const onPointerDown = (e) => {
    // A tap on a dot opens that photo instead of starting a drag — handled
    // by the dot's own onPointerDown (which stops propagation) — so
    // reaching here means the background/scope area was hit.
    dragging.current = true;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    if (e.cancelable) e.preventDefault();
    const t = pointToTarget(e.clientX, e.clientY);
    if (t) commit(t);
  };
  const onPointerMove = (e) => {
    if (!dragging.current) return;
    if (e.cancelable) e.preventDefault();
    const t = pointToTarget(e.clientX, e.clientY);
    if (t) commit(t);
  };
  const endDrag = () => { dragging.current = false; };

  React.useEffect(() => () => { if (rafId.current) cancelAnimationFrame(rafId.current); }, []);

  const closeCount = target
    ? dots.reduce((n, d) => n + (vsIsMatch(d.color, target) ? 1 : 0), 0)
    : dots.length;

  // Ring/spoke grid + hue-wheel labels, drawn once.
  const rings = [0.25, 0.5, 0.75, 1].map((f) => VS_MAX_R * f);
  const spokes = Array.from({ length: 6 }, (_, i) => i * 60);
  const wheelLabels = [
    { h: 0, t: "R" }, { h: 60, t: "Y" }, { h: 120, t: "G" },
    { h: 180, t: "C" }, { h: 240, t: "B" }, { h: 300, t: "M" },
  ];

  return (
    <div className="vscope">
      <div className="vscope-head">
        <span className="label vscope-title">Browse by color</span>
        {/* Always rendered (just hidden) so the header never changes size */}
        <button
          className="vscope-reset"
          onClick={() => onTargetChange(null)}
          data-cursor="hover"
          style={{ visibility: target ? "visible" : "hidden" }}
          tabIndex={target ? 0 : -1}
        >Reset</button>
      </div>

      <div className="vscope-stage">
        <svg
          ref={svgRef}
          className="vscope-svg"
          viewBox={`0 0 ${VS_SIZE} ${VS_SIZE}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          role="application"
          aria-label="Color scope — drag to browse the archive by hue and saturation"
        >
          <circle className="vscope-face" cx={VS_CENTER} cy={VS_CENTER} r={VS_MAX_R} />
          {rings.map((r) => (
            <circle key={r} className="vscope-ring" cx={VS_CENTER} cy={VS_CENTER} r={r} />
          ))}
          {spokes.map((h) => {
            const p = vsHueSatToXy(h, 100);
            return <line key={h} className="vscope-spoke" x1={VS_CENTER} y1={VS_CENTER} x2={p.x} y2={p.y} />;
          })}
          <circle className="vscope-ring vscope-ring-outer" cx={VS_CENTER} cy={VS_CENTER} r={VS_MAX_R} />

          {dots.map(({ item, index, color }) => {
            // Position and matching (vsIsMatch, above) always use the photo's
            // real hue/saturation. The fill color floors saturation/lightness
            // purely so muted, low-chroma photos still render as a clearly
            // legible hue instead of a near-grey speck — cosmetic only.
            const p = vsHueSatToXy(color.h, color.s);
            const dim = target && !vsIsMatch(color, target);
            return (
              <circle
                key={item.id}
                className={"vscope-dot" + (dim ? " dim" : "")}
                cx={p.x} cy={p.y} r={dim ? 1.8 : 2.6}
                fill={hslToCss(color.h, Math.max(color.s, 48), Math.min(Math.max(color.l, 42), 62))}
                onPointerDown={(e) => { e.stopPropagation(); }}
                onClick={(e) => { e.stopPropagation(); onOpenLightbox(index); }}
                data-cursor="view"
              >
                <title>{item.title === item.country ? item.country : `${item.title} · ${item.country}`}</title>
              </circle>
            );
          })}

          {target && (() => {
            const cp = vsHueSatToXy(target.h, target.s);
            return (
              <g className="vscope-crosshair" style={{ transform: `translate(${cp.x}px, ${cp.y}px)` }}>
                <circle className="vscope-crosshair-ring" r={6} />
                <line x1={-10} y1={0} x2={-3} y2={0} />
                <line x1={3} y1={0} x2={10} y2={0} />
                <line x1={0} y1={-10} x2={0} y2={-3} />
                <line x1={0} y1={3} x2={0} y2={10} />
              </g>
            );
          })()}

          {wheelLabels.map(({ h, t }) => {
            const theta = ((90 - h) * Math.PI) / 180;
            const x = VS_CENTER + VS_LABEL_R * Math.cos(theta);
            const y = VS_CENTER - VS_LABEL_R * Math.sin(theta);
            return <text key={t} className="vscope-label" x={x} y={y} dominantBaseline="middle" textAnchor="middle">{t}</text>;
          })}
        </svg>
      </div>

      {/* Same structure with or without a target — placeholders instead of
          swapping in different content — so nothing shifts on first drag. */}
      <div className="vscope-readout">
        <span
          className={"vscope-swatch" + (target ? "" : " empty")}
          style={target ? { background: hslToCss(target.h, target.s, 55) } : undefined}
          aria-hidden="true"
        />
        <div className="vscope-stat">
          <span className="label dim">Hue</span>
          <span className="vscope-stat-val">{target ? `${vsPad3(target.h)}°` : "———"}</span>
        </div>
        <div className="vscope-stat">
          <span className="label dim">Sat</span>
          <span className="vscope-stat-val">{target ? `${vsPad3(target.s)}%` : "———"}</span>
        </div>
        <div className="vscope-stat">
          <span className="label dim">Matches</span>
          <span className="vscope-stat-val">{target ? vsPad3(closeCount) : "———"}</span>
        </div>
      </div>

      <p className="vscope-hint">Drag inside the circle to sort the archive by color, closest first. Tap a dot to open that photo.</p>
    </div>
  );
}

window.Vectorscope = Vectorscope;
window.vsGetColor = vsGetColor;
window.vsIsMatch = vsIsMatch;
window.vsColorDistance = vsColorDistance;
