import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { BlogList } from "@/components/blog/BlogList";
import { getAllPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Insights on web development, design systems, animations, and building better digital products.",
};

export default async function BlogPage() {
  const posts = await getAllPosts();

  return (
    <>
      <section className="section-glow control-grid relative overflow-hidden bg-[var(--color-control-black)] py-20 sm:py-28 lg:py-36">
        <Container className="relative space-y-12">
          <div>
            <Eyebrow>Blog / 01</Eyebrow>
            <h1 className="mt-6 font-display text-display font-semibold leading-[0.91] tracking-[-0.065em] text-[var(--ink)]">
              Thoughts on development and design.
            </h1>
            <p className="mt-6 max-w-[66ch] text-lead leading-8 text-[var(--ink-muted)]">
              Articles on web development, design systems, animations, and
              building better digital products through thoughtful engineering
              and user-focused design.
            </p>
          </div>
        </Container>
      </section>

      <section
        data-field="manual"
        className="section-glow manual-grid border-t border-[var(--line)] bg-[var(--surface)] py-20 text-[var(--ink)] sm:py-28 lg:py-36"
      >
        <Container>
          {posts.length > 0 ? (
            <BlogList posts={posts} />
          ) : (
            <div className="text-center py-12">
              <p className="text-[var(--ink-muted)]">
                More articles coming soon...
              </p>
            </div>
          )}
        </Container>
      </section>
    </>
  );
}
