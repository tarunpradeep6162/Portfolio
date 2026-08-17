"use client";

import { Calendar, Clock, ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { BlogPost } from "@/lib/blog";

interface BlogPostProps {
  post: BlogPost;
}

export function BlogPost({ post }: BlogPostProps) {
  return (
    <article className="max-w-[65ch] mx-auto space-y-8">
      <Link
        href="/blog"
        className="inline-flex items-center gap-2 text-[var(--accent)] hover:gap-3 transition-all duration-300 font-mono text-sm"
      >
        <ArrowLeft size={16} />
        Back to blog
      </Link>

      <div className="space-y-4">
        <h1 className="font-display text-5xl font-semibold leading-tight tracking-[-0.065em] text-[var(--ink)]">
          {post.title}
        </h1>

        <p className="text-lg text-[var(--ink-muted)] leading-7">
          {post.description}
        </p>

        <div className="flex flex-wrap gap-6 pt-4 text-sm text-[var(--ink-muted)] border-t border-[var(--line)] pt-4">
          <div className="flex items-center gap-2">
            <Calendar size={16} />
            <time dateTime={post.date}>
              {new Date(post.date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
          </div>

          <div className="flex items-center gap-2">
            <Clock size={16} />
            <span>{post.readTime} min read</span>
          </div>

          {post.author && (
            <div className="font-mono text-xs uppercase tracking-[0.1em]">
              By {post.author}
            </div>
          )}
        </div>
      </div>

      {post.image && (
        <div className="relative overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--surface-raised)]">
          <img
            src={post.image}
            alt={post.title}
            className="w-full h-96 object-cover"
          />
        </div>
      )}

      <div className="prose prose-invert max-w-none text-[var(--ink)] space-y-6">
        <div className="leading-7 space-y-4 text-base">
          {post.content
            .split("\n\n")
            .filter(Boolean)
            .map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
        </div>
      </div>

      {post.tags && post.tags.length > 0 && (
        <div className="border-t border-[var(--line)] pt-8">
          <div className="text-xs uppercase tracking-[0.16em] text-[var(--ink-muted)] mb-3">
            Tags
          </div>
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full bg-[var(--accent)]/10 px-3 py-1.5 text-xs font-medium text-[var(--accent)]"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
