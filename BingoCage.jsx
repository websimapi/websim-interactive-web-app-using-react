import { jsxDEV } from "react/jsx-dev-runtime";
import React, { useRef, useEffect, useMemo } from "react";
import * as THREE from "three";
function mulberry32(a) {
  return function() {
    var t = a += 1831565813;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _v3 = new THREE.Vector3();
const _n = new THREE.Vector3();
function BingoCage({
  width = 560,
  height = 420,
  tappable = true,
  autoSpin = false,
  onSpinStart,
  onBallDraw,
  controlledSpin = null,
  // boolean or null
  drawnNumbers = null,
  // array of numbers that are currently drawn (external control)
  seed = null
  // random seed
}) {
  const mountRef = useRef(null);
  const rafRef = useRef(null);
  const TIME_STEP = 1 / 60;
  const SUB_STEPS = 3;
  const stateRef = useRef({
    scene: null,
    camera: null,
    renderer: null,
    cageGroup: null,
    wireGroup: null,
    balls: [],
    // { mesh, vel, number, drawn }
    spinning: false,
    rotationSpeed: 0,
    R: 120,
    acc: 0,
    rand: Math.random,
    spatialGrid: [],
    // 3D grid for collisions
    gridSize: 34
    // Cell size slightly larger than ball diameter (32)
  });
  const propsRef = useRef({ controlledSpin, drawnNumbers, autoSpin });
  useEffect(() => {
    propsRef.current = { controlledSpin, drawnNumbers, autoSpin };
  }, [controlledSpin, drawnNumbers, autoSpin]);
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const finalSeed = seed !== null ? seed : Math.floor(Math.random() * 1e5);
    const prng = mulberry32(finalSeed);
    const scene = new THREE.Scene();
    scene.background = null;
    const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 2e3);
    const cageY = 80;
    camera.position.set(0, cageY, 480);
    camera.lookAt(0, cageY, 0);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);
    const dir = new THREE.DirectionalLight(16777215, 1.2);
    dir.position.set(100, 300, 200);
    scene.add(dir);
    scene.add(new THREE.AmbientLight(16777215, 0.7));
    const cageGroup = new THREE.Group();
    cageGroup.position.y = cageY;
    scene.add(cageGroup);
    const wireGroup = new THREE.Group();
    cageGroup.add(wireGroup);
    const R = 120;
    const metalMat = new THREE.MeshStandardMaterial({
      color: 13421772,
      metalness: 0.8,
      roughness: 0.2,
      side: THREE.DoubleSide
    });
    const numHoops = 24;
    const hoopGeo = new THREE.TorusGeometry(R, 1.2, 5, 32);
    for (let i = 0; i < numHoops; i++) {
      const hoop = new THREE.Mesh(hoopGeo, metalMat);
      hoop.rotation.x = Math.PI * i / numHoops;
      wireGroup.add(hoop);
    }
    const numParallels = 10;
    for (let i = 1; i < numParallels; i++) {
      const theta = -Math.PI / 2 + Math.PI * i / numParallels;
      const rRing = R * Math.cos(theta);
      const xRing = R * Math.sin(theta);
      if (rRing > 10) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(rRing, 1.2, 5, 48), metalMat);
        ring.rotation.y = Math.PI / 2;
        ring.position.x = xRing;
        wireGroup.add(ring);
      }
    }
    const hubGeo = new THREE.CylinderGeometry(8, 8, 10, 16);
    const hubLeft = new THREE.Mesh(hubGeo, metalMat);
    hubLeft.rotation.z = Math.PI / 2;
    hubLeft.position.x = -R - 5;
    wireGroup.add(hubLeft);
    const hubRight = new THREE.Mesh(hubGeo, metalMat);
    hubRight.rotation.z = Math.PI / 2;
    hubRight.position.x = R + 5;
    wireGroup.add(hubRight);
    const hatchMesh = new THREE.Mesh(new THREE.BoxGeometry(70, 4, 40), new THREE.MeshStandardMaterial({ color: 13421772, metalness: 0.8, roughness: 0.3 }));
    hatchMesh.position.set(0, -R - 6, 0);
    cageGroup.add(hatchMesh);
    const balls = [];
    const BALL_RADIUS = 16;
    const ballGeom = new THREE.SphereGeometry(BALL_RADIUS, 16, 12);
    const ballBaseMat = new THREE.MeshStandardMaterial({ color: 16777215, metalness: 0, roughness: 0.4 });
    const groupColors = [16756141, 11392767, 16774573, 12124077, 14724607];
    const BALL_COUNT = 75;
    for (let i = 0; i < BALL_COUNT; i++) {
      const number = i + 1;
      const group = Math.floor((number - 1) / 15);
      const mat = ballBaseMat.clone();
      mat.color.setHex(groupColors[group % 5]);
      const m = new THREE.Mesh(ballGeom, mat);
      const radiusLimit = R - (BALL_RADIUS + 8);
      const theta = prng() * Math.PI * 2;
      const phi = Math.acos(2 * prng() - 1);
      const r = Math.pow(prng(), 1 / 3) * radiusLimit;
      const startPos = new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      );
      m.position.copy(startPos).add(new THREE.Vector3(0, cageY, 0));
      const label = number.toString();
      const canvas = document.createElement("canvas");
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(32, 32, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#" + new THREE.Color(groupColors[group % 5]).getHexString();
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.fillStyle = "#111";
      ctx.font = "bold 32px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, 32, 34);
      const tex = new THREE.CanvasTexture(canvas);
      const labelPlane = new THREE.Mesh(new THREE.PlaneGeometry(BALL_RADIUS * 1.6, BALL_RADIUS * 1.6), new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
      labelPlane.position.set(0, 0, BALL_RADIUS + 0.1);
      m.add(labelPlane);
      scene.add(m);
      balls.push({
        mesh: m,
        vel: new THREE.Vector3((prng() - 0.5) * 10, (prng() - 0.5) * 10, (prng() - 0.5) * 10),
        mass: 1,
        radius: BALL_RADIUS,
        labelPlane,
        number,
        drawn: false,
        sleeping: false
      });
    }
    const gridSize = 36;
    const gridDim = Math.ceil((R * 2 + 50) / gridSize);
    const spatialGrid = new Array(gridDim * gridDim * gridDim).fill(null);
    stateRef.current = {
      scene,
      camera,
      renderer,
      cageGroup,
      wireGroup,
      balls,
      spinning: propsRef.current.autoSpin,
      rotationSpeed: 0,
      R,
      acc: 0,
      rand: prng,
      spatialGrid,
      gridDim,
      gridSize,
      cageY
    };
    const GRAVITY = new THREE.Vector3(0, -2500, 0);
    const DAMPING = 0.99;
    const RESTITUTION = 0.8;
    const CAGE_RESTITUTION = 0.5;
    const FRICTION = 0.95;
    const updatePhysics = (dt) => {
      const s = stateRef.current;
      const pProps = propsRef.current;
      if (pProps.drawnNumbers) {
        for (let b of s.balls) {
          const isDrawn = pProps.drawnNumbers.includes(b.number);
          if (b.drawn !== isDrawn) {
            b.drawn = isDrawn;
            b.mesh.visible = !isDrawn;
            if (isDrawn) b.mesh.position.set(0, -9999, 0);
          }
        }
      }
      const isSpinning = pProps.controlledSpin !== null ? pProps.controlledSpin : s.spinning;
      if (isSpinning) {
        s.rotationSpeed = Math.min(6, s.rotationSpeed + dt * 4);
      } else {
        s.rotationSpeed = Math.max(0, s.rotationSpeed - dt * 2);
      }
      s.wireGroup.rotation.x += s.rotationSpeed * dt;
      const activeBalls = s.balls.filter((b) => !b.drawn);
      if (activeBalls.length === 0) return;
      for (let i = 0; i < s.spatialGrid.length; i++) s.spatialGrid[i] = null;
      const cagePos = s.cageGroup.position;
      const R_inner = s.R - (16 + 2);
      const R_sq = R_inner * R_inner;
      for (let b of activeBalls) {
        b.vel.addScaledVector(GRAVITY, dt);
        b.vel.multiplyScalar(DAMPING);
        b.mesh.position.addScaledVector(b.vel, dt);
        _v1.subVectors(b.mesh.position, cagePos);
        const dSq = _v1.lengthSq();
        if (dSq > R_sq) {
          const d = Math.sqrt(dSq);
          _n.copy(_v1).multiplyScalar(1 / d);
          const pen = d - R_inner;
          b.mesh.position.addScaledVector(_n, -pen);
          _v2.set(s.rotationSpeed, 0, 0).cross(_v1);
          _v3.subVectors(b.vel, _v2);
          const vDotN = _v3.dot(_n);
          if (vDotN > 0) {
            _v3.addScaledVector(_n, -(1 + CAGE_RESTITUTION) * vDotN);
            const vn = _n.clone().multiplyScalar(_v3.dot(_n));
            const vt = _v3.clone().sub(vn);
            vt.multiplyScalar(FRICTION);
            _v3.copy(vn).add(vt);
            b.vel.addVectors(_v3, _v2);
            if (s.rotationSpeed > 2) {
              b.vel.x += (s.rand() - 0.5) * 50;
              b.vel.y += (s.rand() - 0.5) * 50;
              b.vel.z += (s.rand() - 0.5) * 50;
            }
          }
        }
        const gx = Math.floor((b.mesh.position.x - cagePos.x + s.R + 25) / s.gridSize);
        const gy = Math.floor((b.mesh.position.y - cagePos.y + s.R + 25) / s.gridSize);
        const gz = Math.floor((b.mesh.position.z - cagePos.z + s.R + 25) / s.gridSize);
        const hash = gx + gy * s.gridDim + gz * s.gridDim * s.gridDim;
        if (hash >= 0 && hash < s.spatialGrid.length) {
          b.next = s.spatialGrid[hash];
          s.spatialGrid[hash] = b;
        }
      }
      const checkCell = (b1, cellIdx) => {
        let b2 = s.spatialGrid[cellIdx];
        while (b2) {
          if (b1 !== b2) {
            _v1.subVectors(b1.mesh.position, b2.mesh.position);
            const d2 = _v1.lengthSq();
            const rSum = 32;
            if (d2 < rSum * rSum && d2 > 1e-3) {
              const d = Math.sqrt(d2);
              _n.copy(_v1).multiplyScalar(1 / d);
              const pen = (rSum - d) * 0.5;
              b1.mesh.position.addScaledVector(_n, pen);
              b2.mesh.position.addScaledVector(_n, -pen);
              const vRel = _v2.subVectors(b1.vel, b2.vel);
              const vn = vRel.dot(_n);
              if (vn < 0) {
                const j = -(1 + RESTITUTION) * vn * 0.5;
                _v3.copy(_n).multiplyScalar(j);
                b1.vel.add(_v3);
                b2.vel.sub(_v3);
              }
            }
          }
          b2 = b2.next;
        }
      };
      for (let b of activeBalls) {
        const gx = Math.floor((b.mesh.position.x - cagePos.x + s.R + 25) / s.gridSize);
        const gy = Math.floor((b.mesh.position.y - cagePos.y + s.R + 25) / s.gridSize);
        const gz = Math.floor((b.mesh.position.z - cagePos.z + s.R + 25) / s.gridSize);
        for (let x = -1; x <= 1; x++) {
          for (let y = -1; y <= 1; y++) {
            for (let z = -1; z <= 1; z++) {
              const idx = gx + x + (gy + y) * s.gridDim + (gz + z) * s.gridDim * s.gridDim;
              if (idx >= 0 && idx < s.spatialGrid.length) {
                checkCell(b, idx);
              }
            }
          }
        }
      }
      for (let b of activeBalls) {
        if (b.vel.lengthSq() < 100) {
          b.vel.multiplyScalar(0.9);
        }
      }
    };
    let lastTime = performance.now();
    const animate = () => {
      const s = stateRef.current;
      if (!s) return;
      const now = performance.now();
      let frameTime = Math.min(0.1, (now - lastTime) / 1e3);
      lastTime = now;
      s.acc += frameTime;
      const step = TIME_STEP / SUB_STEPS;
      while (s.acc >= step) {
        updatePhysics(step);
        s.acc -= step;
      }
      for (let b of s.balls) {
        if (!b.drawn) b.labelPlane.lookAt(s.camera.position);
      }
      s.renderer.render(s.scene, s.camera);
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(rafRef.current);
      if (mount) mount.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [width, height, seed]);
  const handleTap = () => {
    const s = stateRef.current;
    if (!s || propsRef.current.controlledSpin !== null) return;
    if (onSpinStart) onSpinStart();
    s.spinning = true;
    s.balls.forEach((b) => {
      if (!b.drawn) {
        b.vel.add(new THREE.Vector3((s.rand() - 0.5) * 100, s.rand() * 100, (s.rand() - 0.5) * 100));
      }
    });
    setTimeout(() => {
      if (stateRef.current) stateRef.current.spinning = false;
    }, 2e3);
    const ii = setInterval(() => {
      if (!stateRef.current) {
        clearInterval(ii);
        return;
      }
      if (stateRef.current.rotationSpeed < 0.1 && !stateRef.current.spinning) {
        clearInterval(ii);
        const available = stateRef.current.balls.filter((b) => !b.drawn);
        if (available.length > 0) {
          const pick = available[Math.floor(stateRef.current.rand() * available.length)];
          pick.drawn = true;
          if (onBallDraw) onBallDraw(pick.number);
        }
      }
    }, 100);
  };
  return /* @__PURE__ */ jsxDEV(
    "div",
    {
      ref: mountRef,
      onClick: tappable ? handleTap : void 0,
      style: { width, height, cursor: tappable ? "pointer" : "default" }
    },
    void 0,
    false,
    {
      fileName: "<stdin>",
      lineNumber: 471,
      columnNumber: 5
    },
    this
  );
}
export {
  BingoCage as default
};
