import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, BarChart3, Zap, Users, TrendingUp } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Eyebrow } from '@/components/ui/Eyebrow';

export const metadata: Metadata = {
  title: 'Analytics Dashboard',
  description: 'Portfolio performance and conversion tracking analytics.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AnalyticsDashboard() {
  // Mock data - in production, fetch from database/analytics service
  const mockMetrics = {
    totalVisits: 1234,
    uniqueVisitors: 892,
    contactFormSubmissions: 23,
    blogArticleViews: 456,
    avgSessionDuration: '2m 34s',
    conversionRate: '2.58%',
    bounceRate: '28%',
  };

  return (
    <div className="min-h-screen bg-[var(--color-dark-navy)]">
      <div className="sticky top-0 z-20 border-b border-white/10 bg-[var(--color-dark-navy)]/92 backdrop-blur-xl">
        <Container className="h-16 flex items-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-gold-primary)] hover:text-[var(--color-cream)] transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Portfolio
          </Link>
        </Container>
      </div>

      <Container className="py-16">
        <div className="mb-12">
          <Eyebrow>Analytics</Eyebrow>
          <h1 className="mt-6 font-display text-5xl font-bold text-[var(--ink)] mb-4">
            Portfolio Analytics
          </h1>
          <p className="text-[var(--ink-muted)] max-w-2xl">
            Real-time tracking of visitor engagement, form submissions, and conversion metrics.
            <br />
            <span className="text-xs mt-2 block">
              Note: This is a demonstration dashboard. In production, this would display real data
              from your analytics backend.
            </span>
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <div className="p-6 rounded-lg border border-[var(--line)] bg-[var(--surface)]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono uppercase tracking-widest text-[var(--ink-muted)]">
                Total Visits
              </span>
              <Users className="text-[var(--accent)] opacity-60" size={20} />
            </div>
            <p className="text-3xl font-display font-bold text-[var(--accent)]">
              {mockMetrics.totalVisits.toLocaleString()}
            </p>
            <p className="mt-2 text-xs text-green-500 font-semibold">↑ 12% this month</p>
          </div>

          <div className="p-6 rounded-lg border border-[var(--line)] bg-[var(--surface)]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono uppercase tracking-widest text-[var(--ink-muted)]">
                Unique Visitors
              </span>
              <TrendingUp className="text-[var(--accent)] opacity-60" size={20} />
            </div>
            <p className="text-3xl font-display font-bold text-[var(--accent)]">
              {mockMetrics.uniqueVisitors.toLocaleString()}
            </p>
            <p className="mt-2 text-xs text-green-500 font-semibold">↑ 8% this week</p>
          </div>

          <div className="p-6 rounded-lg border border-[var(--line)] bg-[var(--surface)]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono uppercase tracking-widest text-[var(--ink-muted)]">
                Contact Submissions
              </span>
              <Zap className="text-[var(--accent)] opacity-60" size={20} />
            </div>
            <p className="text-3xl font-display font-bold text-[var(--accent)]">
              {mockMetrics.contactFormSubmissions}
            </p>
            <p className="mt-2 text-xs text-[var(--ink-muted)]">Last 30 days</p>
          </div>

          <div className="p-6 rounded-lg border border-[var(--line)] bg-[var(--surface)]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono uppercase tracking-widest text-[var(--ink-muted)]">
                Conversion Rate
              </span>
              <BarChart3 className="text-[var(--accent)] opacity-60" size={20} />
            </div>
            <p className="text-3xl font-display font-bold text-[var(--accent)]">
              {mockMetrics.conversionRate}
            </p>
            <p className="mt-2 text-xs text-[var(--ink-muted)]">Form submissions</p>
          </div>
        </div>

        {/* Detailed Metrics */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Traffic */}
          <div className="p-8 rounded-lg border border-[var(--line)] bg-[var(--surface)]">
            <h3 className="font-display text-lg font-bold text-[var(--ink)] mb-6">
              Traffic Metrics
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-[var(--line)]">
                <span className="text-[var(--ink-muted)]">Avg. Session Duration</span>
                <span className="font-display font-bold text-[var(--ink)]">
                  {mockMetrics.avgSessionDuration}
                </span>
              </div>
              <div className="flex items-center justify-between pb-4 border-b border-[var(--line)]">
                <span className="text-[var(--ink-muted)]">Bounce Rate</span>
                <span className="font-display font-bold text-[var(--ink)]">
                  {mockMetrics.bounceRate}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--ink-muted)]">Total Pageviews</span>
                <span className="font-display font-bold text-[var(--ink)]">
                  {(mockMetrics.totalVisits * 2.3).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Content Performance */}
          <div className="p-8 rounded-lg border border-[var(--line)] bg-[var(--surface)]">
            <h3 className="font-display text-lg font-bold text-[var(--ink)] mb-6">
              Content Performance
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-[var(--line)]">
                <span className="text-[var(--ink-muted)]">Blog Article Views</span>
                <span className="font-display font-bold text-[var(--ink)]">
                  {mockMetrics.blogArticleViews}
                </span>
              </div>
              <div className="flex items-center justify-between pb-4 border-b border-[var(--line)]">
                <span className="text-[var(--ink-muted)]">Top Article</span>
                <span className="font-display font-bold text-[var(--ink)]">
                  Infrastructure as Code
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--ink-muted)]">Avg. Time on Article</span>
                <span className="font-display font-bold text-[var(--ink)]">3m 12s</span>
              </div>
            </div>
          </div>
        </div>

        {/* Note */}
        <div className="mt-12 p-6 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/20">
          <p className="text-sm text-[var(--ink-muted)]">
            <strong>Dashboard Status:</strong> This is a demonstration analytics dashboard. In production,
            integrate with:
          </p>
          <ul className="mt-3 space-y-2 text-sm text-[var(--ink-muted)]">
            <li>• Google Analytics 4 for traffic tracking</li>
            <li>• Custom database for form submission tracking</li>
            <li>• Segment or Mixpanel for user behavior tracking</li>
            <li>• Hotjar or Microsoft Clarity for heatmaps and session recording</li>
          </ul>
        </div>
      </Container>
    </div>
  );
}
