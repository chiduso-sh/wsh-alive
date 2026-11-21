import "server-only";
import { tool, type InferUITools, type UIDataTypes, type UIMessage } from "ai";
import { z } from "zod";
import { getAllPosts } from "@/lib/posts";
import { requestSubscription } from "@/lib/newsletter/subscribe";
import { CATEGORIES, NAV_PATHS, type PostSummary } from "./catalog";

export const SYSTEM_PROMPT = [
  "You are the WSH Alive guide: a warm, concise assistant for a wellness blog about workouts, nutrition, lifestyle and mindfulness.",
  "Help visitors find articles, open pages and join the weekly newsletter.",
  "Reply in plain text (no Markdown), usually one to three sentences.",
  "Articles returned by get_posts are already shown to the visitor as cards, so don't repeat the list: add a short comment or recommendation instead.",
  "Only mention articles that get_posts returned. Never invent articles, links or facts about the site.",
  "When the visitor asks to go somewhere, or accepts your offer to open a page, call navigate_to.",
  "To subscribe someone, ask for their first name and email if you don't have them, then call subscribe_user straight away. The site asks them to approve before anything is sent, so don't ask for confirmation yourself. Afterwards, pass on the tool's result in your own words.",
  "You offer general wellness information, not medical advice. For injuries, symptoms or medical conditions, suggest seeing a qualified professional.",
  "Politely decline requests unrelated to wellness or this site.",
].join(" ");

// Errors thrown here reach the visitor and the model verbatim, so only throw
// messages that are safe to show.
class SafeToolError extends Error {}

export function buildTools(ip: string) {
  return {
    get_posts: tool({
      description: "List the blog's articles with title, category, read time, excerpt and slug. Omit the category to list every article.",
      inputSchema: z.object({
        category: z.enum(CATEGORIES).optional().describe("Only list articles in this category"),
      }),
      execute: async ({ category }): Promise<PostSummary[]> => {
        try {
          return getAllPosts(category).map(({ slug, title, category, readTime, excerpt }) => ({ slug, title, category, readTime, excerpt }));
        } catch {
          throw new SafeToolError("The articles couldn't be loaded right now.");
        }
      },
    }),

    // No execute: runs in the browser (router.push), see AssistantChat.
    navigate_to: tool({
      description: "Open a page of the site for the visitor. The chat stays open.",
      inputSchema: z.object({ path: z.enum(NAV_PATHS).describe("The site path to open") }),
      outputSchema: z.string(),
    }),

    // Requires the visitor's approval (see toolApproval in the chat route).
    // A modified client could fake that approval, but it would only get what
    // the public signup form already offers, under the same rate limits.
    subscribe_user: tool({
      description: "Send the visitor a confirmation email for the weekly newsletter (double opt-in). Needs their first name and email address.",
      inputSchema: z.object({
        name: z.string().min(1).max(50).describe("The visitor's first name"),
        email: z.string().min(3).max(254).describe("The visitor's email address"),
      }),
      execute: async ({ name, email }) => {
        const result = await requestSubscription({ name, email }, ip);
        if (!result.ok) throw new SafeToolError(result.error);
        return result.message;
      },
    }),
  };
}

export type AssistantTools = ReturnType<typeof buildTools>;
export type AssistantMessage = UIMessage<never, UIDataTypes, InferUITools<AssistantTools>>;
