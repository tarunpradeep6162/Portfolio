'use client';

import { useEffect, useRef, useState } from 'react';

export function Canvas3DInteractive() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    // Dynamic import of Three.js
    import('three').then(({
      Scene,
      PerspectiveCamera,
      WebGLRenderer,
      IcosahedronGeometry,
      MeshPhongMaterial,
      Mesh,
      PointLight,
      AmbientLight,
      Color
    }) => {
      const scene = new Scene();
      scene.background = new Color(0x0f1419);

      const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.z = 5;

      const renderer = new WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(window.devicePixelRatio);
      containerRef.current!.appendChild(renderer.domElement);

      const geometry = new IcosahedronGeometry(2, 4);
      const material = new MeshPhongMaterial({
        color: 0xd4af37,
        emissive: 0xc9a961,
        shininess: 100,
      });
      const mesh = new Mesh(geometry, material);
      scene.add(mesh);

      const light1 = new PointLight(0xd4af37, 1);
      light1.position.set(5, 5, 5);
      scene.add(light1);

      const light2 = new PointLight(0xb88a82, 0.5);
      light2.position.set(-5, -5, 5);
      scene.add(light2);

      const ambientLight = new AmbientLight(0xffffff, 0.3);
      scene.add(ambientLight);

      // Mouse tracking
      const handleMouseMove = (e: MouseEvent) => {
        const x = (e.clientX / window.innerWidth) * 2 - 1;
        const y = -(e.clientY / window.innerHeight) * 2 + 1;
        setMousePos({ x, y });
      };

      window.addEventListener('mousemove', handleMouseMove);

      let animationId: number;
      const animate = () => {
        animationId = requestAnimationFrame(animate);

        // Base rotation
        mesh.rotation.x += 0.003;
        mesh.rotation.y += 0.005;

        // Mouse-influenced rotation (subtle)
        mesh.rotation.x += mousePos.y * 0.001;
        mesh.rotation.y += mousePos.x * 0.001;

        renderer.render(scene, camera);
      };
      animate();

      const handleResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      };
      window.addEventListener('resize', handleResize);

      return () => {
        cancelAnimationFrame(animationId);
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('mousemove', handleMouseMove);
        renderer.dispose();
        geometry.dispose();
        material.dispose();
        containerRef.current?.removeChild(renderer.domElement);
      };
    });
  }, [mousePos]);

  return <div ref={containerRef} className="fixed inset-0 -z-10 opacity-40" />;
}
