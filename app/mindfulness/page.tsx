import { getAllPosts } from "@/lib/posts";
import PostCard from "@/components/PostCard";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Mindfulness" };

export default function MindfulnessPage() {
  const posts = getAllPosts("mindfulness");

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="mb-10">
        <p className="text-xs tracking-widest uppercase text-earth font-medium mb-3">Mindfulness</p>
        <h1 className="font-serif text-4xl text-bark font-normal">Mindfulness articles</h1>
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
