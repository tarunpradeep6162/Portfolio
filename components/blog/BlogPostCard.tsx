import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { BlogPost } from '@/content/blog';

interface BlogPostCardProps {
  post: BlogPost;
}

export function BlogPostCard({ post }: BlogPostCardProps) {
  const formattedDate = new Date(post.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <article className="group flex flex-col h-full border border-[var(--line)] rounded-lg p-6 hover:border-[var(--accent)] transition-colors bg-[var(--surface)] hover:bg-[var(--surface)]/80">
      <div className="flex-1">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <time className="text-xs font-mono uppercase tracking-widest text-[var(--accent)]">
              {formattedDate}
            </time>
            <span className="ml-4 text-xs font-mono text-[var(--ink-muted)]">
              {post.readingTime} min read
            </span>
          </div>
          {post.featured && (
            <span className="px-2 py-1 text-xs font-semibold bg-[var(--accent)]/10 text-[var(--accent)] rounded">
              Featured
            </span>
          )}
        </div>

        <h3 className="text-xl font-display font-bold text-[var(--ink)] mb-3 group-hover:text-[var(--accent)] transition-colors line-clamp-3">
          {post.title}
        </h3>

        <p className="text-sm text-[var(--ink-muted)] mb-4 line-clamp-2">
          {post.description}
        </p>

        <div className="flex flex-wrap gap-2">
          {post.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-1 rounded bg-[var(--accent)]/10 text-[var(--accent)]"
            >
              {tag}
            </span>
          ))}
          {post.tags.length > 3 && (
            <span className="text-xs px-2 py-1 text-[var(--ink-muted)]">
              +{post.tags.length - 3}
            </span>
          )}
        </div>
      </div>

      <Link
        href={`/blog/${post.slug}`}
        className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent)] group-hover:gap-3 transition-all"
      >
        Read Article
        <ArrowRight size={16} />
      </Link>
    </article>
  );
}
