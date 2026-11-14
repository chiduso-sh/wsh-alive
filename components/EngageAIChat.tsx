"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EngageAIClient, type Handlers, type Outcome } from "@/lib/engageai/client";
import { CATEGORIES, NAV_PATHS, type Category, type NavPath } from "@/lib/engageai/manifest";

type PostSummary = { slug: string; title: string; category: string; readTime: string; excerpt: string };

type Message =
  | { id: string; role: "user" | "ai"; text: string }
  | { id: string; role: "posts"; posts: PostSummary[] }
  // local: asked by our own handler (resolved in the browser); otherwise sent by EngageAI and answered via /confirm.
  | { id: string; role: "confirm"; prompt: string; callId: string | null; local: boolean; answered: boolean };

type NewMessage = Message extends infer M ? (M extends Message ? Omit<M, "id"> : never) : never;

type Stored = { sessionId: string; messages: Message[] };

const STORAGE_KEY = "wsh-alive-chat-v2";
const GREETING: Message = { id: "greeting", role: "ai", text: "Hi! I'm your WSH Alive guide 🌿 Ask me about workouts, nutrition, or anything on the blog." };
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Runs on the server too (window is undefined there), which is fine: the panel
// starts closed, so stored messages never affect the server-rendered HTML.
function loadStored(): Stored {
  try {
    const raw = typeof window !== "undefined" ? window.sessionStorage.getItem(STORAGE_KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw) as Stored;
      if (typeof parsed.sessionId === "string" && Array.isArray(parsed.messages)) {
        // A question left open before a reload can't be answered any more.
        return { ...parsed, messages: parsed.messages.map(m => (m.role === "confirm" ? { ...m, answered: true } : m)) };
      }
    }
  } catch { /* storage blocked or corrupt: start fresh */ }
  return { sessionId: crypto.randomUUID(), messages: [GREETING] };
}

async function fetchPosts(category?: Category): Promise<PostSummary[]> {
  const res = await fetch(category ? `/api/posts?category=${category}` : "/api/posts");
  if (!res.ok) throw new Error("Could not load posts");
  const posts: PostSummary[] = await res.json();
  return posts.map(({ slug, title, category, readTime, excerpt }) => ({ slug, title, category, readTime, excerpt }));
}

export default function EngageAIChat() {
  const router = useRouter();
  const [initial] = useState(loadStored);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initial.messages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const sessionId = useRef(initial.sessionId);
  const clientRef = useRef<EngageAIClient | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingConfirms = useRef(new Map<string, (ok: boolean) => void>());

  const add = useCallback((msg: NewMessage, id: string = crypto.randomUUID()) => {
    setMessages(prev => [...prev, { ...msg, id } as Message]);
  }, []);

  // Shows a Yes/No card and resolves when the visitor clicks one.
  const askUser = useCallback((prompt: string) => {
    const id = crypto.randomUUID();
    add({ role: "confirm", prompt, callId: null, local: true, answered: false }, id);
    return new Promise<boolean>(resolve => pendingConfirms.current.set(id, resolve));
  }, [add]);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ sessionId: sessionId.current, messages }));
    } catch { /* storage unavailable: chat still works, just not across reloads */ }
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open, loading]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function client() {
    if (!clientRef.current) {
      const showPosts = (posts: PostSummary[]) => {
        if (posts.length) add({ role: "posts", posts });
        // The model gets the data too, so it can answer follow-up questions.
        return posts;
      };
      const handlers: Handlers = {
        get_all_posts: async () => showPosts(await fetchPosts()),
        get_posts_by_category: async ({ category }) => {
          if (!CATEGORIES.includes(category as Category)) throw new Error(`Unknown category: ${String(category)}`);
          return showPosts(await fetchPosts(category as Category));
        },
        navigate_to: async ({ path }) => {
          if (!NAV_PATHS.includes(path as NavPath)) throw new Error(`Unknown page: ${String(path)}`);
          router.push(path as NavPath);
          // EngageAI sometimes echoes simple results verbatim, so make this readable as a reply.
          const page = path === "/" ? "home" : String(path).slice(1);
          return `Here's the ${page} page 🌿`;
        },
        subscribe_user: async ({ name, email }) => {
          if (typeof name !== "string" || !name.trim()) throw new Error("A first name is required");
          if (typeof email !== "string" || !EMAIL.test(email)) throw new Error("That email address looks invalid");
          // Nothing is submitted until the visitor confirms, whatever the model decided.
          if (!(await askUser(`Subscribe ${name.trim()} (${email.trim()}) to the weekly wellness letter?`))) {
            return "No problem, I haven't subscribed you.";
          }
          const res = await fetch("/api/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: name.trim(), email: email.trim() }),
          });
          if (!res.ok) throw new Error("Subscription failed");
          return `You're in, ${name.trim()}! The first letter arrives on Sunday 🌿`;
        },
      };
      clientRef.current = new EngageAIClient(handlers, sessionId.current, id => { sessionId.current = id; });
    }
    return clientRef.current;
  }

  function show(outcome: Outcome) {
    if (outcome.kind === "confirm") {
      add({ role: "confirm", prompt: outcome.prompt, callId: outcome.callId, local: false, answered: false });
    } else if (outcome.text.trim()) {
      // Replies are plain text; drop Markdown bold markers the model sometimes adds.
      add({ role: "ai", text: outcome.text.replace(/\*\*(.+?)\*\*/g, "$1") });
    }
  }

  async function run(task: () => Promise<Outcome>) {
    setLoading(true);
    try {
      show(await task());
    } catch {
      add({ role: "ai", text: "Sorry, I'm having trouble connecting right now. Try again in a moment." });
    } finally {
      setLoading(false);
    }
  }

  function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    add({ role: "user", text });
    run(() => client().send(text));
  }

  function answer(msg: Extract<Message, { role: "confirm" }>, confirmed: boolean) {
    if (msg.answered || (loading && !msg.local)) return;
    setMessages(prev => prev.map(m => (m.id === msg.id && m.role === "confirm" ? { ...m, answered: true } : m)));
    add({ role: "user", text: confirmed ? "Yes, go ahead" : "No, cancel" });
    if (msg.local) {
      // The request is still in flight, waiting on this answer inside the handler.
      pendingConfirms.current.get(msg.id)?.(confirmed);
      pendingConfirms.current.delete(msg.id);
    } else {
      run(() => client().confirm(confirmed, msg.callId));
    }
  }

  const waitingOnVisitor = messages.some(m => m.role === "confirm" && m.local && !m.answered);

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
                <p className="text-sage-pale text-xs font-light mt-0.5">Always here to help</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close chat" className="text-white/70 hover:text-white text-xl leading-none">×</button>
          </div>

          <div role="log" aria-live="polite" className="flex-1 min-h-0 max-h-[340px] overflow-y-auto px-4 py-4 flex flex-col gap-3">
            {messages.map(msg => {
              if (msg.role === "posts") {
                return (
                  <ul key={msg.id} className="flex flex-col gap-2 max-w-[90%]">
                    {msg.posts.map(p => (
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
              if (msg.role === "confirm") {
                return (
                  <div key={msg.id} className="max-w-[85%] px-4 py-3 rounded-2xl rounded-bl-sm bg-cream border border-mist text-sm text-bark font-light">
                    <p className="whitespace-pre-wrap">{msg.prompt}</p>
                    {!msg.answered && (
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => answer(msg, true)} disabled={loading && !msg.local}
                          className="px-4 py-1.5 rounded-full bg-sage text-white text-xs hover:bg-sage-light transition-colors disabled:opacity-40">Yes</button>
                        <button onClick={() => answer(msg, false)} disabled={loading && !msg.local}
                          className="px-4 py-1.5 rounded-full border border-mist text-bark text-xs hover:border-sage transition-colors disabled:opacity-40">No</button>
                      </div>
                    )}
                  </div>
                );
              }
              return (
                <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed font-light whitespace-pre-wrap
                    ${msg.role === "user" ? "bg-sage text-white rounded-br-sm" : "bg-cream text-bark rounded-bl-sm border border-mist"}`}>
                    {msg.text}
                  </div>
                </div>
              );
            })}
            {loading && !waitingOnVisitor && (
              <div className="flex justify-start" aria-label="Guide is typing">
                <div className="bg-cream border border-mist px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 bg-sage-light rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 bg-sage-light rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 bg-sage-light rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <form className="px-4 py-3 border-t border-mist flex gap-2" onSubmit={e => { e.preventDefault(); send(); }}>
            <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} maxLength={2000}
              aria-label="Message the guide" placeholder="Ask me anything..."
              className="flex-1 text-sm px-4 py-2 rounded-full border border-mist bg-white text-bark placeholder:text-sage-light outline-none focus:border-sage transition-colors"
            />
            <button type="submit" disabled={!input.trim() || loading} aria-label="Send message"
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
