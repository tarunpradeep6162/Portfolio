"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { CompanionState } from "@/lib/companion/state";

const PALETTE = {
  graphite: "#111820",
  graphiteDark: "#0a0f14",
  metal: "#3a4350",
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
}

/**
 * Procedural RC-01 geometry only - no imported meshes, no external assets.
 * A compact torso, domed head on a short neck, two articulated arms, and a
 * tripod hover base. Motion is bounded per lib/companion/state.ts's
 * documented state list; nothing here loops indefinitely except idle
 * breathing and the sleep dim, and head tracking is clamped and damped so
 * it never reads as chasing the pointer.
 */
export function RC01Model({ state, fullEmissiveDetail }: RC01ModelProps) {
  const rootRef = useRef<THREE.Group>(null);
  const torsoRef = useRef<THREE.Mesh>(null);
  const headRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const visorRef = useRef<THREE.MeshStandardMaterial>(null);
  const chestSeamRef = useRef<THREE.MeshStandardMaterial>(null);
  const baseRingRef = useRef<THREE.MeshStandardMaterial>(null);

  const pointer = useThree((s) => s.pointer);
  const bootStart = useRef<number | null>(null);
  const stateEnteredAt = useRef(0);
  const lastState = useRef<CompanionState | null>(null);

  const clampedPointer = useRef(new THREE.Vector2(0, 0));

  useFrame((frameState, delta) => {
    const t = frameState.clock.elapsedTime;

    if (lastState.current !== state) {
      lastState.current = state;
      stateEnteredAt.current = t;
      if (state === "boot") bootStart.current = t;
    }
    const stateElapsed = t - stateEnteredAt.current;

    // Head tracking: only during idle/listening, clamped to a small safe cone,
    // damped rather than snapping - restrained, not chasing.
    const trackingAllowed = state === "idle" || state === "greeting";
    const targetX = trackingAllowed ? THREE.MathUtils.clamp(pointer.x, -1, 1) : 0;
    const targetY = trackingAllowed ? THREE.MathUtils.clamp(pointer.y, -1, 1) : 0;
    const pointerDamp = clampedPointer.current;
    pointerDamp.x = damp(pointerDamp.x, targetX, 3, delta);
    pointerDamp.y = damp(pointerDamp.y, targetY, 3, delta);

    if (headRef.current) {
      const maxYaw = THREE.MathUtils.degToRad(12);
      const maxPitch = THREE.MathUtils.degToRad(6);
      headRef.current.rotation.y = pointerDamp.x * maxYaw;
      headRef.current.rotation.x = -pointerDamp.y * maxPitch;
    }

    // Breathing / boot rise on the torso.
    if (torsoRef.current) {
      let breathe = 1;
      if (state === "sleep") {
        breathe = 1 + Math.sin(t / 4.5) * 0.006;
      } else if (state === "boot") {
        const progress = Math.min(1, stateElapsed / 0.9);
        breathe = THREE.MathUtils.lerp(0.92, 1, progress);
      } else if (state === "success") {
        const progress = Math.min(1, stateElapsed / 0.5);
        breathe = 1 + Math.sin(progress * Math.PI) * 0.03;
      } else {
        breathe = 1 + Math.sin(t / 2) * 0.015;
      }
      torsoRef.current.scale.setScalar(
        damp(torsoRef.current.scale.x, breathe, 6, delta),
      );
    }

    // Arms: greeting lift once, pointing gesture, briefing alternation.
    const armRestAngle = THREE.MathUtils.degToRad(6);
    let leftTarget = armRestAngle;
    let rightTarget = armRestAngle;

    if (state === "greeting") {
      const lift = Math.min(1, stateElapsed / 0.5);
      leftTarget = THREE.MathUtils.degToRad(6 + 15 * Math.sin(lift * Math.PI));
      rightTarget = leftTarget;
    } else if (state === "pointing") {
      rightTarget = THREE.MathUtils.degToRad(55);
      leftTarget = armRestAngle;
    } else if (state === "briefing") {
      const wave = Math.sin(t * 2.4) * 10;
      leftTarget = THREE.MathUtils.degToRad(10 + wave);
      rightTarget = THREE.MathUtils.degToRad(10 - wave);
    }

    if (leftArmRef.current) {
      leftArmRef.current.rotation.z = damp(
        leftArmRef.current.rotation.z,
        leftTarget,
        5,
        delta,
      );
    }
    if (rightArmRef.current) {
      rightArmRef.current.rotation.z = damp(
        rightArmRef.current.rotation.z,
        -rightTarget,
        5,
        delta,
      );
    }

    // Visor / status light intensity per state.
    if (visorRef.current) {
      let intensity = 1.1;
      let color = PALETTE.lime;
      if (state === "boot") {
        intensity = THREE.MathUtils.lerp(0, 1.4, Math.min(1, stateElapsed / 0.9));
      } else if (state === "thinking") {
        intensity = 0.9 + Math.abs(Math.sin(t * 6)) * 0.9;
      } else if (state === "error") {
        intensity = stateElapsed < 0.6 ? 2.2 : 0.6;
        color = PALETTE.coral;
      } else if (state === "success") {
        intensity = stateElapsed < 0.4 ? 2.4 : 1.1;
      } else if (state === "sleep") {
        intensity = 0.15;
      }
      visorRef.current.emissiveIntensity = damp(
        visorRef.current.emissiveIntensity,
        intensity,
        8,
        delta,
      );
      visorRef.current.emissive.set(color);
      visorRef.current.color.set(color);
    }

    if (chestSeamRef.current) {
      chestSeamRef.current.emissiveIntensity = damp(
        chestSeamRef.current.emissiveIntensity,
        state === "sleep" ? 0.1 : 0.6,
        6,
        delta,
      );
    }
    if (baseRingRef.current) {
      baseRingRef.current.emissiveIntensity = damp(
        baseRingRef.current.emissiveIntensity,
        state === "sleep" ? 0.08 : 0.45,
        6,
        delta,
      );
    }
  });

  return (
    <group ref={rootRef} position={[0, -0.3, 0]}>
      {/* Tripod hover base */}
      <group position={[0, -1.35, 0]}>
        <mesh
          rotation={[0, 0, THREE.MathUtils.degToRad(0)]}
          position={[0.55, -0.1, 0.3]}
        >
          <cylinderGeometry args={[0.04, 0.05, 0.55, 8]} />
          <meshStandardMaterial color={PALETTE.metal} metalness={0.7} roughness={0.35} />
        </mesh>
        <mesh position={[-0.55, -0.1, 0.3]}>
          <cylinderGeometry args={[0.04, 0.05, 0.55, 8]} />
          <meshStandardMaterial color={PALETTE.metal} metalness={0.7} roughness={0.35} />
        </mesh>
        <mesh position={[0, -0.1, -0.6]}>
          <cylinderGeometry args={[0.04, 0.05, 0.55, 8]} />
          <meshStandardMaterial color={PALETTE.metal} metalness={0.7} roughness={0.35} />
        </mesh>
        <mesh position={[0, -0.4, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.5, 0.03, 12, fullEmissiveDetail ? 32 : 16]} />
          <meshStandardMaterial
            ref={baseRingRef}
            color={PALETTE.blue}
            emissive={PALETTE.blue}
            emissiveIntensity={0.45}
            metalness={0.4}
            roughness={0.4}
          />
        </mesh>
      </group>

      {/* Torso */}
      <mesh ref={torsoRef} position={[0, 0, 0]}>
        <boxGeometry args={[0.85, 1.05, 0.6]} />
        <meshStandardMaterial color={PALETTE.graphite} metalness={0.3} roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.05, 0.305]}>
        <boxGeometry args={[0.5, 0.06, 0.02]} />
        <meshStandardMaterial
          ref={chestSeamRef}
          color={PALETTE.lime}
          emissive={PALETTE.lime}
          emissiveIntensity={0.6}
        />
      </mesh>

      {/* Left arm: shoulder pivot + forearm */}
      <group ref={leftArmRef} position={[-0.5, 0.32, 0]}>
        <mesh position={[-0.18, -0.05, 0]} rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[0.09, 0.32, 4, fullEmissiveDetail ? 12 : 6]} />
          <meshStandardMaterial color={PALETTE.metal} metalness={0.6} roughness={0.4} />
        </mesh>
        <mesh position={[-0.36, -0.28, 0]} rotation={[0, 0, Math.PI / 2.6]}>
          <capsuleGeometry args={[0.075, 0.3, 4, fullEmissiveDetail ? 12 : 6]} />
          <meshStandardMaterial color={PALETTE.graphite} metalness={0.4} roughness={0.5} />
        </mesh>
        <mesh position={[-0.18, -0.05, 0]}>
          <sphereGeometry args={[0.06, fullEmissiveDetail ? 16 : 8, 8]} />
          <meshStandardMaterial
            color={PALETTE.blue}
            emissive={PALETTE.blue}
            emissiveIntensity={0.5}
          />
        </mesh>
      </group>

      {/* Right arm: mirrored */}
      <group ref={rightArmRef} position={[0.5, 0.32, 0]}>
        <mesh position={[0.18, -0.05, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <capsuleGeometry args={[0.09, 0.32, 4, fullEmissiveDetail ? 12 : 6]} />
          <meshStandardMaterial color={PALETTE.metal} metalness={0.6} roughness={0.4} />
        </mesh>
        <mesh position={[0.36, -0.28, 0]} rotation={[0, 0, -Math.PI / 2.6]}>
          <capsuleGeometry args={[0.075, 0.3, 4, fullEmissiveDetail ? 12 : 6]} />
          <meshStandardMaterial color={PALETTE.graphite} metalness={0.4} roughness={0.5} />
        </mesh>
        <mesh position={[0.18, -0.05, 0]}>
          <sphereGeometry args={[0.06, fullEmissiveDetail ? 16 : 8, 8]} />
          <meshStandardMaterial
            color={PALETTE.blue}
            emissive={PALETTE.blue}
            emissiveIntensity={0.5}
          />
        </mesh>
      </group>

      {/* Neck + head */}
      <mesh position={[0, 0.62, 0]}>
        <cylinderGeometry args={[0.08, 0.1, 0.14, 8]} />
        <meshStandardMaterial color={PALETTE.graphiteDark} metalness={0.5} roughness={0.5} />
      </mesh>
      <group ref={headRef} position={[0, 0.86, 0]}>
        <mesh>
          <boxGeometry
            args={[0.62, 0.4, 0.5]}
            // Rounded feel without a separate bevel pass - low segment sphere-mix.
          />
          <meshStandardMaterial color={PALETTE.graphite} metalness={0.3} roughness={0.5} />
        </mesh>
        <mesh position={[0, -0.02, 0.255]}>
          <boxGeometry args={[0.42, 0.08, 0.03]} />
          <meshStandardMaterial
            ref={visorRef}
            color={PALETTE.lime}
            emissive={PALETTE.lime}
            emissiveIntensity={1.1}
            toneMapped={false}
          />
        </mesh>
        <mesh position={[0, 0.22, 0]}>
          <sphereGeometry args={[0.32, fullEmissiveDetail ? 24 : 12, fullEmissiveDetail ? 16 : 8]} />
          <meshStandardMaterial color={PALETTE.graphite} metalness={0.35} roughness={0.45} />
        </mesh>
      </group>

      <ambientLight intensity={1.1} />
      <directionalLight position={[2, 3, 2.5]} intensity={1.6} />
      <directionalLight position={[-2, 1, 2]} intensity={0.6} />
      <pointLight position={[-1.5, 0.5, 1.8]} intensity={0.6} color={PALETTE.blue} />
      <pointLight position={[0, -0.5, 2]} intensity={0.5} color={PALETTE.lime} />
    </group>
  );
}
