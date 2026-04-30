"use client";
import { useState } from "react";

type Status = "idle" | "loading" | "success" | "error";

export default function NewsletterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      setStatus(res.ok ? "success" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <section className="mx-4 md:mx-10 mb-12 bg-sage-pale rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-start md:items-center gap-8">
      <div className="flex-1">
        <p className="text-xs tracking-widest uppercase text-sage font-medium mb-3">Weekly wellness letter</p>
        <h2 className="font-serif text-3xl text-bark font-normal leading-snug mb-3">
          Grounded in your inbox,<br />every Sunday.
        </h2>
        <p className="text-sm text-[#6A5A4A] font-light leading-relaxed">
          No noise, no fads. Just one thoughtful email a week — a workout tip, a seasonal recipe, and something good to carry into your week.
        </p>
      </div>

      {status === "success" ? (
        <div className="flex-shrink-0 w-full md:w-72 text-center">
          <div className="text-4xl mb-3">🌿</div>
          <p className="font-serif text-xl text-bark">You&apos;re in!</p>
          <p className="text-sm text-sage-light font-light mt-1">See you Sunday.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 flex-shrink-0 w-full md:w-72">
          <input
            type="text" placeholder="Your name" value={name}
            onChange={e => setName(e.target.value)} required
            className="px-5 py-3 rounded-full border border-mist bg-white text-sm text-bark placeholder:text-sage-light outline-none focus:border-sage transition-colors"
          />
          <input
            type="email" placeholder="Your email address" value={email}
            onChange={e => setEmail(e.target.value)} required
            className="px-5 py-3 rounded-full border border-mist bg-white text-sm text-bark placeholder:text-sage-light outline-none focus:border-sage transition-colors"
          />
          <button type="submit" disabled={status === "loading"}
            className="bg-earth text-white py-3 rounded-full text-xs tracking-widest uppercase font-medium hover:bg-earth-light transition-colors disabled:opacity-60"
          >
            {status === "loading" ? "Joining..." : "Join the community"}
          </button>
          {status === "error" && <p className="text-xs text-red-500 text-center">Something went wrong. Try again.</p>}
        </form>
      )}
    </section>
  );
}
