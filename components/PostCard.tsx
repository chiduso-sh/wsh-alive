"use client";
import Link from "next/link";
import Image from "next/image";

export type Post = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
  coverImage?: string;
};

const tagStyles: Record<string, string> = {
  workouts: "text-sage",
  nutrition: "text-earth",
  lifestyle: "text-blue-500",
  mindfulness: "text-purple-500",
};

const bgStyles: Record<string, string> = {
  workouts: "bg-sage-pale",
  nutrition: "bg-cream",
  lifestyle: "bg-blue-50",
  mindfulness: "bg-purple-50",
};

export default function PostCard({ post, large = false }: { post: Post; large?: boolean }) {
  return (
    <Link href={`/blog/${post.slug}`} className="no-underline group h-full">
      <article className="rounded-xl overflow-hidden border border-mist bg-white h-full flex flex-col transition-transform duration-200 group-hover:-translate-y-1">
        <div className={`relative flex items-center justify-center ${large ? "h-72" : "h-48"} ${bgStyles[post.category] || "bg-sage-pale"}`}>
          {post.coverImage ? (
            <Image src={post.coverImage} alt={post.title} fill className="object-cover" />
          ) : (
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-30">
              <ellipse cx="40" cy="72" rx="28" ry="8" fill="#6B7F5E"/>
              <rect x="36" y="36" width="8" height="36" rx="3" fill="#A07850"/>
              <ellipse cx="40" cy="22" rx="22" ry="20" fill="#6B7F5E"/>
              <ellipse cx="40" cy="18" rx="16" ry="15" fill="#8FA07F"/>
              <circle cx="32" cy="18" r="2" fill="#F5EDE0" opacity="0.8"/>
              <circle cx="47" cy="15" r="1.5" fill="#F5EDE0" opacity="0.8"/>
            </svg>
          )}
        </div>
        <div className="p-5 flex flex-col flex-1">
          <span className={`text-xs tracking-widest uppercase font-medium mb-2 ${tagStyles[post.category] || "text-sage"}`}>
            {post.category}
          </span>
          <h2 className={`font-serif text-bark leading-snug mb-2 font-normal ${large ? "text-2xl" : "text-lg"}`}>
            {post.title}
          </h2>
          {large && <p className="text-sm text-[#6A5A4A] leading-relaxed font-light mb-4 flex-1">{post.excerpt}</p>}
          <div className="flex gap-4 text-xs text-sage-light font-light mt-auto pt-3 border-t border-mist">
            <span>{post.readTime}</span>
            <span>{post.date}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
