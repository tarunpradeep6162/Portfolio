'use client';

import { Container } from '@/components/ui/Container';
import { Eyebrow } from '@/components/ui/Eyebrow';

interface Technology {
  name: string;
  category: string;
  description: string;
}

const technologies: Technology[] = [
  { name: 'Terraform', category: 'Infrastructure', description: 'Infrastructure as Code' },
  { name: 'Kubernetes', category: 'Orchestration', description: 'Container Orchestration' },
  { name: 'AWS', category: 'Cloud', description: 'Cloud Platform' },
  { name: 'Jenkins', category: 'CI/CD', description: 'Pipeline Automation' },
  { name: 'Docker', category: 'Containers', description: 'Containerization' },
  { name: 'Ansible', category: 'Automation', description: 'Configuration Management' },
  { name: 'Prometheus', category: 'Monitoring', description: 'Metrics & Alerting' },
  { name: 'ELK Stack', category: 'Logging', description: 'Log Aggregation' },
  { name: 'Vault', category: 'Security', description: 'Secrets Management' },
  { name: 'Consul', category: 'Service Mesh', description: 'Service Discovery' },
  { name: 'Istio', category: 'Service Mesh', description: 'Traffic Management' },
  { name: 'GitOps', category: 'Practices', description: 'Declarative Operations' },
];

export function TechStackShowcase() {
  const categories = Array.from(new Set(technologies.map((t) => t.category)));

  return (
    <section className="bg-gradient-to-b from-[var(--surface)] to-[var(--color-dark-navy)] py-20 sm:py-28 lg:py-36">
      <Container>
        <div className="max-w-3xl mb-16">
          <Eyebrow>Technology Stack</Eyebrow>
          <h2 className="mt-6 font-display text-5xl sm:text-6xl font-bold leading-tight text-[var(--ink)]">
            Tools & Technologies
          </h2>
          <p className="mt-6 text-lg text-[var(--ink-muted)]">
            Battle-tested, production-proven technologies that power reliable cloud infrastructure and automation.
          </p>
        </div>

        <div className="space-y-12">
          {categories.map((category) => {
            const items = technologies.filter((t) => t.category === category);

            return (
              <div key={category}>
                <h3 className="font-display text-lg font-bold text-[var(--accent)] mb-4 uppercase tracking-widest text-sm">
                  {category}
                </h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map((tech) => (
                    <div
                      key={tech.name}
                      className="group p-4 rounded-lg border border-[var(--line)] bg-[var(--surface)]/50 hover:border-[var(--accent)] hover:bg-[var(--surface)] transition-all cursor-default"
                    >
                      <h4 className="font-display font-semibold text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors mb-1">
                        {tech.name}
                      </h4>
                      <p className="text-xs text-[var(--ink-muted)]">
                        {tech.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Additional note */}
        <div className="mt-16 p-8 rounded-lg bg-[var(--accent)]/5 border border-[var(--accent)]/20">
          <p className="text-sm text-[var(--ink-muted)]">
            <strong>Technology Selection:</strong> I choose tools based on specific project requirements,
            not personal preference. My stack is flexible and includes whatever technology solves the problem
            best—whether that's commercial platforms or open-source solutions.
          </p>
        </div>
      </Container>
    </section>
  );
}
