"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { pushAIMessage } from "./EngageAIChat";

const APP_ID = "wsh_alive";
const APP_NAME = "wsh-alive";

type FunctionDef = {
  name: string;
  description: string;
  parameters: object;
  handler: (args: Record<string, unknown>) => Promise<unknown>;
};

type AgentAction = {
  actionType: string;
  message: string | null;
  functionCalls: Array<{ functionName: string; arguments: Record<string, unknown>; callId: string }>;
};

type ChatApiResponse = {
  session_id: string;
  action: {
    action_type: string;
    message?: string;
    function_calls?: Array<{ function_name: string; arguments: Record<string, unknown>; call_id: string }>;
  };
};

type Post = { title: string; category: string; excerpt: string; slug: string; readTime: string };

async function proxyPost(path: string, body: object) {
  const res = await fetch("/api/engageai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, body }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`EngageAI error ${res.status}: ${err}`);
  }
  return res.json();
}

function parseAction(data: ChatApiResponse): AgentAction {
  const raw = data.action;
  return {
    actionType: raw.action_type,
    message: raw.message ?? null,
    functionCalls: (raw.function_calls ?? []).map(fc => ({
      functionName: fc.function_name,
      arguments: fc.arguments,
      callId: fc.call_id,
    })),
  };
}

class EngageAIClient {
  private sessionId: string;
  private functions = new Map<string, FunctionDef>();
  private initialized = false;
  lastCategoryShown: string | null = null;

  constructor() {
    this.sessionId = `sess_${Date.now().toString(36)}`;
  }

  registerFunction(fn: FunctionDef) { this.functions.set(fn.name, fn); }

  async initialize() {
    const manifest = {
      app_id: APP_ID,
      app_name: APP_NAME,
      version: "1.0.0",
      description: "You are a warm, friendly wellness guide for WSH Alive — a fitness and lifestyle blog. Help users discover content, navigate the site, and subscribe to the newsletter. Be concise and encouraging.",
      domain: "other",
      functions: Array.from(this.functions.values()).map(fn => ({
        name: fn.name,
        description: fn.description,
        parameters: fn.parameters,
        requires_confirmation: false,
      })),
    };
    await proxyPost("/api/v1/register", { manifest });
    this.initialized = true;
  }

  async sendMessage(text: string): Promise<string> {
    if (!this.initialized) throw new Error("Not initialized");
    const data: ChatApiResponse = await proxyPost("/api/v1/chat", {
      session_id: this.sessionId,
      app_id: APP_ID,
      message: text,
    });
    this.sessionId = data.session_id;
    return this._handleAction(parseAction(data));
  }

  private async _handleAction(action: AgentAction): Promise<string> {
    if (action.actionType === "function_call") {
      const results = await Promise.all(
        action.functionCalls.map(async call => {
          const fn = this.functions.get(call.functionName);
          if (!fn) return { call_id: call.callId, function_name: call.functionName, success: false, error: "Not registered" };
          try {
            const result = await fn.handler(call.arguments);
            return { call_id: call.callId, function_name: call.functionName, success: true, result };
          } catch (err) {
            return { call_id: call.callId, function_name: call.functionName, success: false, error: String(err) };
          }
        })
      );
      const followUp: ChatApiResponse = await proxyPost("/api/v1/results", {
        session_id: this.sessionId,
        app_id: APP_ID,
        results,
      });
      this.sessionId = followUp.session_id;
      const nextAction = parseAction(followUp);
      const msg = nextAction.message ?? "";
      if (msg.toLowerCase().trim() === "done") return "";
      return this._handleAction(nextAction);
    }
    return action.message ?? "";
  }
}

let clientInstance: EngageAIClient | null = null;
export function getEngageAIClient() { return clientInstance; }

export default function EngageAIWidget() {
  const router = useRouter();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const client = new EngageAIClient();

    client.registerFunction({
      name: "get_all_posts",
      description: "Returns all blog posts. Call when user asks what articles are available.",
      parameters: { type: "object", properties: {} },
      handler: async () => {
        const res = await fetch("/api/posts");
        const posts: Post[] = await res.json();
        if (!posts.length) { pushAIMessage("No posts yet — check back soon!"); return "done"; }
        const msg = `Here are all the articles on WSH Alive:\n\n${posts.map(p => `📄 "${p.title}"\n${p.excerpt}`).join("\n\n")}\n\nWould you like me to take you to any of these?`;
        pushAIMessage(msg);
        return "done";
      },
    });

    client.registerFunction({
      name: "get_posts_by_category",
      description: "Returns blog posts filtered by category. Call when user asks about workouts, nutrition, lifestyle, or mindfulness.",
      parameters: {
        type: "object",
        properties: {
          category: {
            type: "string",
            description: "The blog category",
            enum: ["workouts", "nutrition", "lifestyle", "mindfulness"],
          },
        },
        required: ["category"],
      },
      handler: async (p) => {
        const category = p.category as string;
        const res = await fetch(`/api/posts?category=${category}`);
        const posts: Post[] = await res.json();
        if (!posts.length) { pushAIMessage(`No ${category} articles yet — check back soon! 🌱`); return "done"; }
        const msg = `Here are the ${category} articles:\n\n${posts.map(p => `📄 "${p.title}" (${p.readTime})\n${p.excerpt}`).join("\n\n")}\n\nShall I take you to the ${category} page?`;
        pushAIMessage(msg);
        client.lastCategoryShown = category;
        return "done";
      },
    });

    client.registerFunction({
      name: "navigate_to",
      description: "Navigate the user to a page on the blog.",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "The URL path to navigate to",
            enum: ["/blog", "/workouts", "/nutrition", "/lifestyle", "/mindfulness", "/about", "/subscribe"],
          },
        },
        required: ["path"],
      },
      handler: async (p) => {
        router.push(p.path as string);
        return `Navigated to ${p.path}.`;
      },
    });

    client.registerFunction({
      name: "subscribe_user",
      description: "Subscribe the user to the WSH Alive newsletter. Ask for name and email first.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "The user's first name" },
          email: { type: "string", description: "The user's email address" },
        },
        required: ["name", "email"],
      },
      handler: async (p) => {
        const res = await fetch("/api/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: p.name, email: p.email }),
        });
        return res.json();
      },
    });

    client.initialize()
      .then(() => { clientInstance = client; })
      .catch(console.error);
  }, [router]);

  return null;
}
