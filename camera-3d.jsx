// ============ Camera Anatomy — Three.js scene ============
// Canon EOS R6 Mark III + RF 24-70mm f/2.8 L IS USM built from real 3D
// primitives (~50 distinct meshes). Scroll drives a smooth assemble →
// explode → reassemble cycle, with the whole assembly oscillating in 3D
// throughout. Rim lighting from behind for the warm edge glow.

function Camera3D() {
  const sectionRef = React.useRef(null);
  const containerRef = React.useRef(null);
  const ctxRef = React.useRef(null);
  const [phase, setPhase] = React.useState(0);

  const PHILOSOPHY = [
    { kicker: "I",   title: "How I see.",
      desc: "Travel photographer based in Singapore, shooting across Asia since 2020." },
    { kicker: "II",  title: "What I look for.",
      desc: "Quiet streets, soft light, the in-between moments most people walk past." },
    { kicker: "III", title: "Ordinary places, extraordinary moments.",
      desc: "Street, travel, and editorial photography." },
    { kicker: "IV",  title: "The photo is what stays.",
      desc: "Browse the archive, or get in touch for work." },
  ];

  React.useEffect(() => {
    if (typeof THREE === 'undefined') return;
    const container = containerRef.current;
    const section = sectionRef.current;
    if (!container || !section) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.matchMedia('(max-width: 760px)').matches;

    /* ── scene ───────────────────────────────────────────────────────── */
    const scene = new THREE.Scene();
    // Mobile gets a wider FOV and further pull-back so the full
    // explosion (~3 units wide either side, ~3 units forward) actually
    // fits inside a portrait viewport without clipping.
    const camera = new THREE.PerspectiveCamera(
      isMobile ? 42 : 30,
      container.clientWidth / Math.max(1, container.clientHeight),
      0.1, 100
    );
    camera.position.set(0, isMobile ? 0.35 : 0.25, isMobile ? 9.0 : 6.0);
    camera.lookAt(0, -0.05, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    // Full device pixel ratio (capped at 2.5) — the camera is the visual
    // centrepiece of the page, sharpness matters more than a few mW here.
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 2 : 2.5));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.55;            // brighter overall curve
    container.appendChild(renderer.domElement);

    /* ── lighting ────────────────────────────────────────────────────── */
    // Warmer + brighter ambient so the body never sinks into black
    scene.add(new THREE.AmbientLight(0x383840, 1.35));

    // Main key — brighter, gives the strong primary specular highlight
    const keyLight = new THREE.DirectionalLight(0xfff4e4, 3.3);
    keyLight.position.set(2.4, 3.2, 2.4);
    scene.add(keyLight);

    // Secondary key from the opposite side so chrome/metal parts catch
    // light from two angles — much more sparkle
    const keyLight2 = new THREE.DirectionalLight(0xeaf0ff, 1.8);
    keyLight2.position.set(-2.6, 2.0, 2.0);
    scene.add(keyLight2);

    // Rim light from behind — the warm edge glow that defines the look
    const rimLight = new THREE.DirectionalLight(0xE0B070, 4.0);
    rimLight.position.set(-1.6, 1.0, -2.0);
    scene.add(rimLight);

    // Second rim from upper-back for top-edge glow
    const rimLight2 = new THREE.DirectionalLight(0xFFCC88, 2.4);
    rimLight2.position.set(1.4, 1.6, -2.2);
    scene.add(rimLight2);

    // Cool fill from below for shape definition
    const fillLight = new THREE.DirectionalLight(0x5a78b0, 1.0);
    fillLight.position.set(-2.2, -1.0, 1.6);
    scene.add(fillLight);

    // Two warm point accents near the lens for bright glass speculars
    const accentLight = new THREE.PointLight(0xFFD8A0, 3.0, 10, 1.5);
    accentLight.position.set(0.8, 1.4, 1.8);
    scene.add(accentLight);

    const accentLight2 = new THREE.PointLight(0xFFE0B0, 2.0, 8, 1.8);
    accentLight2.position.set(-0.6, 0.6, 1.6);
    scene.add(accentLight2);

    /* ── model ───────────────────────────────────────────────────────── */
    const built = buildModel(renderer.capabilities.getMaxAnisotropy());
    scene.add(built.group);
    // Initial pose: slightly angled so we see the lens depth
    built.group.rotation.y = -0.55;
    built.group.rotation.x = 0.15;

    /* ── scroll state ────────────────────────────────────────────────── */
    let scrollP = 0;
    let lastPhase = -1;
    const onScroll = () => {
      const r = section.getBoundingClientRect();
      const runway = section.offsetHeight - window.innerHeight;
      if (runway <= 0) return;
      scrollP = Math.max(0, Math.min(1, -r.top / runway));
      const ph = scrollP < 0.25 ? 0 : scrollP < 0.55 ? 1 : scrollP < 0.85 ? 2 : 3;
      if (ph !== lastPhase) { lastPhase = ph; setPhase(ph); }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* ── resize ──────────────────────────────────────────────────────── */
    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', onResize);

    /* ── animation loop ──────────────────────────────────────────────── */
    const easeInOut = (t) => t * t * (3 - 2 * t);

    // explosion progress curve: 0 at start, peaks near middle, returns to 0 at end
    const explodeCurve = (p) => {
      if (p < 0.05) return 0;
      if (p > 0.95) return 0;
      // ramp up from 0.05 to 0.55, peak, descend to 0.95
      let t;
      if (p < 0.55) t = (p - 0.05) / 0.5;
      else          t = 1 - (p - 0.55) / 0.4;
      return easeInOut(Math.max(0, Math.min(1, t)));
    };

    let raf;
    const tick = () => {
      const xT = explodeCurve(scrollP);

      // Apply per-part interpolation
      const parts = built.parts;
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        const t = xT * (p.weight || 1);
        p.mesh.position.x = p.rest.position.x + (p.target.position.x - p.rest.position.x) * t;
        p.mesh.position.y = p.rest.position.y + (p.target.position.y - p.rest.position.y) * t;
        p.mesh.position.z = p.rest.position.z + (p.target.position.z - p.rest.position.z) * t;
        p.mesh.rotation.x = p.rest.rotation.x + (p.target.rotation.x - p.rest.rotation.x) * t;
        p.mesh.rotation.y = p.rest.rotation.y + (p.target.rotation.y - p.rest.rotation.y) * t;
        p.mesh.rotation.z = p.rest.rotation.z + (p.target.rotation.z - p.rest.rotation.z) * t;
      }

      if (!reduce) {
        // Continuous rotation throughout scroll
        const yaw = -0.55 + scrollP * Math.PI * 1.6 * (isMobile ? 0.7 : 1);
        const pitch = 0.15 + Math.sin(scrollP * Math.PI * 0.85) * 0.18 * (1 - Math.max(0, (scrollP - 0.92) / 0.08));
        built.group.rotation.y = yaw;
        built.group.rotation.x = pitch;
      }

      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    ctxRef.current = { scene, renderer, camera, model: built };

    /* ── cleanup ─────────────────────────────────────────────────────── */
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      container.removeChild(renderer.domElement);
      // dispose geometries + materials
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          if (Array.isArray(o.material)) o.material.forEach(m => m.dispose());
          else o.material.dispose();
        }
      });
      renderer.dispose();
    };
  }, []);

  const cur = PHILOSOPHY[phase];

  return (
    <section className="cam3d-section" ref={sectionRef}>
      <div className="cam3d-sticky">
        <div className="cam3d-canvas" ref={containerRef} aria-hidden="true" />
        <div className="cam3d-cap">
          <div className="cam3d-kicker">{cur.kicker}</div>
          <h2 className="cam3d-title" key={"t" + phase}>{cur.title}</h2>
          <p className="cam3d-desc" key={"d" + phase}>{cur.desc}</p>
          <div className="cam3d-progress" aria-hidden="true">
            {PHILOSOPHY.map((_, i) => (
              <span key={i} className={"c3d-dot" + (i === phase ? " on" : (i < phase ? " past" : ""))} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   Procedural model builder. Returns { group, parts } where parts are
   each { mesh, rest, target, weight } so the animation loop can lerp
   per-mesh between rest and target on every scroll frame.
   ────────────────────────────────────────────────────────────────────── */
function buildModel(maxAnisotropy = 4) {
  const group = new THREE.Group();
  const parts = [];

  // ── materials ───────────────────────────────────────────────────────
  const matBody       = new THREE.MeshStandardMaterial({ color: 0x35302a, roughness: 0.38, metalness: 0.7 });
  const matBodyDark   = new THREE.MeshStandardMaterial({ color: 0x15110e, roughness: 0.55, metalness: 0.45 });
  const matRubber     = new THREE.MeshStandardMaterial({ color: 0x1c1814, roughness: 0.85, metalness: 0.05 });
  const matMetal      = new THREE.MeshStandardMaterial({ color: 0x45403a, roughness: 0.22, metalness: 0.92 });
  const matMetalLight = new THREE.MeshStandardMaterial({ color: 0x5e5853, roughness: 0.18, metalness: 0.95 });
  const matOchre = new THREE.MeshStandardMaterial({ color: 0xC8A265, roughness: 0.35, metalness: 0.8, emissive: 0x6a4a20, emissiveIntensity: 0.15 });
  const matRed = new THREE.MeshStandardMaterial({ color: 0xE03A3E, roughness: 0.4, metalness: 0.6, emissive: 0xE03A3E, emissiveIntensity: 0.35 });
  const matGlass = new THREE.MeshPhysicalMaterial({
    color: 0x101e30, roughness: 0.08, metalness: 0.1,
    transmission: 0.45, thickness: 0.15, opacity: 0.92, transparent: true,
    clearcoat: 1.0, clearcoatRoughness: 0.05, ior: 1.5,
  });
  const matGlassTint = new THREE.MeshPhysicalMaterial({
    color: 0x18331f, roughness: 0.06, metalness: 0.1,
    transmission: 0.5, thickness: 0.1, opacity: 0.9, transparent: true,
    clearcoat: 1.0, clearcoatRoughness: 0.05, ior: 1.52,
  });
  const matSensor = new THREE.MeshStandardMaterial({ color: 0x2a4a72, roughness: 0.18, metalness: 0.7, emissive: 0x1f3a5a, emissiveIntensity: 0.35 });
  const matPCB = new THREE.MeshStandardMaterial({ color: 0x1a4030, roughness: 0.5, metalness: 0.3 });
  const matChip = new THREE.MeshStandardMaterial({ color: 0x202428, roughness: 0.6, metalness: 0.7 });

  // ── helpers ─────────────────────────────────────────────────────────
  const addPart = (mesh, opts) => {
    const o = opts || {};
    if (o.pos) mesh.position.set(o.pos[0], o.pos[1], o.pos[2]);
    if (o.rot) mesh.rotation.set(o.rot[0], o.rot[1], o.rot[2]);
    const tPos = o.target ? [
      mesh.position.x + o.target[0],
      mesh.position.y + o.target[1],
      mesh.position.z + o.target[2],
    ] : [mesh.position.x, mesh.position.y, mesh.position.z];
    const tRot = o.targetRot ? [
      mesh.rotation.x + o.targetRot[0],
      mesh.rotation.y + o.targetRot[1],
      mesh.rotation.z + o.targetRot[2],
    ] : [mesh.rotation.x, mesh.rotation.y, mesh.rotation.z];
    parts.push({
      mesh,
      rest:   { position: { x: mesh.position.x, y: mesh.position.y, z: mesh.position.z },
                rotation: { x: mesh.rotation.x, y: mesh.rotation.y, z: mesh.rotation.z } },
      target: { position: { x: tPos[0], y: tPos[1], z: tPos[2] },
                rotation: { x: tRot[0], y: tRot[1], z: tRot[2] } },
      weight: o.weight != null ? o.weight : 1,
    });
    group.add(mesh);
    return mesh;
  };
  const box = (w, h, d, s) => { const g = new THREE.BoxGeometry(w, h, d, s||1, s||1, s||1); return g; };
  const cyl = (rt, rb, h, s, openEnded) => new THREE.CylinderGeometry(rt, rb, h, s || 48, 1, openEnded || false);
  const tor = (r, tube, rad, tub) => new THREE.TorusGeometry(r, tube, rad || 16, tub || 72);
  // Rounded box: extrude a rounded rectangle shape along its depth so corners
  // are properly chamfered instead of flat boxes. Returns geometry centred at
  // origin in all axes.
  const roundedBox = (w, h, d, r) => {
    const radius = Math.min(r, w / 2, h / 2);
    const shape = new THREE.Shape();
    const x = -w / 2, y = -h / 2;
    shape.moveTo(x + radius, y);
    shape.lineTo(x + w - radius, y);
    shape.quadraticCurveTo(x + w, y, x + w, y + radius);
    shape.lineTo(x + w, y + h - radius);
    shape.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    shape.lineTo(x + radius, y + h);
    shape.quadraticCurveTo(x, y + h, x, y + h - radius);
    shape.lineTo(x, y + radius);
    shape.quadraticCurveTo(x, y, x + radius, y);
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: d, bevelEnabled: true, bevelThickness: radius * 0.6,
      bevelSize: radius * 0.5, bevelSegments: 4, steps: 1, curveSegments: 12,
    });
    geo.translate(0, 0, -d / 2);
    return geo;
  };

  // Helper to make a "lens element" — sphere flattened on Z axis.
  // Each element gets a thin metal rim around it (a slim torus) so the
  // chain reads as a series of discs with mounting hardware.
  const lensElement = (rGlass, rRim, depth, mat) => {
    const elGroup = new THREE.Group();
    const sphereGeo = new THREE.SphereGeometry(rGlass, 48, 32);
    const glass = new THREE.Mesh(sphereGeo, mat);
    glass.scale.set(1, 1, depth);
    elGroup.add(glass);
    const rim = new THREE.Mesh(tor(rRim, 0.012, 8, 48), matMetal);
    elGroup.add(rim);
    return elGroup;
  };

  // ── engraved-text labels ────────────────────────────────────────────
  // Real cameras have printed branding all over them — adding it is what
  // separates "a model of a camera" from "a stack of toy primitives".
  // Each label is a transparent canvas with the text drawn on it, mapped
  // to a thin plane that sits flush against a body/lens surface. The text
  // is slightly emissive-bright so it reads as crisp printed lettering.
  const labelCache = [];
  const makeLabel = (text, opts) => {
    const o = opts || {};
    const color = o.color || '#d8d2c4';
    const weight = o.weight || '700';
    const planeW = o.w || 0.4;
    // Canvas sized to the text; high-res for crisp lettering when zoomed
    const fontPx = 80;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.font = `${weight} ${fontPx}px "Helvetica Neue", Arial, sans-serif`;
    const metrics = ctx.measureText(text);
    const padX = 28, padY = 22;
    canvas.width = Math.ceil(metrics.width) + padX * 2;
    canvas.height = fontPx + padY * 2;
    // Redeclare font after resize (resizing clears context state)
    ctx.font = `${weight} ${fontPx}px "Helvetica Neue", Arial, sans-serif`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    if (o.letterSpacing) ctx.letterSpacing = o.letterSpacing;
    ctx.fillStyle = color;
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = maxAnisotropy;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    labelCache.push(tex);

    const mat = new THREE.MeshBasicMaterial({
      map: tex, transparent: true, depthWrite: false,
      side: THREE.DoubleSide, toneMapped: false,
      opacity: o.opacity != null ? o.opacity : 0.92,
    });
    const aspect = canvas.height / canvas.width;
    const plane = new THREE.PlaneGeometry(planeW, planeW * aspect);
    return new THREE.Mesh(plane, mat);
  };

  /* ════════════════════════════════════════════════════════════════════
     CAMERA BODY
     Coordinate system: lens points +Z (toward camera). Y up. X right.
     ════════════════════════════════════════════════════════════════════ */

  // Main chassis — proper rounded box for the body shell
  addPart(new THREE.Mesh(roundedBox(1.55, 1.05, 0.72, 0.08), matBody), {
    pos: [0, 0, -0.32],
    target: [0, 0, -0.7],
  });

  // Right-side grip (camera's right = image left). Rounded too for the
  // ergonomic bulge.
  addPart(new THREE.Mesh(roundedBox(0.28, 1.0, 0.62, 0.13), matRubber), {
    pos: [-0.82, -0.02, -0.28],
    target: [-2.8, 0.2, -0.6],
  });
  // Grip texture rings (3 horizontal lines)
  for (let i = 0; i < 3; i++) {
    addPart(new THREE.Mesh(box(0.23, 0.014, 0.58), matBodyDark), {
      pos: [-0.82, -0.25 + i * 0.18, -0.28],
      target: [-2.8, -0.05 + i * 0.18, -0.6],
    });
  }

  // EVF prism hump (top center) — small pyramid using small cylinder
  const evfGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.22, 4);
  evfGeo.rotateY(Math.PI / 4);
  addPart(new THREE.Mesh(evfGeo, matBody), {
    pos: [0, 0.65, -0.28],
    target: [0, 2.4, -0.5],
  });
  // EVF eyepiece (back side, small)
  addPart(new THREE.Mesh(cyl(0.08, 0.09, 0.05, 32), matBodyDark), {
    pos: [0, 0.62, -0.66],
    rot: [Math.PI/2, 0, 0],
    target: [0, 2.6, -1.4],
    targetRot: [0.6, 0, 0],
  });

  // Top plate
  addPart(new THREE.Mesh(roundedBox(1.55, 0.08, 0.72, 0.05), matBody), {
    pos: [0, 0.54, -0.32],
    target: [0, 1.8, -0.7],
  });

  // ── branding / engraved labels ──────────────────────────────────────
  // "EOS R6 Mark III" on the front body face, below the lens mount.
  // Travels with the main chassis (delta [0,0,-0.7]). z=0.12 clears the
  // bevelled front face (~0.09) so the print sits on the surface.
  addPart(makeLabel('EOS R6  Mark III', { color: '#d8d2c4', weight: '600', w: 0.48, letterSpacing: '2px' }), {
    pos: [0.16, -0.47, 0.12],
    target: [0, 0, -0.7],
  });

  // Hot shoe
  addPart(new THREE.Mesh(box(0.28, 0.04, 0.2), matBodyDark), {
    pos: [0, 0.58, -0.18],
    target: [0, 2.9, -0.2],
  });
  // Hot shoe contacts (3 tiny rectangles)
  for (let i = 0; i < 3; i++) {
    addPart(new THREE.Mesh(box(0.04, 0.005, 0.13), matOchre), {
      pos: [-0.06 + i * 0.06, 0.6, -0.18],
      target: [-0.1 + i * 0.06, 2.9, -0.2],
    });
  }

  // Mode dial (top left)
  const modeDialGroup = new THREE.Group();
  const modeBase = new THREE.Mesh(cyl(0.16, 0.165, 0.075, 32), matMetal);
  modeDialGroup.add(modeBase);
  // Tick marks around dial
  for (let i = 0; i < 12; i++) {
    const tick = new THREE.Mesh(box(0.006, 0.01, 0.018), matOchre);
    const a = (i / 12) * Math.PI * 2;
    tick.position.set(Math.cos(a) * 0.145, 0.04, Math.sin(a) * 0.145);
    modeDialGroup.add(tick);
  }
  modeDialGroup.position.set(-0.55, 0.6, -0.18);
  parts.push({
    mesh: modeDialGroup,
    rest: { position: { x: -0.55, y: 0.6, z: -0.18 }, rotation: { x: 0, y: 0, z: 0 } },
    target: { position: { x: -2.0, y: 2.6, z: -0.4 }, rotation: { x: 0.6, y: 0.4, z: 0.2 } },
    weight: 1,
  });
  group.add(modeDialGroup);

  // Top-plate LCD (right shoulder)
  addPart(new THREE.Mesh(box(0.32, 0.04, 0.14), matBodyDark), {
    pos: [0.45, 0.58, -0.32],
    target: [2.4, 2.2, -0.6],
  });
  // LCD screen surface (slightly raised)
  addPart(new THREE.Mesh(box(0.28, 0.012, 0.1), matOchre), {
    pos: [0.45, 0.605, -0.32],
    target: [2.4, 2.22, -0.6],
  });

  // Shutter button (top of grip, slightly angled)
  addPart(new THREE.Mesh(cyl(0.06, 0.055, 0.05, 24), matOchre), {
    pos: [0.62, 0.59, 0.0],
    rot: [0.18, 0, 0],
    target: [2.8, 2.2, 0.4],
    targetRot: [0.8, 0, 0],
  });

  // Front control dial (in front, top of grip)
  addPart(new THREE.Mesh(cyl(0.07, 0.08, 0.04, 32), matMetalLight), {
    pos: [0.62, 0.5, 0.12],
    rot: [Math.PI/2, 0, 0],
    target: [3.0, 1.5, 1.0],
    targetRot: [Math.PI/2 + 0.5, 0, 0],
  });

  // Power switch
  addPart(new THREE.Mesh(box(0.12, 0.03, 0.05), matBodyDark), {
    pos: [-0.58, 0.6, -0.04],
    target: [-2.2, 2.4, 0.1],
  });

  // Vari-angle back LCD — flat photo plane mounted just outside the body
  // back, with a thin bezel frame around it. Displays one of Alston's
  // photos as a texture so the LCD is showing a real frame, like a camera
  // mid-review. Moves with the body chassis during the explosion so the
  // photo stays attached to the camera and is always clearly outside the
  // body's silhouette (visible when the assembly rotates around to face
  // the camera at p≈0.73).
  {
    const texLoader = new THREE.TextureLoader();
    // Sakura After Dark — night cherry blossoms over a canal, glowing
    // pink. An archive-only frame (not on the home page), reads vividly on
    // the small LCD. Max anisotropy keeps it sharp at glancing angles.
    const photoTex = texLoader.load('images/Japan/IMG_6090.JPG');
    photoTex.colorSpace = THREE.SRGBColorSpace;
    photoTex.anisotropy = maxAnisotropy;
    photoTex.colorSpace = THREE.SRGBColorSpace;

    // MeshBasicMaterial bypasses lighting entirely — the photo appears
    // at its full texture brightness regardless of scene illumination,
    // which is what we want for the LCD (it's emitting its own light,
    // not being lit by the scene). DoubleSide so the photo renders
    // whichever side of the plane faces the camera through the rotation.
    const matScreen = new THREE.MeshBasicMaterial({
      map: photoTex,
      side: THREE.DoubleSide,
      toneMapped: false,
    });

    // Bezel — sits at z=-0.78 (0.10 outside body back face at z=-0.68)
    const bezel = new THREE.Mesh(roundedBox(0.96, 0.66, 0.06, 0.03), matBodyDark);
    addPart(bezel, {
      pos: [0, 0, -0.78],
      target: [0, 0, -0.7],   // same delta as body chassis
    });

    // LCD photo plane — ~3:2 aspect. Pushed further outside the bezel
    // so there's no z-fighting (the bezel is 0.06 deep; plane needs to
    // sit clearly beyond bezel's outer face).
    const lcd = new THREE.Mesh(
      new THREE.PlaneGeometry(0.92, 0.62),
      matScreen
    );
    addPart(lcd, {
      pos: [0, 0, -0.86],
      target: [0, 0, -0.7],
    });
  }

  // Multi-controller (joystick, back)
  addPart(new THREE.Mesh(cyl(0.05, 0.05, 0.06, 24), matMetal), {
    pos: [0.55, 0.05, -0.68],
    rot: [Math.PI/2, 0, 0],
    target: [2.5, -0.4, -2.6],
    targetRot: [Math.PI/2 + 0.3, 0, 0],
  });

  // Back buttons (rear grid of 6 small buttons)
  for (let i = 0; i < 6; i++) {
    const col = i % 2, row = Math.floor(i / 2);
    addPart(new THREE.Mesh(cyl(0.022, 0.022, 0.018, 16), matBodyDark), {
      pos: [0.5 + col * 0.07, -0.16 - row * 0.11, -0.68],
      rot: [Math.PI/2, 0, 0],
      target: [2.2 + col * 0.3, -0.6 - row * 0.3, -2.8],
      targetRot: [Math.PI/2, 0, 0],
    });
  }

  // Canon red dot (front, on grip)
  addPart(new THREE.Mesh(cyl(0.04, 0.04, 0.012, 24), matRed), {
    pos: [0.62, 0.2, 0.1],
    rot: [Math.PI/2, 0, 0],
    target: [2.4, 1.4, 1.0],
    targetRot: [Math.PI/2, 0, 0],
  });

  // AF assist (small lens on body front)
  addPart(new THREE.Mesh(cyl(0.04, 0.04, 0.01, 24), matBodyDark), {
    pos: [-0.42, 0.18, 0.1],
    rot: [Math.PI/2, 0, 0],
    target: [-1.8, 1.3, 0.6],
    targetRot: [Math.PI/2, 0, 0],
  });

  // Strap lugs (rings on top corners of body)
  for (let i = 0; i < 2; i++) {
    addPart(new THREE.Mesh(tor(0.045, 0.014, 8, 24), matMetalLight), {
      pos: [i === 0 ? -0.82 : 0.82, 0.46, -0.12],
      rot: [0, 0, Math.PI/2],
      target: [(i === 0 ? -3.0 : 3.0), 2.0, 0.4],
      targetRot: [0.5, 0.4, Math.PI/2 + 0.3],
    });
  }

  // Card door (right side of body — hinges open)
  addPart(new THREE.Mesh(box(0.06, 0.5, 0.32), matBody), {
    pos: [0.81, 0.0, -0.28],
    target: [1.8, -0.2, -1.4],
    targetRot: [0, -Math.PI/2.2, 0],
  });

  // Battery door (bottom)
  addPart(new THREE.Mesh(box(0.42, 0.06, 0.36), matBody), {
    pos: [-0.5, -0.55, -0.18],
    target: [-1.8, -2.2, -0.5],
  });

  /* ════════════════════════════════════════════════════════════════════
     LENS — RF 24-70mm f/2.8 L IS USM
     ════════════════════════════════════════════════════════════════════ */

  // Lens mount on body (RF mount with bayonet)
  addPart(new THREE.Mesh(tor(0.4, 0.045, 12, 48), matMetalLight), {
    pos: [0, 0, 0.05],
    target: [0, -0.4, 1.2],
  });
  // RF mount red index dot
  addPart(new THREE.Mesh(cyl(0.012, 0.012, 0.012, 16), matRed), {
    pos: [0, 0.42, 0.07],
    rot: [Math.PI/2, 0, 0],
    target: [0, 0.02, 1.25],
    targetRot: [Math.PI/2, 0, 0],
  });

  // Lens barrel body (chunky cylinder, 24-70 is a big lens)
  const barrelGeo = cyl(0.35, 0.38, 0.62, 64);
  const barrel = new THREE.Mesh(barrelGeo, matBody);
  barrel.rotation.x = Math.PI / 2;
  addPart(barrel, {
    pos: [0, 0, 0.5],
    rot: [Math.PI/2, 0, 0],
    target: [0, -1.2, 1.5],
    targetRot: [Math.PI/2 + 0.4, 0.3, 0],
  });
  // Lens spec engraving on top of the barrel (faces up, white). Travels
  // with the barrel's explosion delta so the print stays on the lens.
  addPart(makeLabel('RF 24-70mm  F2.8 L  IS USM', { color: '#eae4d6', weight: '600', w: 0.56, letterSpacing: '1px' }), {
    pos: [0, 0.40, 0.5],
    rot: [-Math.PI / 2, 0, 0],
    target: [0, -1.2, 1.5],
    targetRot: [0.4, 0.3, 0],
  });

  // Zoom ring (wide, with knurled texture — separate cylinder slightly larger)
  const zoomGeo = cyl(0.395, 0.395, 0.18, 64);
  addPart(new THREE.Mesh(zoomGeo, matBodyDark), {
    pos: [0, 0, 0.38],
    rot: [Math.PI/2, 0, 0],
    target: [0, -1.6, 1.0],
    targetRot: [Math.PI/2 + 0.5, 0.5, 0],
  });
  // Zoom ring knurl ridges (subtle pattern — 24 thin slats)
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    addPart(new THREE.Mesh(box(0.012, 0.16, 0.008), matMetal), {
      pos: [Math.cos(a) * 0.4, Math.sin(a) * 0.4, 0.38],
      rot: [0, 0, a],
      target: [Math.cos(a) * 0.6, Math.sin(a) * 0.6, 1.0],
      targetRot: [0, 0, a],
      weight: 0.6,
    });
  }

  // Focus ring (narrower, in front of zoom)
  addPart(new THREE.Mesh(cyl(0.39, 0.39, 0.1, 64), matBodyDark), {
    pos: [0, 0, 0.6],
    rot: [Math.PI/2, 0, 0],
    target: [0, -0.4, 2.4],
    targetRot: [Math.PI/2 + 0.3, 0.6, 0],
  });
  // Focus ring knurl ridges
  for (let i = 0; i < 32; i++) {
    const a = (i / 32) * Math.PI * 2;
    addPart(new THREE.Mesh(box(0.008, 0.09, 0.006), matMetal), {
      pos: [Math.cos(a) * 0.394, Math.sin(a) * 0.394, 0.6],
      rot: [0, 0, a],
      target: [Math.cos(a) * 0.5, Math.sin(a) * 0.5, 2.4],
      targetRot: [0, 0, a],
      weight: 0.5,
    });
  }

  // Control ring (back of lens, near mount)
  addPart(new THREE.Mesh(cyl(0.385, 0.385, 0.05, 64), matMetal), {
    pos: [0, 0, 0.22],
    rot: [Math.PI/2, 0, 0],
    target: [0, 0.4, 1.6],
    targetRot: [Math.PI/2, 0.3, 0],
  });

  // L-ring (red, signature L lens marker)
  addPart(new THREE.Mesh(tor(0.4, 0.014, 8, 64), matRed), {
    pos: [0, 0, 0.72],
    target: [0, 0.2, 3.2],
  });

  // Front element ring (filter thread housing)
  addPart(new THREE.Mesh(tor(0.36, 0.04, 12, 48), matBodyDark), {
    pos: [0, 0, 0.78],
    target: [0, 0.5, 3.6],
  });
  // Lens hood mount tabs (3 small bumps)
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    addPart(new THREE.Mesh(box(0.025, 0.025, 0.03), matMetal), {
      pos: [Math.cos(a) * 0.37, Math.sin(a) * 0.37, 0.8],
      target: [Math.cos(a) * 0.55, Math.sin(a) * 0.55 + 0.8, 4.0],
      weight: 0.7,
    });
  }

  // 7 lens glass elements — chain from rear to front
  // Each is a slightly differently sized disc with a metal rim
  const lensSpecs = [
    { rG: 0.20, rR: 0.22, depth: 0.16, mat: matGlass,     z: 0.10 },
    { rG: 0.22, rR: 0.24, depth: 0.20, mat: matGlassTint, z: 0.22 },
    { rG: 0.25, rR: 0.27, depth: 0.16, mat: matGlass,     z: 0.34 },
    { rG: 0.27, rR: 0.29, depth: 0.18, mat: matGlassTint, z: 0.46 },
    { rG: 0.29, rR: 0.31, depth: 0.20, mat: matGlass,     z: 0.56 },
    { rG: 0.31, rR: 0.33, depth: 0.16, mat: matGlassTint, z: 0.66 },
    { rG: 0.33, rR: 0.35, depth: 0.18, mat: matGlass,     z: 0.74 },
  ];
  lensSpecs.forEach((s, i) => {
    const el = lensElement(s.rG, s.rR, s.depth, s.mat);
    el.position.set(0, 0, s.z);
    // Target: chain forward AND fan slightly upward as they get rear
    const fwd = (lensSpecs.length - 1 - i) * 0.5;          // rear chains further back/up
    const yFan = ((lensSpecs.length - 1 - i) - 3) * 0.45;  // rear up, front down
    const tPos = { x: 0, y: yFan, z: s.z + fwd + 1.6 };
    parts.push({
      mesh: el,
      rest:   { position: { x: 0, y: 0, z: s.z }, rotation: { x: 0, y: 0, z: 0 } },
      target: { position: tPos, rotation: { x: 0, y: 0.1 * (i - 3), z: 0 } },
      weight: 1,
    });
    group.add(el);
  });

  // Aperture blades (9 thin triangles between elements 3-4)
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    const shape = new THREE.Shape();
    shape.moveTo(0, -0.02);
    shape.lineTo(0.18, 0.0);
    shape.lineTo(0, 0.02);
    shape.closePath();
    const blade = new THREE.Mesh(new THREE.ShapeGeometry(shape), matMetal);
    blade.position.set(Math.cos(a) * 0.04, Math.sin(a) * 0.04, 0.40);
    blade.rotation.z = a;
    addPart(blade, {
      pos: [Math.cos(a) * 0.04, Math.sin(a) * 0.04, 0.40],
      rot: [0, 0, a],
      target: [Math.cos(a) * 1.6, Math.sin(a) * 1.6, 2.0],
      targetRot: [0, 0, a + Math.PI/4],
      weight: 0.9,
    });
  }

  // Lens switches (AF/MF + IS on/off, on left side of lens)
  for (let i = 0; i < 2; i++) {
    addPart(new THREE.Mesh(box(0.035, 0.06, 0.025), matBodyDark), {
      pos: [-0.4, -0.05 + i * 0.13, 0.46],
      target: [-2.4, 0.5 + i * 0.2, 1.6],
      weight: 0.8,
    });
    // Switch nub
    addPart(new THREE.Mesh(box(0.018, 0.04, 0.012), matOchre), {
      pos: [-0.418, -0.05 + i * 0.13, 0.46],
      target: [-2.45, 0.5 + i * 0.2, 1.6],
      weight: 0.8,
    });
  }

  /* ════════════════════════════════════════════════════════════════════
     INTERNALS — revealed during explosion
     These start at zero scale-equivalent (clipped inside body) and fly
     out to meaningful positions when the assembly opens.
     ════════════════════════════════════════════════════════════════════ */

  // Full-frame CMOS sensor + IBIS frame — flies straight out the front
  const sensorGroup = new THREE.Group();
  const sensorPlate = new THREE.Mesh(box(0.38, 0.26, 0.02), matSensor);
  sensorGroup.add(sensorPlate);
  // IBIS suspension arms (4 corners)
  for (let i = 0; i < 4; i++) {
    const arm = new THREE.Mesh(cyl(0.008, 0.008, 0.12, 8), matMetalLight);
    const cx = (i % 2) ? 0.21 : -0.21;
    const cy = (i < 2) ? 0.15 : -0.15;
    arm.position.set(cx, cy, 0);
    arm.rotation.z = Math.atan2(cy, cx);
    sensorGroup.add(arm);
  }
  sensorGroup.position.set(0, 0, 0.03);
  parts.push({
    mesh: sensorGroup,
    rest:   { position: { x: 0, y: 0,    z: 0.03 }, rotation: { x: 0, y: 0, z: 0 } },
    target: { position: { x: 0, y: 0.2,  z: 3.4  }, rotation: { x: 0, y: 0.3, z: 0 } },
    weight: 1,
  });
  group.add(sensorGroup);

  // PCB (behind sensor)
  addPart(new THREE.Mesh(box(0.55, 0.42, 0.02), matPCB), {
    pos: [0, 0, -0.12],
    target: [0.8, -1.6, -2.0],
  });
  // DIGIC X processor chip (on PCB)
  addPart(new THREE.Mesh(box(0.14, 0.14, 0.035), matChip), {
    pos: [0.08, 0.05, -0.1],
    target: [1.2, -1.4, -2.0],
  });
  // Smaller chips on PCB
  for (let i = 0; i < 3; i++) {
    addPart(new THREE.Mesh(box(0.07, 0.05, 0.02), matChip), {
      pos: [-0.18 + i * 0.05, -0.12, -0.1],
      target: [-1.5 + i * 0.4, -1.8, -2.0],
      weight: 0.8,
    });
  }

  // Battery (LP-E6P) inside grip
  addPart(new THREE.Mesh(box(0.18, 0.42, 0.14), matBodyDark), {
    pos: [-0.82, -0.18, -0.32],
    target: [-3.2, -1.8, -1.2],
  });
  // Battery contacts (3 golden strips on top)
  for (let i = 0; i < 3; i++) {
    addPart(new THREE.Mesh(box(0.018, 0.012, 0.018), matOchre), {
      pos: [-0.86 + i * 0.04, 0.03, -0.32],
      target: [-3.3 + i * 0.05, -1.6, -1.2],
      weight: 0.9,
    });
  }

  // CFexpress card (top slot)
  addPart(new THREE.Mesh(box(0.14, 0.1, 0.015), matMetalLight), {
    pos: [0.78, 0.1, -0.32],
    target: [3.4, 1.4, -1.0],
  });
  // CFexpress label strip
  addPart(new THREE.Mesh(box(0.06, 0.025, 0.005), matOchre), {
    pos: [0.76, 0.115, -0.318],
    target: [3.38, 1.42, -0.99],
    weight: 0.95,
  });

  // SD card (bottom slot)
  addPart(new THREE.Mesh(box(0.12, 0.09, 0.012), matMetal), {
    pos: [0.78, -0.05, -0.32],
    target: [3.4, 0.6, -1.4],
  });

  // Random screw heads scattered around the body — mechanical detail
  // They fly out radially when exploded
  const screwPositions = [
    [-0.7, 0.42, -0.65], [0.7, 0.42, -0.65],
    [-0.7, -0.42, -0.65], [0.7, -0.42, -0.65],
    [-0.42, -0.55, -0.1], [0.42, -0.55, -0.1],
    [-0.55, 0.3, 0.05], [0.55, 0.3, 0.05],
  ];
  for (const sp of screwPositions) {
    addPart(new THREE.Mesh(cyl(0.016, 0.018, 0.012, 16), matMetalLight), {
      pos: sp,
      rot: [Math.PI/2, 0, 0],
      target: [sp[0] * 3, sp[1] * 3, sp[2] - 1.5],
      targetRot: [Math.PI/2 + 1, 0.5, 0],
      weight: 0.6,
    });
  }

  return { group, parts };
}

window.Camera3D = Camera3D;
