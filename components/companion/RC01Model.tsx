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

const PALETTE = {
  shell: "#eef1f4",
  shellShade: "#c9d0d8",
  joint: "#2a323c",
  glass: "#05080c",
  lime: "#d8ff4f",
  blue: "#748cff",
  coral: "#ff6847",
};

function damp(current: number, target: number, lambda: number, delta: number) {
  return THREE.MathUtils.damp(current, target, lambda, delta);
}

interface RC01ModelProps {
  state: CompanionState;
  fullEmissiveDetail: boolean;
  /** Project-specific eye accent during a project briefing (v5.1). */
  accentColor?: string;
}

/**
 * RC-01, v7: a glossy companion robot - clear-coated white shell, a black
 * glass face screen with two expressive emissive eyes and a speech bar,
 * floating arms, antenna, ear lights and a hover thruster - lit by a
 * procedural studio environment map so the shell has real reflections.
 * Still fully procedural (no downloaded meshes); all body language is
 * driven by `robotSignals` + the companion state machine.
 */
export function RC01Model({ state, fullEmissiveDetail, accentColor }: RC01ModelProps) {
  const rootRef = useRef<THREE.Group>(null);
  const torsoRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const eyesRef = useRef<THREE.Group>(null);
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);
  const mouthRef = useRef<THREE.Mesh>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const thrusterRef = useRef<THREE.Mesh>(null);

  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const pointer = useThree((s) => s.pointer);

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

  const materials = useMemo(
    () => ({
      shell: new THREE.MeshPhysicalMaterial({
        color: PALETTE.shell,
        roughness: 0.28,
        metalness: 0.05,
        clearcoat: 1,
        clearcoatRoughness: 0.08,
        envMapIntensity: 1.1,
      }),
      shellShade: new THREE.MeshPhysicalMaterial({
        color: PALETTE.shellShade,
        roughness: 0.35,
        metalness: 0.1,
        clearcoat: 0.6,
      }),
      joint: new THREE.MeshStandardMaterial({ color: PALETTE.joint, roughness: 0.4, metalness: 0.8 }),
      glass: new THREE.MeshPhysicalMaterial({
        color: PALETTE.glass,
        roughness: 0.05,
        metalness: 0.2,
        clearcoat: 1,
        clearcoatRoughness: 0.02,
        envMapIntensity: 1.6,
      }),
      eye: new THREE.MeshStandardMaterial({
        color: PALETTE.lime,
        emissive: PALETTE.lime,
        emissiveIntensity: 1.6,
        toneMapped: false,
      }),
      mouth: new THREE.MeshBasicMaterial({
        color: PALETTE.lime,
        transparent: true,
        opacity: 0.3,
        toneMapped: false,
      }),
      accent: new THREE.MeshStandardMaterial({
        color: PALETTE.blue,
        emissive: PALETTE.blue,
        emissiveIntensity: 0.8,
        toneMapped: false,
      }),
      chest: new THREE.MeshStandardMaterial({
        color: PALETTE.lime,
        emissive: PALETTE.lime,
        emissiveIntensity: 0.8,
        toneMapped: false,
      }),
      thruster: new THREE.MeshBasicMaterial({
        color: PALETTE.blue,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
      groundGlow: new THREE.MeshBasicMaterial({
        color: PALETTE.blue,
        transparent: true,
        opacity: 0.12,
        depthWrite: false,
      }),
    }),
    [],
  );
  useEffect(() => () => Object.values(materials).forEach((m) => m.dispose()), [materials]);

  const stateEnteredAt = useRef(0);
  const lastState = useRef<CompanionState | null>(null);
  const look = useRef(new THREE.Vector2(0, 0));
  const nextBlinkAt = useRef(1.5);
  const blinkStart = useRef(-1);
  const nextGlanceAt = useRef(2);
  const glance = useRef(new THREE.Vector2(0, 0));
  const eyeColor = useRef(new THREE.Color(PALETTE.lime));
  const targetColor = useRef(new THREE.Color(PALETTE.lime));

  useFrame((frameState, delta) => {
    const t = frameState.clock.elapsedTime;
    const nowMs = performance.now();
    const signals = robotSignals;
    const awake = state !== "sleep" && state !== "boot";

    if (lastState.current !== state) {
      lastState.current = state;
      stateEnteredAt.current = t;
    }
    const stateElapsed = t - stateEnteredAt.current;

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

    if (headRef.current) {
      const maxYaw = THREE.MathUtils.degToRad(gazeActive ? 28 : 16);
      const maxPitch = THREE.MathUtils.degToRad(gazeActive ? 12 : 8);
      let pitch = -THREE.MathUtils.clamp(l.y, -1.6, 1.6) * maxPitch;
      let roll = 0;
      if (gestureName === "nod") {
        pitch += Math.sin(gestureProgress * Math.PI * 4) * THREE.MathUtils.degToRad(12) * envelope;
      } else if (gestureName === "shrug") {
        roll = THREE.MathUtils.degToRad(10) * envelope;
      } else if (state === "thinking") {
        roll = THREE.MathUtils.degToRad(8);
      } else if (state === "sleep") {
        pitch = THREE.MathUtils.degToRad(14);
      }
      headRef.current.rotation.y = THREE.MathUtils.clamp(l.x, -2.2, 2.2) * maxYaw;
      headRef.current.rotation.x = damp(headRef.current.rotation.x, pitch, 8, delta);
      headRef.current.rotation.z = damp(headRef.current.rotation.z, roll, 6, delta);
    }

    // Eyes also slide across the face screen - small, but it's what makes
    // the gaze read as intentional rather than the whole head swivelling.
    if (eyesRef.current) {
      eyesRef.current.position.x = damp(eyesRef.current.position.x, THREE.MathUtils.clamp(l.x, -1, 1) * 0.05, 10, delta);
      eyesRef.current.position.y = damp(eyesRef.current.position.y, THREE.MathUtils.clamp(l.y, -1, 1) * 0.03, 10, delta);
    }

    // ---- Eye shape = emotion; blink = quick squash ----
    if (awake && t > nextBlinkAt.current) {
      blinkStart.current = t;
      nextBlinkAt.current = t + (Math.random() < 0.2 ? 0.25 : 2.5 + Math.random() * 4);
    }
    const blinkAge = t - blinkStart.current;
    const blink = blinkStart.current >= 0 && blinkAge < 0.14 ? Math.sin((blinkAge / 0.14) * Math.PI) : 0;
    let eyeHeight = 1;
    let eyeTilt = 0;
    if (state === "sleep") eyeHeight = 0.12;
    else if (state === "boot") eyeHeight = Math.max(0.1, Math.min(1, stateElapsed / 0.9));
    else if (state === "success" || gestureName === "celebrate" || gestureName === "wave") eyeHeight = 0.45;
    else if (state === "thinking") eyeHeight = 0.7;
    else if (state === "error") eyeTilt = 0.35;
    const eyeScaleY = Math.max(0.08, eyeHeight * (1 - blink * 0.9));
    const eyes: Array<[THREE.Mesh | null, number]> = [
      [leftEyeRef.current, -1],
      [rightEyeRef.current, 1],
    ];
    for (const [eye, side] of eyes) {
      if (!eye) continue;
      eye.scale.y = damp(eye.scale.y, eyeScaleY, blink > 0 ? 40 : 12, delta);
      eye.rotation.z = damp(eye.rotation.z, eyeTilt * side, 10, delta);
    }
    if (mouthRef.current) {
      mouthRef.current.scale.x = damp(mouthRef.current.scale.x, 0.5 + voice * 1.6, 18, delta);
      mouthRef.current.scale.y = damp(mouthRef.current.scale.y, 0.35 + voice * 0.9, 18, delta);
    }
    materials.mouth.opacity = 0.25 + voice * 0.75;

    // ---- Body: hover bob, sway, attention lean, scroll flinch ----
    if (rootRef.current) {
      const flinchAge = (nowMs - signals.flinchAt) / 1000;
      const flinchAmount = flinchAge < 0.6 ? Math.exp(-flinchAge * 7) : 0;
      const hop = gestureName === "celebrate" ? Math.abs(Math.sin(gestureProgress * Math.PI * 3)) * 0.08 : 0;
      const bootRise = state === "boot" ? (1 - Math.min(1, stateElapsed / 0.9)) * -0.2 : 0;
      const bob = state === "sleep" ? -0.05 : Math.sin(t * 1.4) * 0.03;
      rootRef.current.position.y = damp(rootRef.current.position.y, 0.1 + bob + hop + bootRise, 8, delta);
      rootRef.current.position.z = damp(rootRef.current.position.z, -flinchAmount * 0.25, 14, delta);
      rootRef.current.rotation.z = damp(
        rootRef.current.rotation.z,
        awake ? Math.sin(t * 0.45) * THREE.MathUtils.degToRad(2) : 0,
        2,
        delta,
      );
      const lean = THREE.MathUtils.degToRad(signals.attention * 7 - flinchAmount * 9);
      rootRef.current.rotation.x = damp(rootRef.current.rotation.x, lean, 4, delta);
    }
    if (torsoRef.current) {
      const breathe = state === "sleep" ? 1 + Math.sin(t / 4.5) * 0.006 : 1 + Math.sin(t / 2) * 0.012;
      torsoRef.current.scale.setScalar(damp(torsoRef.current.scale.x, breathe, 6, delta));
    }

    // ---- Arms (positive = raised outward) ----
    const rest = THREE.MathUtils.degToRad(8);
    let leftTarget = rest + Math.sin(t * 1.4 + 0.6) * 0.03;
    let rightTarget = rest + Math.sin(t * 1.4) * 0.03;
    if (state === "greeting") {
      const lift = Math.min(1, stateElapsed / 0.5);
      leftTarget = rightTarget = THREE.MathUtils.degToRad(8 + 20 * Math.sin(lift * Math.PI));
    } else if (state === "pointing") {
      rightTarget = THREE.MathUtils.degToRad(65);
    } else if (state === "briefing") {
      const talk = Math.sin(t * 2.4) * 12;
      leftTarget = THREE.MathUtils.degToRad(14 + talk);
      rightTarget = THREE.MathUtils.degToRad(14 - talk);
    } else if (state === "thinking") {
      rightTarget = THREE.MathUtils.degToRad(38);
    }
    if (gestureName === "wave") {
      rightTarget = THREE.MathUtils.lerp(
        rightTarget,
        THREE.MathUtils.degToRad(130 + Math.sin(gestureProgress * Math.PI * 6) * 20),
        envelope,
      );
    } else if (gestureName === "point") {
      rightTarget = THREE.MathUtils.lerp(rightTarget, THREE.MathUtils.degToRad(75), envelope);
    } else if (gestureName === "shrug") {
      leftTarget = THREE.MathUtils.lerp(leftTarget, THREE.MathUtils.degToRad(38), envelope);
      rightTarget = THREE.MathUtils.lerp(rightTarget, THREE.MathUtils.degToRad(38), envelope);
    } else if (gestureName === "celebrate") {
      const pump = THREE.MathUtils.degToRad(120 + Math.sin(gestureProgress * Math.PI * 6) * 15);
      leftTarget = THREE.MathUtils.lerp(leftTarget, pump, envelope);
      rightTarget = THREE.MathUtils.lerp(rightTarget, pump, envelope);
    }
    if (leftArmRef.current) leftArmRef.current.rotation.z = damp(leftArmRef.current.rotation.z, -leftTarget, 5, delta);
    if (rightArmRef.current) rightArmRef.current.rotation.z = damp(rightArmRef.current.rotation.z, rightTarget, 5, delta);

    // ---- Lights ----
    let eyeIntensity = 1.6;
    let target = PALETTE.lime;
    if (state === "boot") eyeIntensity = THREE.MathUtils.lerp(0, 1.8, Math.min(1, stateElapsed / 0.9));
    else if (state === "thinking") eyeIntensity = 1.2 + Math.abs(Math.sin(t * 6)) * 0.9;
    else if (state === "error") target = PALETTE.coral;
    else if (state === "success") eyeIntensity = stateElapsed < 0.4 ? 2.8 : 1.6;
    else if (state === "sleep") eyeIntensity = 0.3;
    else if (state === "briefing" && accentColor) target = accentColor;
    eyeIntensity += voice * 0.8;
    targetColor.current.set(target);
    eyeColor.current.lerp(targetColor.current, Math.min(1, delta * 8));
    materials.eye.color.copy(eyeColor.current);
    materials.eye.emissive.copy(eyeColor.current);
    materials.eye.emissiveIntensity = damp(materials.eye.emissiveIntensity, eyeIntensity, 8, delta);
    materials.mouth.color.copy(eyeColor.current);

    const pulse = state === "thinking" ? 0.8 + Math.abs(Math.sin(t * 6)) * 1.2 : 0.8 + Math.sin(t * 1.6) * 0.15;
    materials.accent.emissiveIntensity = damp(
      materials.accent.emissiveIntensity,
      state === "sleep" ? 0.1 : pulse,
      6,
      delta,
    );
    materials.chest.emissiveIntensity = damp(
      materials.chest.emissiveIntensity,
      state === "sleep" ? 0.1 : 0.7 + voice * 1.2,
      8,
      delta,
    );
    if (thrusterRef.current) {
      const flicker = 1 + Math.sin(t * 23) * 0.05 + Math.sin(t * 37) * 0.04;
      const power = state === "sleep" ? 0.35 : 1;
      thrusterRef.current.scale.set(power * flicker, power * (1.05 + Math.sin(t * 1.4) * 0.12), power * flicker);
      materials.thruster.opacity = state === "sleep" ? 0.1 : 0.3 + Math.sin(t * 17) * 0.04;
    }
  });

  const seg = fullEmissiveDetail ? 48 : 24;
  const segLow = fullEmissiveDetail ? 24 : 12;

  return (
    <group ref={rootRef} scale={0.62} position={[0, 0.1, 0]}>
      {/* ---------------- Head ---------------- */}
      <group ref={headRef} position={[0, 0.62, 0]}>
        {/* Shell: slightly wide, rounded helmet */}
        <mesh material={materials.shell} scale={[1.18, 0.98, 1]}>
          <sphereGeometry args={[0.44, seg, seg]} />
        </mesh>
        {/* Face screen: black glass set into the front of the helmet */}
        <mesh material={materials.glass} position={[0, -0.02, 0.2]} scale={[1.04, 0.72, 0.62]}>
          <sphereGeometry args={[0.4, seg, seg]} />
        </mesh>
        {/* Eyes + speech bar, just proud of the glass */}
        <group position={[0, 0, 0.455]}>
          <group ref={eyesRef}>
            <mesh ref={leftEyeRef} material={materials.eye} position={[-0.14, 0.03, 0]}>
              <capsuleGeometry args={[0.06, 0.05, 8, segLow]} />
            </mesh>
            <mesh ref={rightEyeRef} material={materials.eye} position={[0.14, 0.03, 0]}>
              <capsuleGeometry args={[0.06, 0.05, 8, segLow]} />
            </mesh>
          </group>
          <mesh ref={mouthRef} material={materials.mouth} position={[0, -0.125, -0.01]} rotation={[0, 0, Math.PI / 2]}>
            <capsuleGeometry args={[0.012, 0.09, 4, 8]} />
          </mesh>
        </group>
        {/* Ear pods with light rings */}
        {[-1, 1].map((side) => (
          <group key={side} position={[side * 0.5, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <mesh material={materials.shellShade}>
              <cylinderGeometry args={[0.12, 0.12, 0.09, segLow]} />
            </mesh>
            <mesh material={materials.accent} position={[0, -side * 0.047, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.078, 0.012, 8, segLow * 2]} />
            </mesh>
          </group>
        ))}
        {/* Antenna */}
        <mesh material={materials.joint} position={[0.12, 0.47, -0.05]} rotation={[0, 0, -0.2]}>
          <cylinderGeometry args={[0.012, 0.016, 0.2, 8]} />
        </mesh>
        <mesh material={materials.accent} position={[0.14, 0.58, -0.05]}>
          <sphereGeometry args={[0.035, segLow, segLow]} />
        </mesh>
      </group>

      {/* Neck */}
      <mesh material={materials.joint} position={[0, 0.17, 0]}>
        <cylinderGeometry args={[0.09, 0.12, 0.12, segLow]} />
      </mesh>

      {/* ---------------- Body: egg-shaped torso ---------------- */}
      <group ref={torsoRef} position={[0, -0.34, 0]}>
        <mesh material={materials.shell} scale={[0.95, 1.15, 0.85]}>
          <sphereGeometry args={[0.42, seg, seg]} />
        </mesh>
        <mesh material={materials.shellShade} position={[0, 0.38, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.24, 0.035, 12, seg]} />
        </mesh>
        {/* Chest light */}
        <mesh material={materials.glass} position={[0, 0.06, 0.33]} scale={[1, 1, 0.35]}>
          <sphereGeometry args={[0.1, segLow, segLow]} />
        </mesh>
        <mesh material={materials.chest} position={[0, 0.06, 0.365]}>
          <torusGeometry args={[0.055, 0.012, 8, segLow * 2]} />
        </mesh>
        <mesh material={materials.joint} position={[0, -0.18, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.37, 0.012, 8, seg]} />
        </mesh>
      </group>

      {/* ---------------- Floating arms (pivot at shoulder) ---------------- */}
      <group ref={leftArmRef} position={[-0.46, -0.08, 0]}>
        <Arm side={-1} materials={materials} segLow={segLow} />
      </group>
      <group ref={rightArmRef} position={[0.46, -0.08, 0]}>
        <Arm side={1} materials={materials} segLow={segLow} />
      </group>

      {/* ---------------- Hover thruster ---------------- */}
      <group position={[0, -0.9, 0]}>
        <mesh material={materials.joint}>
          <cylinderGeometry args={[0.16, 0.1, 0.08, segLow]} />
        </mesh>
        <mesh material={materials.accent} position={[0, -0.045, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.1, 0.014, 8, segLow * 2]} />
        </mesh>
        <mesh ref={thrusterRef} material={materials.thruster} position={[0, -0.15, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.13, 0.22, segLow, 1, true]} />
        </mesh>
      </group>
      <mesh material={materials.groundGlow} position={[0, -1.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.45, seg]} />
      </mesh>

      {/* Key, fill, and a blue rim for separation from the dark panel */}
      <ambientLight intensity={0.35} />
      <directionalLight position={[2, 3, 3]} intensity={1.8} />
      <directionalLight position={[-2.5, 1, 1.5]} intensity={0.5} />
      <directionalLight position={[0, 1, -3]} intensity={1.2} color={PALETTE.blue} />
      <pointLight position={[0, 0.3, 1.2]} intensity={0.4} color={PALETTE.lime} distance={3} />
    </group>
  );
}

function Arm({
  side,
  materials,
  segLow,
}: {
  side: number;
  materials: {
    joint: THREE.Material;
    shell: THREE.Material;
    shellShade: THREE.Material;
    accent: THREE.Material;
  };
  segLow: number;
}) {
  return (
    <>
      <mesh material={materials.joint} position={[side * 0.02, 0, 0]}>
        <sphereGeometry args={[0.07, segLow, segLow]} />
      </mesh>
      <mesh material={materials.shell} position={[side * 0.08, -0.26, 0]} rotation={[0, 0, side * 0.12]}>
        <capsuleGeometry args={[0.075, 0.3, 8, segLow]} />
      </mesh>
      <mesh material={materials.shellShade} position={[side * 0.12, -0.5, 0]}>
        <sphereGeometry args={[0.082, segLow, segLow]} />
      </mesh>
      <mesh material={materials.accent} position={[side * 0.125, -0.575, 0.02]}>
        <sphereGeometry args={[0.02, 8, 8]} />
      </mesh>
    </>
  );
}
