import { getAllPosts } from "@/lib/posts";
import { CATEGORIES, CATEGORY_SLUGS, isCategory } from "@/lib/categories";
import PostCard from "@/components/PostCard";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

type Props = { params: Promise<{ category: string }> };

// One page per category (/workouts, /nutrition, ...). Any other top-level
// path that isn't its own route is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return CATEGORY_SLUGS.map(category => ({ category }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  return isCategory(category) ? { title: CATEGORIES[category].label } : {};
}

export default async function CategoryPage({ params }: Props) {
  const { category } = await params;
  if (!isCategory(category)) notFound();

  const { label } = CATEGORIES[category];
  const posts = getAllPosts(category);

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="mb-10">
        <p className="text-xs tracking-widest uppercase text-earth font-medium mb-3">{label}</p>
        <h1 className="font-serif text-4xl text-bark font-normal">{label} articles</h1>
        <p className="text-sm text-sage-light font-light mt-2">{posts.length} article{posts.length !== 1 ? "s" : ""}</p>
      </div>
      {posts.length === 0 ? (
        <p className="text-[#6A5A4A] font-light">No articles yet — check back soon.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map(post => <PostCard key={post.slug} post={post} />)}
        </div>
      )}
    </div>
  );
}
