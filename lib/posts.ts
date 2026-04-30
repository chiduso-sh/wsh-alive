import fs from "fs";
import path from "path";
import matter from "gray-matter";

const postsDir = path.join(process.cwd(), "content/posts");

export type PostMeta = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
  coverImage?: string;
};

export function getAllPosts(categoryFilter?: string): PostMeta[] {
  const files = fs.readdirSync(postsDir);
  return files
    .filter(f => f.endsWith(".mdx") || f.endsWith(".md"))
    .map(file => {
      const slug = file.replace(/\.mdx?$/, "");
      const raw = fs.readFileSync(path.join(postsDir, file), "utf-8");
      const { data } = matter(raw);
      return { slug, ...data } as PostMeta;
    })
    .filter(p => !categoryFilter || p.category === categoryFilter)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getPostBySlug(slug: string) {
  const filePath = [".mdx", ".md"]
    .map(ext => path.join(postsDir, slug + ext))
    .find(p => fs.existsSync(p));

  if (!filePath) return null;

  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  return { meta: { slug, ...data } as PostMeta, content };
}
