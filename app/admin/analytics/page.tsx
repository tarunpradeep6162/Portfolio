import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";

async function getAnalyticsData() {
  try {
    const baseUrl =
      process.env.VERCEL_URL || "http://localhost:3000";
    const analyticsRes = await fetch(`${baseUrl}/api/analytics`, {
      cache: "no-store",
    });
    const vitalsRes = await fetch(`${baseUrl}/api/vitals`, {
      cache: "no-store",
    });

    return {
      analytics: analyticsRes.ok ? await analyticsRes.json() : null,
      vitals: vitalsRes.ok ? await vitalsRes.json() : null,
    };
  } catch (error) {
    console.error("Error fetching analytics data:", error);
    return { analytics: null, vitals: null };
  }
}

export const metadata = {
  title: "Analytics Dashboard",
  robots: "noindex, nofollow",
};

export default async function AnalyticsDashboard() {
  const { analytics, vitals } = await getAnalyticsData();

  return (
    <div className="min-h-screen bg-[var(--color-control-black)]">
      <section className="section-glow control-grid relative overflow-hidden py-20 sm:py-28 lg:py-36">
        <Container className="relative space-y-12">
          <div>
            <Eyebrow>Analytics Dashboard / 01</Eyebrow>
            <h1 className="mt-6 font-display text-display font-semibold leading-[0.91] tracking-[-0.065em] text-[var(--ink)]">
              Performance metrics & insights.
            </h1>
            <p className="mt-6 max-w-[66ch] text-lead leading-8 text-[var(--ink-muted)]">
              Real-time analytics data including user interactions, page views,
              and Web Vitals metrics.
            </p>
          </div>
        </Container>
      </section>

      <section
        data-field="manual"
        className="section-glow manual-grid border-t border-[var(--line)] bg-[var(--surface)] py-20 text-[var(--ink)] sm:py-28 lg:py-36"
      >
        <Container className="space-y-16">
          {analytics && (
            <div>
              <h2 className="font-display text-heading font-semibold tracking-[-0.045em] mb-8">
                User Analytics
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="rounded-lg border border-[var(--line)] bg-[var(--color-control-raised)] p-6">
                  <p className="text-sm text-[var(--ink-muted)] uppercase tracking-[0.1em]">
                    Total Events
                  </p>
                  <p className="mt-3 font-display text-3xl font-semibold text-[var(--accent)]">
                    {analytics.eventCount || 0}
                  </p>
                </div>
                <div className="rounded-lg border border-[var(--line)] bg-[var(--color-control-raised)] p-6">
                  <p className="text-sm text-[var(--ink-muted)] uppercase tracking-[0.1em]">
                    Page Views
                  </p>
                  <p className="mt-3 font-display text-3xl font-semibold text-[var(--accent)]">
                    {analytics.pageViews || 0}
                  </p>
                </div>
                <div className="rounded-lg border border-[var(--line)] bg-[var(--color-control-raised)] p-6">
                  <p className="text-sm text-[var(--ink-muted)] uppercase tracking-[0.1em]">
                    Interactions
                  </p>
                  <p className="mt-3 font-display text-3xl font-semibold text-[var(--accent)]">
                    {analytics.interactions || 0}
                  </p>
                </div>
                <div className="rounded-lg border border-[var(--line)] bg-[var(--color-control-raised)] p-6">
                  <p className="text-sm text-[var(--ink-muted)] uppercase tracking-[0.1em]">
                    Animations Tracked
                  </p>
                  <p className="mt-3 font-display text-3xl font-semibold text-[var(--accent)]">
                    {analytics.animations || 0}
                  </p>
                </div>
              </div>
            </div>
          )}

          {vitals && vitals.byName && (
            <div>
              <h2 className="font-display text-heading font-semibold tracking-[-0.045em] mb-8">
                Web Vitals
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                {Object.entries(vitals.byName).map(([name, data]: any) => (
                  <div
                    key={name}
                    className="rounded-lg border border-[var(--line)] bg-[var(--color-control-raised)] p-6"
                  >
                    <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--accent)]">
                      {name}
                    </p>
                    <div className="mt-4 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-[var(--ink-muted)]">Avg</span>
                        <span className="font-mono font-semibold">
                          {data.avg}ms
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--ink-muted)]">P75</span>
                        <span className="font-mono font-semibold">
                          {data.p75}ms
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--ink-muted)]">P95</span>
                        <span className="font-mono font-semibold">
                          {data.p95}ms
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!analytics && !vitals && (
            <div className="rounded-lg border border-[var(--line)] bg-[var(--color-control-raised)] p-12 text-center">
              <p className="text-[var(--ink-muted)]">
                No analytics data available. Data will be collected as users
                interact with the site.
              </p>
            </div>
          )}
        </Container>
      </section>
    </div>
  );
}
