"use client";

import { useMemo, useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { computeAtlasSceneGeometry } from "@/lib/v8/atlasSceneGeometry";

/**
 * Atlas's real node/edge geometry - moved unchanged from
 * AtlasSpatialScene.tsx (Phase 2 of docs/PORTFOLIO_V8_IMPLEMENTATION_PLAN.md).
 * Owns no <Canvas> of its own: this is exactly the content that used to be
 * AtlasSpatialScene's children, now rendered inside
 * components/v8/ControlRoomScene.tsx's shared Canvas instead. Pure
 * procedural geometry only (boxes + line segments derived from the
 * project's own `flow` string) - no imported meshes, matching RC-01's
 * "no external 3D assets" pattern, unchanged from V6/V7.
 */
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
        onClick={(event: ThreeEvent<MouseEvent>) => {
          event.stopPropagation();
          onSelect();
        }}
      >
        <boxGeometry args={[0.62, 0.62, 0.62]} />
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

export interface AtlasSceneContentProps {
  flow: string;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
}

export function AtlasSceneContent({ flow, selectedNodeId, onSelectNode }: AtlasSceneContentProps) {
  const geometry = useMemo(() => computeAtlasSceneGeometry(flow), [flow]);
  const edgeVectors = useMemo<[THREE.Vector3, THREE.Vector3][]>(
    () => geometry.edges.map(([a, b]) => [new THREE.Vector3(...a), new THREE.Vector3(...b)]),
    [geometry.edges],
  );

  return (
    <>
      <ambientLight intensity={0.65} />
      <directionalLight position={[2, 3, 4]} intensity={0.8} />
      <AtlasEdges points={edgeVectors} />
      {geometry.nodes.map((point) => (
        <AtlasNode
          key={point.nodeId}
          position={point.position}
          active={point.nodeId === selectedNodeId}
          onSelect={() => onSelectNode(point.nodeId)}
        />
      ))}
    </>
  );
}
