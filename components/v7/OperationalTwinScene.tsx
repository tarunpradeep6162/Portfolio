"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { qualityPresets, type QualityTier } from "@/lib/companion/state";
import { computeSpineInstruments, type SpineInstrument } from "@/lib/v7/spineInstruments";

/**
 * The Instrument Deck: one instanced mesh, 8 instruments (one per real
 * Reliability Spine stage), each instrument's height driven by
 * `demonstratedByCount` from lib/v7/spineInstruments.ts - never a
 * decorative random value. Deliberately a single InstancedMesh rather
 * than 8 separate <mesh> components (spec Section 11: "use instancing for
 * repeated nodes... avoid one React component per decorative particle").
 *
 * First working pass of the selected "Instrument Deck" direction
 * (docs/OPERATIONAL_TWIN_V7_DESIGN_DIRECTION.md) - proves the real
 * content-driven geometry and the activation/selection lifecycle end to
 * end. Material/lighting/camera-choreography polish is deliberately
 * deferred to the Phase 16 performance/visual pass, not skipped silently:
 * this scene is real and functional now, not a placeholder standing in
 * for later replacement.
 */
const GAP = 1.15;
const BASE_HEIGHT = 0.28;
const HEIGHT_PER_COUNT = 0.22;
const WIDTH = 0.62;
const DEPTH = 0.5;
const PIP_SPACING = 0.16;
const PIP_RADIUS = 0.055;

const IDLE_COLOR = new THREE.Color("#4a5563");
const ACTIVE_COLOR = new THREE.Color("#d8ff4f");
const PIP_COLOR = new THREE.Color("#8996a3");
const PIP_ACTIVE_COLOR = new THREE.Color("#47d7b0");

function instrumentHeight(instrument: SpineInstrument): number {
  return BASE_HEIGHT + instrument.demonstratedByCount * HEIGHT_PER_COUNT;
}

function InstrumentDeckInstances({
  instruments,
  selectedStageId,
  onSelectStage,
}: {
  instruments: SpineInstrument[];
  selectedStageId: string | null;
  onSelectStage: (stageId: SpineInstrument["stageId"]) => void;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const colorTargets = useRef<THREE.Color[]>(
    instruments.map(() => IDLE_COLOR.clone()),
  );

  const centerX = ((instruments.length - 1) * GAP) / 2;

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    instruments.forEach((instrument, i) => {
      const isActive = instrument.stageId === selectedStageId;
      const target = isActive ? ACTIVE_COLOR : IDLE_COLOR;
      colorTargets.current[i].lerp(target, 1 - Math.pow(0.001, delta));
      mesh.setColorAt(i, colorTargets.current[i]);
    });

    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  const matrices = useMemo(() => {
    return instruments.map((instrument, i) => {
      const height = instrumentHeight(instrument);
      const matrix = new THREE.Matrix4();
      matrix.compose(
        new THREE.Vector3(i * GAP - centerX, height / 2, 0),
        new THREE.Quaternion(),
        new THREE.Vector3(WIDTH, height, DEPTH),
      );
      return matrix;
    });
    // instruments is content-derived and effectively static for the
    // lifetime of one mounted scene (a full page reload is what would
    // ever change spine/project content) - recomputing per instrument
    // identity is deliberate, not a missing dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instruments]);

  // Per-instance transform matrices are geometry, not per-frame animation -
  // set once when the mesh exists and whenever the (effectively static)
  // matrices change, not every frame inside useFrame above.
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    matrices.forEach((matrix, i) => mesh.setMatrixAt(i, matrix));
    mesh.instanceMatrix.needsUpdate = true;
  }, [matrices]);

  function handleClick(event: ThreeEvent<MouseEvent>) {
    event.stopPropagation();
    const id = event.instanceId;
    if (id === undefined) return;
    const instrument = instruments[id];
    if (instrument) onSelectStage(instrument.stageId);
  }

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, instruments.length]}
      onClick={handleClick}
      onPointerOver={(event) => {
        event.stopPropagation();
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "";
      }}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshLambertMaterial />
    </instancedMesh>
  );
}

/**
 * A discrete, per-project readout above each instrument - one small pip
 * per real flagship project that demonstrates that stage, stacked above
 * the bar rather than only encoded in bar height. Bar height alone is
 * hard to compare precisely at a glance; a small count of physical marks
 * reads the way a real instrument's indicator lights do, and it's a
 * second honest representation of the exact same real number
 * (demonstratedByCount), not a second, independently-invented metric.
 * One InstancedMesh for every pip across every instrument, not one
 * component per pip (spec Section 11's instancing requirement applies
 * here exactly as much as it does to the bars themselves).
 */
function StatusPips({
  instruments,
  selectedStageId,
}: {
  instruments: SpineInstrument[];
  selectedStageId: string | null;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const centerX = ((instruments.length - 1) * GAP) / 2;

  const pipLayout = useMemo(() => {
    const layout: { instrumentIndex: number; y: number }[] = [];
    instruments.forEach((instrument, i) => {
      const barTop = instrumentHeight(instrument);
      for (let p = 0; p < instrument.demonstratedByCount; p++) {
        layout.push({ instrumentIndex: i, y: barTop + PIP_RADIUS * 1.6 + p * PIP_SPACING });
      }
    });
    return layout;
  }, [instruments]);

  const colorTargets = useRef<THREE.Color[]>(pipLayout.map(() => PIP_COLOR.clone()));

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    pipLayout.forEach((pip, i) => {
      const x = pip.instrumentIndex * GAP - centerX;
      const matrix = new THREE.Matrix4();
      matrix.compose(
        new THREE.Vector3(x, pip.y, DEPTH / 2 + PIP_RADIUS),
        new THREE.Quaternion(),
        new THREE.Vector3(1, 1, 1),
      );
      mesh.setMatrixAt(i, matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pipLayout]);

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    pipLayout.forEach((pip, i) => {
      const instrument = instruments[pip.instrumentIndex];
      const isActive = instrument.stageId === selectedStageId;
      const target = isActive ? PIP_ACTIVE_COLOR : PIP_COLOR;
      colorTargets.current[i].lerp(target, 1 - Math.pow(0.001, delta));
      mesh.setColorAt(i, colorTargets.current[i]);
    });
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  if (pipLayout.length === 0) return null;

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, pipLayout.length]}>
      <sphereGeometry args={[PIP_RADIUS, 8, 6]} />
      <meshLambertMaterial />
    </instancedMesh>
  );
}

function OrbitCamera({ centerX }: { centerX: number }) {
  useFrame(({ camera, clock }) => {
    // Slow, restrained orbit - spec Section 8: "slow camera interpolation...
    // avoid elastic, bouncy, constantly floating or attention-seeking
    // motion." One full revolution takes 90s. Radius widened from the
    // first pass's 4.2 - at that distance with a 38 deg FOV, the 8-unit-
    // wide deck (8 instruments at 1.15 units apart) didn't fit in frame,
    // cropping to about 4 visible instruments. Found by actually looking
    // at a screenshot, not by trusting the numbers.
    const t = clock.getElapsedTime() * ((Math.PI * 2) / 90);
    const radius = 8.6;
    camera.position.x = centerX + Math.sin(t) * radius * 0.3;
    camera.position.z = Math.cos(t) * radius;
    camera.position.y = 2.3;
    camera.lookAt(centerX, 0.6, 0);
  });
  return null;
}

export interface OperationalTwinSceneProps {
  selectedStageId: string | null;
  onSelectStage: (stageId: SpineInstrument["stageId"]) => void;
  qualityTier: QualityTier;
  onError: () => void;
}

export function OperationalTwinScene({
  selectedStageId,
  onSelectStage,
  qualityTier,
  onError,
}: OperationalTwinSceneProps) {
  const instruments = useMemo(() => computeSpineInstruments(), []);
  const quality = qualityPresets[qualityTier];

  return (
    <Canvas
      dpr={quality.dpr}
      frameloop="always"
      gl={{ antialias: quality.antialias, alpha: true, powerPreference: "low-power" }}
      camera={{ position: [0, 2.6, 8.6], fov: 38 }}
      onCreated={({ gl }) => {
        // Same context-loss guard as Atlas/RC-01 (proven necessary during
        // V6: Three.js's own dispose() on unmount fires a genuine
        // webglcontextlost event as part of intentional cleanup, which
        // this listener must route through the same recovery path as a
        // real GPU failure - not treat as one when it's actually a
        // deliberate close, hence the host component's activeRef guard.
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
      <ambientLight intensity={0.75} />
      <directionalLight position={[2, 4, 3]} intensity={1.1} />
      {/* Cool rim/fill light from the opposite side - cheap (no shadow
          casting, per Section 11's "no real-time shadows by default"),
          just a second directional light for silhouette definition so
          the deck reads as a considered object, not a flat-lit block. */}
      <directionalLight position={[-3, 1.5, -2]} intensity={0.35} color="#4e79ff" />
      <OrbitCamera centerX={0} />
      <InstrumentDeckInstances
        instruments={instruments}
        selectedStageId={selectedStageId}
        onSelectStage={onSelectStage}
      />
      <StatusPips instruments={instruments} selectedStageId={selectedStageId} />
      {/* A solid deck surface, not a generic 3D-editor wireframe grid -
          reads as the instrument panel's own physical base rather than
          scaffolding left over from building the scene. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[12, 6]} />
        <meshLambertMaterial color="#0d1218" />
      </mesh>
    </Canvas>
  );
}
