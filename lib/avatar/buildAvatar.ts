import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

/**
 * Tarun's armoured "digital twin", built procedurally from his character
 * sheet (front / 3/4 / side / back).
 *
 * How it's shaped: every body part is a *lathe* of an anatomical profile
 * (waist-to-chest V taper, thigh taper, calf bulge...) squashed to an
 * elliptical cross-section. Armour plates are thick curved *bands* of the
 * same profile, pushed slightly outward and limited to an arc (front,
 * back, sides) - so plates follow the body the way sculpted armour does
 * instead of floating as boxes. Light strips are tubes run along those
 * surfaces. The helmet visor carries his hologram portrait.
 *
 * The same builder feeds the on-site viewer and scripts/export-avatar.mjs
 * (.glb), so the download and the page are identical. Every joint is a
 * named node (hips > spine > chest > neck > head; shoulder > upperArm >
 * elbow > forearm > hand; hip > thigh > knee > shin > foot) and an "Idle"
 * clip is included. Units are metres, feet at y = 0, facing +Z.
 */
export interface AvatarBuild {
  root: THREE.Group;
  clips: THREE.AnimationClip[];
  /** Emissive light-strip material, exposed so viewers can pulse it. */
  glow: THREE.MeshStandardMaterial;
  dispose: () => void;
}

/** [radius, y] pairs, y ascending. */
type Profile = ReadonlyArray<readonly [number, number]>;

const TAU = Math.PI * 2;

function radiusAt(profile: Profile, y: number): number {
  if (y <= profile[0][1]) return profile[0][0];
  for (let i = 1; i < profile.length; i++) {
    const [r1, y1] = profile[i];
    const [r0, y0] = profile[i - 1];
    if (y <= y1) {
      const t = (y - y0) / (y1 - y0);
      // smoothstep between control points -> rounder muscle forms
      const s = t * t * (3 - 2 * t);
      return r0 + (r1 - r0) * s;
    }
  }
  return profile[profile.length - 1][0];
}

export function buildAvatar({ faceTexture }: { faceTexture?: THREE.Texture | null } = {}): AvatarBuild {
  const geometries: THREE.BufferGeometry[] = [];
  const track = <G extends THREE.BufferGeometry>(g: G) => {
    geometries.push(g);
    return g;
  };

  // ---------------------------------------------------------------- materials
  const chrome = new THREE.MeshPhysicalMaterial({
    name: "ArmourChrome",
    color: "#1b1f25",
    metalness: 0.9,
    roughness: 0.3,
    clearcoat: 0.6,
    clearcoatRoughness: 0.15,
    side: THREE.DoubleSide,
  });
  const trim = new THREE.MeshPhysicalMaterial({
    name: "ArmourTrim",
    color: "#2b3037",
    metalness: 0.9,
    roughness: 0.36,
    clearcoat: 0.3,
    side: THREE.DoubleSide,
  });
  const suit = new THREE.MeshStandardMaterial({ name: "Undersuit", color: "#0b0d10", metalness: 0.3, roughness: 0.72 });
  const vent = new THREE.MeshStandardMaterial({ name: "VentMesh", color: "#050607", metalness: 0.5, roughness: 0.6 });
  // Saturated neon (the concept's strips read yellow-green, not pastel);
  // not tone-mapped so filmic tone mapping can't wash it toward white.
  const glow = new THREE.MeshStandardMaterial({
    name: "LightStrip",
    color: "#9fe800",
    emissive: "#c2ff1f",
    emissiveIntensity: 1.1,
    toneMapped: false,
  });
  const visorGlass = new THREE.MeshPhysicalMaterial({
    name: "VisorGlass",
    color: "#04070a",
    metalness: 0.2,
    roughness: 0.2,
    clearcoat: 1,
    clearcoatRoughness: 0.15,
  });
  const face = new THREE.MeshStandardMaterial({
    name: "HologramFace",
    color: "#000000",
    map: faceTexture ?? null,
    emissive: "#ffffff",
    emissiveMap: faceTexture ?? null,
    emissiveIntensity: faceTexture ? 1 : 0,
    transparent: true,
    alphaTest: 0.02,
    depthWrite: false,
  });
  const materials = [chrome, trim, suit, vent, glow, visorGlass, face];

  // ------------------------------------------------------------ primitives
  const node = (name: string, parent: THREE.Object3D, x = 0, y = 0, z = 0) => {
    const g = new THREE.Group();
    g.name = name;
    g.position.set(x, y, z);
    parent.add(g);
    return g;
  };
  type T = { p?: number[]; r?: number[]; s?: number[]; name?: string };
  const add = (parent: THREE.Object3D, geometry: THREE.BufferGeometry, material: THREE.Material, t: T = {}) => {
    const m = new THREE.Mesh(track(geometry), material);
    const { p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1] } = t;
    m.position.set(p[0], p[1], p[2]);
    m.rotation.set(r[0], r[1], r[2]);
    m.scale.set(s[0], s[1], s[2]);
    m.castShadow = true;
    m.receiveShadow = true;
    if (t.name) m.name = t.name;
    parent.add(m);
    return m;
  };

  /** Full body-part surface. */
  const body = (profile: Profile, segments = 40) =>
    new THREE.LatheGeometry(
      profile.map(([r, y]) => new THREE.Vector2(r, y)),
      segments,
    );

  /**
   * A thick curved armour plate: the profile between y0..y1, offset outward
   * by `lift`, `thickness` deep, over the arc [phi0, phi0 + arc] (0 = front).
   */
  const plate = (profile: Profile, y0: number, y1: number, phi0: number, arc: number, lift = 0.012, thickness = 0.012) => {
    const steps = 10;
    const outer: THREE.Vector2[] = [];
    const inner: THREE.Vector2[] = [];
    for (let i = 0; i <= steps; i++) {
      const y = y0 + ((y1 - y0) * i) / steps;
      // plates taper in at top/bottom edges -> bevelled look
      const edge = Math.sin((i / steps) * Math.PI) ** 0.35;
      const r = radiusAt(profile, y);
      outer.push(new THREE.Vector2(r + lift * edge + 0.002, y));
      inner.push(new THREE.Vector2(r + lift - thickness, y));
    }
    const loop = [...outer, ...inner.reverse(), outer[0].clone()];
    return new THREE.LatheGeometry(loop, 24, phi0 - arc / 2, arc);
  };

  /** A glowing tube following the surface at angle `phi` between y0..y1. */
  const stripAlong = (profile: Profile, y0: number, y1: number, phi: number, lift = 0.017, radius = 0.0045) => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 8; i++) {
      const y = y0 + ((y1 - y0) * i) / 8;
      const r = radiusAt(profile, y) + lift;
      pts.push(new THREE.Vector3(r * Math.sin(phi), y, r * Math.cos(phi)));
    }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, radius, 6, false);
  };

  /** A glowing ring around the surface at height y, over an arc. */
  const stripAround = (profile: Profile, y: number, phi0: number, arc: number, lift = 0.018, radius = 0.004) => {
    const r = radiusAt(profile, y) + lift;
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 16; i++) {
      const phi = phi0 - arc / 2 + (arc * i) / 16;
      pts.push(new THREE.Vector3(r * Math.sin(phi), y, r * Math.cos(phi)));
    }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 32, radius, 6, false);
  };

  const box = (w: number, h: number, d: number, radius = 0.012) =>
    new RoundedBoxGeometry(w, h, d, 3, Math.min(radius, w / 2, h / 2, d / 2) * 0.999);
  const ring = (radius: number, tube = 0.005) => new THREE.TorusGeometry(radius, tube, 8, 48);
  const sphere = (r: number) => new THREE.SphereGeometry(r, 40, 24);

  // ------------------------------------------------------------- skeleton
  const root = new THREE.Group();
  root.name = "TarunArmour";
  const hips = node("hips", root, 0, 0.98, 0);
  const spine = node("spine", hips, 0, 0.08, 0);
  const chest = node("chest", spine, 0, 0.3, 0);
  const neck = node("neck", chest, 0, 0.18, 0);
  const head = node("head", neck, 0, 0.12, 0);

  // ---------------------------------------------------------------- torso
  // Spine space: pelvis at -0.16, waist ~0.05, chest peak ~0.36, neck 0.48.
  const TORSO: Profile = [
    [0.02, -0.2],
    [0.12, -0.18],
    [0.145, -0.1],
    [0.14, -0.02],
    [0.128, 0.06],
    [0.135, 0.14],
    [0.165, 0.23],
    [0.195, 0.31],
    [0.2, 0.37],
    [0.18, 0.42],
    [0.12, 0.46],
    [0.06, 0.485],
  ];
  const torso = node("torsoShape", spine);
  torso.scale.set(1.2, 1, 0.76);
  add(torso, body(TORSO, 48), suit);
  // Pectoral plates (split at the sternum), abdominal bands, back, sides
  add(torso, plate(TORSO, 0.24, 0.43, -0.3, 0.5, 0.014, 0.014), chrome);
  add(torso, plate(TORSO, 0.24, 0.43, 0.3, 0.5, 0.014, 0.014), chrome);
  add(torso, plate(TORSO, 0.22, 0.44, 0, 0.14, 0.02, 0.012), trim); // sternum keel
  for (let i = 0; i < 3; i++) {
    const y = 0.02 + i * 0.065;
    add(torso, plate(TORSO, y, y + 0.055, 0, 1.1 - i * 0.05, 0.012, 0.012), chrome);
  }
  add(torso, plate(TORSO, 0.08, 0.44, Math.PI, 1.6, 0.013, 0.014), chrome); // back
  for (const side of [-1, 1]) {
    add(torso, plate(TORSO, 0.04, 0.33, side * (Math.PI / 2), 0.7, 0.01, 0.012), chrome); // flanks
    add(torso, plate(TORSO, -0.15, -0.03, side * (Math.PI / 2), 0.9, 0.012, 0.012), chrome); // hip guards
    add(torso, stripAlong(TORSO, 0.07, 0.3, side * (Math.PI / 2), 0.014), glow);
    add(torso, stripAlong(TORSO, 0.26, 0.4, side * 0.55, 0.019), glow); // chest chevron arms
  }
  add(torso, plate(TORSO, -0.16, -0.05, 0, 0.7, 0.014, 0.012), chrome); // belt front
  add(torso, plate(TORSO, -0.14, 0.07, Math.PI, 1.3, 0.012, 0.012), chrome); // lower back
  add(torso, stripAround(TORSO, -0.05, 0, 1.6, 0.017), glow); // belt line
  add(torso, stripAlong(TORSO, 0.23, 0.34, 0, 0.024, 0.0055), glow); // sternum light
  add(torso, stripAround(TORSO, 0.2, 0, 0.9, 0.015), glow); // under-chest line
  for (const side of [-1, 1]) add(torso, stripAlong(TORSO, 0.1, 0.4, Math.PI + side * 0.12, 0.018), glow); // spine lights
  // Chest vents (the dark mesh panels on the concept)
  for (const side of [-1, 1]) {
    const phi = side * 0.42;
    const r = radiusAt(TORSO, 0.33) + 0.024;
    add(torso, box(0.07, 0.055, 0.008, 0.004), vent, {
      p: [r * Math.sin(phi), 0.33, r * Math.cos(phi)],
      r: [-0.2, phi, 0],
    });
  }

  // ----------------------------------------------------------- neck & head
  const NECK: Profile = [
    [0.07, -0.03],
    [0.058, 0.03],
    [0.052, 0.08],
  ];
  add(neck, body(NECK, 32), suit);
  add(neck, plate(NECK, -0.03, 0.05, 0, 3.6, 0.01, 0.01), trim);
  add(neck, stripAround(NECK, 0.02, 0, 1.2, 0.013), glow);

  // Head: a head-shaped helmet (not a fishbowl) with a large wrap visor.
  const HEAD: Profile = [
    [0.02, -0.1],
    [0.06, -0.095],
    [0.085, -0.07],
    [0.1, -0.02],
    [0.106, 0.03],
    [0.1, 0.08],
    [0.08, 0.12],
    [0.045, 0.145],
    [0.005, 0.152],
  ];
  const helmet = node("helmetShape", head);
  helmet.scale.set(0.9, 1, 1.02);
  add(helmet, body(HEAD, 48), chrome, { name: "helmet" });
  // Swept crest (echoes the hair silhouette from the concept)
  add(helmet, plate(HEAD, 0.06, 0.152, Math.PI * 0.95, 0.55, 0.018, 0.02), trim);
  // Visor glass + hologram portrait, as front arcs of the same head form
  add(helmet, plate(HEAD, -0.075, 0.09, 0, 2.2, 0.006, 0.006), visorGlass, { name: "visor" });
  const faceGeo = new THREE.LatheGeometry(
    Array.from({ length: 13 }, (_, i) => {
      const y = -0.07 + (0.155 * i) / 12;
      return new THREE.Vector2(radiusAt(HEAD, y) + 0.0105, y);
    }),
    32,
    -1.0,
    2.0,
  );
  // Lathe UVs run u=0..1 across the arc and v=0..1 bottom-to-top: the
  // portrait maps onto the visor unmirrored and upright.
  add(helmet, faceGeo, face, { name: "hologramFace" });
  for (const side of [-1, 1]) {
    // Ear pods with light rings (straight from the concept's head detail)
    add(head, new THREE.CylinderGeometry(0.034, 0.034, 0.03, 32), trim, { p: [side * 0.1, 0.0, -0.005], r: [0, 0, Math.PI / 2] });
    add(head, ring(0.024, 0.0045), glow, { p: [side * 0.116, 0.0, -0.005], r: [0, Math.PI / 2, 0] });
    add(head, box(0.012, 0.05, 0.05, 0.005), trim, { p: [side * 0.103, 0.05, -0.03], r: [0.5, 0, 0] });
  }

  // ------------------------------------------------------------------ arms
  const UPPER_ARM: Profile = [
    [0.036, -0.3],
    [0.044, -0.27],
    [0.05, -0.2],
    [0.058, -0.1],
    [0.056, -0.03],
    [0.05, 0.0],
  ];
  const FOREARM: Profile = [
    [0.032, -0.27],
    [0.034, -0.24],
    [0.042, -0.14],
    [0.05, -0.06],
    [0.045, 0.0],
  ];
  for (const side of [-1, 1] as const) {
    const n = side < 0 ? "L" : "R";
    const out = side * (Math.PI / 2); // phi pointing away from the body
    const shoulder = node(`shoulder${n}`, chest, side * 0.25, 0.075, 0);
    // Pauldron: layered shell cap + the round light ring from the concept
    add(shoulder, new THREE.SphereGeometry(0.085, 40, 20, 0, TAU, 0, Math.PI * 0.62), chrome, { s: [1.12, 0.95, 1.05], r: [0, 0, side * -0.35] });
    add(shoulder, new THREE.SphereGeometry(0.092, 40, 20, 0, TAU, 0, Math.PI * 0.3), trim, { p: [side * 0.01, 0.01, 0], s: [1.1, 0.95, 1.05], r: [0, 0, side * -0.35] });
    add(shoulder, ring(0.05, 0.0065), glow, { p: [side * 0.083, -0.015, 0], r: [0, Math.PI / 2, side * -0.35] });

    const upperArm = node(`upperArm${n}`, shoulder, side * 0.015, -0.03, 0);
    upperArm.rotation.z = side * 0.13; // relaxed A-pose, as drawn
    add(upperArm, body(UPPER_ARM), suit);
    add(upperArm, plate(UPPER_ARM, -0.24, -0.04, out, 2.4), chrome);
    add(upperArm, plate(UPPER_ARM, -0.22, -0.06, 0, 1.3, 0.01, 0.01), chrome);
    add(upperArm, stripAlong(UPPER_ARM, -0.22, -0.06, out, 0.013), glow);

    const elbow = node(`elbow${n}`, upperArm, 0, -0.3, 0);
    add(elbow, sphere(0.042), trim, { s: [1, 0.9, 1] });
    add(elbow, ring(0.036, 0.0045), glow, { p: [side * 0.03, 0, 0], r: [0, Math.PI / 2, 0] });

    const forearm = node(`forearm${n}`, elbow, 0, -0.01, 0);
    forearm.rotation.x = -0.14;
    add(forearm, body(FOREARM), suit);
    add(forearm, plate(FOREARM, -0.23, -0.03, 0, 2.6), chrome);
    add(forearm, plate(FOREARM, -0.2, -0.05, Math.PI, 1.6, 0.01, 0.01), chrome);
    // The long oval forearm light from the concept: two rails + caps
    for (const d of [-0.28, 0.28]) add(forearm, stripAlong(FOREARM, -0.2, -0.06, d, 0.016, 0.005), glow);
    add(forearm, stripAround(FOREARM, -0.06, 0, 0.56, 0.016, 0.005), glow);
    add(forearm, stripAround(FOREARM, -0.2, 0, 0.56, 0.016, 0.005), glow);

    const hand = node(`hand${n}`, forearm, 0, -0.28, 0.004);
    add(hand, box(0.07, 0.08, 0.032, 0.012), suit, { p: [0, -0.035, 0] });
    add(hand, box(0.066, 0.05, 0.012, 0.005), trim, { p: [0, -0.03, 0.018] });
    for (let f = 0; f < 4; f++) {
      const fx = -0.025 + f * 0.0167;
      const finger = node(`finger${n}${f}`, hand, fx, -0.075, 0.002);
      finger.rotation.x = 0.25;
      add(finger, new THREE.CapsuleGeometry(0.0078, 0.028, 4, 10), suit, { p: [0, -0.018, 0] });
      add(finger, new THREE.CapsuleGeometry(0.0082, 0.012, 4, 10), trim, { p: [0, -0.006, 0.002] });
      add(finger, new THREE.CapsuleGeometry(0.0072, 0.02, 4, 10), suit, { p: [0, -0.045, 0.006], r: [0.35, 0, 0] });
    }
    add(hand, new THREE.CapsuleGeometry(0.0085, 0.035, 4, 10), suit, { p: [-side * 0.038, -0.045, 0.018], r: [0.4, 0, side * -0.55] });
  }

  // ------------------------------------------------------------------ legs
  const THIGH: Profile = [
    [0.05, -0.44],
    [0.058, -0.4],
    [0.072, -0.3],
    [0.086, -0.16],
    [0.09, -0.06],
    [0.085, 0.02],
  ];
  const SHIN: Profile = [
    [0.04, -0.4],
    [0.042, -0.36],
    [0.05, -0.24],
    [0.064, -0.12],
    [0.058, -0.03],
    [0.052, 0.0],
  ];
  for (const side of [-1, 1] as const) {
    const n = side < 0 ? "L" : "R";
    const out = side * (Math.PI / 2);
    const hip = node(`hip${n}`, hips, side * 0.095, -0.06, 0);
    hip.rotation.z = side * 0.035;

    const thigh = node(`thigh${n}`, hip, 0, 0, 0);
    add(thigh, body(THIGH), suit);
    add(thigh, plate(THIGH, -0.36, -0.04, 0, 1.9), chrome);
    add(thigh, plate(THIGH, -0.34, -0.06, out, 1.1, 0.01, 0.012), chrome);
    add(thigh, plate(THIGH, -0.34, -0.1, Math.PI, 1.4, 0.008, 0.01), chrome);
    add(thigh, stripAlong(THIGH, -0.32, -0.08, out, 0.011), glow);
    add(thigh, stripAlong(THIGH, -0.3, -0.12, side * 0.2, 0.017), glow);

    const knee = node(`knee${n}`, thigh, 0, -0.44, 0);
    add(knee, sphere(0.052), trim, { p: [0, 0, 0.01], s: [1, 1.05, 0.95] });
    add(knee, new THREE.SphereGeometry(0.058, 32, 16, -1.1, 2.2, 0.3, 2.4), chrome, { p: [0, 0, 0.014] });
    add(knee, ring(0.03, 0.0055), glow, { p: [0, 0, 0.07] });

    const shin = node(`shin${n}`, knee, 0, -0.01, 0);
    add(shin, body(SHIN), suit);
    add(shin, plate(SHIN, -0.36, -0.03, 0, 2.1, 0.014, 0.014), chrome);
    add(shin, plate(SHIN, -0.32, -0.08, Math.PI, 2.0, 0.01, 0.012), chrome);
    add(shin, stripAlong(SHIN, -0.32, -0.08, 0, 0.019, 0.0055), glow);
    add(shin, stripAlong(SHIN, -0.3, -0.1, out, 0.011), glow);

    const foot = node(`foot${n}`, shin, 0, -0.41, 0);
    add(foot, box(0.1, 0.075, 0.23, 0.035), chrome, { p: [0, -0.02, 0.045] });
    add(foot, box(0.108, 0.02, 0.245, 0.008), suit, { p: [0, -0.062, 0.045] });
    add(foot, box(0.085, 0.06, 0.08, 0.025), trim, { p: [0, 0.015, 0.0] });
    add(foot, new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * 0.052, -0.05, -0.06),
        new THREE.Vector3(side * 0.055, -0.05, 0.08),
        new THREE.Vector3(side * 0.035, -0.05, 0.16),
      ]),
      16, 0.004, 6, false,
    ), glow);
  }

  return {
    root,
    clips: [buildIdleClip(root)],
    glow,
    dispose: () => {
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
    },
  };
}

/** A 4 s seamless idle: breathing, a slow look-around, weight shift, arm sway. */
function buildIdleClip(root: THREE.Object3D): THREE.AnimationClip {
  const duration = 4;
  const steps = 16;
  const times = Array.from({ length: steps + 1 }, (_, i) => (i / steps) * duration);
  const tracks: THREE.KeyframeTrack[] = [];

  const rotTrack = (name: string, fn: (phase: number) => [number, number, number]) => {
    const obj = root.getObjectByName(name);
    if (!obj) return;
    const base = obj.rotation.clone();
    const values: number[] = [];
    for (const t of times) {
      const [x, y, z] = fn((t / duration) * TAU);
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(base.x + x, base.y + y, base.z + z));
      values.push(q.x, q.y, q.z, q.w);
    }
    tracks.push(new THREE.QuaternionKeyframeTrack(`${name}.quaternion`, times, values));
  };

  rotTrack("spine", (p) => [Math.sin(p) * 0.012, 0, 0]);
  rotTrack("chest", (p) => [Math.sin(p) * 0.018, Math.sin(p) * 0.02, 0]);
  rotTrack("head", (p) => [Math.sin(p * 2) * 0.025, Math.sin(p) * 0.2, 0]);
  rotTrack("hips", (p) => [0, 0, Math.sin(p) * 0.01]);
  rotTrack("upperArmL", (p) => [Math.sin(p) * 0.04, 0, Math.sin(p) * 0.02]);
  rotTrack("upperArmR", (p) => [-Math.sin(p) * 0.04, 0, Math.sin(p) * 0.02]);
  rotTrack("forearmL", (p) => [Math.sin(p + 0.6) * 0.035, 0, 0]);
  rotTrack("forearmR", (p) => [-Math.sin(p + 0.6) * 0.035, 0, 0]);

  return new THREE.AnimationClip("Idle", duration, tracks);
}
