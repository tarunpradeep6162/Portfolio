"use client";

import Link from "next/link";
import { Calendar, Clock, Tag } from "lucide-react";
import type { BlogPost } from "@/lib/blog";

interface BlogListProps {
  posts: BlogPost[];
}

export function BlogList({ posts }: BlogListProps) {
  return (
    <div className="space-y-8">
      {posts.map((post) => (
        <article
          key={post.slug}
          className="group border-b border-[var(--line)] pb-8 transition-all duration-300 hover:border-[var(--accent)]/50"
        >
          <Link href={`/blog/${post.slug}`} className="block">
            <div className="space-y-3">
              <h2 className="font-display text-2xl font-semibold tracking-[-0.035em] transition-colors duration-300 group-hover:text-[var(--accent)]">
                {post.title}
              </h2>
              <p className="max-w-[66ch] text-[var(--ink-muted)] leading-6">
                {post.description}
              </p>

              <div className="flex flex-wrap gap-4 pt-2 text-sm text-[var(--ink-muted)]">
                <div className="flex items-center gap-1.5">
                  <Calendar size={16} />
                  <time dateTime={post.date}>
                    {new Date(post.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </time>
                </div>

                <div className="flex items-center gap-1.5">
                  <Clock size={16} />
                  <span>{post.readTime} min read</span>
                </div>

                {post.author && (
                  <div className="text-xs uppercase tracking-[0.1em]">
                    By {post.author}
                  </div>
                )}
              </div>

              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-full bg-[var(--accent)]/10 px-2.5 py-1 text-xs font-medium text-[var(--accent)]"
                    >
                      <Tag size={12} />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Link>
        </article>
      ))}
    </div>
  );
}
