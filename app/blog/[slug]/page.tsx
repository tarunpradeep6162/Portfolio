import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Button } from "@/components/ui/Button";
import { SplitReveal } from "@/components/shared/SplitReveal";
import { ArticleBody, articleBlocks, tableOfContents } from "@/components/blog/ArticleBody";
import { ArticleToc } from "@/components/blog/ArticleToc";
import { blogPosts } from "@/content/blog";
import { site } from "@/content/site";

function getPost(slug: string) {
  return blogPosts.find((post) => post.slug === slug);
}

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata(props: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const post = getPost(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
    openGraph: { title: post.title, description: post.description, type: "article", publishedTime: post.date },
  };
}

export default async function BlogPostPage(props: PageProps<"/blog/[slug]">) {
  const { slug } = await props.params;
  const post = getPost(slug);
  if (!post) notFound();

  const blocks = articleBlocks(post.content, post.title);
  const toc = tableOfContents(blocks);
  const date = new Date(post.date).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" });
  const related = blogPosts
    .filter((p) => p.slug !== post.slug)
    .map((p) => ({ post: p, shared: p.tags.filter((t) => post.tags.includes(t)).length }))
    .sort((a, b) => b.shared - a.shared)
    .slice(0, 2)
    .map((r) => r.post);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: { "@type": "Person", name: site.name, url: site.url },
    keywords: post.tags.join(", "),
  };

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header className="control-grid border-b border-[var(--line)] bg-[var(--color-control-black)] py-16 sm:py-24">
        <Container>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--color-telemetry-steel)] transition-colors hover:text-[var(--color-signal-lime)]"
          >
            <ArrowLeft size={13} aria-hidden /> Field notes
          </Link>
          <div className="mt-10 max-w-[58rem]">
            <Eyebrow>{post.tags.slice(0, 2).join(" / ")}</Eyebrow>
            <SplitReveal
              as="h1"
              className="mt-6 font-display text-[clamp(2.3rem,1.4rem+3.2vw,4.8rem)] font-semibold leading-[0.96] tracking-[-0.055em] text-[var(--ink)]"
            >
              {post.title}
            </SplitReveal>
            <p className="mt-6 max-w-[60ch] text-lead leading-8 text-[var(--ink-muted)]">{post.description}</p>
            <p className="mt-8 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-telemetry-steel)]">
              <time dateTime={post.date}>{date}</time>
              <span>{post.readingTime} min read</span>
              <span>{post.author}</span>
            </p>
          </div>
        </Container>
      </header>

      <div data-field="manual" className="manual-grid bg-[var(--surface)] text-[var(--ink)]">
        <Container className="grid gap-12 py-16 sm:py-20 lg:grid-cols-[minmax(0,1fr)_16rem] lg:gap-20 lg:py-24">
          <div className="max-w-[68ch]">
            <ArticleBody blocks={blocks} />
            <div className="mt-14 flex flex-wrap gap-2 border-t border-[var(--line)] pt-8">
              {post.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/blog?tag=${encodeURIComponent(tag)}`}
                  className="border border-[var(--line)] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-muted)] transition-colors hover:border-[var(--accent-secondary)] hover:text-[var(--ink)]"
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>
          <aside className="hidden lg:block">
            <div className="sticky top-28">
              <ArticleToc entries={toc} />
            </div>
          </aside>
        </Container>
      </div>

      <section className="control-grid border-t border-white/10 bg-[var(--color-control-black)] py-16 sm:py-20">
        <Container>
          <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--color-telemetry-steel)]">Keep reading</p>
          <div className="mt-6 grid gap-px border border-white/10 bg-white/10 sm:grid-cols-2">
            {related.map((p) => (
              <Link key={p.slug} href={`/blog/${p.slug}`} className="group bg-[var(--color-control-black)] p-6 transition-colors hover:bg-white/[0.03] sm:p-8">
                <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--color-telemetry-steel)]">{p.readingTime} min read</span>
                <span className="mt-3 flex items-start justify-between gap-6 font-display text-xl font-semibold leading-tight tracking-[-0.03em] text-[var(--color-cloud-linen)] group-hover:text-[var(--color-signal-lime)]">
                  {p.title}
                  <ArrowUpRight size={18} aria-hidden className="shrink-0 transition-transform group-hover:rotate-45" />
                </span>
              </Link>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Button href="/work">See these ideas in the case studies</Button>
            <Button href={`mailto:${site.email}`} variant="secondary">
              Discuss this with Tarun
            </Button>
          </div>
        </Container>
      </section>
    </article>
  );
}
