import { getAllPosts } from "@/lib/posts";
import PostCard from "@/components/PostCard";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "All Articles" };

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="mb-10">
        <p className="text-xs tracking-widest uppercase text-earth font-medium mb-3">All articles</p>
        <h1 className="font-serif text-4xl text-bark font-normal">The WSH Alive Journal</h1>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map(post => <PostCard key={post.slug} post={post} />)}
      </div>
    </div>
  );
}
