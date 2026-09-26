"use client";
/* eslint-disable react-hooks/immutability -- the incident state and three.js objects are
   mutable per-frame render resources, mutated inside useFrame by design. */

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

const CORAL = new THREE.Color("#ff6847");
const LIME = new THREE.Color("#d8ff4f");
const NODE_IDLE = new THREE.Color("#232e3a");

export type IncidentPhase = "tour" | "incident" | "reroute" | "recovered";

/** Shared, per-frame state of the cinematic incident film (Phase 10). */
interface IncidentState {
  phase: IncidentPhase | null;
  failedId: string | null;
  flash: number;
}

function AtlasNode({
  nodeId,
  position,
  active,
  onSelect,
  incident,
}: {
  nodeId: string;
  position: [number, number, number];
  active: boolean;
  onSelect: () => void;
  incident: React.RefObject<IncidentState>;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshLambertMaterial>(null);

  // `active` is a prop, so this callback closure (recreated each render by
  // useFrame's own subscription) always sees its latest value - no ref
  // needed to smuggle it into the render loop.
  useFrame((state, delta) => {
    const m = materialRef.current;
    if (!m) return;
    const inc = incident.current;
    const failed = inc.failedId === nodeId && (inc.phase === "incident" || inc.phase === "reroute");
    const recovered = inc.failedId === nodeId && inc.phase === "recovered" && inc.flash > 0;
    let intensity = active ? 0.9 : 0.15;
    if (failed) {
      m.emissive.copy(CORAL);
      m.color.copy(CORAL).multiplyScalar(0.4);
      intensity = inc.phase === "incident" ? 0.6 + Math.abs(Math.sin(state.clock.elapsedTime * 9)) * 0.9 : 0.12;
    } else {
      m.emissive.copy(LIME);
      m.color.copy(active || recovered ? LIME : NODE_IDLE);
      if (recovered) intensity = 0.4 + inc.flash;
    }
    m.emissiveIntensity = THREE.MathUtils.damp(m.emissiveIntensity, intensity, failed ? 20 : 6, delta);
    if (meshRef.current) {
      const s = failed && inc.phase === "incident" ? 1 + Math.sin(state.clock.elapsedTime * 9) * 0.06 : 1;
      meshRef.current.scale.setScalar(s);
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

/**
 * Packets travelling every edge - the system's traffic. Their speed follows
 * `rate` (live GitHub activity, Phase 18); during the incident film,
 * packets heading into the failed node turn coral, then vanish while
 * traffic reroutes.
 */
function Packets({
  edges,
  rate,
  incident,
}: {
  edges: { from: string; to: string; a: THREE.Vector3; b: THREE.Vector3 }[];
  rate: number;
  incident: React.RefObject<IncidentState>;
}) {
  const perEdge = 3;
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);
  useFrame((state) => {
    const m = mesh.current;
    if (!m) return;
    const t = state.clock.elapsedTime;
    const inc = incident.current;
    edges.forEach((edge, e) => {
      const touches = inc.failedId !== null && (edge.from === inc.failedId || edge.to === inc.failedId);
      for (let k = 0; k < perEdge; k++) {
        const i = e * perEdge + k;
        const u = (t * 0.22 * (0.5 + rate) + k / perEdge + e * 0.13) % 1;
        dummy.position.lerpVectors(edge.a, edge.b, u);
        const hidden = touches && inc.phase === "reroute";
        dummy.scale.setScalar(hidden ? 0 : 1);
        dummy.updateMatrix();
        m.setMatrixAt(i, dummy.matrix);
        m.setColorAt(i, color.copy(touches && inc.phase === "incident" ? CORAL : LIME));
      }
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });
  if (edges.length === 0) return null;
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, edges.length * perEdge]}>
      <sphereGeometry args={[0.045, 10, 8]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  );
}

/**
 * The incident film's camera (Phase 10): a 16 s loop - fly node to node,
 * pull back wide as one node fails, hold while traffic reroutes, then the
 * recovery flash. Outside cinematic mode the camera eases home.
 */
function CinematicRig({
  enabled,
  points,
  home,
  incident,
  onPhase,
}: {
  enabled: boolean;
  points: { nodeId: string; position: [number, number, number] }[];
  home: THREE.Vector3;
  incident: React.RefObject<IncidentState>;
  onPhase: (phase: IncidentPhase | null, nodeId: string | null) => void;
}) {
  const startedAt = useRef<number | null>(null);
  const lastPhase = useRef<IncidentPhase | null>(null);
  const look = useMemo(() => new THREE.Vector3(), []);
  const target = useMemo(() => new THREE.Vector3(), []);
  const lookTarget = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, delta) => {
    const cam = state.camera;
    const inc = incident.current;
    if (!enabled || points.length === 0) {
      startedAt.current = null;
      if (inc.phase !== null) {
        inc.phase = null;
        inc.failedId = null;
        onPhase(null, null);
        lastPhase.current = null;
      }
      cam.position.lerp(home, 1 - Math.exp(-3 * delta));
      look.lerp(lookTarget.set(home.x, 0, 0), 1 - Math.exp(-3 * delta));
      cam.lookAt(look);
      return;
    }
    if (startedAt.current === null) startedAt.current = state.clock.elapsedTime;
    const t = (state.clock.elapsedTime - startedAt.current) % 16;
    const failed = points[Math.floor(points.length / 2)];
    let phase: IncidentPhase;
    if (t < 8) {
      phase = "tour";
      const seg = 8 / points.length;
      const i = Math.min(points.length - 1, Math.floor(t / seg));
      const p = points[i].position;
      // Close enough to feel like a fly-through, far enough to keep context.
      target.set(p[0] + 0.9, p[1] + 0.55, p[2] + 3.1);
      lookTarget.set(p[0], p[1], p[2]);
    } else {
      phase = t < 10.5 ? "incident" : t < 13 ? "reroute" : "recovered";
      target.set(home.x, home.y + 0.5, home.z + 1.4);
      lookTarget.set(failed.position[0], failed.position[1], 0);
    }
    inc.phase = phase;
    inc.failedId = phase === "tour" ? null : failed.nodeId;
    inc.flash = phase === "recovered" ? Math.max(0, 1.2 - (t - 13) * 0.8) : 0;
    if (phase !== lastPhase.current) {
      lastPhase.current = phase;
      onPhase(phase, inc.failedId);
    }
    cam.position.lerp(target, 1 - Math.exp(-2.2 * delta));
    look.lerp(lookTarget, 1 - Math.exp(-2.6 * delta));
    cam.lookAt(look);
  });
  return null;
}

interface AtlasSpatialSceneProps {
  flow: string;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
  qualityTier: QualityTier;
  onError: () => void;
  /** Phase 10: play the incident film (camera fly-through + failure + recovery). */
  cinematic?: boolean;
  /** Phase 18: packet traffic multiplier from live GitHub activity. */
  trafficRate?: number;
  onIncidentPhase?: (phase: IncidentPhase | null, nodeId: string | null) => void;
}

export function AtlasSpatialScene({
  flow,
  selectedNodeId,
  onSelectNode,
  qualityTier,
  onError,
  cinematic = false,
  trafficRate = 1,
  onIncidentPhase,
}: AtlasSpatialSceneProps) {
  const incident = useRef<IncidentState>({ phase: null, failedId: null, flash: 0 });
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
      <Packets
        edges={edges
          .map((edge) => {
            const from = positioned.find((p) => p.nodeId === edge.from);
            const to = positioned.find((p) => p.nodeId === edge.to);
            return from && to
              ? { from: edge.from, to: edge.to, a: new THREE.Vector3(...from.position), b: new THREE.Vector3(...to.position) }
              : null;
          })
          .filter((e): e is NonNullable<typeof e> => e !== null)}
        rate={trafficRate}
        incident={incident}
      />
      <CinematicRig
        enabled={cinematic}
        points={positioned.map((p) => ({ nodeId: p.nodeId, position: p.position }))}
        home={new THREE.Vector3(centerX, 0.6, 3.4)}
        incident={incident}
        onPhase={(phase, nodeId) => onIncidentPhase?.(phase, nodeId)}
      />
      {positioned.map((point) => {
        const node = nodes.find((n) => n.id === point.nodeId);
        if (!node) return null;
        return (
          <AtlasNode
            key={point.nodeId}
            nodeId={point.nodeId}
            incident={incident}
            position={point.position}
            active={point.nodeId === selectedNodeId}
            onSelect={() => onSelectNode(point.nodeId)}
          />
        );
      })}
    </Canvas>
  );
}
