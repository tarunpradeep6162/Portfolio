import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { BlogPostCard } from "@/components/blog/BlogPostCard";
import { blogPosts } from "@/content/blog";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Articles about cloud infrastructure, DevOps, Kubernetes, security, and software engineering.",
};

export default function BlogPage() {
  const featuredPosts = blogPosts.filter((post) => post.featured);
  const otherPosts = blogPosts.filter((post) => !post.featured);
  const allTags = Array.from(new Set(blogPosts.flatMap((post) => post.tags)));

  return (
    <section className="bg-[var(--surface)] py-20 sm:py-28 lg:py-36 text-[var(--ink)]">
      <Container>
        <div className="max-w-3xl mb-16">
          <Eyebrow>Engineering Articles</Eyebrow>
          <h1 className="mt-6 font-display text-5xl sm:text-6xl font-bold leading-tight">
            Cloud Infrastructure & DevOps
          </h1>
          <p className="mt-6 text-lg text-[var(--ink-muted)] leading-relaxed">
            In-depth articles on infrastructure automation, deployment strategies, cloud architecture, and production reliability. Learn from real-world implementation experiences.
          </p>
        </div>

        {/* Featured Posts */}
        {featuredPosts.length > 0 && (
          <div className="mb-20">
            <h2 className="font-display text-2xl font-bold mb-8 text-[var(--ink)]">
              Featured Articles
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {featuredPosts.map((post) => (
                <BlogPostCard key={post.id} post={post} />
              ))}
            </div>
          </div>
        )}

        {/* All Posts */}
        <div className="mb-16">
          <h2 className="font-display text-2xl font-bold mb-8 text-[var(--ink)]">
            All Articles
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {otherPosts.map((post) => (
              <BlogPostCard key={post.id} post={post} />
            ))}
          </div>
        </div>

        {/* Tags */}
        <div className="border-t border-[var(--line)] pt-12">
          <h3 className="font-display text-lg font-bold mb-6 text-[var(--ink)]">
            Topics Covered
          </h3>
          <div className="flex flex-wrap gap-3">
            {allTags.map((tag) => (
              <Link
                key={tag}
                href={`/blog?tag=${encodeURIComponent(tag)}`}
                className="px-4 py-2 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-colors font-medium text-sm"
              >
                {tag}
              </Link>
            ))}
          </div>
        </div>

        {/* Newsletter CTA */}
        <div className="mt-20 p-8 rounded-lg bg-gradient-to-r from-[var(--accent)]/10 to-[var(--accent-secondary)]/10 border border-[var(--accent)]/20">
          <h3 className="font-display text-xl font-bold mb-3 text-[var(--ink)]">
            Stay Updated
          </h3>
          <p className="text-[var(--ink-muted)] mb-4">
            Get new articles delivered to your inbox when they&apos;re published.
          </p>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="your.email@example.com"
              className="flex-1 px-4 py-2 rounded bg-white text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
            <button className="px-6 py-2 bg-[var(--accent)] text-white font-semibold rounded hover:bg-[var(--accent-secondary)] transition-colors">
              Subscribe
            </button>
          </div>
        </div>
      </Container>
    </section>
  );
}
