import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
      <p className="font-serif text-8xl text-mist font-normal mb-4">404</p>
      <h1 className="font-serif text-3xl text-bark font-normal mb-3">Page not found</h1>
      <p className="text-sm text-sage-light font-light mb-8">This page has wandered off the trail.</p>
      <Link href="/" className="bg-sage text-white px-8 py-3 rounded-full text-xs tracking-widest uppercase hover:bg-sage-light transition-colors no-underline">
        Back to home
      </Link>
    </div>
  );
}
