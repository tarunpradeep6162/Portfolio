import { TrendingUp, BarChart3, Zap, Shield } from 'lucide-react';

interface Metric {
  label: string;
  value: string;
  change?: string;
  icon?: 'trending' | 'chart' | 'zap' | 'shield';
}

interface CaseStudyMetricsProps {
  metrics: Metric[];
  title?: string;
}

const iconMap = {
  trending: TrendingUp,
  chart: BarChart3,
  zap: Zap,
  shield: Shield,
};

export function CaseStudyMetrics({ metrics, title }: CaseStudyMetricsProps) {
  return (
    <div className="space-y-6">
      {title && (
        <h3 className="font-display text-2xl font-bold text-[var(--ink)]">
          {title}
        </h3>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {metrics.map((metric, index) => {
          const Icon = metric.icon ? iconMap[metric.icon] : null;

          return (
            <div
              key={index}
              className="p-6 rounded-lg border border-[var(--line)] bg-[var(--surface-secondary)] hover:border-[var(--accent)] transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-mono uppercase tracking-widest text-[var(--ink-muted)] mb-2">
                    {metric.label}
                  </p>
                  <p className="text-3xl font-display font-bold text-[var(--accent)]">
                    {metric.value}
                  </p>
                </div>
                {Icon && (
                  <Icon className="text-[var(--accent)] opacity-40" size={24} />
                )}
              </div>

              {metric.change && (
                <p className="text-sm text-green-500 font-semibold">
                  {metric.change}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
