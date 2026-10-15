/* ============================================================
   ROJGAR AI — 3D Particle Network Background (Three.js)
   Soft indigo dots + faint links over the lavender backdrop.
   ============================================================ */

(function () {
  "use strict";

  const canvas = document.getElementById("particle-canvas");
  if (!canvas || typeof THREE === "undefined") return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobile = window.matchMedia("(max-width: 768px)").matches;

  // ---- Config ------------------------------------------------
  const COUNT = isMobile ? 50 : 110;
  const LINK_DIST = 1.5;
  const SPEED = reducedMotion ? 0 : 0.004;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
  camera.position.z = 6.5;

  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: !isMobile,
    powerPreference: "high-performance",
  });
  renderer.setClearColor(0x000000, 0);

  let boundsX = 6;
  let boundsY = 3.5;

  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const dist = camera.position.z;
    const vFov = (camera.fov * Math.PI) / 180;
    boundsY = Math.tan(vFov / 2) * dist;
    boundsX = boundsY * camera.aspect;
  }
  resize();
  window.addEventListener("resize", resize);

  // ---- Data arrays -------------------------------------------
  const positions = new Float32Array(COUNT * 3);
  const velocities = new Float32Array(COUNT * 3);

  for (let i = 0; i < COUNT; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 2 * boundsX;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 2 * boundsY;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 2.5;
    velocities[i * 3] = (Math.random() - 0.5) * SPEED;
    velocities[i * 3 + 1] = (Math.random() - 0.5) * SPEED;
    velocities[i * 3 + 2] = (Math.random() - 0.5) * SPEED * 0.4;
  }

  // ---- Round sprite texture ----------------------------------
  function makeDotTexture() {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const ctx = c.getContext("2d");
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.35, "rgba(255,255,255,0.85)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }

  // ---- Points ------------------------------------------------
  const pointsGeo = new THREE.BufferGeometry();
  pointsGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const pointsMat = new THREE.PointsMaterial({
    color: 0x7c86d8,
    size: isMobile ? 0.08 : 0.065,
    map: makeDotTexture(),
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
    sizeAttenuation: true,
  });

  const points = new THREE.Points(pointsGeo, pointsMat);
  scene.add(points);

  // ---- Lines -------------------------------------------------
  const maxLinks = COUNT * 8;
  const linePositions = new Float32Array(maxLinks * 6);
  const lineColors = new Float32Array(maxLinks * 6);

  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));
  lineGeo.setAttribute("color", new THREE.BufferAttribute(lineColors, 3));

  const lineMat = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.28,
    depthWrite: false,
  });

  const lines = new THREE.LineSegments(lineGeo, lineMat);
  scene.add(lines);

  const cA = new THREE.Color(0x8b93d8);
  const cB = new THREE.Color(0x6d74c0);

  // ---- Animation loop ----------------------------------------
  const posAttr = pointsGeo.getAttribute("position");
  const lineAttr = lineGeo.getAttribute("position");
  const colAttr = lineGeo.getAttribute("color");

  let raf = null;

  function tick() {
    raf = requestAnimationFrame(tick);

    const arr = posAttr.array;

    for (let i = 0; i < COUNT; i++) {
      const ix = i * 3;
      arr[ix] += velocities[ix];
      arr[ix + 1] += velocities[ix + 1];
      arr[ix + 2] += velocities[ix + 2];

      if (arr[ix] > boundsX) arr[ix] = -boundsX;
      else if (arr[ix] < -boundsX) arr[ix] = boundsX;
      if (arr[ix + 1] > boundsY) arr[ix + 1] = -boundsY;
      else if (arr[ix + 1] < -boundsY) arr[ix + 1] = boundsY;
    }
    posAttr.needsUpdate = true;

    let li = 0;
    for (let i = 0; i < COUNT && li < maxLinks; i++) {
      const ax = arr[i * 3], ay = arr[i * 3 + 1], az = arr[i * 3 + 2];
      for (let j = i + 1; j < COUNT && li < maxLinks; j++) {
        const bx = arr[j * 3], by = arr[j * 3 + 1], bz = arr[j * 3 + 2];
        const dx = ax - bx, dy = ay - by, dz = az - bz;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < LINK_DIST) {
          const t = 1 - dist / LINK_DIST;
          const o = li * 6;
          linePositions[o] = ax;     linePositions[o + 1] = ay; linePositions[o + 2] = az;
          linePositions[o + 3] = bx; linePositions[o + 4] = by; linePositions[o + 5] = bz;
          const c1 = cA.clone().lerp(cB, t * 0.6);
          const c2 = cB.clone().lerp(cA, t * 0.6);
          lineColors[o] = c1.r * t;     lineColors[o + 1] = c1.g * t; lineColors[o + 2] = c1.b * t;
          lineColors[o + 3] = c2.r * t; lineColors[o + 4] = c2.g * t; lineColors[o + 5] = c2.b * t;
          li++;
        }
      }
    }
    for (let k = li * 6; k < maxLinks * 6; k++) {
      linePositions[k] = 0;
      lineColors[k] = 0;
    }
    lineAttr.needsUpdate = true;
    colAttr.needsUpdate = true;

    const t = performance.now() * 0.00006;
    points.rotation.y = Math.sin(t) * 0.06;
    lines.rotation.y = Math.sin(t) * 0.06;

    renderer.render(scene, camera);
  }

  tick();

  document.addEventListener("visibilitychange", function () {
    if (document.hidden && raf) {
      cancelAnimationFrame(raf);
      raf = null;
    } else if (!document.hidden && !raf) {
      tick();
    }
  });
})();
