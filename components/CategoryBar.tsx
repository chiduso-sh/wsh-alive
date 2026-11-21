import Link from "next/link";
import { getAllPosts } from "@/lib/posts";
import { CATEGORIES, CATEGORY_SLUGS } from "@/lib/categories";

export default function CategoryBar() {
  const posts = getAllPosts();

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 border-b border-mist">
      {CATEGORY_SLUGS.map((slug, i) => {
        const { label, emoji, iconBg } = CATEGORIES[slug];
        const count = posts.filter(p => p.category === slug).length;
        return (
          <Link key={slug} href={`/${slug}`}
            className={`flex items-center gap-3 px-6 py-4 no-underline hover:bg-sage-pale transition-colors border-mist
              ${i < CATEGORY_SLUGS.length - 1 ? "border-r" : ""}
              ${i < 2 ? "border-b md:border-b-0" : ""}
            `}
          >
            <div className={`w-9 h-9 rounded-full ${iconBg} flex items-center justify-center text-sm flex-shrink-0`}>
              {emoji}
            </div>
            <div>
              <div className="text-sm font-medium text-bark tracking-wide">{label}</div>
              <div className="text-xs text-sage-light font-light">{count} article{count !== 1 ? "s" : ""}</div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
