// The centerpiece: a scroll-driven exploded view of the ClearNote stack.
// This module is lazy-loaded (see main.js) so Three.js never touches the
// initial page load.
//
// ── Dropping in the real model ───────────────────────────────────────────
// 1. Convert the STL/CAD export to glTF/GLB (Blender: import → export .glb).
// 2. Put it at  public/models/clearnote.glb
// 3. Set  MODEL_URL = './models/clearnote.glb'  below.
// Top-level children of the GLB explode radially from the assembly center.
// If a child's name matches a data-callout key (panel / board / battery /
// back), that callout anchors to it; unmatched callouts stay hidden.
// ─────────────────────────────────────────────────────────────────────────

import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const MODEL_URL = null;

// The five palette colors — the model is a design element, not a fake
// photograph, so it renders in the site's own ink.
const P = {
  lightest: 0xf3f2fd,
  light: 0xe6e4fb,
  mid: 0xceccf8,
  accent: 0xafafe7,
  ink: 0x130f34,
};

const CALLOUTS = [
  { key: 'panel',   range: [0.30, 0.52] },
  { key: 'board',   range: [0.44, 0.68] },
  { key: 'battery', range: [0.56, 0.80] },
  { key: 'back',    range: [0.70, 0.96] },
];

const smooth = (t) => {
  const x = Math.min(Math.max(t, 0), 1);
  return x * x * (3 - 2 * x);
};
const lerp = (a, b, t) => a + (b - a) * t;

export async function initViewer({ stage, canvas, fallback, reduced }) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  } catch (err) {
    canvas.hidden = true;
    fallback.hidden = false;
    stage.style.height = '70svh';
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Static mode = a considered still image instead of a scroll performance:
  // reduced-motion visitors and low-power devices both get it.
  const lowPower = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2;
  const staticMode = reduced || lowPower;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 60);
  // Aim at the center of the exploded stack, not the assembled device, so
  // the composition stays balanced through the whole scrub.
  const target = new THREE.Vector3(0, 0.45, 0);

  const hemi = new THREE.HemisphereLight(P.lightest, P.ink, 0.9);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(0xffffff, 1.3);
  key.position.set(4, 6, 3);
  scene.add(key);
  const rim = new THREE.DirectionalLight(P.accent, 0.7);
  rim.position.set(-5, 2, -4);
  scene.add(rim);

  const assembly = new THREE.Group();
  scene.add(assembly);

  // parts: [{ object, basePos, explodeOffset }]
  const parts = [];
  // anchors: key → Object3D parented to a part, for callout projection
  const anchors = {};

  const mat = (color, opts = {}) =>
    new THREE.MeshStandardMaterial({ color, roughness: 0.45, metalness: 0.1, ...opts });

  function addPart(object, explodeOffset) {
    object.userData.basePos = object.position.clone();
    object.userData.explode = explodeOffset;
    assembly.add(object);
    parts.push(object);
    return object;
  }

  function addAnchor(key, part, x, y, z) {
    const a = new THREE.Object3D();
    a.position.set(x, y, z);
    part.add(a);
    anchors[key] = a;
  }

  function buildProceduralAssembly() {
    // The ClearNote stack, screen-up: back shell → battery → rigid-flex
    // board → E-Ink panel → bezel. Placeholder geometry until the real
    // CAD lands (see MODEL_URL note at the top).

    // ── back shell ──
    const back = new THREE.Mesh(
      new THREE.BoxGeometry(4.6, 0.16, 3.3),
      mat(P.mid, { roughness: 0.55 })
    );
    back.position.set(0, 0, 0);
    addPart(back, new THREE.Vector3(0, -0.85, 0));
    addAnchor('back', back, 1.5, 0, 0.9);

    // ── battery ──
    const battery = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 0.14, 1.9),
      mat(P.light, { metalness: 0.25, roughness: 0.4 })
    );
    battery.position.set(-0.9, 0.18, 0);
    addPart(battery, new THREE.Vector3(0, -0.35, 0));
    addAnchor('battery', battery, 1.3, 0.05, 0.5);

    // ── rigid-flex board with the ESP32-S3 ──
    const pcb = new THREE.Group();
    const board = new THREE.Mesh(new THREE.BoxGeometry(4.3, 0.07, 2.95), mat(P.ink, { roughness: 0.6 }));
    pcb.add(board);
    const esp = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.1, 0.5), mat(P.ink, { roughness: 0.3 }));
    esp.position.set(1.2, 0.08, -0.75);
    pcb.add(esp);
    const sd = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.11, 0.4), mat(P.light, { metalness: 0.4, roughness: 0.35 }));
    sd.position.set(1.6, 0.08, 0.65);
    pcb.add(sd);
    const usb = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.1, 0.28), mat(P.light, { metalness: 0.5, roughness: 0.3 }));
    usb.position.set(-2.0, 0.08, 0);
    pcb.add(usb);
    for (let i = 0; i < 4; i++) {
      const cap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 0.12, 16),
        mat(P.mid, { metalness: 0.4, roughness: 0.35 })
      );
      cap.position.set(0.2 + (i % 2) * 0.24, 0.09, -0.9 + Math.floor(i / 2) * 0.3);
      pcb.add(cap);
    }
    pcb.position.set(0, 0.32, 0);
    addPart(pcb, new THREE.Vector3(0, 0.12, 0));
    addAnchor('board', pcb, 1.45, 0.1, -0.75);

    // ── E-Ink panel: ink frame, paper-white active area ──
    const panel = new THREE.Group();
    const panelBase = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.07, 3.1), mat(P.ink, { roughness: 0.5 }));
    panel.add(panelBase);
    const screen = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.02, 2.7), mat(P.lightest, { roughness: 0.95, metalness: 0 }));
    screen.position.set(0, 0.045, 0);
    panel.add(screen);
    panel.position.set(0, 0.52, 0);
    addPart(panel, new THREE.Vector3(0, 0.6, 0));
    addAnchor('panel', panel, 1.55, 0.06, 0.95);

    // ── bezel frame ──
    const bezel = new THREE.Group();
    const bezelMat = mat(P.mid, { roughness: 0.5 });
    const mkBar = (w, d, x, z) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.09, d), bezelMat);
      m.position.set(x, 0, z);
      bezel.add(m);
    };
    mkBar(4.6, 0.18, 0, 1.56);
    mkBar(4.6, 0.18, 0, -1.56);
    mkBar(0.18, 2.94, 2.21, 0);
    mkBar(0.18, 2.94, -2.21, 0);
    bezel.position.set(0, 0.66, 0);
    addPart(bezel, new THREE.Vector3(0, 1.15, 0));
  }

  async function buildFromGLB(url) {
    const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
    const gltf = await new GLTFLoader().loadAsync(url);
    const root = gltf.scene;

    // Normalize scale/position so any model fits the stage.
    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const scale = 3.4 / Math.max(size.x, size.y, size.z);
    root.scale.setScalar(scale);
    root.position.sub(center.multiplyScalar(scale));
    assembly.add(root);

    // Top-level children explode away from the assembly center.
    root.children.forEach((child) => {
      const cBox = new THREE.Box3().setFromObject(child);
      const cCenter = cBox.getCenter(new THREE.Vector3());
      const dir = cCenter.lengthSq() > 1e-6
        ? cCenter.normalize()
        : new THREE.Vector3(0, 1, 0);
      child.userData.basePos = child.position.clone();
      child.userData.explode = dir.multiplyScalar(1.1);
      parts.push(child);
      const match = CALLOUTS.find((c) => child.name.toLowerCase().includes(c.key));
      if (match) addAnchor(match.key, child, 0.3, 0.15, 0.3);
    });
  }

  if (MODEL_URL) {
    try {
      await buildFromGLB(MODEL_URL);
    } catch (err) {
      console.warn('[viewer] GLB failed to load, using procedural assembly:', err);
      buildProceduralAssembly();
    }
  } else {
    buildProceduralAssembly();
  }

  // Callout DOM elements, matched to anchors.
  const calloutEls = CALLOUTS.map((c) => ({
    ...c,
    el: stage.querySelector(`[data-callout="${c.key}"]`),
  })).filter((c) => c.el && anchors[c.key]);

  const state = { progress: staticMode ? 0.55 : 0 };
  const v3 = new THREE.Vector3();

  function layout() {
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function render() {
    const p = state.progress;

    // Camera orbit — one slow, deliberate arc across the whole moment.
    const azimuth = lerp(-0.95, 0.85, p);
    const polar = lerp(1.15, 0.8, p);
    let radius = lerp(11.4, 9.6, smooth(p));
    // On narrow screens, pull back just enough that the device's width
    // (~2.9 half-units with margin) fits the horizontal field of view.
    const halfFov = Math.tan((camera.fov * Math.PI) / 360);
    radius = Math.max(radius, 2.9 / (halfFov * camera.aspect));
    camera.position.set(
      target.x + radius * Math.sin(polar) * Math.sin(azimuth),
      target.y + radius * Math.cos(polar),
      target.z + radius * Math.sin(polar) * Math.cos(azimuth)
    );
    camera.lookAt(target);

    // Explosion — starts after the visitor has seen it whole.
    const explode = smooth((p - 0.18) / 0.5);
    parts.forEach((part) => {
      part.position
        .copy(part.userData.basePos)
        .addScaledVector(part.userData.explode, explode);
    });

    renderer.render(scene, camera);

    // Callouts — projected from 3D anchors, fading in at their own moment.
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    calloutEls.forEach((c) => {
      const a = anchors[c.key];
      a.getWorldPosition(v3).project(camera);
      const x = (v3.x * 0.5 + 0.5) * w;
      const y = (-v3.y * 0.5 + 0.5) * h;
      let opacity;
      if (staticMode) {
        opacity = 1;
      } else {
        const [r0, r1] = c.range;
        const fadeIn = smooth((p - r0) / 0.06);
        const fadeOut = 1 - smooth((p - r1) / 0.06);
        opacity = Math.min(fadeIn, fadeOut);
      }
      if (v3.z > 1) opacity = 0;
      c.el.style.opacity = opacity.toFixed(3);
      // Keep labels on screen — clamp against the stage edges.
      const cx = Math.max(34, Math.min(x + 30, w - c.el.offsetWidth - 10));
      const cy = Math.max(10, Math.min(y - 12, h - c.el.offsetHeight - 10));
      c.el.style.transform = `translate(${cx.toFixed(1)}px, ${cy.toFixed(1)}px)`;
    });
  }

  function applyTheme() {
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    hemi.intensity = dark ? 0.7 : 0.95;
    key.intensity = dark ? 1.6 : 1.25;
    rim.intensity = dark ? 0.9 : 0.6;
    render();
  }

  window.addEventListener('oa:themechange', applyTheme);
  window.addEventListener('resize', () => { layout(); render(); });

  if (staticMode) {
    stage.style.height = '72svh';
    layout();
    applyTheme();
    return;
  }

  // The scroll performance: pin the stage and scrub one linear progress
  // value; render() choreographs everything from it.
  gsap.timeline({
    scrollTrigger: {
      trigger: stage,
      start: 'top top',
      end: '+=260%',
      pin: true,
      scrub: 0.8,
      anticipatePin: 1,
    },
  }).to(state, {
    progress: 1,
    ease: 'none',
    duration: 1,
    onUpdate: render,
  });

  layout();
  applyTheme();
  ScrollTrigger.refresh();
}
