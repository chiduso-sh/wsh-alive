// Shared between the server (registration, request validation) and the
// browser (function handlers). Contains no secrets.

export const CATEGORIES = ["workouts", "nutrition", "lifestyle", "mindfulness"] as const;
export type Category = (typeof CATEGORIES)[number];

export const NAV_PATHS = ["/", "/blog", "/workouts", "/nutrition", "/lifestyle", "/mindfulness", "/about", "/subscribe"] as const;
export type NavPath = (typeof NAV_PATHS)[number];

export const FUNCTION_NAMES = ["get_all_posts", "get_posts_by_category", "navigate_to", "subscribe_user"] as const;
export type FunctionName = (typeof FUNCTION_NAMES)[number];

export function isFunctionName(v: unknown): v is FunctionName {
  return typeof v === "string" && (FUNCTION_NAMES as readonly string[]).includes(v);
}

// Keep under 512 characters: EngageAI rejects longer descriptions with a 422.
const SYSTEM_DESCRIPTION = [
  "Warm, concise guide for WSH Alive, a wellness blog (workouts, nutrition, lifestyle, mindfulness).",
  "Help visitors find articles, open pages and join the newsletter.",
  "Posts returned by functions are already shown as cards: reply in 1-2 sentences, don't repeat the list.",
  "If the user accepts an offer to open a page, call navigate_to.",
  "Never invent articles.",
].join(" ");

export function buildManifest(appId: string) {
  return {
    app_id: appId,
    app_name: "WSH Alive",
    version: "2.0.0",
    description: SYSTEM_DESCRIPTION,
    domain: "health",
    functions: [
      {
        name: "get_all_posts",
        description: "List every article on the blog with its title, category, read time, excerpt and slug.",
        parameters: { type: "object", properties: {}, required: [] },
        side_effects: ["none"],
        examples: ["What articles do you have?", "Show me everything on the blog"],
      },
      {
        name: "get_posts_by_category",
        description: "List the articles in one category.",
        parameters: {
          type: "object",
          properties: {
            category: { type: "string", description: "The blog category to list", enum: [...CATEGORIES] },
          },
          required: ["category"],
        },
        side_effects: ["none"],
        examples: ["Any nutrition tips?", "Show me workout articles", "I want to feel calmer"],
      },
      {
        name: "navigate_to",
        description: "Open a page of the site for the user. Use it when they ask to go somewhere or accept your offer to open a page.",
        parameters: {
          type: "object",
          properties: {
            path: { type: "string", description: "The site path to open", enum: [...NAV_PATHS] },
          },
          required: ["path"],
        },
        side_effects: ["none"],
        examples: ["Take me to the nutrition page", "Yes, open it", "Go to about"],
      },
      {
        name: "subscribe_user",
        description: "Subscribe the user to the weekly newsletter. Ask for their first name and email if missing, then call this straight away: the site shows the user a Yes/No confirmation before anything is submitted.",
        parameters: {
          type: "object",
          properties: {
            name: { type: "string", description: "The user's first name" },
            email: { type: "string", description: "The user's email address" },
          },
          required: ["name", "email"],
        },
        // Confirmation happens in the site, not via EngageAI: its requires_confirmation
        // makes the model ask in text and then sends a second formal prompt.
        requires_confirmation: false,
        side_effects: ["creates_record"],
        examples: ["Sign me up for the newsletter", "Subscribe ada@example.com"],
      },
    ],
  };
}
