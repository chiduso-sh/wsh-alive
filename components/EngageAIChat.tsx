"use client";
import { useState, useRef, useEffect, useCallback } from "react";

type Message = { role: "user" | "ai"; text: string };

// Global message injector — lets EngageAIWidget push messages into the chat
let _pushMessage: ((text: string) => void) | null = null;
export function pushAIMessage(text: string) { _pushMessage?.(text); }

export default function EngageAIChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", text: "Hi! I'm your WSH Alive guide 🌿 Ask me about workouts, nutrition, or anything on the blog." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const addMessage = useCallback((msg: Message) => {
    setMessages(prev => [...prev, msg]);
  }, []);

  // Register the global injector
  useEffect(() => {
    _pushMessage = (text: string) => addMessage({ role: "ai", text });
    return () => { _pushMessage = null; };
  }, [addMessage]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    addMessage({ role: "user", text });
    setLoading(true);

    try {
      // Dynamically import to avoid circular deps
      const { getEngageAIClient } = await import("./EngageAIWidget");
      const client = getEngageAIClient();
      if (!client) throw new Error("Client not ready");

      // Intercept yes/no navigation locally instead of re-asking the AI
      const affirmative = /^(yes|yeah|sure|yep|ok|okay|take me there|go there|navigate|let's go)$/i.test(text.trim());
      if (affirmative && client.lastCategoryShown) {
        const { useRouter } = await import("next/navigation");
        window.location.href = `/${client.lastCategoryShown}`;
        addMessage({ role: "ai", text: `Taking you to the ${client.lastCategoryShown} page! 🌿` });
        client.lastCategoryShown = null;
        setLoading(false);
        return;
      }

      const reply = await client.sendMessage(text);
      if (reply && reply.toLowerCase().trim() !== "done") addMessage({ role: "ai", text: reply });
    } catch {
      addMessage({ role: "ai", text: "Sorry, I'm having trouble connecting right now. Try again in a moment." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 md:w-96 flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-mist bg-warm-white"
          style={{ maxHeight: "520px" }}>
          <div className="flex items-center justify-between px-5 py-4 bg-sage">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-sage-pale flex items-center justify-center text-sm">🌿</div>
              <div>
                <p className="text-white text-sm font-medium leading-none">WSH Alive Guide</p>
                <p className="text-green-200 text-xs font-light mt-0.5">Always here to help</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white text-xl leading-none">×</button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3" style={{ minHeight: 0, maxHeight: "340px" }}>
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed font-light whitespace-pre-wrap
                  ${msg.role === "user" ? "bg-sage text-white rounded-br-sm" : "bg-cream text-bark rounded-bl-sm border border-mist"}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-cream border border-mist px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 bg-sage-light rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 bg-sage-light rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 bg-sage-light rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="px-4 py-3 border-t border-mist flex gap-2">
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && send()}
              placeholder="Ask me anything..."
              className="flex-1 text-sm px-4 py-2 rounded-full border border-mist bg-white text-bark placeholder:text-sage-light outline-none focus:border-sage transition-colors"
            />
            <button onClick={send} disabled={!input.trim() || loading}
              className="w-9 h-9 rounded-full bg-sage text-white flex items-center justify-center flex-shrink-0 hover:bg-sage-light transition-colors disabled:opacity-40">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      <button onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-sage text-white shadow-lg hover:bg-sage-light transition-all hover:scale-105 flex items-center justify-center"
        aria-label="Open AI chat">
        {open
          ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          : <span className="text-2xl">🌿</span>}
      </button>
    </>
  );
}
