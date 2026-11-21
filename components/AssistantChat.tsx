"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithApprovalResponses,
  lastAssistantMessageIsCompleteWithToolCalls,
} from "ai";
import { isNavPath, type PostSummary } from "@/lib/assistant/catalog";
import type { AssistantMessage } from "@/lib/assistant/tools";

const STORAGE_KEY = "wsh-alive-assistant-v1";
const MAX_STORED = 30;
const MAX_TOOL_ROUNDS = 4;
const GREETING = "Hi! I'm your WSH Alive guide 🌿 Ask me about workouts, nutrition, or anything on the blog.";

// Runs on the server too (window is undefined there), which is fine: the panel
// starts closed, so stored messages never affect the server-rendered HTML.
function loadStored(): AssistantMessage[] {
  try {
    const raw = typeof window !== "undefined" ? window.sessionStorage.getItem(STORAGE_KEY) : null;
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (Array.isArray(parsed)) return parsed as AssistantMessage[];
  } catch { /* storage blocked or corrupt: start fresh */ }
  return [];
}

// Replies are rendered as plain text; drop the Markdown markers models still add sometimes.
function plain(text: string) {
  return text.replace(/\*\*(.+?)\*\*/g, "$1").replace(/^#+\s+/gm, "").replace(/^\s*[*-]\s+/gm, "• ");
}

// Continue automatically once tool results or approvals are in, but stop a
// model that keeps calling client-side tools in a loop.
function shouldContinue({ messages }: { messages: AssistantMessage[] }) {
  const last = messages.at(-1);
  if (last?.role !== "assistant") return false;
  if (last.parts.filter(p => p.type.startsWith("tool-")).length > MAX_TOOL_ROUNDS) return false;
  return lastAssistantMessageIsCompleteWithToolCalls({ messages }) || lastAssistantMessageIsCompleteWithApprovalResponses({ messages });
}

function errorText(err: Error) {
  // The API answers with { error } JSON; fall back to a generic line for anything else.
  try {
    const parsed = JSON.parse(err.message) as { error?: unknown };
    if (typeof parsed.error === "string") return parsed.error;
  } catch { /* not JSON */ }
  return "Sorry, I'm having trouble connecting right now. Try again in a moment.";
}

function Bubble({ from, children }: { from: "user" | "assistant"; children: React.ReactNode }) {
  return (
    <div className={`flex ${from === "user" ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed font-light whitespace-pre-wrap
        ${from === "user" ? "bg-sage text-white rounded-br-sm" : "bg-cream text-bark rounded-bl-sm border border-mist"}`}>
        {children}
      </div>
    </div>
  );
}

function PostCards({ posts }: { posts: PostSummary[] }) {
  if (!posts.length) return null;
  return (
    <ul className="flex flex-col gap-2 max-w-[90%]">
      {posts.map(p => (
        <li key={p.slug}>
          <Link href={`/blog/${p.slug}`} className="block no-underline rounded-xl border border-mist bg-white px-4 py-3 hover:border-sage transition-colors">
            <span className="block text-[10px] tracking-widest uppercase text-earth">{p.category} · {p.readTime}</span>
            <span className="block font-serif text-sm text-bark leading-snug mt-1">{p.title}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function AssistantChat() {
  const router = useRouter();
  const [initial] = useState(loadStored);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [failure, setFailure] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { messages, setMessages, sendMessage, addToolOutput, addToolApprovalResponse, status, stop, clearError } = useChat<AssistantMessage>({
    messages: initial,
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    sendAutomaticallyWhen: shouldContinue,
    onError: err => setFailure(errorText(err)),
    onToolCall({ toolCall }) {
      if (toolCall.dynamic || toolCall.toolName !== "navigate_to") return;
      const { path } = toolCall.input;
      if (!isNavPath(path)) {
        addToolOutput({ tool: "navigate_to", toolCallId: toolCall.toolCallId, state: "output-error", errorText: "That page doesn't exist." });
        return;
      }
      router.push(path);
      // No await: awaiting inside onToolCall can deadlock the chat.
      addToolOutput({ tool: "navigate_to", toolCallId: toolCall.toolCallId, output: `Opened ${path === "/" ? "the home page" : path}.` });
    },
  });

  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (busy) return;
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-MAX_STORED)));
    } catch { /* storage unavailable: chat still works, just not across reloads */ }
  }, [messages, busy]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open, busy, failure]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function send() {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setFailure(null);
    clearError();
    sendMessage({ text });
  }

  function restart() {
    stop();
    setFailure(null);
    clearError();
    setMessages([]);
  }

  const last = messages.at(-1);
  const lastHasText = last?.role === "assistant" && last.parts.some(p => p.type === "text" && p.text.trim());
  const awaitingApproval = messages.some(m => m.parts.some(p => p.type === "tool-subscribe_user" && p.state === "approval-requested"));
  const typing = (status === "submitted" || (status === "streaming" && !lastHasText)) && !awaitingApproval;

  return (
    <>
      {open && (
        <div role="dialog" aria-label="WSH Alive guide"
          className="fixed bottom-24 right-6 z-50 w-80 md:w-96 max-h-[520px] flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-mist bg-warm-white">
          <div className="flex items-center justify-between px-5 py-4 bg-sage">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-sage-pale flex items-center justify-center text-sm" aria-hidden>🌿</div>
              <div>
                <p className="text-white text-sm font-medium leading-none">WSH Alive Guide</p>
                <p className="text-sage-pale text-xs font-light mt-0.5">Powered by Gemini</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {messages.length > 0 && (
                <button onClick={restart} className="text-white/70 hover:text-white text-xs font-light">New chat</button>
              )}
              <button onClick={() => setOpen(false)} aria-label="Close chat" className="text-white/70 hover:text-white text-xl leading-none">×</button>
            </div>
          </div>

          <div role="log" aria-live="polite" className="flex-1 min-h-0 max-h-[340px] overflow-y-auto px-4 py-4 flex flex-col gap-3">
            <Bubble from="assistant">{GREETING}</Bubble>

            {messages.map(message => (
              <div key={message.id} className="flex flex-col gap-3">
                {message.parts.map((part, i) => {
                  const key = `${message.id}-${i}`;
                  switch (part.type) {
                    case "text":
                      return part.text.trim()
                        ? <Bubble key={key} from={message.role === "user" ? "user" : "assistant"}>{message.role === "user" ? part.text : plain(part.text)}</Bubble>
                        : null;
                    case "tool-get_posts":
                      return part.state === "output-available" ? <PostCards key={key} posts={part.output} /> : null;
                    case "tool-subscribe_user":
                      if (part.state !== "approval-requested" || part.approval.isAutomatic) return null;
                      return (
                        <div key={key} className="max-w-[85%] px-4 py-3 rounded-2xl rounded-bl-sm bg-cream border border-mist text-sm text-bark font-light">
                          <p>Send a confirmation email to <span className="font-normal">{part.input.email}</span> so {part.input.name} can join the weekly wellness letter?</p>
                          <div className="flex gap-2 mt-3">
                            <button onClick={() => addToolApprovalResponse({ id: part.approval.id, approved: true })}
                              className="px-4 py-1.5 rounded-full bg-sage text-white text-xs hover:bg-sage-light transition-colors">Yes</button>
                            <button onClick={() => addToolApprovalResponse({ id: part.approval.id, approved: false, reason: "The visitor declined." })}
                              className="px-4 py-1.5 rounded-full border border-mist text-bark text-xs hover:border-sage transition-colors">No</button>
                          </div>
                        </div>
                      );
                    default:
                      return null;
                  }
                })}
              </div>
            ))}

            {typing && (
              <div className="flex justify-start" aria-label="Guide is typing">
                <div className="bg-cream border border-mist px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 bg-sage-light rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 bg-sage-light rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 bg-sage-light rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            )}
            {failure && <Bubble from="assistant">{failure}</Bubble>}
            <div ref={bottomRef} />
          </div>

          <form className="px-4 py-3 border-t border-mist flex gap-2" onSubmit={e => { e.preventDefault(); send(); }}>
            <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} maxLength={2000}
              aria-label="Message the guide" placeholder="Ask me anything..."
              className="flex-1 text-sm px-4 py-2 rounded-full border border-mist bg-white text-bark placeholder:text-sage-light outline-none focus:border-sage transition-colors"
            />
            <button type="submit" disabled={!input.trim() || busy || awaitingApproval} aria-label="Send message"
              className="w-9 h-9 rounded-full bg-sage text-white flex items-center justify-center flex-shrink-0 hover:bg-sage-light transition-colors disabled:opacity-40">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </form>
        </div>
      )}

      <button onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-sage text-white shadow-lg hover:bg-sage-light transition-all hover:scale-105 flex items-center justify-center"
        aria-label={open ? "Close AI chat" : "Open AI chat"} aria-expanded={open}>
        {open
          ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          : <span className="text-2xl" aria-hidden>🌿</span>}
      </button>
    </>
  );
}
