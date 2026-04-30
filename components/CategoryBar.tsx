"use client";
import Link from "next/link";

const categories = [
  { label: "Workouts", slug: "workouts", count: 24, bg: "bg-[#E8EFE4]", emoji: "🏋️" },
  { label: "Nutrition", slug: "nutrition", count: 18, bg: "bg-[#F5EDE0]", emoji: "🥗" },
  { label: "Lifestyle", slug: "lifestyle", count: 31, bg: "bg-[#E5EDF5]", emoji: "🌿" },
  { label: "Mindfulness", slug: "mindfulness", count: 12, bg: "bg-[#F0EAF5]", emoji: "🧘" },
];

export default function CategoryBar() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 border-b border-mist">
      {categories.map((cat, i) => (
        <Link key={cat.slug} href={`/${cat.slug}`}
          className={`flex items-center gap-3 px-6 py-4 no-underline hover:bg-sage-pale transition-colors border-mist
            ${i < categories.length - 1 ? "border-r" : ""}
            ${i < 2 ? "border-b md:border-b-0" : ""}
          `}
        >
          <div className={`w-9 h-9 rounded-full ${cat.bg} flex items-center justify-center text-sm flex-shrink-0`}>
            {cat.emoji}
          </div>
          <div>
            <div className="text-sm font-medium text-bark tracking-wide">{cat.label}</div>
            <div className="text-xs text-sage-light font-light">{cat.count} articles</div>
          </div>
        </Link>
      ))}
    </div>
  );
}
