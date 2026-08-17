"use client";

import { useEffect, useState } from "react";
import { Code2, GitFork, Star, TrendingUp } from "lucide-react";

interface GitHubStats {
  repos: number;
  followers: number;
  stars: number;
  contributions: number;
}

export function GitHubStatsCard() {
  const [stats, setStats] = useState<GitHubStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const username = "tarunpradeep6162";

        // Fetch user data
        const userRes = await fetch(
          `https://api.github.com/users/${username}`,
        );
        const userData = await userRes.json();

        // Fetch repos to count stars
        const reposRes = await fetch(
          `https://api.github.com/users/${username}/repos?per_page=100`,
        );
        const repos = await reposRes.json();

        const totalStars = repos.reduce(
          (sum: number, repo: { stargazers_count: number }) =>
            sum + repo.stargazers_count,
          0,
        );

        // Calculate contributions (approximate from repos)
        const totalForks = repos.reduce(
          (sum: number, repo: { forks_count: number }) =>
            sum + repo.forks_count,
          0,
        );

        setStats({
          repos: userData.public_repos,
          followers: userData.followers,
          stars: totalStars,
          contributions: totalForks,
        });
      } catch (error) {
        console.error("Failed to fetch GitHub stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-12 rounded bg-[var(--ink-muted)]/20" />
        <div className="h-12 rounded bg-[var(--ink-muted)]/20" />
      </div>
    );
  }

  if (!stats) return null;

  const statItems = [
    {
      icon: Code2,
      label: "Repositories",
      value: stats.repos,
      color: "text-[var(--accent)]",
    },
    {
      icon: Star,
      label: "Stars received",
      value: stats.stars,
      color: "text-yellow-500",
    },
    {
      icon: TrendingUp,
      label: "Followers",
      value: stats.followers,
      color: "text-[var(--accent-secondary)]",
    },
    {
      icon: GitFork,
      label: "Total forks",
      value: stats.contributions,
      color: "text-green-500",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4">
      {statItems.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <a
            key={stat.label}
            href="https://github.com/tarunpradeep6162"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--ink)]/[0.02] p-4 transition-all hover:border-[var(--accent)] hover:bg-[var(--accent)]/[0.05] sm:p-6"
            style={{
              animationDelay: `${index * 50}ms`,
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/0 to-[var(--accent)]/0 transition-all group-hover:from-[var(--accent)]/10 group-hover:to-[var(--accent)]/5" />
            <div className="relative">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--ink-muted)] transition-colors group-hover:text-[var(--accent)]">
                    {stat.label}
                  </p>
                  <p className="mt-2 font-display text-2xl font-bold text-[var(--ink)] sm:text-3xl">
                    {stat.value.toLocaleString()}
                  </p>
                </div>
                <Icon className={`${stat.color} transition-transform group-hover:scale-110 group-hover:rotate-12`} />
              </div>
            </div>
          </a>
        );
      })}
    </div>
  );
}
