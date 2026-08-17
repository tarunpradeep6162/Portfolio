"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp,
  Users,
  Zap,
  BarChart3,
  PieChart,
  Activity,
  Target,
} from "lucide-react";
import {
  getConversionFunnel,
  getCohortAnalysis,
  getMetrics,
  AnalyticsMetrics,
  ConversionFunnel,
  CohortAnalysis,
} from "@/lib/analytics/conversions";

export function AnalyticsDashboard() {
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [funnel, setFunnel] = useState<ConversionFunnel[]>([]);
  const [cohorts, setCohorts] = useState<CohortAnalysis[]>([]);
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d">("30d");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const now = new Date();
      const start = new Date();

      if (dateRange === "7d") start.setDate(now.getDate() - 7);
      if (dateRange === "30d") start.setDate(now.getDate() - 30);
      if (dateRange === "90d") start.setDate(now.getDate() - 90);

      const [metricsData, funnelData, cohortsData] = await Promise.all([
        getMetrics({ start, end: now }),
        getConversionFunnel({ start, end: now }),
        getCohortAnalysis("monthly"),
      ]);

      setMetrics(metricsData);
      setFunnel(funnelData);
      setCohorts(cohortsData);
      setLoading(false);
    };

    loadData();
  }, [dateRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-[var(--ink-muted)]">Loading analytics...</div>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="min-h-screen bg-[var(--surface)] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="font-display text-4xl font-bold text-[var(--ink)] mb-2">
              Analytics Dashboard
            </h1>
            <p className="text-[var(--ink-muted)]">
              Track conversions, cohorts, and customer insights
            </p>
          </div>

          {/* Date Range Selector */}
          <div className="flex gap-2">
            {(["7d", "30d", "90d"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-2 rounded text-sm font-semibold transition-all ${
                  dateRange === range
                    ? "bg-[var(--accent)] text-white"
                    : "bg-[var(--color-charcoal)] text-[var(--ink)] hover:border-[var(--accent)]"
                }`}
              >
                {range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : "90 Days"}
              </button>
            ))}
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Sessions"
            value={metrics.totalSessions.toLocaleString()}
            icon={<Activity size={24} />}
            change={12}
          />
          <MetricCard
            title="Total Users"
            value={metrics.totalUsers.toLocaleString()}
            icon={<Users size={24} />}
            change={8}
          />
          <MetricCard
            title="Conversion Rate"
            value={`${(metrics.conversionRate * 100).toFixed(2)}%`}
            icon={<Target size={24} />}
            change={0.5}
          />
          <MetricCard
            title="Customer LTV"
            value={`$${(metrics.lifetimeValue / 1000).toFixed(1)}k`}
            icon={<TrendingUp size={24} />}
            change={15}
          />
        </div>

        {/* Conversion Funnel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="rounded-lg border border-[var(--line)] bg-[var(--color-charcoal)] p-6">
            <h2 className="font-display text-xl font-bold text-[var(--ink)] mb-6">
              Conversion Funnel
            </h2>
            <div className="space-y-4">
              {funnel.map((stage, index) => {
                const maxCount = Math.max(...funnel.map((s) => s.count));
                const percentage = (stage.count / maxCount) * 100;

                return (
                  <div key={index}>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-semibold text-[var(--ink)] capitalize">
                        {stage.eventName}
                      </span>
                      <span className="text-sm text-[var(--ink-muted)]">
                        {stage.count.toLocaleString()} ({(stage.conversionRate * 100).toFixed(2)}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--surface)] overflow-hidden">
                      <div
                        className="h-full bg-[var(--accent)]"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Traffic Sources */}
          <div className="rounded-lg border border-[var(--line)] bg-[var(--color-charcoal)] p-6">
            <h2 className="font-display text-xl font-bold text-[var(--ink)] mb-6">
              Traffic Sources
            </h2>
            <div className="space-y-4">
              {metrics.trafficSources.map((source, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-[var(--surface)] rounded">
                  <div className="flex-1">
                    <p className="font-semibold text-[var(--ink)] capitalize">
                      {source.source}
                    </p>
                    <p className="text-xs text-[var(--ink-muted)]">
                      {source.sessions.toLocaleString()} sessions
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-[var(--accent)]">
                      {source.conversions}
                    </p>
                    <p className="text-xs text-[var(--ink-muted)]">
                      {((source.conversions / source.sessions) * 100).toFixed(2)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cohort Analysis */}
        <div className="rounded-lg border border-[var(--line)] bg-[var(--color-charcoal)] p-6">
          <h2 className="font-display text-xl font-bold text-[var(--ink)] mb-6">
            Cohort Analysis
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--line)]">
                  <th className="text-left py-3 px-3 font-semibold text-[var(--ink)]">
                    Cohort
                  </th>
                  <th className="text-center py-3 px-3 font-semibold text-[var(--ink)]">
                    Size
                  </th>
                  <th className="text-center py-3 px-3 font-semibold text-[var(--ink)]">
                    Day 1
                  </th>
                  <th className="text-center py-3 px-3 font-semibold text-[var(--ink)]">
                    Day 7
                  </th>
                  <th className="text-center py-3 px-3 font-semibold text-[var(--ink)]">
                    Day 30
                  </th>
                  <th className="text-center py-3 px-3 font-semibold text-[var(--ink)]">
                    Conversion
                  </th>
                  <th className="text-center py-3 px-3 font-semibold text-[var(--ink)]">
                    Avg Revenue
                  </th>
                </tr>
              </thead>
              <tbody>
                {cohorts.slice(0, 6).map((cohort, index) => (
                  <tr key={index} className="border-b border-[var(--line)] hover:bg-[var(--surface)]">
                    <td className="py-3 px-3 text-[var(--ink)]">
                      {cohort.cohortName}
                    </td>
                    <td className="text-center py-3 px-3 text-[var(--ink)]">
                      {cohort.initialSize}
                    </td>
                    <td className="text-center py-3 px-3 text-[var(--accent)]">
                      {(cohort.retentionDay1 * 100).toFixed(0)}%
                    </td>
                    <td className="text-center py-3 px-3 text-[var(--accent)]">
                      {(cohort.retentionDay7 * 100).toFixed(0)}%
                    </td>
                    <td className="text-center py-3 px-3 text-[var(--accent)]">
                      {(cohort.retentionDay30 * 100).toFixed(0)}%
                    </td>
                    <td className="text-center py-3 px-3 text-[var(--ink)]">
                      {(cohort.conversionRate * 100).toFixed(2)}%
                    </td>
                    <td className="text-center py-3 px-3 text-[var(--ink)]">
                      ${(cohort.averageRevenue / 1000).toFixed(1)}k
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Device Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          {metrics.deviceTypes.map((device, index) => (
            <div
              key={index}
              className="rounded-lg border border-[var(--line)] bg-[var(--color-charcoal)] p-6"
            >
              <h3 className="font-semibold text-[var(--ink)] mb-4 capitalize">
                {device.device}
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-[var(--ink-muted)] mb-1">Sessions</p>
                  <p className="text-2xl font-bold text-[var(--accent)]">
                    {(device.sessions / 1000).toFixed(1)}k
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--ink-muted)] mb-1">Conversion Rate</p>
                  <p className="text-lg font-bold text-[var(--ink)]">
                    {(device.conversionRate * 100).toFixed(3)}%
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  change: number;
}

function MetricCard({ title, value, icon, change }: MetricCardProps) {
  return (
    <div className="rounded-lg border border-[var(--line)] bg-[var(--color-charcoal)] p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="text-[var(--accent)]">{icon}</div>
        <div className={`text-xs font-semibold ${change >= 0 ? "text-green-600" : "text-red-600"}`}>
          {change >= 0 ? "+" : ""}{change}%
        </div>
      </div>
      <p className="text-sm text-[var(--ink-muted)] mb-2">{title}</p>
      <p className="text-2xl font-bold text-[var(--ink)]">{value}</p>
    </div>
  );
}
