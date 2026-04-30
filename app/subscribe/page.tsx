import NewsletterForm from "@/components/NewsletterForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Subscribe" };

export default function SubscribePage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center py-16">
      <NewsletterForm />
    </div>
  );
}
