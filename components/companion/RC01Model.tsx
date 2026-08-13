"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { CompanionState } from "@/lib/companion/state";

const PALETTE = {
  graphite: "#131b24",
  graphiteDark: "#0a0f14",
  // Lighter than "graphite" specifically to break the v5.0 black-on-black
  // silhouette problem: a mid-tone chest/head panel insert that still reads
  // as dark chassis, but separates from the near-black background.
  panel: "#232e3a",
  metal: "#4a5563",
  steel: "#6b7684",
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
  /** Project-specific visor accent during a project briefing (v5.1). */
  accentColor?: string;
}

/**
 * Procedural RC-01 geometry only - no imported meshes, no external assets.
 * v5.1 revision: adds the waist/lower-body connector and hover-base detail
 * that v5.0 was missing (torso floated with an empty gap above the tripod),
 * shoulder pauldrons and a head sensor mast for a stronger silhouette and
 * more mechanical detail, and a lighter "panel" accent color so the model
 * reads as lit chassis rather than black-on-black. The whole assembly is
 * scaled down and the camera reframed (see CompanionCanvas.tsx) to fix the
 * v5.0 head/base cropping.
 */
export function RC01Model({ state, fullEmissiveDetail, accentColor }: RC01ModelProps) {
  const rootRef = useRef<THREE.Group>(null);
  const torsoRef = useRef<THREE.Mesh>(null);
  const headRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const visorRef = useRef<THREE.MeshStandardMaterial>(null);
  const chestSeamRef = useRef<THREE.MeshStandardMaterial>(null);
  const baseRingRef = useRef<THREE.MeshStandardMaterial>(null);
  const sensorRef = useRef<THREE.MeshStandardMaterial>(null);
  const footGlowRefs = useRef<THREE.MeshStandardMaterial[]>([]);

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
      } else if (state === "briefing" && accentColor) {
        color = accentColor;
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
        state === "sleep" ? 0.1 : 0.65,
        6,
        delta,
      );
    }
    if (baseRingRef.current) {
      baseRingRef.current.emissiveIntensity = damp(
        baseRingRef.current.emissiveIntensity,
        state === "sleep" ? 0.08 : 0.5,
        6,
        delta,
      );
    }
    if (sensorRef.current) {
      const pulse = state === "thinking" ? 0.6 + Math.abs(Math.sin(t * 6)) * 0.7 : 0.55;
      sensorRef.current.emissiveIntensity = damp(
        sensorRef.current.emissiveIntensity,
        state === "sleep" ? 0.08 : pulse,
        6,
        delta,
      );
    }
    for (const mat of footGlowRefs.current) {
      if (!mat) continue;
      mat.emissiveIntensity = damp(
        mat.emissiveIntensity,
        state === "sleep" ? 0.05 : 0.4 + Math.sin(t * 1.6) * 0.08,
        4,
        delta,
      );
    }
  });

  const segLow = fullEmissiveDetail ? 12 : 6;
  const segMid = fullEmissiveDetail ? 16 : 8;
  const segHigh = fullEmissiveDetail ? 24 : 12;

  return (
    <group ref={rootRef} scale={0.54} position={[0, 0.32, 0]}>
      {/* Hover base: tripod legs, foot repulsor pads, and an under-glow ring */}
      <group position={[0, -1.55, 0]}>
        {[
          { x: 0.55, z: 0.32 },
          { x: -0.55, z: 0.32 },
          { x: 0, z: -0.62 },
        ].map((leg, i) => (
          <group key={i}>
            <mesh position={[leg.x, -0.16, leg.z]}>
              <cylinderGeometry args={[0.05, 0.065, 0.6, 8]} />
              <meshStandardMaterial color={PALETTE.metal} metalness={0.75} roughness={0.3} />
            </mesh>
          </group>
        ))}
        {/* One shared foot-glow disc rather than a pad per leg - keeps the
            hover-repulsor read at a third of the draw-call cost. */}
        <mesh position={[0, -0.44, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.08, 0.42, segMid * 2]} />
          <meshStandardMaterial
            ref={(m) => {
              if (m) footGlowRefs.current[0] = m;
            }}
            color={PALETTE.blue}
            emissive={PALETTE.blue}
            emissiveIntensity={0.35}
            metalness={0.3}
            roughness={0.5}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh position={[0, -0.14, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.52, 0.045, 12, segMid * 2]} />
          <meshStandardMaterial
            ref={baseRingRef}
            color={PALETTE.blue}
            emissive={PALETTE.blue}
            emissiveIntensity={0.5}
            metalness={0.4}
            roughness={0.35}
          />
        </mesh>
        <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.46, segMid * 2]} />
          <meshBasicMaterial color={PALETTE.blue} transparent opacity={0.06} />
        </mesh>
      </group>

      {/* Waist / lower-body connector - bridges the torso to the hover base,
          the piece v5.0 was missing entirely (a bare gap in its place). */}
      <mesh position={[0, -0.92, 0]}>
        <cylinderGeometry args={[0.22, 0.32, 0.62, segMid]} />
        <meshStandardMaterial color={PALETTE.metal} metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, -1.14, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.3, 0.02, 8, segMid]} />
        <meshStandardMaterial color={PALETTE.steel} metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Torso: two-tone chassis (darker frame + lighter chest panel insert) */}
      <mesh ref={torsoRef} position={[0, -0.28, 0]}>
        <boxGeometry args={[0.86, 1.0, 0.58]} />
        <meshStandardMaterial color={PALETTE.graphite} metalness={0.3} roughness={0.55} />
      </mesh>
      <mesh position={[0, -0.22, 0.3]}>
        <boxGeometry args={[0.58, 0.72, 0.02]} />
        <meshStandardMaterial color={PALETTE.panel} metalness={0.35} roughness={0.45} />
      </mesh>
      <mesh position={[0, 0.04, 0.31]}>
        <boxGeometry args={[0.5, 0.06, 0.02]} />
        <meshStandardMaterial
          ref={chestSeamRef}
          color={PALETTE.lime}
          emissive={PALETTE.lime}
          emissiveIntensity={0.65}
        />
      </mesh>
      {/* Side vent greeble - one per side breaks up the flat torso faces
          without the draw-call cost of a full grille. */}
      {[-0.435, 0.435].map((x, i) => (
        <mesh key={i} position={[x, -0.06, 0.05]}>
          <boxGeometry args={[0.02, 0.28, 0.22]} />
          <meshStandardMaterial color={PALETTE.steel} metalness={0.7} roughness={0.3} />
        </mesh>
      ))}

      {/* Shoulder pauldrons - mechanical caps at each arm socket */}
      {[-0.5, 0.5].map((x, i) => (
        <mesh key={i} position={[x, 0.14, 0]}>
          <sphereGeometry args={[0.19, segMid, segLow, 0, Math.PI * 2, 0, Math.PI / 1.7]} />
          <meshStandardMaterial color={PALETTE.metal} metalness={0.65} roughness={0.35} />
        </mesh>
      ))}

      {/* Left arm: shoulder capsule + elbow joint + forearm + wrist paddle */}
      <group ref={leftArmRef} position={[-0.5, 0.08, 0]}>
        <mesh position={[-0.19, -0.06, 0]} rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[0.09, 0.32, 4, segLow]} />
          <meshStandardMaterial color={PALETTE.metal} metalness={0.6} roughness={0.4} />
        </mesh>
        <mesh position={[-0.38, -0.3, 0]}>
          <sphereGeometry args={[0.075, segMid, segLow]} />
          <meshStandardMaterial
            color={PALETTE.blue}
            emissive={PALETTE.blue}
            emissiveIntensity={0.55}
          />
        </mesh>
        <mesh position={[-0.56, -0.52, 0]} rotation={[0, 0, Math.PI / 2.6]}>
          <capsuleGeometry args={[0.065, 0.28, 4, segLow]} />
          <meshStandardMaterial color={PALETTE.graphite} metalness={0.4} roughness={0.5} />
        </mesh>
        <mesh position={[-0.68, -0.72, 0]}>
          <boxGeometry args={[0.16, 0.05, 0.1]} />
          <meshStandardMaterial color={PALETTE.steel} metalness={0.7} roughness={0.3} />
        </mesh>
      </group>

      {/* Right arm: mirrored */}
      <group ref={rightArmRef} position={[0.5, 0.08, 0]}>
        <mesh position={[0.19, -0.06, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <capsuleGeometry args={[0.09, 0.32, 4, segLow]} />
          <meshStandardMaterial color={PALETTE.metal} metalness={0.6} roughness={0.4} />
        </mesh>
        <mesh position={[0.38, -0.3, 0]}>
          <sphereGeometry args={[0.075, segMid, segLow]} />
          <meshStandardMaterial
            color={PALETTE.blue}
            emissive={PALETTE.blue}
            emissiveIntensity={0.55}
          />
        </mesh>
        <mesh position={[0.56, -0.52, 0]} rotation={[0, 0, -Math.PI / 2.6]}>
          <capsuleGeometry args={[0.065, 0.28, 4, segLow]} />
          <meshStandardMaterial color={PALETTE.graphite} metalness={0.4} roughness={0.5} />
        </mesh>
        <mesh position={[0.68, -0.72, 0]}>
          <boxGeometry args={[0.16, 0.05, 0.1]} />
          <meshStandardMaterial color={PALETTE.steel} metalness={0.7} roughness={0.3} />
        </mesh>
      </group>

      {/* Neck collar with a lighter steel accent ring */}
      <mesh position={[0, 0.28, 0]}>
        <cylinderGeometry args={[0.09, 0.11, 0.16, segLow]} />
        <meshStandardMaterial color={PALETTE.graphiteDark} metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.34, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.1, 0.015, 8, segLow]} />
        <meshStandardMaterial color={PALETTE.steel} metalness={0.75} roughness={0.25} />
      </mesh>

      {/* Head: domed sensor housing, visor band, brow ridge, side vents, sensor mast */}
      <group ref={headRef} position={[0, 0.56, 0]}>
        <mesh position={[0, 0.06, 0]}>
          <sphereGeometry args={[0.34, segHigh, segMid]} />
          <meshStandardMaterial color={PALETTE.graphite} metalness={0.35} roughness={0.45} />
        </mesh>
        {/*
          Both the brow ridge and visor are mounted proud of the head
          sphere's surface (not flush) - the sphere bulges forward more at
          its horizontal center than at its edges, so a flush-mounted flat
          panel gets partly swallowed by the curve at its center while its
          edges still poke through, which reads as two separate glowing
          dots ("eyes") instead of one continuous visor bar. Mounting both
          proud of the sphere's z-extent at x=0 (the worst case) guarantees
          the whole width of each panel is visible along its full length.
        */}
        <mesh position={[0, 0.2, 0.34]}>
          <boxGeometry args={[0.46, 0.04, 0.05]} />
          <meshStandardMaterial color={PALETTE.panel} metalness={0.4} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.03, 0.37]}>
          <boxGeometry args={[0.42, 0.09, 0.03]} />
          <meshStandardMaterial
            ref={visorRef}
            color={PALETTE.lime}
            emissive={PALETTE.lime}
            emissiveIntensity={1.1}
            toneMapped={false}
          />
        </mesh>
        {/* Side sensor vents */}
        {[-0.33, 0.33].map((x, i) => (
          <mesh key={i} position={[x, 0.02, 0.02]}>
            <boxGeometry args={[0.03, 0.14, 0.16]} />
            <meshStandardMaterial color={PALETTE.steel} metalness={0.7} roughness={0.3} />
          </mesh>
        ))}
        {/* Sensor mast - small antenna on the crown, breaks up the top silhouette */}
        <mesh position={[0, 0.34, -0.02]}>
          <cylinderGeometry args={[0.015, 0.02, 0.16, 6]} />
          <meshStandardMaterial color={PALETTE.metal} metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.43, -0.02]}>
          <sphereGeometry args={[0.035, segLow, segLow]} />
          <meshStandardMaterial
            ref={sensorRef}
            color={PALETTE.blue}
            emissive={PALETTE.blue}
            emissiveIntensity={0.55}
            toneMapped={false}
          />
        </mesh>
      </group>

      {/* Lighting: bright enough to separate the chassis from the dark
          Observatory backdrop, plus a rim light from behind-below for edge
          definition against the panel's own dark gradient. */}
      <ambientLight intensity={1.3} />
      <directionalLight position={[2, 3, 2.5]} intensity={1.7} />
      <directionalLight position={[-2, 1, 2]} intensity={0.7} />
      <directionalLight position={[0, -0.5, -2.5]} intensity={0.5} color={PALETTE.blue} />
      <pointLight position={[-1.5, 0.5, 1.8]} intensity={0.65} color={PALETTE.blue} />
      <pointLight position={[0, -0.5, 2]} intensity={0.55} color={PALETTE.lime} />
    </group>
  );
}
