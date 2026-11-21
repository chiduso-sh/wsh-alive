import { getPostBySlug, getAllPosts } from "@/lib/posts";
import { CATEGORIES } from "@/lib/categories";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import type { Metadata } from "next";
import Link from "next/link";

type Props = { params: Promise<{ slug: string }> };

// Only the posts found at build time exist; any other slug is a 404 without
// touching the filesystem.
export const dynamicParams = false;

export async function generateStaticParams() {
  return getAllPosts().map(p => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  return {
    title: post.meta.title,
    description: post.meta.excerpt,
    openGraph: { title: post.meta.title, description: post.meta.excerpt },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const { meta, content } = post;

  return (
    <article className="max-w-2xl mx-auto px-6 py-12">
      <Link href="/blog" className="text-xs tracking-widest uppercase text-sage-light hover:text-sage no-underline transition-colors mb-8 inline-block">
        ← Back to journal
      </Link>

      <header className="mb-10">
        <span className={`text-xs tracking-widest uppercase font-medium px-3 py-1 rounded-full ${CATEGORIES[meta.category].tagPill}`}>
          {CATEGORIES[meta.category].label}
        </span>
        <h1 className="font-serif text-4xl md:text-5xl text-bark leading-tight font-normal mt-4 mb-4">
          {meta.title}
        </h1>
        <p className="text-base text-[#6A5A4A] font-light leading-relaxed mb-4">{meta.excerpt}</p>
        <div className="flex gap-4 text-sm text-sage-light font-light border-t border-mist pt-4">
          <span>{meta.date}</span>
          <span>·</span>
          <span>{meta.readTime}</span>
        </div>
      </header>

      <div className="prose">
        <MDXRemote source={content} />
      </div>
    </article>
  );
}
