"use client";
import { useState } from "react";
import { MAX_NAME_LENGTH, validateSubscriber } from "@/lib/newsletter/validate";

type Status = "idle" | "loading" | "pending" | "error";

const inputClass =
  "px-5 py-3 rounded-full border border-mist bg-white text-sm text-bark placeholder:text-sage-light outline-none focus:border-sage transition-colors";

export default function NewsletterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState(""); // honeypot, hidden from people
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const subscriber = validateSubscriber({ name, email });
    if (typeof subscriber === "string") {
      setStatus("error");
      setMessage(subscriber);
      return;
    }

    setStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...subscriber, company }),
      });
      const data: { message?: string; error?: string } = await res.json().catch(() => ({}));
      setStatus(res.ok ? "pending" : "error");
      setMessage((res.ok ? data.message : data.error) || "Something went wrong. Try again.");
    } catch {
      setStatus("error");
      setMessage("Couldn't reach the server. Check your connection and try again.");
    }
  }

  return (
    <section className="mx-4 md:mx-10 mb-12 bg-sage-pale rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-start md:items-center gap-8">
      <div className="flex-1">
        <p className="text-xs tracking-widest uppercase text-sage font-medium mb-3">Weekly wellness letter</p>
        <h2 className="font-serif text-3xl text-bark font-normal leading-snug mb-3">
          Grounded in your inbox,<br />every Sunday.
        </h2>
        <p className="text-sm text-bark/80 font-light leading-relaxed">
          No noise, no fads. Just one thoughtful email a week — a workout tip, a seasonal recipe, and something good to carry into your week.
        </p>
      </div>

      {status === "pending" ? (
        <div className="flex-shrink-0 w-full md:w-72 text-center" role="status">
          <div className="text-4xl mb-3" aria-hidden>📬</div>
          <p className="font-serif text-xl text-bark">Check your inbox</p>
          <p className="text-sm text-bark/70 font-light mt-1">{message}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3 flex-shrink-0 w-full md:w-72">
          <input
            type="text" placeholder="Your name" value={name} aria-label="Your name" autoComplete="given-name"
            maxLength={MAX_NAME_LENGTH} onChange={e => setName(e.target.value)} required className={inputClass}
          />
          <input
            type="email" placeholder="Your email address" value={email} aria-label="Your email address" autoComplete="email"
            onChange={e => setEmail(e.target.value)} required className={inputClass}
          />
          {/* Honeypot: off-screen and skipped by keyboard and screen readers, so only bots fill it in. */}
          <input
            type="text" name="company" value={company} onChange={e => setCompany(e.target.value)}
            tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px] h-px w-px opacity-0"
          />
          <button type="submit" disabled={status === "loading"}
            className="bg-earth text-white py-3 rounded-full text-xs tracking-widest uppercase font-medium hover:bg-earth-light transition-colors disabled:opacity-60"
          >
            {status === "loading" ? "Sending…" : "Join the community"}
          </button>
          {status === "error" && <p className="text-xs text-red-600 text-center" role="alert">{message}</p>}
          <p className="text-[11px] text-bark/60 text-center font-light">We&apos;ll email you a link to confirm. Unsubscribe any time.</p>
        </form>
      )}
    </section>
  );
}
