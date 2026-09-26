"use client";
/* eslint-disable react-hooks/immutability -- three.js scene objects are mutated per frame inside useFrame (the react-three-fiber pattern). */

import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { buildAvatar } from "@/lib/avatar/buildAvatar";

function Studio() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const env = pmrem.fromScene(room, 0.04).texture;
    scene.environment = env;
    return () => {
      scene.environment = null;
      env.dispose();
      room.dispose?.();
      pmrem.dispose();
    };
  }, [gl, scene]);
  return null;
}

/**
 * The avatar on a turntable: plays the model's own "Idle" clip, drifts
 * slowly round on its own, and can be dragged to any angle (with inertia).
 */
function Avatar() {
  const face = useLoader(THREE.TextureLoader, "/rc01/face-holo.webp");
  const avatar = useMemo(() => {
    face.colorSpace = THREE.SRGBColorSpace;
    return buildAvatar({ faceTexture: face });
  }, [face]);
  const mixer = useMemo(() => new THREE.AnimationMixer(avatar.root), [avatar]);
  const spin = useRef({ angle: -0.35, velocity: 0, dragging: false, lastX: 0, idleSince: 0 });
  const gl = useThree((s) => s.gl);

  useEffect(() => {
    mixer.clipAction(avatar.clips[0]).play();
    return () => {
      mixer.stopAllAction();
      avatar.dispose();
    };
  }, [mixer, avatar]);

  useEffect(() => {
    const el = gl.domElement;
    const s = spin.current;
    const down = (e: PointerEvent) => {
      s.dragging = true;
      s.lastX = e.clientX;
      el.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!s.dragging) return;
      const dx = (e.clientX - s.lastX) * 0.012;
      s.lastX = e.clientX;
      s.angle += dx;
      s.velocity = dx;
    };
    const up = () => {
      s.dragging = false;
      s.idleSince = performance.now();
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
    };
  }, [gl]);

  useFrame((_, delta) => {
    mixer.update(delta);
    const s = spin.current;
    if (!s.dragging) {
      s.velocity *= Math.pow(0.04, delta);
      // gentle auto-turn resumes 2.5s after the visitor lets go
      const auto = performance.now() - s.idleSince > 2500 ? 0.12 * delta : 0;
      s.angle += s.velocity + auto;
    }
    avatar.root.rotation.y = s.angle;
    avatar.glow.emissiveIntensity = 1.0 + Math.sin(performance.now() / 700) * 0.12;
  });

  return <primitive object={avatar.root} />;
}

export function AvatarCanvas({ onError }: { onError: () => void }) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      camera={{ position: [0, 1.0, 4.4], fov: 26 }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
      onCreated={({ gl, camera }) => {
        camera.lookAt(0, 0.92, 0);
        gl.domElement.addEventListener(
          "webglcontextlost",
          (e) => {
            e.preventDefault();
            onError();
          },
          { once: true },
        );
      }}
      style={{ touchAction: "pan-y", cursor: "grab" }}
      aria-label="Tarun's armoured 3D avatar. Drag to rotate."
    >
      <Studio />
      <ambientLight intensity={0.25} />
      <directionalLight position={[2, 4, 3]} intensity={2.2} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-3, 2, -2]} intensity={1.6} color="#748cff" />
      <directionalLight position={[3, 0, -2]} intensity={0.9} color="#d8ff4f" />
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <circleGeometry args={[0.9, 64]} />
        <shadowMaterial opacity={0.45} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.002}>
        <circleGeometry args={[0.5, 64]} />
        <meshBasicMaterial color="#d8ff4f" transparent opacity={0.06} />
      </mesh>
      <Suspense fallback={null}>
        <Avatar />
      </Suspense>
    </Canvas>
  );
}
