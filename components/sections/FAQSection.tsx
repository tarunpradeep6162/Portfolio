'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Eyebrow } from '@/components/ui/Eyebrow';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQ[] = [
  {
    id: '1',
    category: 'Services',
    question: 'What type of projects do you specialize in?',
    answer:
      'I specialize in cloud infrastructure automation, CI/CD pipeline design, Kubernetes deployments, and distributed system architecture. I focus on building reliable, scalable systems that support rapid growth and recovery from failures.',
  },
  {
    id: '2',
    category: 'Services',
    question: 'Do you work with startups or only enterprise clients?',
    answer:
      'I work with both startups and enterprises. Startups benefit from infrastructure-first thinking that prevents technical debt, while enterprises leverage my experience scaling systems for reliability and compliance.',
  },
  {
    id: '3',
    category: 'Services',
    question: 'What cloud providers do you work with?',
    answer:
      'I have production experience with AWS, Google Cloud Platform, and Azure. My Infrastructure as Code approach ensures portability across providers, allowing flexibility in deployment decisions.',
  },
  {
    id: '4',
    category: 'Process',
    question: 'What is your typical engagement timeline?',
    answer:
      'Engagements vary based on scope. Initial infrastructure assessment takes 2-4 weeks. Implementation projects range from 2-6 months. Ongoing support arrangements are available for teams needing continuous optimization.',
  },
  {
    id: '5',
    category: 'Process',
    question: 'How do you handle legacy systems?',
    answer:
      'Legacy systems require careful migration planning. I typically start with observability improvements, gradually introduce Infrastructure as Code, implement CI/CD, then migrate to modern architectures with minimal disruption.',
  },
  {
    id: '6',
    category: 'Process',
    question: 'Do you provide training and knowledge transfer?',
    answer:
      'Yes. Knowledge transfer is built into every engagement. I document patterns, conduct team sessions, and empower your team to maintain systems independently. Long-term success depends on team capability.',
  },
  {
    id: '7',
    category: 'Technical',
    question: 'What tools and technologies do you prefer?',
    answer:
      'I favor open-source, battle-tested tools: Terraform for IaC, Kubernetes for orchestration, Prometheus for monitoring, and GitOps practices for deployment. Tool selection depends on your specific requirements and team expertise.',
  },
  {
    id: '8',
    category: 'Technical',
    question: 'How do you approach security in infrastructure?',
    answer:
      'Security is foundational, not bolt-on. I implement zero-trust architecture, least-privilege access, secrets management, compliance as code, and continuous security scanning. Every system is designed assuming compromise will occur.',
  },
  {
    id: '9',
    category: 'Technical',
    question: 'What is your approach to infrastructure testing?',
    answer:
      'Infrastructure should be tested like application code. I implement automated testing for infrastructure changes, use policy as code to enforce standards, and apply chaos engineering to validate recovery procedures.',
  },
  {
    id: '10',
    category: 'Support',
    question: 'Do you offer ongoing support and maintenance?',
    answer:
      'Yes. I offer support arrangements for monitoring, optimization, incident response, and architectural guidance. Ongoing relationships allow for continuous improvement and proactive issue resolution.',
  },
  {
    id: '11',
    category: 'Support',
    question: 'How do you handle emergencies and incidents?',
    answer:
      'I provide priority support for production incidents. My incident response focuses on minimizing user impact, conducting thorough RCAs, and implementing preventive measures to avoid recurrence.',
  },
  {
    id: '12',
    category: 'Support',
    question: 'What is your communication style?',
    answer:
      'Clear, transparent communication is critical. I provide regular status updates, explain technical decisions in business terms, and ensure stakeholders understand implications of architectural choices.',
  },
];

export function FAQSection() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', ...Array.from(new Set(faqs.map((faq) => faq.category)))];
  const filteredFAQs =
    selectedCategory === 'all'
      ? faqs
      : faqs.filter((faq) => faq.category === selectedCategory);

  return (
    <section className="bg-[var(--surface)] py-20 sm:py-28 lg:py-36">
      <Container>
        <div className="max-w-3xl mb-16">
          <Eyebrow>Common Questions</Eyebrow>
          <h2 className="mt-6 font-display text-5xl sm:text-6xl font-bold leading-tight text-[var(--ink)]">
            Frequently Asked Questions
          </h2>
          <p className="mt-6 text-lg text-[var(--ink-muted)]">
            Answers to common questions about services, process, technical approach, and support.
          </p>
        </div>

        {/* Category Filter */}
        <div className="mb-12 flex flex-wrap gap-3">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-all ${
                selectedCategory === category
                  ? 'bg-[var(--accent)] text-white'
                  : 'bg-[var(--surface-secondary)] text-[var(--ink-muted)] hover:bg-[var(--accent)]/10 hover:text-[var(--accent)]'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* FAQ Items */}
        <div className="max-w-3xl space-y-4">
          {filteredFAQs.map((faq) => (
            <button
              key={faq.id}
              onClick={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
              className="w-full text-left"
            >
              <div className="p-6 border border-[var(--line)] rounded-lg hover:border-[var(--accent)] hover:bg-[var(--surface-secondary)] transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <span className="inline-block mb-3 text-xs font-mono uppercase tracking-widest text-[var(--accent)]">
                      {faq.category}
                    </span>
                    <h3 className="font-display text-lg font-semibold text-[var(--ink)]">
                      {faq.question}
                    </h3>
                  </div>
                  <ChevronDown
                    size={20}
                    className={`flex-shrink-0 text-[var(--accent)] transition-transform ${
                      expandedId === faq.id ? 'rotate-180' : ''
                    }`}
                  />
                </div>

                {expandedId === faq.id && (
                  <div className="mt-6 pt-6 border-t border-[var(--line)]">
                    <p className="text-[var(--ink-muted)] leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Still have questions? */}
        <div className="mt-16 p-8 rounded-lg bg-gradient-to-r from-[var(--accent)]/10 to-[var(--accent-secondary)]/10 border border-[var(--accent)]/20">
          <h3 className="font-display text-xl font-bold text-[var(--ink)] mb-3">
            Still have questions?
          </h3>
          <p className="text-[var(--ink-muted)] mb-4">
            Reach out directly—I respond within 24 hours and love discussing infrastructure challenges.
          </p>
          <a
            href="#contact"
            className="inline-block px-6 py-2 bg-[var(--accent)] text-white font-semibold rounded-lg hover:bg-[var(--accent-secondary)] transition-colors"
          >
            Start a Conversation
          </a>
        </div>
      </Container>
    </section>
  );
}
