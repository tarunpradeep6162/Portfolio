import fs from "fs";
import path from "path";
import matter from "gray-matter";

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  readTime: number;
  author?: string;
  tags?: string[];
  image?: string;
  content: string;
}

const postsDirectory = path.join(process.cwd(), "content/blog");

export async function getAllPosts(): Promise<BlogPost[]> {
  if (!fs.existsSync(postsDirectory)) {
    return [];
  }

  const files = fs.readdirSync(postsDirectory);
  const posts: BlogPost[] = [];

  for (const file of files) {
    if (!file.endsWith(".mdx")) continue;

    const filePath = path.join(postsDirectory, file);
    const fileContents = fs.readFileSync(filePath, "utf8");
    const { data, content } = matter(fileContents);

    const slug = file.replace(/\.mdx?$/, "");
    const readTime = Math.ceil(content.split(/\s+/).length / 200);

    posts.push({
      slug,
      title: data.title || "",
      description: data.description || "",
      date: data.date || new Date().toISOString().split("T")[0],
      readTime,
      author: data.author,
      tags: data.tags || [],
      image: data.image,
      content,
    });
  }

  return posts.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const filePath = path.join(postsDirectory, `${slug}.mdx`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const fileContents = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(fileContents);
  const readTime = Math.ceil(content.split(/\s+/).length / 200);

  return {
    slug,
    title: data.title || "",
    description: data.description || "",
    date: data.date || new Date().toISOString().split("T")[0],
    readTime,
    author: data.author,
    tags: data.tags || [],
    image: data.image,
    content,
  };
}

export async function getRelatedPosts(
  slug: string,
  limit: number = 3
): Promise<BlogPost[]> {
  const currentPost = await getPostBySlug(slug);
  if (!currentPost) return [];

  const allPosts = await getAllPosts();
  const filtered = allPosts.filter((p) => p.slug !== slug);

  if (currentPost.tags && currentPost.tags.length > 0) {
    return filtered
      .filter((p) =>
        p.tags?.some((tag) => currentPost.tags?.includes(tag))
      )
      .slice(0, limit);
  }

  return filtered.slice(0, limit);
}
