import Header from "@/src/components/home/Header";
import Hero from "@/src/components/home/Hero";
import Workflow from "@/src/components/home/Workflow";
import Features from "@/src/components/home/Features";
import Footer from "@/src/components/home/Footer";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <Header />

      <Hero />

      <Workflow />

      <Features />

      <Footer />
    </main>
  );
}