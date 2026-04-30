import { getAllPosts } from "@/lib/posts";
import PostCard from "@/components/PostCard";
import CategoryBar from "@/components/CategoryBar";
import NewsletterForm from "@/components/NewsletterForm";
import Link from "next/link";

export default function Home() {
  const posts = getAllPosts();
  const featured = posts[0];
  const secondary = posts.slice(1, 3);

  return (
    <>
      {/* HERO */}
      <section className="grid grid-cols-1 md:grid-cols-2 min-h-[480px]">
        <div className="flex flex-col justify-center px-8 md:px-12 py-16 bg-cream order-2 md:order-1">
          <p className="text-xs tracking-widest uppercase text-earth font-medium mb-4">Fitness &amp; Wellness Journal</p>
          <h1 className="font-serif text-5xl md:text-6xl text-bark leading-tight font-normal mb-6">
            Move well.<br />Eat well.<br /><em className="text-sage">Live rooted.</em>
          </h1>
          <p className="text-base text-[#6A5A4A] leading-relaxed font-light max-w-sm mb-8">
            A calm corner of the internet for those who believe wellness is a lifelong practice — not a quick fix.
          </p>
          <div className="flex gap-4 items-center flex-wrap">
            <Link href="/blog" className="bg-sage text-white px-8 py-3 rounded-full text-xs tracking-widest uppercase hover:bg-sage-light transition-colors no-underline">
              Explore articles
            </Link>
            <Link href="/about" className="text-earth text-sm underline underline-offset-4 hover:text-bark transition-colors">
              Our philosophy →
            </Link>
          </div>
        </div>
        <div className="order-1 md:order-2 bg-sage-pale flex items-center justify-center min-h-[240px]">
          <svg width="340" height="400" viewBox="0 0 400 480" xmlns="http://www.w3.org/2000/svg">
            <rect width="400" height="480" fill="#EEF2EB"/>
            <ellipse cx="200" cy="520" rx="300" ry="160" fill="#D4DDD0"/>
            <circle cx="300" cy="80" r="50" fill="#F5EDE0" opacity="0.7"/>
            <circle cx="300" cy="80" r="35" fill="#E8D5B8" opacity="0.8"/>
            <rect x="187" y="240" width="26" height="170" rx="5" fill="#A07850"/>
            <line x1="200" y1="285" x2="145" y2="248" stroke="#8A6640" strokeWidth="7" strokeLinecap="round"/>
            <line x1="200" y1="268" x2="252" y2="232" stroke="#8A6640" strokeWidth="6" strokeLinecap="round"/>
            <line x1="200" y1="315" x2="138" y2="298" stroke="#8A6640" strokeWidth="5" strokeLinecap="round"/>
            <line x1="200" y1="305" x2="260" y2="290" stroke="#8A6640" strokeWidth="4" strokeLinecap="round"/>
            <ellipse cx="200" cy="165" rx="105" ry="90" fill="#6B7F5E" opacity="0.9"/>
            <ellipse cx="168" cy="192" rx="70" ry="62" fill="#7A9068" opacity="0.85"/>
            <ellipse cx="232" cy="188" rx="75" ry="66" fill="#5E7252" opacity="0.85"/>
            <ellipse cx="200" cy="148" rx="86" ry="76" fill="#7A9068"/>
            <ellipse cx="200" cy="132" rx="66" ry="62" fill="#8FA07F"/>
            <circle cx="162" cy="142" r="4" fill="#F5EDE0" opacity="0.6"/>
            <circle cx="218" cy="136" r="3" fill="#F5EDE0" opacity="0.6"/>
            <ellipse cx="200" cy="408" rx="130" ry="18" fill="#8FA07F" opacity="0.4"/>
          </svg>
        </div>
      </section>

      <CategoryBar />

      {/* FEATURED */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex justify-between items-baseline mb-8">
          <h2 className="font-serif text-3xl text-bark font-normal">Featured reads</h2>
          <Link href="/blog" className="text-xs tracking-widest uppercase text-sage hover:text-earth no-underline transition-colors">
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="md:col-span-3">
            {featured && <PostCard post={featured} large />}
          </div>
          <div className="md:col-span-2 flex flex-col gap-6">
            {secondary.map(post => <PostCard key={post.slug} post={post} />)}
          </div>
        </div>
      </section>

      <NewsletterForm />
    </>
  );
}
