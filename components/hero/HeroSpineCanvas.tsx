"use client";

import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { spineStages } from "@/content/spine";
import { useAdaptiveQuality } from "@/lib/three/useAdaptiveQuality";
import { useFinePointer } from "@/lib/motion/useFinePointer";

const ACCENT = new THREE.Color("#ff6b45");
const PACKET = new THREE.Color("#2f7cff");
const STEEL = new THREE.Color("#8797a5");

// World-space x past which a node's label is clear of the hero's text
// column (see the SpineTopology position comment below).
const LABEL_X_THRESHOLD = 0.5;

function SpineTopology() {
  const group = useRef<THREE.Group>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const finePointer = useFinePointer();

  // Eight real delivery stages (content/spine.ts) spread across the full
  // hero width so the topology - and unlabeled nodes specifically - travel
  // behind/between the name typography rather than being confined to one
  // side of it. The text column occupies most of the vertical space on the
  // left/center of the hero (eyebrow, name, tagline, paragraph, CTAs all
  // stacked), so no y-band clears every line there; labels are only shown
  // for nodes past the text column's right edge (see LABEL_X_THRESHOLD)
  // rather than chasing gaps between lines. Alternating z-depth gives the
  // pointer parallax below something genuine to reveal.
  const positions = useMemo(() => {
    const count = spineStages.length;
    return spineStages.map((_, i) => {
      const t = i / (count - 1);
      const x = (t - 0.5) * 11;
      const y = (i % 2 === 0 ? 1.3 : -1.3) + Math.sin(t * Math.PI) * 0.4;
      const z = -1.8 + Math.cos(t * Math.PI * 2) * 1.1;
      return new THREE.Vector3(x, y, z);
    });
  }, []);

  const linePositions = useMemo(() => {
    const arr = new Float32Array(positions.length * 3);
    positions.forEach((p, i) => p.toArray(arr, i * 3));
    return arr;
  }, [positions]);

  useEffect(() => {
    if (!finePointer) return;
    function handlePointerMove(event: PointerEvent) {
      pointer.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (event.clientY / window.innerHeight) * 2 - 1;
    }
    window.addEventListener("pointermove", handlePointerMove);
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, [finePointer]);

  useFrame((state) => {
    if (!group.current) return;
    // Idle drift, always on - restrained, not orbiting.
    const idle = Math.sin(state.clock.elapsedTime * 0.08) * 0.06;
    // Pointer-driven depth parallax, fine-pointer desktops only: subtle
    // rotation toward the cursor, damped rather than snapping to it.
    const targetX = finePointer ? pointer.current.y * 0.12 : 0;
    const targetY = finePointer ? idle + pointer.current.x * 0.18 : idle;
    group.current.rotation.x += (targetX - group.current.rotation.x) * 0.04;
    group.current.rotation.y += (targetY - group.current.rotation.y) * 0.04;
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
        <group key={spineStages[i].id} position={pos}>
          <mesh>
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
          {pos.x > LABEL_X_THRESHOLD && (
            <Html center distanceFactor={9} style={{ pointerEvents: "none" }}>
              <span
                style={{
                  display: "block",
                  transform: "translateY(1.4em)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: i % 2 === 0 ? "#ff6b45" : "#2f7cff",
                  whiteSpace: "nowrap",
                  opacity: 0.8,
                }}
              >
                {spineStages[i].label}
              </span>
            </Html>
          )}
        </group>
      ))}
    </group>
  );
}

/**
 * The R3F scene itself. Only ever mounted by HeroSpineLoader (which gates
 * on reduced-motion preference); purely decorative/ambient (aria-hidden by
 * the caller) - the accessible, described version of this same information
 * is the Reliability Spine walkthrough section further down the home page,
 * not a duplicate copy inside the hero. Frame loop pauses when the
 * tab/canvas isn't visible; DPR is capped; no post-processing, bloom, or
 * large particle counts (spec §16 performance budget).
 */
export default function HeroSpineCanvas() {
  const { dpr, visible } = useAdaptiveQuality();

  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      <Canvas
        dpr={dpr}
        frameloop={visible ? "always" : "never"}
        gl={{ antialias: true, powerPreference: "low-power" }}
        camera={{ position: [0, 0, 6], fov: 45 }}
      >
        <ambientLight intensity={0.6} />
        <pointLight position={[4, 4, 4]} intensity={0.8} />
        <SpineTopology />
      </Canvas>
    </div>
  );
}
