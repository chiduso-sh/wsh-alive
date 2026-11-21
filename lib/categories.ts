// The blog's categories: the one list behind the category pages, the home
// page bar, post tags, the sitemap, frontmatter validation and the
// assistant's tools. Client-safe (no filesystem access).

export const CATEGORY_SLUGS = ["workouts", "nutrition", "lifestyle", "mindfulness"] as const;
export type Category = (typeof CATEGORY_SLUGS)[number];

type CategoryStyle = {
  label: string;
  emoji: string;
  iconBg: string; // home page category bar
  cardBg: string; // post card image area
  tagText: string; // post card tag
  tagPill: string; // tag on the article page
};

// Full class strings so Tailwind can find them.
export const CATEGORIES: Record<Category, CategoryStyle> = {
  workouts: {
    label: "Workouts", emoji: "🏋️", iconBg: "bg-[#E8EFE4]",
    cardBg: "bg-sage-pale", tagText: "text-sage", tagPill: "text-sage bg-sage-pale",
  },
  nutrition: {
    label: "Nutrition", emoji: "🥗", iconBg: "bg-[#F5EDE0]",
    cardBg: "bg-cream", tagText: "text-earth", tagPill: "text-earth bg-cream",
  },
  lifestyle: {
    label: "Lifestyle", emoji: "🌿", iconBg: "bg-[#E5EDF5]",
    cardBg: "bg-blue-50", tagText: "text-blue-500", tagPill: "text-blue-600 bg-blue-50",
  },
  mindfulness: {
    label: "Mindfulness", emoji: "🧘", iconBg: "bg-[#F0EAF5]",
    cardBg: "bg-purple-50", tagText: "text-purple-500", tagPill: "text-purple-600 bg-purple-50",
  },
};

export function isCategory(value: string): value is Category {
  return (CATEGORY_SLUGS as readonly string[]).includes(value);
}
