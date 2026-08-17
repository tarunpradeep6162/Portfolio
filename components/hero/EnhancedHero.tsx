'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowDown, Zap } from 'lucide-react';

export function EnhancedHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight * 0.6;

    // Particle system for animated background
    const particles: any[] = [];
    const particleCount = 50;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.2,
      });
    }

    const animate = () => {
      // Clear canvas with dark background
      ctx.fillStyle = 'rgba(15, 20, 25, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      particles.forEach((particle) => {
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Bounce off walls
        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

        // Draw particle with gold glow
        ctx.fillStyle = `rgba(212, 175, 55, ${particle.opacity})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();

        // Draw connecting lines
        particles.forEach((otherParticle) => {
          const dx = particle.x - otherParticle.x;
          const dy = particle.y - otherParticle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 150) {
            ctx.strokeStyle = `rgba(212, 175, 55, ${0.1 * (1 - distance / 150)})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(otherParticle.x, otherParticle.y);
            ctx.stroke();
          }
        });
      });

      requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight * 0.6;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <section className="relative overflow-hidden bg-[var(--surface)] pt-20 pb-0">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-0 opacity-60"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center py-20">
          {/* Left: Text Content */}
          <div data-scroll-reveal>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-1 bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)]" />
              <span className="text-sm font-mono uppercase tracking-widest text-[var(--accent)]">
                Cloud Systems Engineer
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold text-[var(--ink)] leading-[1.1] mb-6">
              I Build
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent)] via-[var(--accent-secondary)] to-[var(--accent)] animate-pulse">
                Reliable Paths
              </span>
              from Code to Cloud
            </h1>

            <p className="text-lg text-[var(--ink-muted)] max-w-lg mb-8 leading-relaxed">
              Infrastructure automation, secure delivery pipelines, and production reliability—
              architected for scale and engineered for trust.
            </p>

            {/* CTA Buttons - More Prominent */}
            <div className="flex flex-wrap gap-4 mb-12">
              <Link
                href="#work"
                className="group relative px-8 py-4 bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)] text-[var(--surface)] font-display font-bold rounded-lg overflow-hidden hover:scale-105 transition-transform duration-300"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Explore Systems
                  <ArrowDown size={20} className="group-hover:translate-y-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform" />
              </Link>

              <Link
                href="#contact"
                className="px-8 py-4 border-2 border-[var(--accent)] text-[var(--accent)] font-display font-bold rounded-lg hover:bg-[var(--accent)]/10 transition-colors duration-300"
              >
                Start a Project
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-[var(--line)]">
              <div>
                <p className="text-3xl font-display font-bold text-[var(--accent)]">4+</p>
                <p className="text-sm text-[var(--ink-muted)]">Case Studies</p>
              </div>
              <div>
                <p className="text-3xl font-display font-bold text-[var(--accent)]">50+</p>
                <p className="text-sm text-[var(--ink-muted)]">Infrastructure Projects</p>
              </div>
              <div>
                <p className="text-3xl font-display font-bold text-[var(--accent)]">99.9%</p>
                <p className="text-sm text-[var(--ink-muted)]">Uptime Average</p>
              </div>
            </div>
          </div>

          {/* Right: Visual Elements */}
          <div className="relative h-96 lg:h-[500px]" data-scroll-reveal>
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/20 via-[var(--accent-secondary)]/10 to-transparent rounded-2xl blur-3xl" />

            <div className="absolute inset-0 border border-[var(--line)] rounded-2xl overflow-hidden">
              <div className="absolute top-6 left-6 flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-[var(--accent)] animate-pulse" />
                <span className="text-xs text-[var(--ink-muted)]">Live System</span>
              </div>

              <div className="absolute inset-0 p-8 flex flex-col justify-center">
                <pre className="text-xs font-mono text-[var(--accent)] overflow-hidden">
{`$ cloud-systems --status
✓ AWS Production: 8 regions
✓ CI/CD Pipelines: 50+ deployments
✓ Infrastructure: IaC, 99.9% uptime
✓ Security: Zero-trust architecture
✓ Reliability: Automatic failover

→ Ready to scale your systems`}
                </pre>
              </div>

              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent" />
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce">
        <div className="text-center">
          <p className="text-xs text-[var(--ink-muted)] mb-2">Scroll to explore</p>
          <Zap size={20} className="text-[var(--accent)] mx-auto animate-pulse" />
        </div>
      </div>
    </section>
  );
}
