"use client";
import Link from "next/link";
import { useState } from "react";

const links = [
  ["Workouts", "/workouts"],
  ["Nutrition", "/nutrition"],
  ["Lifestyle", "/lifestyle"],
  ["About", "/about"],
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-warm-white border-b border-mist">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="font-serif text-2xl text-bark no-underline">
          WSH<span className="text-sage italic"> Alive</span>
        </Link>

        {/* Desktop links */}
        <ul className="hidden md:flex gap-8 list-none m-0 p-0">
          {links.map(([label, href]) => (
            <li key={label}>
              <Link href={href} className="text-xs tracking-widest uppercase text-sage hover:text-earth transition-colors no-underline">
                {label}
              </Link>
            </li>
          ))}
        </ul>

        <Link href="/subscribe" className="hidden md:inline-block text-xs tracking-widest uppercase px-5 py-2 border border-sage text-sage rounded-full hover:bg-sage hover:text-white transition-all no-underline">
          Subscribe
        </Link>

        {/* Mobile hamburger */}
        <button className="md:hidden flex flex-col gap-1.5 p-2" onClick={() => setOpen(!open)} aria-label="Toggle menu">
          <span className={`block w-6 h-0.5 bg-bark transition-all ${open ? "rotate-45 translate-y-2" : ""}`} />
          <span className={`block w-6 h-0.5 bg-bark transition-all ${open ? "opacity-0" : ""}`} />
          <span className={`block w-6 h-0.5 bg-bark transition-all ${open ? "-rotate-45 -translate-y-2" : ""}`} />
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-mist bg-warm-white px-6 py-4 flex flex-col gap-4">
          {links.map(([label, href]) => (
            <Link key={label} href={href} onClick={() => setOpen(false)} className="text-sm tracking-widest uppercase text-sage no-underline">
              {label}
            </Link>
          ))}
          <Link href="/subscribe" onClick={() => setOpen(false)} className="text-sm tracking-widest uppercase text-earth no-underline">
            Subscribe
          </Link>
        </div>
      )}
    </nav>
  );
}
