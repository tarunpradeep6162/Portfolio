"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { computeSpineInstruments, type SpineInstrument } from "@/lib/v7/spineInstruments";
import {
  operationalTwinDeckGridFragmentShader,
  operationalTwinDeckGridVertexShader,
} from "@/lib/v9/shaders/operationalTwinDeckGrid";

/**
 * The Instrument Deck's real content - moved unchanged from the old
 * OperationalTwinScene.tsx (V8 Phase 3), which owned its own <Canvas>.
 * This component owns no Canvas itself; it's rendered inside
 * components/v8/ControlRoomScene.tsx's shared Canvas via
 * OperationalTwinControlRoomScene.tsx. One instanced mesh, 8 instruments
 * (one per real Reliability Spine stage), each instrument's height driven
 * by `demonstratedByCount` from lib/v7/spineInstruments.ts - never a
 * decorative random value.
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instruments]);

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
    const t = clock.getElapsedTime() * ((Math.PI * 2) / 90);
    const radius = 8.6;
    camera.position.x = centerX + Math.sin(t) * radius * 0.3;
    camera.position.z = Math.cos(t) * radius;
    camera.position.y = 2.3;
    camera.lookAt(centerX, 0.6, 0);
  });
  return null;
}

export interface OperationalTwinSceneContentProps {
  selectedStageId: string | null;
  onSelectStage: (stageId: SpineInstrument["stageId"]) => void;
}

export function OperationalTwinSceneContent({
  selectedStageId,
  onSelectStage,
}: OperationalTwinSceneContentProps) {
  const instruments = useMemo(() => computeSpineInstruments(), []);

  return (
    <>
      <ambientLight intensity={0.75} />
      <directionalLight position={[2, 4, 3]} intensity={1.1} />
      <directionalLight position={[-3, 1.5, -2]} intensity={0.35} color="#4e79ff" />
      <OrbitCamera centerX={0} />
      <InstrumentDeckInstances
        instruments={instruments}
        selectedStageId={selectedStageId}
        onSelectStage={onSelectStage}
      />
      <StatusPips instruments={instruments} selectedStageId={selectedStageId} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[12, 6]} />
        {/* A small, reviewed procedural grid-line shader
            (docs/PORTFOLIO_V9_ARCHITECTURE.md polyglot addendum, Phase
            10) - grid lines from the plane's own UV coordinates, which
            a flat meshLambertMaterial cannot render without an external
            texture asset (this codebase's 3D systems deliberately use
            none). Static, no per-frame updates - the plane itself was
            never animated before this shader either. */}
        <shaderMaterial
          vertexShader={operationalTwinDeckGridVertexShader}
          fragmentShader={operationalTwinDeckGridFragmentShader}
          uniforms={{
            uBaseColor: { value: new THREE.Color("#0d1218") },
            uLineColor: { value: new THREE.Color("#4a5563") },
            uGridSize: { value: 24 },
            uLineWidth: { value: 1.5 },
          }}
        />
      </mesh>
    </>
  );
}
