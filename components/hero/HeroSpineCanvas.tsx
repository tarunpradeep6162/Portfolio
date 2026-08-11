"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { spineStages } from "@/content/spine";
import { useAdaptiveQuality } from "@/lib/three/useAdaptiveQuality";

const ACCENT = new THREE.Color("#ff6b45");
const PACKET = new THREE.Color("#2f7cff");
const STEEL = new THREE.Color("#8797a5");

function SpineTopology() {
  const group = useRef<THREE.Group>(null);

  // Eight nodes on a gentle arc, biased to the right and pushed back in z so
  // the topology sits in the hero's open space rather than behind the text
  // column - a CSS mask on the canvas wrapper reinforces this (see below).
  const positions = useMemo(() => {
    const count = spineStages.length;
    return spineStages.map((_, i) => {
      const t = i / (count - 1);
      const x = (t - 0.5) * 6 + 2.5;
      const y = Math.sin(t * Math.PI) * 0.7 - 0.3;
      return new THREE.Vector3(x, y, -1.5);
    });
  }, []);

  const linePositions = useMemo(() => {
    const arr = new Float32Array(positions.length * 3);
    positions.forEach((p, i) => p.toArray(arr, i * 3));
    return arr;
  }, [positions]);

  useFrame((state) => {
    if (!group.current) return;
    // Idle drift only - no pointer-following, no orbit controls (spec: "restrained").
    group.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.08) * 0.06;
  });

  return (
    <group ref={group}>
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[linePositions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color={STEEL} transparent opacity={0.25} />
      </line>
      {positions.map((pos, i) => (
        <mesh key={spineStages[i].id} position={pos}>
          <sphereGeometry args={[0.12, 24, 24]} />
          <meshStandardMaterial
            color={i % 2 === 0 ? ACCENT : PACKET}
            emissive={i % 2 === 0 ? ACCENT : PACKET}
            emissiveIntensity={0.35}
            roughness={0.4}
            transparent
            opacity={0.85}
          />
        </mesh>
      ))}
    </group>
  );
}

/**
 * The R3F scene itself. Only ever mounted by HeroSpineLoader (which gates
 * on WebGL support, motion preference, and viewport). Frame loop pauses
 * when the tab/canvas isn't visible; DPR is capped; no post-processing,
 * bloom, or large particle counts (spec §16 performance budget).
 */
export default function HeroSpineCanvas() {
  const { dpr, visible } = useAdaptiveQuality();

  return (
    <div
      className="pointer-events-none absolute inset-0"
      aria-hidden
      style={{
        // Belt-and-suspenders legibility guard: fades the canvas out over the
        // text column regardless of exact 3D node placement or viewport width.
        maskImage: "linear-gradient(to right, transparent, transparent 46%, black 68%)",
        WebkitMaskImage: "linear-gradient(to right, transparent, transparent 46%, black 68%)",
      }}
    >
      <Canvas
        dpr={dpr}
        frameloop={visible ? "always" : "never"}
        gl={{ antialias: true, powerPreference: "low-power" }}
        camera={{ position: [0, 0, 6], fov: 40 }}
      >
        <ambientLight intensity={0.6} />
        <pointLight position={[4, 4, 4]} intensity={0.8} />
        <SpineTopology />
      </Canvas>
    </div>
  );
}
