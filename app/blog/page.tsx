import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SplitReveal } from "@/components/shared/SplitReveal";
import { ScrollReveal } from "@/components/shared/ScrollReveal";
import { blogPosts } from "@/content/blog";
import { cn } from "@/lib/cn";

export const metadata: Metadata = {
  title: "Field notes",
  description:
    "Articles on cloud infrastructure, CI/CD, Kubernetes, security and observability by Tarun Pradeep B.",
};

const tagCounts = new Map<string, number>();
for (const tag of blogPosts.flatMap((post) => post.tags)) tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
const allTags = [...tagCounts.keys()].sort();
// The filter row shows topics shared by 2+ articles (a one-post tag is
// just that post); every tag still works as a link from its article.
const filterTags = allTags.filter((tag) => (tagCounts.get(tag) ?? 0) > 1);

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "2-digit" });

export default async function BlogPage(props: PageProps<"/blog">) {
  const { tag } = await props.searchParams;
  const activeTag = typeof tag === "string" && allTags.includes(tag) ? tag : null;
  const posts = [...blogPosts]
    .filter((post) => !activeTag || post.tags.includes(activeTag))
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <>
      <section className="control-grid border-b border-[var(--line)] bg-[var(--color-control-black)] py-20 sm:py-28">
        <Container>
          <Eyebrow>Field notes / {String(blogPosts.length).padStart(2, "0")}</Eyebrow>
          <SplitReveal
            as="h1"
            className="mt-6 max-w-[14ch] font-display text-[clamp(2.8rem,1.6rem+4vw,5.6rem)] font-semibold leading-[0.92] tracking-[-0.06em] text-[var(--ink)]"
          >
            Notes from the delivery path.
          </SplitReveal>
          <p className="mt-6 max-w-[56ch] text-lead leading-8 text-[var(--ink-muted)]">
            Explainers on infrastructure as code, pipelines, containers, security and observability - the
            ideas behind the systems in the case studies.
          </p>

          <nav aria-label="Filter by topic" className="mt-10 flex flex-wrap gap-2">
            <Link
              href="/blog"
              aria-current={activeTag ? undefined : "page"}
              className={cn(
                "border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors",
                !activeTag
                  ? "border-[var(--color-signal-lime)] text-[var(--color-signal-lime)]"
                  : "border-white/15 text-[var(--color-telemetry-steel)] hover:border-white/40 hover:text-[var(--color-cloud-linen)]",
              )}
            >
              All
            </Link>
            {(activeTag && !filterTags.includes(activeTag) ? [...filterTags, activeTag] : filterTags).map((t) => (
              <Link
                key={t}
                href={`/blog?tag=${encodeURIComponent(t)}`}
                aria-current={activeTag === t ? "page" : undefined}
                className={cn(
                  "border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors",
                  activeTag === t
                    ? "border-[var(--color-signal-lime)] text-[var(--color-signal-lime)]"
                    : "border-white/15 text-[var(--color-telemetry-steel)] hover:border-white/40 hover:text-[var(--color-cloud-linen)]",
                )}
              >
                {t}
              </Link>
            ))}
          </nav>
        </Container>
      </section>

      <section data-field="manual" className="manual-grid bg-[var(--surface)] py-16 text-[var(--ink)] sm:py-24">
        <Container>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--ink-muted)]" aria-live="polite">
            {activeTag ? `${posts.length} article${posts.length === 1 ? "" : "s"} tagged “${activeTag}”` : `${posts.length} articles`}
          </p>
          <ScrollReveal className="mt-6 border-t border-[var(--line)]">
            {posts.map((post, index) => (
              <article key={post.slug} data-reveal className="group border-b border-[var(--line)]">
                <Link
                  href={`/blog/${post.slug}`}
                  className="grid gap-4 py-8 transition-colors sm:grid-cols-[4rem_1fr_auto] sm:gap-8 sm:py-10"
                >
                  <span className="font-mono text-[10px] tracking-[0.16em] text-[var(--accent-secondary)]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span>
                    <span className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                      <time dateTime={post.date}>{formatDate(post.date)}</time>
                      <span>{post.readingTime} min read</span>
                      <span>{post.tags.slice(0, 3).join(" · ")}</span>
                    </span>
                    <span className="mt-3 block max-w-[34ch] font-display text-[clamp(1.5rem,1.1rem+1.2vw,2.3rem)] font-semibold leading-[1.08] tracking-[-0.04em] transition-colors group-hover:text-[var(--accent-secondary)]">
                      {post.title}
                    </span>
                    <span className="mt-3 block max-w-[62ch] text-sm leading-6 text-[var(--ink-muted)]">
                      {post.description}
                    </span>
                  </span>
                  <span
                    aria-hidden
                    className="hidden h-11 w-11 items-center justify-center border border-[var(--line)] transition-all duration-300 group-hover:rotate-45 group-hover:border-[var(--accent-secondary)] sm:flex"
                  >
                    <ArrowUpRight size={16} />
                  </span>
                </Link>
              </article>
            ))}
          </ScrollReveal>
          {activeTag && (
            <Link href="/blog" className="mt-8 inline-block font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--accent-secondary)] hover:text-[var(--accent)]">
              ← Show all articles
            </Link>
          )}
        </Container>
      </section>
    </>
  );
}
