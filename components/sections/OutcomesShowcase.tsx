import { ArrowRight, TrendingUp } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Eyebrow } from '@/components/ui/Eyebrow';

interface Outcome {
  title: string;
  before: {
    stat: string;
    description: string;
  };
  after: {
    stat: string;
    description: string;
  };
  impact: string;
}

const outcomes: Outcome[] = [
  {
    title: 'Deployment Frequency',
    before: {
      stat: '1-2x monthly',
      description: 'Manual processes, risky deployments',
    },
    after: {
      stat: '10-20x daily',
      description: 'Automated CI/CD, safe rollouts',
    },
    impact: '10x faster releases',
  },
  {
    title: 'Mean Time to Recover',
    before: {
      stat: '4-8 hours',
      description: 'Limited observability, manual debugging',
    },
    after: {
      stat: '15-30 minutes',
      description: 'Real-time monitoring, automated alerting',
    },
    impact: '90% reduction',
  },
  {
    title: 'Infrastructure Costs',
    before: {
      stat: '~20% waste',
      description: 'Over-provisioned resources',
    },
    after: {
      stat: '5-8% waste',
      description: 'Right-sized infrastructure, auto-scaling',
    },
    impact: '60% cost savings',
  },
  {
    title: 'Team Productivity',
    before: {
      stat: '60% ops work',
      description: 'Firefighting and manual tasks',
    },
    after: {
      stat: '20% ops work',
      description: 'Automated operations, focus on strategy',
    },
    impact: '3x faster development',
  },
];

export function OutcomesShowcase() {
  return (
    <section className="bg-[var(--surface)] py-20 sm:py-28 lg:py-36">
      <Container>
        <div className="max-w-3xl mb-16">
          <Eyebrow>Real Impact</Eyebrow>
          <h2 className="mt-6 font-display text-5xl sm:text-6xl font-bold leading-tight text-[var(--ink)]">
            Before & After: Measurable Outcomes
          </h2>
          <p className="mt-6 text-lg text-[var(--ink-muted)]">
            See the tangible improvements clients achieve through modern infrastructure practices and cloud transformation.
          </p>
        </div>

        <div className="space-y-8">
          {outcomes.map((outcome, index) => (
            <div
              key={index}
              className="group grid md:grid-cols-3 gap-6 p-8 rounded-lg border border-[var(--line)] hover:border-[var(--accent)] hover:bg-[var(--surface-secondary)] transition-all"
            >
              {/* Before */}
              <div>
                <p className="text-xs font-mono uppercase tracking-widest text-[var(--ink-muted)] mb-2">
                  Before
                </p>
                <p className="text-2xl font-display font-bold text-[var(--ink)] mb-3">
                  {outcome.before.stat}
                </p>
                <p className="text-sm text-[var(--ink-muted)]">
                  {outcome.before.description}
                </p>
              </div>

              {/* Arrow */}
              <div className="hidden md:flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <ArrowRight className="text-[var(--accent)] opacity-60" size={24} />
                  <div className="flex items-center gap-1 px-3 py-2 rounded-full bg-[var(--accent)]/10">
                    <TrendingUp size={14} className="text-[var(--accent)]" />
                    <span className="text-xs font-semibold text-[var(--accent)]">
                      {outcome.impact}
                    </span>
                  </div>
                </div>
              </div>

              {/* After */}
              <div>
                <p className="text-xs font-mono uppercase tracking-widest text-[var(--accent)] mb-2">
                  After
                </p>
                <p className="text-2xl font-display font-bold text-[var(--accent)] mb-3">
                  {outcome.after.stat}
                </p>
                <p className="text-sm text-[var(--ink-muted)]">
                  {outcome.after.description}
                </p>
              </div>

              {/* Title (mobile) */}
              <div className="md:hidden col-span-full">
                <p className="font-display font-semibold text-[var(--ink)] text-center">
                  {outcome.title}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 p-8 rounded-lg bg-gradient-to-r from-[var(--accent)]/10 to-[var(--accent-secondary)]/10 border border-[var(--accent)]/20 text-center">
          <h3 className="font-display text-2xl font-bold text-[var(--ink)] mb-3">
            Ready to transform your infrastructure?
          </h3>
          <p className="text-[var(--ink-muted)] mb-6 max-w-2xl mx-auto">
            These outcomes are typical for organizations that embrace modern cloud practices and infrastructure automation.
          </p>
          <a
            href="#contact"
            className="inline-block px-6 py-3 bg-[var(--accent)] text-white font-semibold rounded-lg hover:bg-[var(--accent-secondary)] transition-colors"
          >
            Start Your Transformation
          </a>
        </div>
      </Container>
    </section>
  );
}
