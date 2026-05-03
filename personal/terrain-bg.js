/* ═══════════════════════════════════════════════════════════════════════
   Animated 3D terrain wireframe background (Three.js)
   Ported from Portfolio v2 design bundle (terrain-bg.jsx)
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  const MOUNT_ID = 'terrain-bg';
  const ACCENT = '#cc785c';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = window.matchMedia('(max-width: 768px)').matches;

  if (reducedMotion || isMobile) return;

  function init() {
    const el = document.getElementById(MOUNT_ID);
    const THREE = window.THREE;
    if (!el || !THREE) return;

    let w = window.innerWidth;
    let h = window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 200);
    camera.position.set(0, 8, 18);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

    const threeColor = new THREE.Color(ACCENT);

    // Build terrain grid 80×80
    const cols = 80;
    const rows = 80;
    const spacing = 0.5;
    const geo = new THREE.BufferGeometry();
    const vertices = [];
    const indices = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        vertices.push((c - cols / 2) * spacing, 0, (r - rows / 2) * spacing);
      }
    }
    for (let r = 0; r < rows - 1; r++) {
      for (let c = 0; c < cols - 1; c++) {
        const i = r * cols + c;
        indices.push(i, i + 1, i + cols);
        indices.push(i + 1, i + cols + 1, i + cols);
      }
    }
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geo.setIndex(indices);

    // Primary wireframe layer
    const mat = new THREE.MeshBasicMaterial({
      color: threeColor,
      wireframe: true,
      transparent: true,
      opacity: 0.12,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -0.3;
    scene.add(mesh);

    // Dim secondary layer offset below
    const mat2 = new THREE.MeshBasicMaterial({
      color: threeColor,
      wireframe: true,
      transparent: true,
      opacity: 0.04,
    });
    const mesh2 = new THREE.Mesh(geo.clone(), mat2);
    mesh2.rotation.x = -0.3;
    mesh2.position.y = -2;
    scene.add(mesh2);

    // Scroll & mouse trackers
    let scrollY = 0;
    let mx = 0;
    let my = 0;
    const onScroll = () => { scrollY = window.scrollY; };
    const onMove = (e) => {
      mx = (e.clientX / window.innerWidth - 0.5) * 2;
      my = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('mousemove', onMove, { passive: true });

    const posAttr = geo.attributes.position;
    const posAttr2 = mesh2.geometry.attributes.position;
    let raf;

    const animate = () => {
      raf = requestAnimationFrame(animate);
      const t = performance.now() * 0.001;

      for (let i = 0; i < posAttr.count; i++) {
        const x = posAttr.getX(i);
        const z = posAttr.getZ(i);
        const wave1 = Math.sin(x * 0.3 + t * 0.6) * Math.cos(z * 0.2 + t * 0.4) * 1.2;
        const wave2 = Math.sin(x * 0.15 + z * 0.15 + t * 0.3) * 0.8;
        const ripple = Math.sin(Math.sqrt(x * x + z * z) * 0.4 - t * 0.8) * 0.5;
        posAttr.setY(i, wave1 + wave2 + ripple);
      }
      posAttr.needsUpdate = true;

      for (let i = 0; i < posAttr2.count; i++) {
        const x = posAttr2.getX(i);
        const z = posAttr2.getZ(i);
        posAttr2.setY(i, Math.sin(x * 0.2 + t * 0.3) * Math.cos(z * 0.25 + t * 0.2) * 1.5);
      }
      posAttr2.needsUpdate = true;

      const scrollFactor = scrollY * 0.003;
      camera.position.y = 8 - scrollFactor * 2 + my * 0.5;
      camera.position.x = mx * 1.5;
      camera.rotation.z = mx * 0.02;
      mesh.rotation.z = Math.sin(t * 0.1) * 0.05 + mx * 0.03;

      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // Pause when tab hidden — saves battery
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && raf) {
        cancelAnimationFrame(raf);
        raf = null;
      } else if (!document.hidden && !raf) {
        animate();
      }
    });
  }

  function loadThree() {
    if (window.THREE) { init(); return; }
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/three@0.160.0/build/three.min.js';
    script.onload = init;
    script.onerror = () => console.warn('Three.js failed to load — terrain background skipped');
    document.head.appendChild(script);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadThree);
  } else {
    loadThree();
  }
})();
