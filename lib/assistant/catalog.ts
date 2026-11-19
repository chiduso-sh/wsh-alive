// Shared by the chat route (tool schemas) and the browser (navigation
// handler). Contains no secrets.

export const CATEGORIES = ["workouts", "nutrition", "lifestyle", "mindfulness"] as const;
export type Category = (typeof CATEGORIES)[number];

export const NAV_PATHS = ["/", "/blog", "/workouts", "/nutrition", "/lifestyle", "/mindfulness", "/about", "/subscribe"] as const;
export type NavPath = (typeof NAV_PATHS)[number];

export function isNavPath(v: unknown): v is NavPath {
  return typeof v === "string" && (NAV_PATHS as readonly string[]).includes(v);
}

export type PostSummary = { slug: string; title: string; category: string; readTime: string; excerpt: string };
