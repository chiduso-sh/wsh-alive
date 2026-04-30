import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EngageAIWidget from "@/components/EngageAIWidget";
import EngageAIChat from "@/components/EngageAIChat";

export const metadata: Metadata = {
  title: { default: "WSH Alive", template: "%s | WSH Alive" },
  description: "A calm space for workouts, nutrition, and lifestyle. Move well. Eat well. Live rooted.",
  openGraph: {
    title: "WSH Alive",
    description: "Move well. Eat well. Live rooted.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-warm-white font-sans text-bark antialiased">
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Footer />
        <EngageAIWidget />
        <EngageAIChat />
      </body>
    </html>
  );
}
