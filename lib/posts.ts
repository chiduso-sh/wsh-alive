import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { z } from "zod";
import { CATEGORY_SLUGS } from "@/lib/categories";

const postsDir = path.join(process.cwd(), "content/posts");

// Lowercase words joined by single hyphens. Slugs arrive from the URL, so
// anything else (dots, slashes, backslashes, encoded characters) is rejected
// before it gets near the filesystem.
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const frontmatter = z.object({
  title: z.string().min(1),
  excerpt: z.string().min(1),
  category: z.enum(CATEGORY_SLUGS),
  // YAML turns an unquoted 2026-04-22 into a Date; keep it as the same string.
  date: z.preprocess(
    d => (d instanceof Date ? d.toISOString().slice(0, 10) : d),
    z.string().refine(d => !Number.isNaN(Date.parse(d)), "must be a date, e.g. 2026-04-22"),
  ),
  readTime: z.string().min(1),
  coverImage: z.string().optional(),
});

export type PostMeta = z.infer<typeof frontmatter> & { slug: string };

function isValidSlug(slug: string) {
  return SLUG.test(slug);
}

// Fails the build with the file name, rather than rendering a broken post.
function readPost(file: string) {
  const slug = file.replace(/\.mdx?$/, "");
  if (!isValidSlug(slug)) throw new Error(`content/posts/${file}: file name must be lowercase words joined by hyphens`);

  const { data, content } = matter(fs.readFileSync(path.join(postsDir, file), "utf-8"));
  const parsed = frontmatter.safeParse(data);
  if (!parsed.success) {
    const issues = parsed.error.issues.map(i => `${i.path.join(".") || "frontmatter"} ${i.message}`).join("; ");
    throw new Error(`content/posts/${file}: invalid frontmatter: ${issues}`);
  }
  return { meta: { slug, ...parsed.data } satisfies PostMeta, content };
}

export function getAllPosts(categoryFilter?: string): PostMeta[] {
  return fs
    .readdirSync(postsDir)
    .filter(f => f.endsWith(".mdx") || f.endsWith(".md"))
    .map(file => readPost(file).meta)
    .filter(p => !categoryFilter || p.category === categoryFilter)
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
}

export function getPostBySlug(slug: string) {
  if (!isValidSlug(slug)) return null;
  const file = [".mdx", ".md"].map(ext => slug + ext).find(f => fs.existsSync(path.join(postsDir, f)));
  return file ? readPost(file) : null;
}
