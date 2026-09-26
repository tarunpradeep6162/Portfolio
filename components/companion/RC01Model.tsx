"use client";
/* eslint-disable react-hooks/immutability -- three.js materials and the scene are
   mutable GPU-side render resources; mutating them per frame inside useFrame
   (instead of re-rendering React) is the intended react-three-fiber pattern. */

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import type { CompanionState } from "@/lib/companion/state";
import { GESTURE_DURATION_MS, robotSignals } from "@/lib/companion/robotSignals";
import { buildAvatar } from "@/lib/avatar/buildAvatar";
import { mergeAvatarMeshes } from "@/lib/avatar/mergeAvatar";
import { HEAD_MODEL_URL, attachHeadModel } from "@/lib/avatar/headModel";

/** The hologram portrait shown on the visor (public/rc01/). */
const FACE_TEXTURE_URL = "/rc01/face-holo.webp";

const PALETTE = {
  lime: "#c2ff1f",
  blue: "#748cff",
  coral: "#ff6847",
};

const JOINTS = [
  "hips",
  "spine",
  "chest",
  "neck",
  "head",
  "upperArmL",
  "upperArmR",
  "forearmL",
  "forearmR",
  "handL",
  "handR",
  "hipL",
  "hipR",
  "kneeL",
  "kneeR",
] as const;
type Joint = (typeof JOINTS)[number];

function damp(current: number, target: number, lambda: number, delta: number) {
  return THREE.MathUtils.damp(current, target, lambda, delta);
}

const deg = THREE.MathUtils.degToRad;

interface RC01ModelProps {
  state: CompanionState;
  fullEmissiveDetail: boolean;
  /** Project-specific light-strip accent during a project briefing (v5.1). */
  accentColor?: string;
}

/**
 * RC-01, v9: Tarun's armoured digital twin (lib/avatar/buildAvatar.ts - the
 * same model as public/avatar/tarun-armour.glb), puppeted live by the
 * companion state machine and `robotSignals`: head gaze and pointer
 * tracking, nods and shrugs, waving / pointing / celebrating arms, a
 * breathing idle, and light strips + visor hologram that react to state
 * (boot flicker, thinking pulse, coral on error, voice glow, dim in sleep).
 * Framed from the knees up so the face reads inside the companion panel.
 */
export function RC01Model({ state, fullEmissiveDetail, accentColor }: RC01ModelProps) {
  const rootRef = useRef<THREE.Group>(null);

  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const pointer = useThree((s) => s.pointer);

  const avatar = useMemo(() => {
    const built = buildAvatar();
    // ~140 draw calls -> ~65: static parts baked into their joints.
    const unmerge = mergeAvatarMeshes(built.root);
    return {
      ...built,
      dispose: () => {
        unmerge();
        built.dispose();
      },
    };
  }, []);
  const rig = useMemo(() => {
    const joints = {} as Record<Joint, THREE.Object3D>;
    const base = {} as Record<Joint, THREE.Euler>;
    for (const name of JOINTS) {
      const obj = avatar.root.getObjectByName(name);
      if (!obj) throw new Error(`RC-01 rig is missing joint "${name}"`);
      joints[name] = obj;
      base[name] = obj.rotation.clone();
    }
    const faceMesh = avatar.root.getObjectByName("hologramFace") as THREE.Mesh;
    const face = faceMesh.material as THREE.MeshStandardMaterial;
    face.opacity = 0;
    // Shadows are off in the companion panel; skip the per-mesh shadow work.
    avatar.root.traverse((o) => {
      o.castShadow = false;
      o.receiveShadow = false;
    });
    return { joints, base, face, faceMesh };
  }, [avatar]);
  useEffect(() => () => avatar.dispose(), [avatar]);

  // Phase 15: a sculpted head, when one has been configured.
  useEffect(() => {
    if (!HEAD_MODEL_URL) return;
    let detach: (() => void) | null = null;
    let cancelled = false;
    attachHeadModel(avatar.root, HEAD_MODEL_URL)
      .then((d) => (cancelled ? d() : (detach = d)))
      .catch(() => undefined);
    return () => {
      cancelled = true;
      detach?.();
    };
  }, [avatar]);

  // Studio reflections: a PMREM-filtered room environment, generated once
  // per canvas (no HDR download), disposed with the canvas.
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const envMap = pmrem.fromScene(room, 0.04).texture;
    const previous = scene.environment;
    scene.environment = envMap;
    return () => {
      scene.environment = previous;
      envMap.dispose();
      room.dispose?.();
      pmrem.dispose();
    };
  }, [gl, scene]);

  // Load the hologram portrait outside React's render path; the visor stays
  // dark glass until it's ready, so a slow or failed load never looks broken.
  useEffect(() => {
    let texture: THREE.Texture | null = null;
    let cancelled = false;
    new THREE.TextureLoader().load(
      FACE_TEXTURE_URL,
      (loaded) => {
        if (cancelled) {
          loaded.dispose();
          return;
        }
        loaded.colorSpace = THREE.SRGBColorSpace;
        loaded.anisotropy = fullEmissiveDetail ? 4 : 1;
        texture = loaded;
        rig.face.map = loaded;
        rig.face.emissiveMap = loaded;
        rig.face.emissiveIntensity = 1;
        rig.face.needsUpdate = true;
      },
      undefined,
      () => undefined,
    );
    return () => {
      cancelled = true;
      texture?.dispose();
    };
  }, [rig, fullEmissiveDetail]);

  const stateEnteredAt = useRef(0);
  const mountedAt = useRef<number | null>(null);
  const stateChanges = useRef(0);
  const lastState = useRef<CompanionState | null>(null);
  const look = useRef(new THREE.Vector2(0, 0));
  const nextGlanceAt = useRef(2);
  const glance = useRef(new THREE.Vector2(0, 0));
  const glowColor = useRef(new THREE.Color(PALETTE.lime));
  const targetColor = useRef(new THREE.Color(PALETTE.lime));

  useFrame((frameState, delta) => {
    const t = frameState.clock.elapsedTime;
    const nowMs = performance.now();
    const signals = robotSignals;
    const awake = state !== "sleep" && state !== "boot";
    const { joints: j, base } = rig;

    if (lastState.current !== state) {
      if (lastState.current !== null) stateChanges.current += 1;
      lastState.current = state;
      stateEnteredAt.current = t;
    }
    const stateElapsed = t - stateEnteredAt.current;
    mountedAt.current ??= t;
    // Walk-in (Phase 13): RC-01 strides into frame from the right when the
    // panel opens, then settles into its idle stance.
    const walk = Math.min(1, (t - mountedAt.current) / 1.9);
    const walking = walk < 1;
    const walkEase = 1 - Math.pow(1 - walk, 3);
    const stride = walking ? Math.sin(t * 8.5) * (1 - walkEase * 0.85) : 0;
    // Mood-change glitch: the hologram tears for a moment on each new state.
    const glitch = stateChanges.current > 0 && stateElapsed < 0.32;

    // Voice energy: word boundaries bump it; engines without boundary
    // events still get a plausible talking rhythm while speech is active.
    signals.voiceEnergy = Math.max(0, signals.voiceEnergy - delta * 3.2);
    const voice = signals.speaking
      ? Math.max(signals.voiceEnergy, 0.25 + Math.abs(Math.sin(t * 11)) * 0.35 * Math.abs(Math.sin(t * 2.7)))
      : signals.voiceEnergy;

    const gesture = signals.gesture;
    let gestureProgress = -1;
    if (gesture) {
      gestureProgress = (nowMs - gesture.startedAt) / GESTURE_DURATION_MS[gesture.name];
      if (gestureProgress >= 1) {
        signals.gesture = null;
        gestureProgress = -1;
      }
    }
    const gestureName = gestureProgress >= 0 && gesture ? gesture.name : null;
    const envelope = gestureProgress >= 0 ? Math.sin(Math.min(1, gestureProgress) * Math.PI) : 0;

    if (awake && t > nextGlanceAt.current) {
      glance.current.set((Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.3);
      nextGlanceAt.current = t + 1.8 + Math.random() * 3.2;
    }

    /** Damp a joint toward its bind pose plus an offset. */
    const pose = (name: Joint, x: number, y: number, z: number, lambda = 6) => {
      const r = j[name].rotation;
      const b = base[name];
      r.x = damp(r.x, b.x + x, lambda, delta);
      r.y = damp(r.y, b.y + y, lambda, delta);
      r.z = damp(r.z, b.z + z, lambda, delta);
    };

    // ---- Head: explicit gaze > pointer tracking > idle glances ----
    const gazeActive = signals.gaze.until > nowMs;
    const trackingAllowed = state === "idle" || state === "greeting";
    let targetX = 0;
    let targetY = 0;
    if (gazeActive) {
      targetX = signals.gaze.x * 2.2;
      targetY = signals.gaze.y * 1.6;
    } else if (trackingAllowed) {
      targetX = THREE.MathUtils.clamp(pointer.x, -1, 1) + glance.current.x;
      targetY = THREE.MathUtils.clamp(pointer.y, -1, 1) + glance.current.y;
    }
    const l = look.current;
    l.x = damp(l.x, targetX, gazeActive ? 5 : 3, delta);
    l.y = damp(l.y, targetY, gazeActive ? 5 : 3, delta);

    const maxYaw = deg(gazeActive ? 30 : 20);
    const maxPitch = deg(gazeActive ? 14 : 10);
    let headPitch = -THREE.MathUtils.clamp(l.y, -1.6, 1.6) * maxPitch;
    let headRoll = 0;
    if (gestureName === "nod") headPitch += Math.sin(gestureProgress * Math.PI * 4) * deg(14) * envelope;
    else if (gestureName === "shrug") headRoll = deg(10) * envelope;
    else if (state === "thinking") {
      headRoll = deg(9);
      headPitch -= deg(6);
    } else if (state === "sleep") headPitch = deg(22);
    const headYaw = THREE.MathUtils.clamp(l.x, -2.2, 2.2) * maxYaw;
    // Split the turn between neck and head so it reads as a real neck.
    pose("neck", headPitch * 0.35, headYaw * 0.35, headRoll * 0.4, 7);
    pose("head", headPitch * 0.65, headYaw * 0.65, headRoll * 0.6, 8);

    // ---- Body: breathing, weight shift, attention lean, scroll flinch ----
    const flinchAge = (nowMs - signals.flinchAt) / 1000;
    const flinchAmount = flinchAge < 0.6 ? Math.exp(-flinchAge * 7) : 0;
    const breath = Math.sin(t * (state === "sleep" ? 1.4 : 2.1));
    const sway = awake ? Math.sin(t * 0.45) : 0;
    const lean = deg(signals.attention * 6 - flinchAmount * 8);
    pose("hips", 0, sway * deg(3), sway * deg(1.2), 3);
    pose("spine", lean * 0.5 + breath * deg(0.8) + (state === "sleep" ? deg(6) : 0), -sway * deg(2), -sway * deg(1), 4);
    pose("chest", lean * 0.5 + breath * deg(1.2), 0, 0, 4);
    // Knees soften with the weight shift, and dip for a celebration hop.
    const hop = gestureName === "celebrate" ? Math.abs(Math.sin(gestureProgress * Math.PI * 3)) : 0;
    pose("hipL", -hop * deg(10) - stride * deg(24), 0, 0, walking ? 30 : 10);
    pose("hipR", -hop * deg(10) + stride * deg(24), 0, 0, walking ? 30 : 10);
    pose("kneeL", hop * deg(18) + Math.max(0, sway) * deg(4) + Math.max(0, stride) * deg(34), 0, 0, walking ? 30 : 10);
    pose("kneeR", hop * deg(18) + Math.max(0, -sway) * deg(4) + Math.max(0, -stride) * deg(34), 0, 0, walking ? 30 : 10);

    if (rootRef.current) {
      const bootRise = state === "boot" ? (1 - Math.min(1, stateElapsed / 0.9)) * -0.25 : 0;
      rootRef.current.position.y = damp(rootRef.current.position.y, -1.32 + bootRise + hop * 0.03, 8, delta);
      rootRef.current.position.z = damp(rootRef.current.position.z, 1.0 - flinchAmount * 0.25, 14, delta);
      rootRef.current.position.x = (1 - walkEase) * 1.7 + (glitch ? (Math.random() - 0.5) * 0.03 : 0);
      rootRef.current.rotation.y = deg(-12) - (1 - walkEase) * deg(55);
      if (walking) rootRef.current.position.y += Math.abs(Math.sin(t * 8.5)) * 0.018 * (1 - walkEase);
    }
    if (rig.faceMesh) rig.faceMesh.position.x = glitch ? (Math.random() - 0.5) * 0.012 : 0;

    // ---- Arms. raise = outward (away from the body); fwd = toward camera;
    //      bend = elbow flex. ----
    const arm = { L: { raise: 0, fwd: 0, bend: deg(6) }, R: { raise: 0, fwd: 0, bend: deg(6) } };
    const idleSwing = Math.sin(t * 1.1) * deg(2);
    arm.L.fwd = idleSwing + stride * deg(22);
    arm.R.fwd = -idleSwing - stride * deg(22);
    if (state === "greeting") {
      const lift = Math.sin(Math.min(1, stateElapsed / 0.8) * Math.PI);
      arm.R.raise = deg(70) * lift;
      arm.R.bend = deg(70) * lift;
    } else if (state === "pointing") {
      // Point toward where the tour's target actually is on the page:
      // the arm on that side, raised by how far off-centre it sits.
      const gx = gazeActive ? signals.gaze.x : 0.4;
      const gy = gazeActive ? signals.gaze.y : 0;
      const side = gx < 0 ? arm.L : arm.R;
      side.fwd = deg(55 + THREE.MathUtils.clamp(gy, -1, 1) * 25);
      side.raise = deg(10 + Math.min(1, Math.abs(gx)) * 45);
      side.bend = deg(4);
    } else if (state === "briefing") {
      const talk = Math.sin(t * 2.4);
      arm.L.fwd = deg(28 + talk * 10);
      arm.R.fwd = deg(28 - talk * 10);
      arm.L.bend = arm.R.bend = deg(55);
    } else if (state === "thinking") {
      // Hand to chin.
      arm.R.fwd = deg(40);
      arm.R.raise = deg(-8);
      arm.R.bend = deg(120);
    } else if (state === "sleep") {
      arm.L.bend = arm.R.bend = deg(2);
    }
    if (voice > 0 && state !== "thinking" && state !== "pointing") {
      arm.R.fwd += voice * deg(10);
      arm.R.bend += voice * deg(15);
    }
    const blend = (from: number, to: number) => THREE.MathUtils.lerp(from, to, envelope);
    if (gestureName === "wave") {
      arm.R.raise = blend(arm.R.raise, deg(150));
      arm.R.bend = blend(arm.R.bend, deg(40 + Math.sin(gestureProgress * Math.PI * 6) * 25));
    } else if (gestureName === "point") {
      arm.R.fwd = blend(arm.R.fwd, deg(80));
      arm.R.bend = blend(arm.R.bend, deg(4));
    } else if (gestureName === "shrug") {
      for (const s of [arm.L, arm.R]) {
        s.raise = blend(s.raise, deg(18));
        s.fwd = blend(s.fwd, deg(20));
        s.bend = blend(s.bend, deg(80));
      }
    } else if (gestureName === "celebrate") {
      const pump = deg(155 + Math.sin(gestureProgress * Math.PI * 6) * 12);
      for (const s of [arm.L, arm.R]) {
        s.raise = blend(s.raise, pump);
        s.bend = blend(s.bend, deg(25));
      }
    }
    // Left arm hangs at -x: raising it outward is -z; right arm is +z.
    // Swinging forward (+z in front) is -x on both.
    pose("upperArmL", -arm.L.fwd, 0, -arm.L.raise, 6);
    pose("upperArmR", -arm.R.fwd, 0, arm.R.raise, 6);
    pose("forearmL", -arm.L.bend, 0, 0, 7);
    pose("forearmR", -arm.R.bend, 0, 0, 7);
    pose("handL", 0, 0, 0, 6);
    pose("handR", 0, gestureName === "wave" ? deg(-20) * envelope : 0, 0, 6);

    // ---- Light strips: state colour + intensity ----
    let glowTarget = 1.1 + Math.sin(t * 1.6) * 0.12;
    let colour = PALETTE.lime;
    if (state === "boot") glowTarget = Math.random() < 0.3 ? 0.1 : THREE.MathUtils.lerp(0, 1.4, Math.min(1, stateElapsed / 0.9));
    else if (state === "thinking") glowTarget = 0.8 + Math.abs(Math.sin(t * 6)) * 1.1;
    else if (state === "error") colour = PALETTE.coral;
    else if (state === "success") glowTarget = stateElapsed < 0.4 ? 2.4 : 1.2;
    else if (state === "sleep") glowTarget = 0.15;
    else if (state === "briefing" && accentColor) colour = accentColor;
    glowTarget += voice * 0.9;
    targetColor.current.set(colour);
    glowColor.current.lerp(targetColor.current, Math.min(1, delta * 8));
    avatar.glow.emissive.copy(glowColor.current);
    avatar.glow.color.copy(glowColor.current).multiplyScalar(0.8);
    avatar.glow.emissiveIntensity = damp(avatar.glow.emissiveIntensity, glowTarget, state === "boot" ? 30 : 8, delta);

    // ---- Visor hologram: boot flicker, voice glow, error glitch, standby ----
    if (rig.face.map) {
      let target = 0.95 + voice * 0.3;
      if (state === "boot") target = Math.random() < 0.35 ? 0.1 : Math.min(1, stateElapsed / 0.9);
      else if (state === "sleep") target = 0.18;
      else if (state === "thinking") target = 0.75 + Math.abs(Math.sin(t * 9)) * 0.25;
      else if (state === "error") target = stateElapsed < 0.6 ? (Math.random() < 0.5 ? 0.3 : 1) : 0.9;
      if (glitch) target = Math.random() < 0.5 ? 0.25 : 1;
      rig.face.opacity = damp(rig.face.opacity, Math.min(1, target), state === "boot" || glitch ? 30 : 10, delta);
      rig.face.emissiveIntensity = 1 + voice * 0.5;
    }
  });

  return (
    <group>
      <group ref={rootRef} position={[0, -1.32, 1.0]} rotation={[0, deg(-12), 0]}>
        <primitive object={avatar.root} />
      </group>

      {/* Key, fill, and blue + lime rims so black chrome separates from the dark panel */}
      <ambientLight intensity={0.3} />
      <directionalLight position={[2, 3, 3]} intensity={2} />
      <directionalLight position={[-2.5, 1, 1.5]} intensity={0.6} />
      <directionalLight position={[-1, 1.5, -3]} intensity={2.4} color={PALETTE.blue} />
      <directionalLight position={[3, 0.5, -1]} intensity={1.2} color={PALETTE.lime} />
    </group>
  );
}
