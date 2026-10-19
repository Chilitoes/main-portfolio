// ============ QR tree — a voxel tree that rebuilds itself into an Instagram QR ============
//
// Every dark module of the QR code is one block. At rest the blocks are
// stacked into a small autumn tree on a paper-colored tile; on reveal they
// hop out and land flat on the tile in QR order while the camera swings
// from a slow 3/4 turntable to straight overhead, and the leaf colors fade
// to ink so the code scans. (Same idea as tree.icqr.com, rebuilt in the
// site's own palette with the Three.js it already loads.)
//
// QR_ROWS encodes "https://instagram.com/alstonsjpeg" — QR version 3,
// error-correction level M, 29×29, "1" = dark. Regenerate with the `qrcode`
// npm package if the handle ever changes:
//   QRCode.create(url, { errorCorrectionLevel: "M" }).modules

const QR_URL = "https://instagram.com/alstonsjpeg";
const QR_ROWS = [
  "11111110000000011011101111111", "10000010001100000010101000001",
  "10111010101000101001101011101", "10111010100000001101001011101",
  "10111010100011110111001011101", "10000010101101111000101000001",
  "11111110101010101010101111111", "00000000100011010010100000000",
  "10111110010010110101001111100", "01111001011100011001111110001",
  "00000011001100000110110010000", "01100001011000101001100111010",
  "10011011000010000101000101100", "00101100001011110001111110001",
  "00010110110101111000100101100", "10111001100001001011001010010",
  "01101010110110110100000101100", "10010100010100001111101110101",
  "10100110101110011100010000100", "10000001001000111001111100010",
  "10110011110000010101111110111", "00000000110001101110100011111",
  "11111110011111110101101011100", "10000010111011010010100010000",
  "10111010101010111100111110110", "10111010110011001001000001111",
  "10111010100100010111111111110", "10000010010110000000110111010",
  "11111110100110000101000000100",
];

const QRT_N = QR_ROWS.length;          // modules per side
const QRT_QUIET = 4;                   // quiet-zone modules around the code
const QRT_PLATE = QRT_N + QRT_QUIET * 2;
const QRT_VOXEL = 1.3;                 // tree block size, in QR modules
const QRT_MORPH_S = 2.4;               // tree → QR duration (seconds)
const QRT_AUTO_REVEAL_MS = 2200;       // first reveal after coming into view

const QRT_INK = 0x15120e;
const QRT_PAPER = 0xe9e1d1;
const QRT_TRUNK = [0x5b3a26, 0x6b4630];
const QRT_LEAVES = [0xc8a265, 0xb5793f, 0x9a4a2c, 0xd6b47a, 0x7d7a3a, 0xa8562f];

// Deterministic PRNG so the tree is the same shape on every visit.
function qrtRng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Pair every dark QR module with a tree voxel. Trunk blocks (lowest) land
// nearest the code's center and the crown unfolds out to the corners, so the
// morph reads as the tree spreading open rather than blocks shuffling.
function qrtBuildBlocks() {
  const rand = qrtRng(20201207);
  const half = (QRT_N - 1) / 2;

  const modules = [];
  QR_ROWS.forEach((row, y) => {
    for (let x = 0; x < QRT_N; x++) {
      if (row[x] === "1") modules.push({ x: x - half, z: y - half });
    }
  });
  const count = modules.length;

  const trunk = [];
  for (let y = 0; y < 7; y++) {
    for (const [x, z] of [[0, 0], [1, 0], [0, 1], [1, 1]]) trunk.push({ x, y, z, trunk: true });
  }
  trunk.push({ x: -1, y: 5, z: 0, trunk: true }, { x: 2, y: 6, z: 1, trunk: true }, { x: 1, y: 7, z: -1, trunk: true });

  // Canopy: union of overlapping spheres, filled from the inside out with a
  // little noise so the silhouette is organic, cut to exactly the blocks left.
  const lobes = [
    { c: [0.5, 10.5, 0.5], r: 4.6 }, { c: [-2.6, 9.2, 1.4], r: 3.3 },
    { c: [3.4, 9.6, -0.8], r: 3.3 }, { c: [0.8, 13.4, 0.2], r: 3.2 },
    { c: [-0.6, 9.4, -2.8], r: 3.0 },
  ];
  const candidates = [];
  for (let x = -7; x <= 8; x++) for (let y = 5; y <= 17; y++) for (let z = -7; z <= 8; z++) {
    let best = Infinity;
    for (const { c, r } of lobes) {
      best = Math.min(best, Math.hypot(x - c[0], y - c[1], z - c[2]) / r);
    }
    if (best < 1.15) candidates.push({ x, y, z, score: best + rand() * 0.22 });
  }
  candidates.sort((a, b) => a.score - b.score);
  const canopy = candidates.slice(0, count - trunk.length);

  const tree = trunk.concat(canopy);
  tree.sort((a, b) => a.y - b.y || Math.atan2(a.z, a.x) - Math.atan2(b.z, b.x));
  modules.sort((a, b) =>
    Math.hypot(a.x, a.z) - Math.hypot(b.x, b.z) || Math.atan2(a.z, a.x) - Math.atan2(b.z, b.x));

  return modules.map((m, i) => {
    const t = tree[i];
    return {
      tree: { x: (t.x - 0.5) * QRT_VOXEL, y: t.y * QRT_VOXEL + QRT_VOXEL / 2 + 0.2, z: (t.z - 0.5) * QRT_VOXEL },
      qr: { x: m.x, y: 0.2 + 0.18, z: m.z },
      color: t.trunk
        ? QRT_TRUNK[Math.floor(rand() * QRT_TRUNK.length)]
        : QRT_LEAVES[Math.floor(rand() * QRT_LEAVES.length)],
      // Stagger: center blocks leave first, outer ones follow.
      delay: (i / count) * 0.42,
    };
  });
}

const qrtEase = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const qrtClamp = (v) => Math.max(0, Math.min(1, v));

function QrTree({ size = 340 }) {
  const stageRef = React.useRef(null);
  const apiRef = React.useRef(null);
  const [isQr, setIsQr] = React.useState(false);
  const [webglFailed, setWebglFailed] = React.useState(false);
  const coarse = React.useMemo(() => window.matchMedia("(pointer: coarse)").matches, []);

  React.useEffect(() => {
    const stage = stageRef.current;
    const THREE = window.THREE;
    if (!stage || !THREE) { setWebglFailed(true); return; }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch (_) {
      setWebglFailed(true);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    stage.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 400);

    scene.add(new THREE.AmbientLight(0xffffff, 1.35));
    const sun = new THREE.DirectionalLight(0xffffff, 1.6);
    sun.position.set(18, 40, 26);
    scene.add(sun);

    const plateGeo = new THREE.BoxGeometry(QRT_PLATE, 0.4, QRT_PLATE);
    const plateMat = new THREE.MeshLambertMaterial({ color: QRT_PAPER });
    const plate = new THREE.Mesh(plateGeo, plateMat);
    scene.add(plate);

    const blocks = qrtBuildBlocks();
    const boxGeo = new THREE.BoxGeometry(1, 1, 1);
    const boxMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const mesh = new THREE.InstancedMesh(boxGeo, boxMat, blocks.length);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(mesh);

    const tmp = new THREE.Object3D();
    const ink = new THREE.Color(QRT_INK);
    const leaf = new THREE.Color();
    const col = new THREE.Color();

    // t: 0 = tree, 1 = QR. target is where t is heading.
    let t = reduce ? 1 : 0;
    let target = t;
    let spin = 0.6;                // turntable azimuth (radians)
    let spinFrom = spin, spinTo = 0;
    let visible = false, raf = null, last = 0;
    let autoTimer = null, autoDone = reduce;

    const layout = () => {
      for (let i = 0; i < blocks.length; i++) {
        const b = blocks[i];
        const u = qrtEase(qrtClamp((t - b.delay) / (1 - 0.42)));
        const hop = Math.sin(Math.PI * u) * 5;
        tmp.position.set(
          b.tree.x + (b.qr.x - b.tree.x) * u,
          b.tree.y + (b.qr.y - b.tree.y) * u + hop,
          b.tree.z + (b.qr.z - b.tree.z) * u,
        );
        const s = QRT_VOXEL * 0.9 + (1 - QRT_VOXEL * 0.9) * u;
        tmp.scale.set(s, s + (0.36 - s) * u, s);
        tmp.updateMatrix();
        mesh.setMatrixAt(i, tmp.matrix);
        leaf.setHex(b.color);
        col.copy(leaf).lerp(ink, qrtClamp(u * 1.4 - 0.2));
        mesh.setColorAt(i, col);
      }
      mesh.instanceMatrix.needsUpdate = true;
      mesh.instanceColor.needsUpdate = true;

      // Tile grows from a small ground patch to the full QR + quiet zone.
      const e = qrtEase(t);
      const ps = 0.62 + 0.38 * e;
      plate.scale.set(ps, 1, ps);

      // Camera: 3/4 turntable view → straight overhead (azimuth eased to 0 so
      // the code lands upright). Polar angle never hits exactly 0 so lookAt
      // keeps a stable "up" (= -z, the QR's top row).
      const az = t > 0 && t < 1 ? spinFrom + (spinTo - spinFrom) * e : (t >= 1 ? 0 : spin);
      const polar = (1 - e) * 0.98 + 1e-4;
      const R = 120;
      camera.position.set(
        R * Math.sin(polar) * Math.sin(az),
        R * Math.cos(polar),
        R * Math.sin(polar) * Math.cos(az),
      );
      camera.up.set(0, 1, 0);
      camera.lookAt(0, (1 - e) * 8, 0);
      // Settled: the paper tile slightly overfills the (rounded, clipped)
      // stage so no dark seam shows around the code.
      const frame = 17.5 + (QRT_PLATE / 2 - 0.25 - 17.5) * e;
      camera.left = -frame; camera.right = frame; camera.top = frame; camera.bottom = -frame;
      camera.updateProjectionMatrix();
    };

    const draw = () => { layout(); renderer.render(scene, camera); };

    const tick = (now) => {
      raf = null;
      if (!visible) return;
      const dt = Math.min(0.05, (now - (last || now)) / 1000);
      last = now;
      if (t !== target) {
        const step = dt / QRT_MORPH_S;
        t = target > t ? Math.min(target, t + step) : Math.max(target, t - step);
        if (t === 1) setIsQr(true);
        if (t === 0) setIsQr(false);
      } else if (t === 0 && !reduce) {
        spin += dt * 0.35;
      }
      draw();
      // Keep looping only while something moves: the turntable (tree) or a
      // morph in progress. A settled QR is a still image — no loop.
      if (t !== target || (t === 0 && !reduce)) raf = requestAnimationFrame(tick);
    };
    const kick = () => { if (visible && raf == null) { last = 0; raf = requestAnimationFrame(tick); } };

    const toggle = (to) => {
      const next = typeof to === "number" ? to : (target > 0.5 ? 0 : 1);
      if (next === target) return;
      if (next === 1) {
        // Ease the turntable to the nearest full turn so the code lands upright.
        spinFrom = spin;
        spinTo = Math.round(spin / (Math.PI * 2)) * Math.PI * 2;
      } else {
        spinFrom = 0; spinTo = 0; spin = 0;
      }
      target = next;
      if (reduce) { t = target; setIsQr(t === 1); draw(); return; }
      kick();
    };
    apiRef.current = { toggle };

    const resize = () => {
      const w = stage.clientWidth;
      renderer.setSize(w, w, false);
      draw();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(stage);

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) {
        kick();
        if (!autoDone && autoTimer == null) {
          autoTimer = setTimeout(() => { autoDone = true; toggle(1); }, QRT_AUTO_REVEAL_MS);
        }
      }
    }, { threshold: 0.35 });
    io.observe(stage);

    const onCtxLost = (e) => { e.preventDefault(); if (raf) cancelAnimationFrame(raf); raf = null; };
    const onCtxRestored = () => { draw(); kick(); };
    renderer.domElement.addEventListener("webglcontextlost", onCtxLost, false);
    renderer.domElement.addEventListener("webglcontextrestored", onCtxRestored, false);

    if (reduce) setIsQr(true);
    resize();

    return () => {
      apiRef.current = null;
      if (raf) cancelAnimationFrame(raf);
      clearTimeout(autoTimer);
      io.disconnect();
      ro.disconnect();
      renderer.domElement.removeEventListener("webglcontextlost", onCtxLost);
      renderer.domElement.removeEventListener("webglcontextrestored", onCtxRestored);
      boxGeo.dispose(); boxMat.dispose(); plateGeo.dispose(); plateMat.dispose();
      mesh.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  if (webglFailed) {
    return (
      <a className="social-chip" href={QR_URL} target="_blank" rel="noopener" data-cursor="hover">
        Instagram / @alstonsjpeg
      </a>
    );
  }

  // Phones can't scan their own screen, so there a tap on the finished code
  // opens Instagram; elsewhere a click flips between tree and code.
  const onStage = () => {
    if (isQr && coarse) { window.open(QR_URL, "_blank", "noopener"); return; }
    apiRef.current?.toggle();
  };

  const caption = isQr
    ? (coarse ? "Tap to open @alstonsjpeg" : "Scan to open @alstonsjpeg")
    : (coarse ? "Tap the tree" : "Click the tree");

  return (
    <figure className="qrt" style={{ maxWidth: size }}>
      <button
        type="button"
        ref={stageRef}
        className="qrt-stage"
        onClick={onStage}
        data-cursor="hover"
        aria-label={isQr
          ? (coarse ? "Open Instagram @alstonsjpeg" : "QR code for Instagram @alstonsjpeg — click to show the tree")
          : "Tree — click to turn it into a QR code for Instagram @alstonsjpeg"}
      />
      <figcaption className="qrt-cap">
        <span className="label dim">{caption}</span>
        {isQr && coarse && (
          <button type="button" className="qrt-replay" onClick={() => apiRef.current?.toggle(0)} data-cursor="hover">
            Replay
          </button>
        )}
      </figcaption>
    </figure>
  );
}

window.QrTree = QrTree;
