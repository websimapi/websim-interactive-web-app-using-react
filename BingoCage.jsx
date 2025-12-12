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
  onFrameUpdate,
  replayData,
  controlledSpin = null,
  spinSchedule = [],
  drawnNumbers = null,
  seed = null,
  currentFrame = void 0
}) {
  const mountRef = useRef(null);
  const rafRef = useRef(null);
  const lastSimulatedFrame = useRef(-1);
  const FPS = 30;
  const TIME_STEP = 1 / FPS;
  const SUB_STEPS = 6;
  const STEP_DT = TIME_STEP / SUB_STEPS;
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
    spinning: false,
    waitingForDraw: false,
    // flag to trigger draw after spin
    rotationSpeed: 0,
    R: CAGE_RADIUS,
    rand: Math.random,
    cageY: CAGE_Y,
    frameIndex: 0,
    baseSeed: 0
  });
  const propsRef = useRef({ controlledSpin, drawnNumbers, autoSpin, spinSchedule, onSpinStart, onBallDraw, onFrameUpdate, replayData });
  useEffect(() => {
    propsRef.current = { controlledSpin, drawnNumbers, autoSpin, spinSchedule, onSpinStart, onBallDraw, onFrameUpdate, replayData };
  }, [controlledSpin, drawnNumbers, autoSpin, spinSchedule, onSpinStart, onBallDraw, onFrameUpdate, replayData]);
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const finalSeed = seed !== null ? seed : Math.floor(Math.random() * 1e5);
    const prng = mulberry32(finalSeed);
    const scene = new THREE.Scene();
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
      const initialPos = m.position.clone();
      const initialVel = new THREE.Vector3((prng() - 0.5) * 2, (prng() - 0.5) * 2, (prng() - 0.5) * 2);
      balls.push({
        mesh: m,
        pos: initialPos.clone(),
        vel: initialVel.clone(),
        initPos: initialPos.clone(),
        initVel: initialVel.clone(),
        mass: 1,
        radius: BALL_RADIUS,
        labelPlane,
        number,
        drawn: false,
        sleeping: false
      });
    }
    stateRef.current = {
      scene,
      camera,
      renderer,
      cageGroup,
      wireGroup,
      balls,
      spinning: propsRef.current.autoSpin,
      waitingForDraw: false,
      rotationSpeed: 0,
      R,
      acc: 0,
      baseSeed: finalSeed,
      rand: prng,
      cageY: CAGE_Y,
      frameIndex: 0
      // Explicitly start at 0
    };
    return () => {
      cancelAnimationFrame(rafRef.current);
      if (mount) mount.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [width, height, seed]);
  const runPhysicsFrame = (isSpinningInput, triggerKick) => {
    const s = stateRef.current;
    if (!s) return;
    const pProps = propsRef.current;
    if (triggerKick) {
      s.balls.forEach((b) => {
        if (!b.drawn) {
          b.vel.add(new THREE.Vector3((s.rand() - 0.5) * 300, s.rand() * 250 + 50, (s.rand() - 0.5) * 300));
          b.sleeping = false;
        }
      });
    }
    if (isSpinningInput) {
      s.rotationSpeed = Math.min(5.5, s.rotationSpeed + TIME_STEP * 4);
    } else {
      s.rotationSpeed = Math.max(0, s.rotationSpeed - TIME_STEP * 2);
    }
    if (s.waitingForDraw && !s.spinning && s.rotationSpeed < 0.2) {
      s.waitingForDraw = false;
      const available = s.balls.filter((b) => !b.drawn);
      if (available.length > 0) {
        const pick = available[Math.floor(s.rand() * available.length)];
        if (pProps.onBallDraw) {
          pProps.onBallDraw(pick.number, s.frameIndex);
        }
      }
    }
    for (let step = 0; step < SUB_STEPS; step++) {
      performSubStep(STEP_DT, s, pProps);
    }
    s.frameIndex++;
  };
  const performSubStep = (dt, s, pProps) => {
    const CAGE_RADIUS2 = s.R;
    const BALL_RADIUS2 = 22;
    const RESTITUTION = 0.5;
    const FRICTION = 0.96;
    const GRAVITY = new THREE.Vector3(0, -980, 0);
    s.wireGroup.rotation.x += s.rotationSpeed * dt;
    const cagePos = s.cageGroup.position;
    const R_inner = CAGE_RADIUS2 - (BALL_RADIUS2 + 2);
    const R_sq = R_inner * R_inner;
    const angularVel = new THREE.Vector3(s.rotationSpeed, 0, 0);
    for (const b of s.balls) {
      if (pProps.drawnNumbers && pProps.drawnNumbers.includes(b.number)) {
        b.drawn = true;
        b.sleeping = true;
        b.pos.set(0, -99999, 0);
        b.vel.set(0, 0, 0);
        continue;
      }
      if (b.sleeping && s.rotationSpeed > 0.5) b.sleeping = false;
      if (b.sleeping) continue;
      b.vel.addScaledVector(GRAVITY, dt);
      if (s.rotationSpeed > 0) {
        _v1.subVectors(b.pos, cagePos);
        const tangential = _v2.copy(angularVel).cross(_v1);
        b.vel.addScaledVector(tangential, dt * 1);
      }
      b.vel.multiplyScalar(0.999);
      b.pos.addScaledVector(b.vel, dt);
      _v1.subVectors(b.pos, cagePos);
      const distSq = _v1.lengthSq();
      if (distSq > R_sq) {
        const dist = Math.sqrt(distSq);
        _n.copy(_v1).multiplyScalar(1 / dist);
        b.pos.copy(cagePos).addScaledVector(_n, R_inner);
        const wallVel = _v2.copy(angularVel).cross(_v1);
        const relVel = _v3.subVectors(b.vel, wallVel);
        const vDotN = relVel.dot(_n);
        if (vDotN > 0) {
          relVel.addScaledVector(_n, -(1 + 0.4) * vDotN);
          _v4.copy(_n).multiplyScalar(relVel.dot(_n));
          const tangentV = relVel.clone().sub(_v4);
          tangentV.multiplyScalar(FRICTION);
          relVel.copy(tangentV).add(_v4);
          b.vel.addVectors(relVel, wallVel);
          if (s.rotationSpeed > 1) {
            b.vel.add(new THREE.Vector3((s.rand() - 0.5) * 50, (s.rand() - 0.5) * 50, (s.rand() - 0.5) * 50));
          }
        }
      }
    }
    const nBalls = s.balls.length;
    for (let iter = 0; iter < 3; iter++) {
      for (let i = 0; i < nBalls; i++) {
        const bi = s.balls[i];
        if (bi.drawn || bi.sleeping) continue;
        for (let j = i + 1; j < nBalls; j++) {
          const bj = s.balls[j];
          if (bj.drawn || bj.sleeping) continue;
          _v1.subVectors(bi.pos, bj.pos);
          const d2 = _v1.lengthSq();
          const rSum = BALL_RADIUS2 * 2;
          if (d2 < rSum * rSum && d2 > 1e-4) {
            const d = Math.sqrt(d2);
            _n.copy(_v1).multiplyScalar(1 / d);
            const overlap = rSum - d;
            const shift = _n.clone().multiplyScalar(overlap * 0.5);
            bi.pos.add(shift);
            bj.pos.sub(shift);
            const relVel = _v2.subVectors(bi.vel, bj.vel);
            const vn = relVel.dot(_n);
            if (vn < 0) {
              const jImpulse = -(1 + RESTITUTION) * vn * 0.5;
              _v3.copy(_n).multiplyScalar(jImpulse);
              bi.vel.add(_v3);
              bj.vel.sub(_v3);
            }
          }
        }
      }
    }
    if (s.rotationSpeed < 0.05) {
      for (const b of s.balls) {
        if (b.drawn) continue;
        const speedSq = b.vel.lengthSq();
        if (speedSq < 50) {
          b.vel.multiplyScalar(0.5);
        }
        if (speedSq < 5) {
          b.vel.set(0, 0, 0);
          b.sleeping = true;
        }
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
      const targetFrame = Math.max(0, Math.floor(currentFrame));
      const s = stateRef.current;
      const pProps = propsRef.current;
      if (pProps.replayData) {
        const rd = pProps.replayData;
        const frameData = rd[targetFrame];
        const data = frameData || rd[targetFrame - 1] || rd[targetFrame + 1];
        if (data) {
          s.wireGroup.rotation.x = data[0];
          s.cageGroup.position.y = s.cageY;
          let idx = 1;
          for (let i = 0; i < s.balls.length; i++) {
            const b = s.balls[i];
            if (idx + 2 < data.length) {
              b.pos.set(data[idx], data[idx + 1], data[idx + 2]);
              idx += 3;
            }
            b.drawn = b.pos.y < -500;
          }
          syncMeshes();
          s.renderer.render(s.scene, s.camera);
          return;
        }
      }
      if (targetFrame < lastSimulatedFrame.current || targetFrame > lastSimulatedFrame.current + 300) {
        s.spinning = false;
        s.rotationSpeed = 0;
        s.wireGroup.rotation.set(0, 0, 0);
        s.frameIndex = 0;
        s.rand = mulberry32(s.baseSeed);
        for (const b of s.balls) {
          b.drawn = false;
          b.sleeping = false;
          b.pos.copy(b.initPos);
          b.vel.copy(b.initVel);
        }
        lastSimulatedFrame.current = 0;
      }
      let steps = targetFrame - lastSimulatedFrame.current;
      if (steps > 500) steps = 500;
      const schedule = pProps.spinSchedule || [];
      for (let i = 0; i < steps; i++) {
        const simFrame = lastSimulatedFrame.current + i;
        const activeWindow = schedule.find((w) => simFrame >= w.startFrame && simFrame < w.endFrame);
        const isSpinning = !!activeWindow;
        const triggerKick = activeWindow && simFrame === activeWindow.startFrame;
        runPhysicsFrame(isSpinning, triggerKick);
      }
      lastSimulatedFrame.current = targetFrame;
      syncMeshes();
      s.renderer.render(s.scene, s.camera);
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
          const isSpinning = s.spinning;
          runPhysicsFrame(isSpinning, false);
          s.acc -= TIME_STEP;
        }
        if (propsRef.current.onFrameUpdate) {
          const data = [parseFloat(s.wireGroup.rotation.x.toFixed(3))];
          for (let i = 0; i < s.balls.length; i++) {
            const b = s.balls[i];
            data.push(
              parseFloat(b.pos.x.toFixed(2)),
              parseFloat(b.pos.y.toFixed(2)),
              parseFloat(b.pos.z.toFixed(2))
            );
          }
          propsRef.current.onFrameUpdate(s.frameIndex, data);
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
    const p = propsRef.current;
    if (!s || p.controlledSpin !== null) return;
    if (s.spinning) return;
    const currentSimFrame = s.frameIndex;
    if (p.onSpinStart) {
      p.onSpinStart(Math.floor(currentSimFrame));
    }
    s.spinning = true;
    s.waitingForDraw = true;
    s.balls.forEach((b) => {
      if (!b.drawn) {
        b.vel.add(new THREE.Vector3((s.rand() - 0.5) * 250, s.rand() * 200 + 50, (s.rand() - 0.5) * 250));
        b.sleeping = false;
      }
    });
    setTimeout(() => {
      if (stateRef.current) stateRef.current.spinning = false;
    }, 2e3);
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
      lineNumber: 570,
      columnNumber: 5
    },
    this
  );
}
export {
  BingoCage as default
};
