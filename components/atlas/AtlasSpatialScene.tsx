"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { parseFlowEdges, parseFlowNodes } from "@/lib/v6/flowParser";
import { computeAtlasLayout } from "@/lib/v6/atlasLayout";
import { qualityPresets, type QualityTier } from "@/lib/companion/state";

/**
 * Pure procedural geometry only (boxes + line segments derived from the
 * project's own `flow` string via the already-verified layout functions) -
 * no imported meshes, matching RC-01's existing "no external 3D assets"
 * pattern. This is the intent-loaded enhancement layer on top of
 * AtlasDiagram's always-present, server-rendered 2D view: everything a
 * visitor can do here (select a node) already works in the 2D view with
 * zero 3D code loaded.
 *
 * Per-node accessible names are NOT attempted inside this Canvas - an HTML
 * `<title>` element used to be here for that purpose, but R3F interprets
 * every lowercase JSX tag as a Three.js constructor to instantiate
 * (`<mesh>` -> THREE.Mesh, etc.), not as HTML, so `<title>` threw
 * "R3F: Title is not part of the THREE namespace!" on every mount - caught
 * by AtlasCanvasHost's error boundary, which silently fell back to its
 * "3D view failed to load" message every single time. Canvas content is
 * opaque to assistive tech regardless, which is why the *whole* canvas
 * already carries a single `role="img"`/`aria-label` on its wrapping div
 * in AtlasCanvasHost.tsx - that was always the real accessibility strategy
 * here, this component never needed its own.
 */
const SCALE = 1 / 55;

function AtlasNode({
  position,
  active,
  onSelect,
}: {
  position: [number, number, number];
  active: boolean;
  onSelect: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshLambertMaterial>(null);

  // `active` is a prop, so this callback closure (recreated each render by
  // useFrame's own subscription) always sees its latest value - no ref
  // needed to smuggle it into the render loop.
  useFrame((_, delta) => {
    if (materialRef.current) {
      materialRef.current.emissiveIntensity = THREE.MathUtils.damp(
        materialRef.current.emissiveIntensity,
        active ? 0.9 : 0.15,
        6,
        delta,
      );
    }
  });

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={(event) => {
          event.stopPropagation();
          onSelect();
        }}
      >
        <boxGeometry args={[0.62, 0.62, 0.62]} />
        {/* Lambert, not Standard: Atlas nodes are abstract diagram markers,
            not RC-01's realistic chassis, so they don't need a PBR
            roughness/metalness workflow - Lambert keeps the same emissive
            glow behavior with a materially cheaper shader to compile,
            identified as the likely long-task source on this measurement
            VM's software-rendered (SwiftShader) WebGL context. */}
        <meshLambertMaterial
          ref={materialRef}
          color={active ? "#d8ff4f" : "#232e3a"}
          emissive="#d8ff4f"
          emissiveIntensity={active ? 0.9 : 0.15}
        />
      </mesh>
    </group>
  );
}

function AtlasEdges({ points }: { points: [THREE.Vector3, THREE.Vector3][] }) {
  const geometry = useMemo(() => {
    const positions = new Float32Array(points.length * 6);
    points.forEach(([a, b], i) => {
      positions.set([a.x, a.y, a.z, b.x, b.y, b.z], i * 6);
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [points]);

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color="#4a5563" transparent opacity={0.6} />
    </lineSegments>
  );
}

interface AtlasSpatialSceneProps {
  flow: string;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
  qualityTier: QualityTier;
  onError: () => void;
}

export function AtlasSpatialScene({
  flow,
  selectedNodeId,
  onSelectNode,
  qualityTier,
  onError,
}: AtlasSpatialSceneProps) {
  const nodes = parseFlowNodes(flow);
  const edges = parseFlowEdges(nodes);
  const layout = computeAtlasLayout(nodes);
  const quality = qualityPresets[qualityTier];

  const positioned = layout.map((point) => ({
    ...point,
    position: [point.x * SCALE, -point.y * SCALE, 0] as [number, number, number],
  }));
  const centerX =
    positioned.reduce((sum, p) => sum + p.position[0], 0) / (positioned.length || 1);

  const edgeSegments: [THREE.Vector3, THREE.Vector3][] = edges
    .map((edge) => {
      const from = positioned.find((p) => p.nodeId === edge.from);
      const to = positioned.find((p) => p.nodeId === edge.to);
      if (!from || !to) return null;
      return [
        new THREE.Vector3(...from.position),
        new THREE.Vector3(...to.position),
      ] as [THREE.Vector3, THREE.Vector3];
    })
    .filter((segment): segment is [THREE.Vector3, THREE.Vector3] => segment !== null);

  return (
    <Canvas
      dpr={quality.dpr}
      frameloop="always"
      gl={{ antialias: quality.antialias, alpha: true, powerPreference: "low-power" }}
      camera={{ position: [centerX, 0.6, 3.4], fov: 34 }}
      onCreated={({ gl }) => {
        // A lost WebGL context doesn't throw a JS exception, so
        // AtlasCanvasHost's SceneErrorBoundary (a React error boundary)
        // can never catch it on its own - this listener is what actually
        // routes context loss into that same "3D view failed to load"
        // recovery path, matching CompanionCanvas.tsx's identical pattern
        // for RC-01's own canvas.
        gl.domElement.addEventListener(
          "webglcontextlost",
          (event) => {
            event.preventDefault();
            onError();
          },
          { once: true },
        );
      }}
    >
      <ambientLight intensity={0.65} />
      <directionalLight position={[2, 3, 4]} intensity={0.8} />
      <AtlasEdges points={edgeSegments} />
      {positioned.map((point) => {
        const node = nodes.find((n) => n.id === point.nodeId);
        if (!node) return null;
        return (
          <AtlasNode
            key={point.nodeId}
            position={point.position}
            active={point.nodeId === selectedNodeId}
            onSelect={() => onSelectNode(point.nodeId)}
          />
        );
      })}
    </Canvas>
  );
}
