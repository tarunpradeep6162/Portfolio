"use client";
/* eslint-disable react-hooks/immutability -- three.js objects are mutable GPU-side
   render resources; mutating them per frame inside useFrame is the intended
   react-three-fiber pattern. */

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { buildAvatar } from "@/lib/avatar/buildAvatar";
import { onCue } from "@/lib/cinema/cues";
import {
  MOODS,
  getStageSnapshot,
  setStageQuality,
  storyState,
  timeOfDay,
  type StageQuality,
} from "@/lib/cinema/stageStore";

/**
 * The persistent cinema stage (Phases 1, 2, 6, 8, 18, 19).
 *
 * One WebGL canvas sits fixed behind the whole site and survives route
 * changes. Its subjects are *anchored to the DOM*: every frame each subject
 * finds its `[data-stage-anchor]` element and places itself where that
 * element is on screen, sized to it. So the 3D world scrolls with the page
 * layout exactly, dark sections become windows into it, and a page change
 * is a cut inside one continuous world rather than a new canvas booting.
 *
 *   hero    - Tarun's armoured double, standing in the Observatory with a
 *             volumetric key light, floor rings and drifting dust
 *   spine   - a column of eight lights; a simulated release travels down it
 *             as the visitor scrolls the Reliability Spine
 *   contact - a wireframe globe with an orbiting packet ("route to you")
 *
 * Film grade: bloom on the light strips, then a grade pass with film
 * grain, vignette, lens chromatic aberration and a focus pull (soft blur
 * between shots, sharp when a subject is framed). Adaptive quality drops
 * bloom, then the whole post chain + resolution, if frames run long.
 */

const LIME = new THREE.Color("#c2ff1f");
const CORAL = new THREE.Color("#ff6847");
const STEEL = new THREE.Color("#2a3440");

interface AnchorFrame {
  /** Centre in NDC (-1..1), height as a fraction of the viewport. */
  x: number;
  y: number;
  w: number;
  h: number;
  /** -1 (below viewport centre) .. 1 (above): how far the anchor has travelled. */
  travel: number;
  visible: boolean;
}

const anchors = new Map<string, AnchorFrame>();
let anchorEls: HTMLElement[] = [];
let windowEls: HTMLElement[] = [];
let lastAnchorScan = -1;
/** Whether any part of the stage can be seen through the page right now. */
let stageVisible = true;

function scanAnchors(now: number) {
  if (now - lastAnchorScan > 500 || anchorEls.some((el) => !el.isConnected)) {
    anchorEls = Array.from(document.querySelectorAll<HTMLElement>("[data-stage-anchor]"));
    windowEls = Array.from(document.querySelectorAll<HTMLElement>(".cinema-window"));
    lastAnchorScan = now;
  }
  const vhNow = window.innerHeight;
  stageVisible = windowEls.some((el) => {
    const r = el.getBoundingClientRect();
    return r.bottom > 0 && r.top < vhNow;
  });
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  anchors.clear();
  for (const el of anchorEls) {
    const name = el.dataset.stageAnchor;
    if (!name) continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    anchors.set(name, {
      x: (cx / vw) * 2 - 1,
      y: -((cy / vh) * 2 - 1),
      w: r.width / vw,
      h: r.height / vh,
      travel: THREE.MathUtils.clamp(-((cy / vh) * 2 - 1), -1.6, 1.6),
      visible: r.bottom > -vh * 0.25 && r.top < vh * 1.25,
    });
  }
}

/** World-space half extents of the z=0 plane for the current camera. */
function planeExtents(camera: THREE.PerspectiveCamera) {
  const halfH = camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  return { halfH, halfW: halfH * camera.aspect };
}

// ------------------------------------------------------------------ shaders

const GradeShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uBlur: { value: 0 },
    uAberration: { value: 0.0016 },
    uGrain: { value: 0.055 },
    uVignette: { value: 0.9 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform vec2 uResolution;
    uniform float uBlur;
    uniform float uAberration;
    uniform float uGrain;
    uniform float uVignette;
    varying vec2 vUv;

    float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

    vec3 sampleCA(vec2 uv) {
      vec2 dir = uv - 0.5;
      float k = uAberration * (1.0 + uBlur * 0.6);
      return vec3(
        texture2D(tDiffuse, uv + dir * k).r,
        texture2D(tDiffuse, uv).g,
        texture2D(tDiffuse, uv - dir * k).b
      );
    }

    void main() {
      vec3 col = sampleCA(vUv);
      // Focus pull: a small disc blur, weighted toward the frame edges.
      if (uBlur > 0.01) {
        vec2 px = uBlur * 2.2 / uResolution;
        float edge = 0.55 + smoothstep(0.0, 0.7, length(vUv - 0.5));
        vec3 acc = col;
        for (int i = 0; i < 8; i++) {
          float a = float(i) * 0.785398;
          acc += sampleCA(vUv + vec2(cos(a), sin(a)) * px * edge);
        }
        col = acc / 9.0;
      }
      // Film grade: teal shadows, warm highlights, gentle contrast.
      float luma = dot(col, vec3(0.2126, 0.7152, 0.0722));
      col += vec3(-0.012, 0.004, 0.018) * (1.0 - luma);
      col += vec3(0.018, 0.008, -0.01) * luma;
      col = mix(col, smoothstep(0.0, 1.0, col), 0.18);
      // Vignette.
      vec2 d = vUv - 0.5;
      d.x *= uResolution.x / uResolution.y;
      col *= mix(1.0, 1.0 - smoothstep(0.25, 1.05, length(d)), uVignette);
      // Animated film grain (luma-weighted so blacks stay clean).
      float g = hash(vUv * uResolution + fract(uTime * 23.17) * 100.0) - 0.5;
      col += g * uGrain * (0.35 + luma);
      gl_FragColor = vec4(col, 1.0);
    }
  `,
};

const coneMaterial = () =>
  new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    uniforms: { uColor: { value: new THREE.Color("#f4f7ff") }, uTime: { value: 0 }, uStrength: { value: 0.1 } },
    vertexShader: /* glsl */ `
      varying vec2 vUv; varying vec3 vN; varying vec3 vV;
      void main() {
        vUv = uv;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vN = normalize(normalMatrix * normal);
        vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor; uniform float uTime; uniform float uStrength;
      varying vec2 vUv; varying vec3 vN; varying vec3 vV;
      void main() {
        float fres = pow(abs(dot(vN, vV)), 1.6);
        float fall = smoothstep(0.0, 0.85, vUv.y);           // bright at the source
        float motes = 0.85 + 0.15 * sin(vUv.y * 40.0 - uTime * 1.3 + vUv.x * 12.0);
        gl_FragColor = vec4(uColor, fres * fall * motes * uStrength);
      }
    `,
  });

// ----------------------------------------------------------------- subjects

function HeroSubject({ mood }: { mood: (typeof MOODS)[keyof typeof MOODS] }) {
  const group = useRef<THREE.Group>(null);
  const figure = useRef<THREE.Group>(null);
  const avatar = useMemo(() => buildAvatar(), []);
  const mixer = useMemo(() => new THREE.AnimationMixer(avatar.root), [avatar]);
  const head = useMemo(() => avatar.root.getObjectByName("head")!, [avatar]);
  const cone = useMemo(() => coneMaterial(), []);
  const ringMat = useMemo(
    () => new THREE.MeshBasicMaterial({ color: LIME, transparent: true, opacity: 0.55, toneMapped: false }),
    [],
  );
  const floorMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: { uColor: { value: LIME.clone() }, uTime: { value: 0 } },
        vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor; uniform float uTime; varying vec2 vUv;
          void main(){
            vec2 p = vUv - 0.5; float r = length(p) * 2.0;
            float glow = (1.0 - smoothstep(0.0, 1.0, r)) * 0.14;
            float band = abs(fract(r * 5.0 - uTime * 0.15) - 0.5);
            float rings = smoothstep(0.46, 0.49, band) * max(0.0, 1.0 - r) * 0.3;
            float a = (glow + rings) * (1.0 - smoothstep(0.85, 1.0, r));
            gl_FragColor = vec4(uColor, a);
          }
        `,
      }),
    [],
  );

  useEffect(() => {
    mixer.clipAction(avatar.clips[0]).play();
    let texture: THREE.Texture | null = null;
    let cancelled = false;
    new THREE.TextureLoader().load("/rc01/face-holo.webp", (loaded) => {
      if (cancelled) return loaded.dispose();
      loaded.colorSpace = THREE.SRGBColorSpace;
      texture = loaded;
      const face = (avatar.root.getObjectByName("hologramFace") as THREE.Mesh).material as THREE.MeshStandardMaterial;
      face.map = loaded;
      face.emissiveMap = loaded;
      face.emissiveIntensity = 1;
      face.needsUpdate = true;
    });
    avatar.root.traverse((o) => {
      o.castShadow = false;
      o.receiveShadow = false;
    });
    return () => {
      cancelled = true;
      texture?.dispose();
      mixer.stopAllAction();
      avatar.dispose();
      cone.dispose();
      ringMat.dispose();
      floorMat.dispose();
    };
  }, [avatar, mixer, cone, ringMat, floorMat]);

  useFrame((state, delta) => {
    const g = group.current;
    const a = anchors.get("hero");
    if (!g) return;
    g.visible = Boolean(a?.visible);
    if (!a || !a.visible) return;
    const cam = state.camera as THREE.PerspectiveCamera;
    const { halfH, halfW } = planeExtents(cam);
    const worldH = a.h * 2 * halfH;
    const s = (Math.min(worldH, a.w * 2 * halfW) * 0.74) / 1.85;
    g.position.set(a.x * halfW, a.y * halfH - s * 0.9, 0);
    g.scale.setScalar(s);

    const t = state.clock.elapsedTime;
    mixer.update(delta);
    // Dolly-and-pan: the figure turns as the hero scrolls out of frame.
    if (figure.current) {
      figure.current.rotation.y = THREE.MathUtils.damp(
        figure.current.rotation.y,
        -0.35 + state.pointer.x * 0.22 + a.travel * 0.55,
        3,
        delta,
      );
    }
    // Head tracks the visitor's pointer on top of the idle clip.
    head.rotateY(THREE.MathUtils.clamp(state.pointer.x, -1, 1) * 0.35);
    head.rotateX(-THREE.MathUtils.clamp(state.pointer.y, -1, 1) * 0.15);

    avatar.glow.emissiveIntensity = 0.75 + Math.sin(t * 1.6) * 0.12;
    cone.uniforms.uTime.value = t;
    // Portrait screens stack the copy above the figure: keep the beam off the text.
    cone.uniforms.uStrength.value = cam.aspect < 1 ? 0.04 : 0.1;
    cone.uniforms.uColor.value.set(mood.key);
    floorMat.uniforms.uTime.value = t;
  });

  return (
    <group ref={group} visible={false}>
      <group ref={figure}>
        <primitive object={avatar.root} />
      </group>
      {/* Volumetric key light falling on the figure */}
      <mesh material={cone} position={[0.05, 1.55, 0]}>
        <cylinderGeometry args={[0.18, 1.05, 3.1, 48, 1, true]} />
      </mesh>
      {/* Floor: glow disc + rings */}
      <mesh material={floorMat} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <planeGeometry args={[2.6, 2.6]} />
      </mesh>
      <mesh material={ringMat} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <torusGeometry args={[0.72, 0.006, 8, 128]} />
      </mesh>
      <mesh material={ringMat} rotation={[-Math.PI / 2.2, 0.2, 0]} position={[0, 0.95, 0]}>
        <torusGeometry args={[1.02, 0.003, 8, 160]} />
      </mesh>
    </group>
  );
}

function SpineSubject() {
  const group = useRef<THREE.Group>(null);
  const nodes = useRef<THREE.Mesh[]>([]);
  const railMat = useMemo(() => new THREE.MeshBasicMaterial({ color: STEEL, transparent: true, opacity: 0.8 }), []);
  const fillMat = useMemo(() => new THREE.MeshBasicMaterial({ color: LIME, toneMapped: false }), []);
  const nodeMats = useMemo(
    () => Array.from({ length: 8 }, () => new THREE.MeshBasicMaterial({ color: STEEL.clone(), toneMapped: false })),
    [],
  );
  const fill = useRef<THREE.Mesh>(null);
  const packet = useRef<THREE.Mesh>(null);
  useEffect(() => () => [railMat, fillMat, ...nodeMats].forEach((m) => m.dispose()), [railMat, fillMat, nodeMats]);

  useFrame((state) => {
    const g = group.current;
    const a = anchors.get("spine");
    if (!g) return;
    g.visible = Boolean(a?.visible);
    if (!a || !a.visible) return;
    const cam = state.camera as THREE.PerspectiveCamera;
    const { halfH, halfW } = planeExtents(cam);
    const worldH = a.h * 2 * halfH;
    // The column runs down the anchor's left edge.
    g.position.set((a.x - a.w) * halfW - 0.08, a.y * halfH, -0.4);
    g.scale.set(1, worldH, 1);
    const p = storyState.spineProgress;
    if (fill.current) {
      fill.current.scale.y = Math.max(0.0001, p);
      fill.current.position.y = 0.5 - p / 2;
    }
    if (packet.current) {
      packet.current.position.y = 0.5 - p;
      packet.current.scale.set(1, 1 / Math.max(worldH, 0.01), 1);
      (packet.current.material as THREE.MeshBasicMaterial).color.copy(storyState.spineAlert >= 0 ? CORAL : LIME);
    }
    const t = state.clock.elapsedTime;
    nodes.current.forEach((node, i) => {
      if (!node) return;
      node.scale.set(1, 1 / Math.max(worldH, 0.01), 1);
      const lit = p >= i / 7 - 0.001;
      const mat = nodeMats[i];
      if (storyState.spineAlert === i) mat.color.copy(CORAL).multiplyScalar(1.2 + Math.sin(t * 12) * 0.6);
      else mat.color.copy(lit ? LIME : STEEL).multiplyScalar(lit ? 1.4 : 1);
    });
  });

  return (
    <group ref={group} visible={false}>
      <mesh material={railMat}>
        <boxGeometry args={[0.012, 1, 0.012]} />
      </mesh>
      <mesh ref={fill} material={fillMat} position={[0, 0.5, 0.001]}>
        <boxGeometry args={[0.02, 1, 0.02]} />
      </mesh>
      {nodeMats.map((mat, i) => (
        <mesh
          key={i}
          ref={(m) => {
            if (m) nodes.current[i] = m;
          }}
          material={mat}
          position={[0, 0.5 - i / 7, 0.01]}
        >
          <sphereGeometry args={[0.05, 20, 12]} />
        </mesh>
      ))}
      <mesh ref={packet} position={[0, 0.5, 0.03]}>
        <sphereGeometry args={[0.085, 20, 12]} />
        <meshBasicMaterial color={LIME} toneMapped={false} />
      </mesh>
    </group>
  );
}

function ContactSubject() {
  const group = useRef<THREE.Group>(null);
  const globe = useRef<THREE.LineSegments>(null);
  const orbit = useRef<THREE.Group>(null);
  const geo = useMemo(() => new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(1, 3)), []);
  useEffect(() => () => geo.dispose(), [geo]);

  useFrame((state, delta) => {
    const g = group.current;
    const a = anchors.get("contact");
    if (!g) return;
    g.visible = Boolean(a?.visible);
    if (!a || !a.visible) return;
    const cam = state.camera as THREE.PerspectiveCamera;
    const { halfH, halfW } = planeExtents(cam);
    const size = Math.min(a.h * 2 * halfH, a.w * 2 * halfW) * 0.42;
    g.position.set(a.x * halfW, a.y * halfH, -0.6);
    g.scale.setScalar(size);
    if (globe.current) {
      globe.current.rotation.y += delta * 0.08;
      globe.current.rotation.x = 0.35 + a.travel * 0.25;
    }
    if (orbit.current) orbit.current.rotation.z += delta * 0.6;
  });

  return (
    <group ref={group} visible={false}>
      <lineSegments ref={globe} geometry={geo}>
        <lineBasicMaterial color="#3a4a5c" transparent opacity={0.55} />
      </lineSegments>
      <group rotation={[1.1, 0.3, 0]}>
        <mesh>
          <torusGeometry args={[1.35, 0.004, 8, 180]} />
          <meshBasicMaterial color={LIME} toneMapped={false} transparent opacity={0.6} />
        </mesh>
        <group ref={orbit}>
          <mesh position={[1.35, 0, 0]}>
            <sphereGeometry args={[0.045, 16, 10]} />
            <meshBasicMaterial color={LIME} toneMapped={false} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

function Dust() {
  const points = useRef<THREE.Points>(null);
  const { geometry, material } = useMemo(() => {
    // Seeded, so the dust field is identical every mount (and render stays pure).
    let seedState = 0x9e3779b9;
    const rand = () => {
      seedState = (seedState + 0x6d2b79f5) | 0;
      let r = Math.imul(seedState ^ (seedState >>> 15), 1 | seedState);
      r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
    const count = 520;
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (rand() - 0.5) * 16;
      pos[i * 3 + 1] = (rand() - 0.5) * 10;
      pos[i * 3 + 2] = (rand() - 0.5) * 6 - 1;
      seed[i] = rand();
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geometry.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uScroll: { value: 0 }, uColor: { value: new THREE.Color("#dfe8ff") } },
      vertexShader: /* glsl */ `
        attribute float aSeed; uniform float uTime; uniform float uScroll; varying float vA;
        void main() {
          vec3 p = position;
          p.y = mod(p.y + uTime * (0.04 + aSeed * 0.06) + uScroll * (0.4 + aSeed), 10.0) - 5.0;
          p.x += sin(uTime * 0.2 + aSeed * 30.0) * 0.15;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = (1.2 + aSeed * 2.4) * (8.0 / -mv.z);
          vA = 0.18 + aSeed * 0.35;
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor; varying float vA;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          gl_FragColor = vec4(uColor, (1.0 - smoothstep(0.0, 0.5, d)) * vA);
        }
      `,
    });
    return { geometry, material };
  }, []);
  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );
  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.elapsedTime;
    material.uniforms.uScroll.value = window.scrollY / Math.max(1, window.innerHeight) * 0.6;
  });
  return <points ref={points} geometry={geometry} material={material} />;
}

// ------------------------------------------------------- director + post

function Director({ onQuality }: { onQuality: (q: StageQuality) => void }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);

  const post = useMemo(() => {
    const composer = new EffectComposer(gl);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.38, 0.45, 0.9);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());
    const grade = new ShaderPass(GradeShader);
    composer.addPass(grade);
    return { composer, bloom, grade };
  }, [gl, scene, camera]);

  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const env = pmrem.fromScene(room, 0.04).texture;
    scene.environment = env;
    return () => {
      scene.environment = null;
      env.dispose();
      room.dispose?.();
      pmrem.dispose();
      post.composer.dispose();
    };
  }, [gl, scene, post]);

  useEffect(() => {
    const dpr = gl.getPixelRatio();
    post.composer.setPixelRatio(dpr);
    post.composer.setSize(size.width, size.height);
    post.bloom.resolution.set(size.width / 2, size.height / 2);
    post.grade.uniforms.uResolution.value.set(size.width * dpr, size.height * dpr);
  }, [post, size, gl]);

  // Transition whip: a route change kicks the camera and blurs the frame.
  const whip = useRef(0);
  useEffect(
    () =>
      onCue((cue) => {
        if (cue.type === "transition") whip.current = 1;
      }),
    [],
  );

  const blur = useRef(1.5);
  const frames = useRef({ n: 0, total: 0 });

  useFrame((state, delta) => {
    scanAnchors(performance.now());

    // Focus pull: sharp while a subject is near frame centre, soft between shots.
    let nearest = Infinity;
    for (const a of anchors.values()) if (a.visible) nearest = Math.min(nearest, Math.abs(a.y));
    const framed = nearest < 0.55;
    whip.current = Math.max(0, whip.current - delta * 1.8);
    blur.current = THREE.MathUtils.damp(blur.current, (framed ? 0 : 1.4) + whip.current * 3, 4, delta);

    // Camera: gentle handheld drift + pointer parallax + a push-in when framed.
    const t = state.clock.elapsedTime;
    const targetFov = (framed ? 28.5 : 31) + whip.current * 4;
    camera.fov = THREE.MathUtils.damp(camera.fov, targetFov, 2.5, delta);
    camera.position.x = THREE.MathUtils.damp(camera.position.x, state.pointer.x * 0.18 + Math.sin(t * 0.31) * 0.03, 2, delta);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, state.pointer.y * 0.1 + Math.sin(t * 0.23) * 0.025, 2, delta);
    camera.rotation.z = Math.sin(t * 0.17) * 0.002 + whip.current * 0.03;
    camera.updateProjectionMatrix();

    // Phase 19: nothing can be seen through the page (an all-paper page, or
    // scrolled into a light section) - skip the frame entirely.
    if (!stageVisible) return;

    const quality = getStageSnapshot().quality;
    if (quality < 2) {
      post.bloom.enabled = quality === 0;
      post.grade.uniforms.uTime.value = t;
      post.grade.uniforms.uBlur.value = blur.current;
      post.composer.render(delta);
    } else {
      gl.render(scene, camera);
    }

    // Adaptive quality (Phase 19): step down if frames run long.
    const f = frames.current;
    f.n += 1;
    f.total += delta;
    if (f.n >= 90) {
      const avg = f.total / f.n;
      if (avg > 0.028 && quality < 2) onQuality((quality + 1) as StageQuality);
      f.n = 0;
      f.total = 0;
    }
  }, 1);

  return null;
}

export default function StageCanvas({ paused }: { paused: boolean }) {
  const mood = MOODS[timeOfDay()];
  const quality = getStageSnapshot().quality;
  return (
    <Canvas
      dpr={quality >= 2 ? [0.75, 0.75] : [1, 1.5]}
      frameloop={paused ? "never" : "always"}
      gl={{ antialias: false, alpha: false, powerPreference: "high-performance" }}
      camera={{ position: [0, 0, 10], fov: 30, near: 0.1, far: 60 }}
      onCreated={({ gl, scene }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = mood.exposure;
        scene.background = new THREE.Color(mood.fog);
      }}
    >
      <ambientLight intensity={0.25} />
      <directionalLight position={[2.5, 5, 4]} intensity={2.2} color={mood.key} />
      <directionalLight position={[-3, 2, -3]} intensity={2.6} color={mood.rim} />
      <directionalLight position={[3, 0.5, -2]} intensity={0.45} color="#d8ff4f" />
      <Dust />
      <HeroSubject mood={mood} />
      <SpineSubject />
      <ContactSubject />
      <Director onQuality={setStageQuality} />
    </Canvas>
  );
}
