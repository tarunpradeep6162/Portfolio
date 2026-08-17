import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Clock, Calendar } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { blogPosts } from "@/content/blog";

export function generateStaticParams() {
  return blogPosts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata(
  props: PageProps<"/blog/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const post = blogPosts.find((p) => p.slug === slug);

  if (!post) {
    return {};
  }

  return {
    title: post.title,
    description: post.description,
  };
}

export default async function BlogPostPage(
  props: PageProps<"/blog/[slug]">,
) {
  const { slug } = await props.params;
  const post = blogPosts.find((p) => p.slug === slug);

  if (!post) {
    notFound();
  }

  // Format date for display
  const formattedDate = new Date(post.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const relatedPosts = blogPosts
    .filter((p) => p.id !== post.id && p.tags.some((tag) => post.tags.includes(tag)))
    .slice(0, 3);

  return (
    <section className="bg-[var(--surface)] py-20 sm:py-28 lg:py-36">
      <Container>
        {/* Back Button */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent)] hover:gap-3 transition-all mb-8"
        >
          <ArrowLeft size={16} />
          Back to Articles
        </Link>

        {/* Header */}
        <div className="max-w-3xl mb-12">
          <Eyebrow>Article</Eyebrow>
          <h1 className="mt-4 font-display text-5xl sm:text-6xl font-bold leading-tight text-[var(--ink)]">
            {post.title}
          </h1>
          <p className="mt-6 text-xl text-[var(--ink-muted)]">
            {post.description}
          </p>

          {/* Metadata */}
          <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-[var(--ink-muted)] border-t border-[var(--line)] pt-8">
            <div className="flex items-center gap-2">
              <Calendar size={16} />
              <time>{formattedDate}</time>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={16} />
              <span>{post.readingTime} minute read</span>
            </div>
            <span className="text-xs font-semibold text-[var(--ink)]">
              by {post.author}
            </span>
          </div>

          {/* Tags */}
          <div className="mt-6 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <Link
                key={tag}
                href={`/blog?tag=${encodeURIComponent(tag)}`}
                className="px-3 py-1 text-xs rounded-full bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-colors"
              >
                {tag}
              </Link>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="max-w-3xl">
          <div className="prose prose-invert max-w-none">
            <article className="text-[var(--ink-muted)] leading-relaxed">
              {post.content.split("\n\n").map((paragraph, index) => {
                if (paragraph.startsWith("# ")) {
                  return (
                    <h2
                      key={index}
                      className="mt-12 mb-4 text-3xl font-display font-bold text-[var(--ink)]"
                    >
                      {paragraph.replace("# ", "")}
                    </h2>
                  );
                }
                if (paragraph.startsWith("## ")) {
                  return (
                    <h3
                      key={index}
                      className="mt-8 mb-3 text-2xl font-display font-bold text-[var(--ink)]"
                    >
                      {paragraph.replace("## ", "")}
                    </h3>
                  );
                }
                if (paragraph.startsWith("```")) {
                  return (
                    <pre
                      key={index}
                      className="mt-4 mb-4 p-4 bg-black/50 rounded-lg overflow-x-auto border border-[var(--line)]"
                    >
                      <code className="text-sm text-[var(--accent)] font-mono">
                        {paragraph.replace(/```/g, "")}
                      </code>
                    </pre>
                  );
                }
                if (paragraph.startsWith("- ")) {
                  return (
                    <ul key={index} className="mt-4 mb-4 ml-6 space-y-2">
                      {paragraph.split("\n").map((item, itemIndex) => (
                        <li key={itemIndex} className="list-disc text-[var(--ink-muted)]">
                          {item.replace("- ", "")}
                        </li>
                      ))}
                    </ul>
                  );
                }
                if (paragraph.startsWith("**")) {
                  return (
                    <p key={index} className="mt-4 mb-4 font-semibold text-[var(--ink)]">
                      {paragraph}
                    </p>
                  );
                }
                return (
                  <p key={index} className="mt-4 mb-4">
                    {paragraph}
                  </p>
                );
              })}
            </article>
          </div>
        </div>

        {/* Related Articles */}
        {relatedPosts.length > 0 && (
          <div className="mt-20 pt-12 border-t border-[var(--line)]">
            <h3 className="font-display text-2xl font-bold mb-8 text-[var(--ink)]">
              Related Articles
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              {relatedPosts.map((relatedPost) => (
                <Link
                  key={relatedPost.id}
                  href={`/blog/${relatedPost.slug}`}
                  className="group p-4 rounded-lg border border-[var(--line)] hover:border-[var(--accent)] hover:bg-[var(--surface-secondary)] transition-all"
                >
                  <h4 className="font-display font-semibold text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors line-clamp-2">
                    {relatedPost.title}
                  </h4>
                  <p className="mt-2 text-xs text-[var(--ink-muted)]">
                    {relatedPost.readingTime} min read
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </Container>
    </section>
  );
}
