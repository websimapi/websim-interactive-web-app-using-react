import { jsxDEV } from "react/jsx-dev-runtime";
import React, { useRef, useEffect } from "react";
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
const _v4 = new THREE.Vector3();
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
  seed = null,
  // random seed
  currentFrame = void 0
  // Remotion frame
}) {
  const mountRef = useRef(null);
  const rafRef = useRef(null);
  const lastSimulatedFrame = useRef(-1);
  const TIME_STEP = 1 / 30;
  const SUB_STEPS = 1;
  const CAGE_RADIUS = 160;
  const BALL_RADIUS = 22;
  const CAGE_Y = 100;
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
    R: CAGE_RADIUS,
    rand: Math.random,
    spatialGrid: [],
    gridSize: BALL_RADIUS * 2 + 2,
    cageY: CAGE_Y
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
    camera.position.set(0, CAGE_Y, 580);
    camera.lookAt(0, CAGE_Y, 0);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);
    const dir = new THREE.DirectionalLight(16777215, 1.2);
    dir.position.set(100, 300, 200);
    scene.add(dir);
    scene.add(new THREE.AmbientLight(16777215, 0.7));
    const cageGroup = new THREE.Group();
    cageGroup.position.y = CAGE_Y;
    scene.add(cageGroup);
    const wireGroup = new THREE.Group();
    cageGroup.add(wireGroup);
    const R = CAGE_RADIUS;
    const metalMat = new THREE.MeshStandardMaterial({
      color: 13421772,
      metalness: 0.8,
      roughness: 0.2,
      side: THREE.DoubleSide
    });
    const numHoops = 24;
    const hoopGeo = new THREE.TorusGeometry(R, 1.5, 5, 32);
    for (let i = 0; i < numHoops; i++) {
      const hoop = new THREE.Mesh(hoopGeo, metalMat);
      hoop.rotation.x = Math.PI * i / numHoops;
      wireGroup.add(hoop);
    }
    const numParallels = 12;
    for (let i = 1; i < numParallels; i++) {
      const theta = -Math.PI / 2 + Math.PI * i / numParallels;
      const rRing = R * Math.cos(theta);
      const xRing = R * Math.sin(theta);
      if (rRing > 10) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(rRing, 1.5, 5, 48), metalMat);
        ring.rotation.y = Math.PI / 2;
        ring.position.x = xRing;
        wireGroup.add(ring);
      }
    }
    const hubGeo = new THREE.CylinderGeometry(10, 10, 12, 16);
    const hubLeft = new THREE.Mesh(hubGeo, metalMat);
    hubLeft.rotation.z = Math.PI / 2;
    hubLeft.position.x = -R - 5;
    wireGroup.add(hubLeft);
    const hubRight = new THREE.Mesh(hubGeo, metalMat);
    hubRight.rotation.z = Math.PI / 2;
    hubRight.position.x = R + 5;
    wireGroup.add(hubRight);
    const hatchMesh = new THREE.Mesh(new THREE.BoxGeometry(90, 5, 50), new THREE.MeshStandardMaterial({ color: 13421772, metalness: 0.8, roughness: 0.3 }));
    hatchMesh.position.set(0, -R - 8, 0);
    cageGroup.add(hatchMesh);
    const balls = [];
    const ballGeom = new THREE.IcosahedronGeometry(BALL_RADIUS, 1);
    const ballBaseMat = new THREE.MeshStandardMaterial({ color: 16777215, metalness: 0, roughness: 0.4 });
    const groupColors = [16756141, 11392767, 16774573, 12124077, 14724607];
    const BALL_COUNT = 75;
    for (let i = 0; i < BALL_COUNT; i++) {
      const number = i + 1;
      const group = Math.floor((number - 1) / 15);
      const mat = ballBaseMat.clone();
      mat.color.setHex(groupColors[group % 5]);
      const m = new THREE.Mesh(ballGeom, mat);
      const radiusLimit = R - (BALL_RADIUS + 10);
      const theta = prng() * Math.PI * 2;
      const phi = Math.acos(2 * prng() - 1);
      const r = Math.pow(prng(), 1 / 3) * radiusLimit;
      const startPos = new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      );
      m.position.copy(startPos).add(new THREE.Vector3(0, CAGE_Y, 0));
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
      ctx.font = "bold 34px Arial";
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
        // Separate physics state
        pos: m.position.clone(),
        vel: new THREE.Vector3((prng() - 0.5) * 10, (prng() - 0.5) * 10, (prng() - 0.5) * 10),
        mass: 1,
        radius: BALL_RADIUS,
        labelPlane,
        number,
        drawn: false,
        sleeping: false
      });
    }
    const gridSize = BALL_RADIUS * 2 + 4;
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
      cageY: CAGE_Y
    };
    return () => {
      cancelAnimationFrame(rafRef.current);
      if (mount) mount.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [width, height, seed]);
  const runPhysicsStep = (dt) => {
    const s = stateRef.current;
    if (!s) return;
    const pProps = propsRef.current;
    const CAGE_RADIUS2 = s.R;
    const BALL_RADIUS2 = 22;
    const RESTITUTION = 0.6;
    const CAGE_RESTITUTION = 0.4;
    const FRICTION = 0.92;
    const GRAVITY = new THREE.Vector3(0, -2500, 0);
    const isSpinning = pProps.controlledSpin !== null ? pProps.controlledSpin : s.spinning;
    if (isSpinning) {
      s.rotationSpeed = Math.min(6, s.rotationSpeed + dt * 4);
    } else {
      s.rotationSpeed = Math.max(0, s.rotationSpeed - dt * 2);
    }
    s.wireGroup.rotation.x += s.rotationSpeed * dt;
    const activeBalls = s.balls;
    const cagePos = s.cageGroup.position;
    const R_inner = CAGE_RADIUS2 - (BALL_RADIUS2 + 2);
    const R_sq = R_inner * R_inner;
    for (let i = 0; i < s.spatialGrid.length; i++) s.spatialGrid[i] = null;
    for (let b of activeBalls) {
      if (pProps.drawnNumbers && pProps.drawnNumbers.includes(b.number)) {
        b.drawn = true;
        b.pos.set(0, -99999, 0);
        continue;
      }
      b.vel.addScaledVector(GRAVITY, dt);
      b.vel.multiplyScalar(0.995);
      b.pos.addScaledVector(b.vel, dt);
      _v1.subVectors(b.pos, cagePos);
      const dSq = _v1.lengthSq();
      if (dSq > R_sq) {
        const d = Math.sqrt(dSq);
        _n.copy(_v1).multiplyScalar(1 / d);
        const pen = d - R_inner;
        b.pos.addScaledVector(_n, -pen);
        _v2.set(s.rotationSpeed, 0, 0).cross(_v1);
        _v3.subVectors(b.vel, _v2);
        const vDotN = _v3.dot(_n);
        if (vDotN > 0) {
          _v3.addScaledVector(_n, -(1 + CAGE_RESTITUTION) * vDotN);
          _v4.copy(_n).multiplyScalar(_v3.dot(_n));
          _v3.sub(_v4).multiplyScalar(FRICTION).add(_v4);
          b.vel.addVectors(_v3, _v2);
          if (s.rotationSpeed > 2) {
            b.vel.x += (s.rand() - 0.5) * 60;
            b.vel.y += (s.rand() - 0.5) * 60;
            b.vel.z += (s.rand() - 0.5) * 60;
          }
        }
      }
      const gx = Math.floor((b.pos.x - cagePos.x + CAGE_RADIUS2 + 25) / s.gridSize);
      const gy = Math.floor((b.pos.y - cagePos.y + CAGE_RADIUS2 + 25) / s.gridSize);
      const gz = Math.floor((b.pos.z - cagePos.z + CAGE_RADIUS2 + 25) / s.gridSize);
      const hash = gx + gy * s.gridDim + gz * s.gridDim * s.gridDim;
      if (hash >= 0 && hash < s.spatialGrid.length) {
        b.next = s.spatialGrid[hash];
        s.spatialGrid[hash] = b;
      }
    }
    for (let b1 of activeBalls) {
      if (b1.drawn) continue;
      const gx = Math.floor((b1.pos.x - cagePos.x + CAGE_RADIUS2 + 25) / s.gridSize);
      const gy = Math.floor((b1.pos.y - cagePos.y + CAGE_RADIUS2 + 25) / s.gridSize);
      const gz = Math.floor((b1.pos.z - cagePos.z + CAGE_RADIUS2 + 25) / s.gridSize);
      for (let x = -1; x <= 1; x++) {
        for (let y = -1; y <= 1; y++) {
          for (let z = -1; z <= 1; z++) {
            const idx = gx + x + (gy + y) * s.gridDim + (gz + z) * s.gridDim * s.gridDim;
            if (idx >= 0 && idx < s.spatialGrid.length) {
              let b2 = s.spatialGrid[idx];
              while (b2) {
                if (b1 !== b2 && !b2.drawn && b1.number < b2.number) {
                  _v1.subVectors(b1.pos, b2.pos);
                  const d2 = _v1.lengthSq();
                  const rSum = BALL_RADIUS2 * 2;
                  if (d2 < rSum * rSum && d2 > 1e-3) {
                    const d = Math.sqrt(d2);
                    _n.copy(_v1).multiplyScalar(1 / d);
                    const pen = (rSum - d) * 0.5;
                    b1.pos.addScaledVector(_n, pen);
                    b2.pos.addScaledVector(_n, -pen);
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
            }
          }
        }
      }
    }
    for (let b of activeBalls) {
      if (!b.drawn && b.vel.lengthSq() < 50 && s.rotationSpeed < 0.1) {
        b.vel.multiplyScalar(0.8);
      }
    }
  };
  const syncMeshes = () => {
    const s = stateRef.current;
    if (!s) return;
    for (let b of s.balls) {
      b.mesh.position.copy(b.pos);
      b.mesh.visible = !b.drawn;
      if (!b.drawn) b.labelPlane.lookAt(s.camera.position);
    }
  };
  useEffect(() => {
    if (!stateRef.current) return;
    if (currentFrame !== void 0) {
      const targetFrame = currentFrame;
      const startFrame = lastSimulatedFrame.current + 1;
      const count = targetFrame - lastSimulatedFrame.current;
      if (count > 0) {
        for (let i = 0; i < count; i++) {
          runPhysicsStep(TIME_STEP);
        }
        lastSimulatedFrame.current = targetFrame;
        syncMeshes();
        stateRef.current.renderer.render(stateRef.current.scene, stateRef.current.camera);
      }
    } else {
      let lastTime = performance.now();
      const animate = () => {
        const s = stateRef.current;
        if (!s) return;
        const now = performance.now();
        let dt = Math.min(0.1, (now - lastTime) / 1e3);
        lastTime = now;
        s.acc += dt;
        while (s.acc >= TIME_STEP) {
          runPhysicsStep(TIME_STEP);
          s.acc -= TIME_STEP;
        }
        syncMeshes();
        s.renderer.render(s.scene, s.camera);
        rafRef.current = requestAnimationFrame(animate);
      };
      rafRef.current = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(rafRef.current);
    }
  }, [currentFrame]);
  const handleTap = () => {
    const s = stateRef.current;
    if (!s || propsRef.current.controlledSpin !== null) return;
    if (onSpinStart) onSpinStart();
    s.spinning = true;
    s.balls.forEach((b) => {
      if (!b.drawn) {
        b.vel.add(new THREE.Vector3((s.rand() - 0.5) * 200, s.rand() * 200, (s.rand() - 0.5) * 200));
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
      lineNumber: 460,
      columnNumber: 5
    },
    this
  );
}
export {
  BingoCage as default
};
