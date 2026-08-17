import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { BlogPost } from "@/components/blog/BlogPost";
import { getAllPosts, getPostBySlug, getRelatedPosts } from "@/lib/blog";
import { generateArticleSchema } from "@/lib/seo/schema";
import { site } from "@/content/site";

interface BlogPostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return { title: "Not Found" };
  }

  return {
    title: post.title,
    description: post.description,
  };
}

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = await getRelatedPosts(slug);
  const schema = generateArticleSchema({
    title: post.title,
    description: post.description,
    image: post.image,
    datePublished: post.date,
    author: post.author,
    url: `${site.url}/blog/${slug}`,
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <section className="section-glow control-grid relative overflow-hidden bg-[var(--color-control-black)] py-20 sm:py-28 lg:py-36">
        <Container className="relative">
          <BlogPost post={post} />
        </Container>
      </section>

      {relatedPosts.length > 0 && (
        <section
          data-field="manual"
          className="section-glow manual-grid border-t border-[var(--line)] bg-[var(--surface)] py-20 text-[var(--ink)] sm:py-28 lg:py-36"
        >
          <Container>
            <h2 className="font-display text-heading font-semibold tracking-[-0.045em] mb-8">
              Related articles
            </h2>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {relatedPosts.map((related) => (
                <a
                  key={related.slug}
                  href={`/blog/${related.slug}`}
                  className="group rounded-lg border border-[var(--line)] bg-[var(--surface-raised)] p-6 transition-all duration-300 hover:border-[var(--accent)]/50 hover:bg-[var(--color-control-raised)]"
                >
                  <h3 className="font-display text-lg font-semibold tracking-[-0.035em] transition-colors duration-300 group-hover:text-[var(--accent)]">
                    {related.title}
                  </h3>
                  <p className="mt-3 text-sm text-[var(--ink-muted)] line-clamp-2">
                    {related.description}
                  </p>
                  <div className="mt-4 flex items-center justify-between text-xs text-[var(--ink-muted)]">
                    <time dateTime={related.date}>
                      {new Date(related.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </time>
                    <span>{related.readTime} min</span>
                  </div>
                </a>
              ))}
            </div>
          </Container>
        </section>
      )}
    </>
  );
}
