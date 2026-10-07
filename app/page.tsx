import { DemoLauncher } from "@/components/demo/DemoLauncher";
import { Footer } from "@/components/Footer";
import { FeaturedArtists } from "@/components/landing/FeaturedArtists";
import { ForArtists } from "@/components/landing/ForArtists";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Occasions } from "@/components/landing/Occasions";
import { Testimonials } from "@/components/landing/Testimonials";
import { Navbar } from "@/components/Navbar";

// The story, top to bottom: what it is → what it covers → who's available →
// how it works → proof → the other side of the marketplace → try it.
export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Occasions />
        <FeaturedArtists />
        <HowItWorks />
        <Testimonials />
        <ForArtists />
        <DemoLauncher />
      </main>
      <Footer />
    </>
  );
}
