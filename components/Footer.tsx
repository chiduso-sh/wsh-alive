import Link from "next/link";

const links = [["About", "/about"], ["Privacy", "/privacy"], ["Contact", "/contact"], ["Instagram", "https://instagram.com"]];

export default function Footer() {
  return (
    <footer className="border-t border-mist bg-warm-white">
      <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <span className="font-serif text-lg text-bark">
          WSH<span className="text-sage italic"> Alive</span>
        </span>
        <div className="flex gap-6">
          {links.map(([label, href]) => (
            <Link key={label} href={href} className="text-xs text-sage-light hover:text-sage no-underline transition-colors">
              {label}
            </Link>
          ))}
        </div>
        <span className="text-xs text-sage-light font-light">© {new Date().getFullYear()} WSH Alive</span>
      </div>
    </footer>
  );
}
