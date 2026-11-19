import { NextRequest, NextResponse } from "next/server";
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  safeValidateUIMessages,
  stepCountIs,
  streamText,
  toUIMessageStream,
} from "ai";
import { google } from "@ai-sdk/google";
import { buildTools, SYSTEM_PROMPT, type AssistantMessage } from "@/lib/assistant/tools";
import { clientIp, rateLimit } from "@/lib/rate-limit";

// The browser sends the whole conversation each turn. Everything in it is
// untrusted: it is size-checked, validated against the tool schemas and
// trimmed before it reaches the model. The model and key live only here.

export const maxDuration = 30;

const MAX_BODY_BYTES = 64 * 1024;
const MAX_MESSAGES = 30;
const MAX_TEXT_LENGTH = 2000;
const DEFAULT_MODEL = "gemini-flash-latest";

function error(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: NextRequest) {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) return error("The assistant isn't available right now.", 503);

  const ip = clientIp(req);
  // Also protects the free-tier Gemini quota from a single visitor.
  if (!rateLimit(`chat:ip:${ip}`, 20, 10 * 60_000)) {
    return error("You're sending messages very quickly. Please wait a few minutes and try again.", 429);
  }

  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) return error("This conversation is too long. Start a new chat to continue.", 413);

  let body: { messages?: unknown };
  try {
    body = JSON.parse(raw);
  } catch {
    return error("Invalid request.", 400);
  }

  const tools = buildTools(ip);
  const parsed = await safeValidateUIMessages<AssistantMessage>({ messages: body?.messages, tools });
  if (!parsed.success) return error("Invalid request.", 400);

  const messages = parsed.data.slice(-MAX_MESSAGES);
  const tooLong = messages.some(m => m.parts.some(p => p.type === "text" && p.text.length > MAX_TEXT_LENGTH));
  if (messages.length === 0 || messages.some(m => m.role === "system") || tooLong) return error("Invalid request.", 400);

  const result = streamText({
    model: google(process.env.GEMINI_MODEL || DEFAULT_MODEL),
    system: SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages, { tools, ignoreIncompleteToolCalls: true }),
    tools,
    toolApproval: { subscribe_user: "user-approval" },
    stopWhen: stepCountIs(4),
    maxOutputTokens: 600,
    abortSignal: req.signal,
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: result.stream,
      tools,
      originalMessages: messages,
      onError: err => {
        // Status and error type only: never the conversation.
        const status = typeof err === "object" && err && "statusCode" in err ? ` ${String(err.statusCode)}` : "";
        console.error(`[chat] ${err instanceof Error ? err.name : "error"}${status}`);
        return "Sorry, I'm having trouble answering right now. Please try again in a moment.";
      },
      // Tool errors are SafeToolError messages written for the visitor.
      redactToolErrors: false,
    }),
  });
}
