"use client";

import { useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera, Group } from "three";
import type { Mesh } from "three";

interface Project3DCardProps {
  title: string;
  description: string;
  color: string;
}

function RotatingCard({ title, description, color }: Project3DCardProps) {
  const groupRef = useRef<Group>(null);
  const meshRef = useRef<Mesh>(null);
  const [isHovered, setIsHovered] = useState(false);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += isHovered ? 0.015 : 0.003;
      groupRef.current.rotation.x = isHovered ? 0.2 : 0.1;
    }
  });

  return (
    <group
      ref={groupRef}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
    >
      <mesh ref={meshRef} scale={isHovered ? 1.1 : 1} position={[0, 0, 0]}>
        <boxGeometry args={[2, 2.5, 0.1]} />
        <meshStandardMaterial
          color={color}
          metalness={0.8}
          roughness={0.1}
          emissive={color}
          emissiveIntensity={isHovered ? 0.5 : 0.2}
        />
      </mesh>
    </group>
  );
}

export function Project3DCard(props: Project3DCardProps) {
  return (
    <div className="w-full h-64 rounded-lg border border-[var(--line)] overflow-hidden bg-[var(--color-control-black)]">
      <Canvas camera={{ position: [0, 0, 4], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <RotatingCard {...props} />
      </Canvas>
    </div>
  );
}
