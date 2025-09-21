import { CategorySection } from "@/components/CategorySection";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { Navbar } from "@/components/Navbar";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <CategorySection />
      <Footer />
    </div>
  );
}
