import { CTA } from "./CTA";

export const Hero = () => {
  return (
    <div className="relative w-full h-screen mb-20">
      <video
        className="w-full h-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
      >
        <source src="/hero-video.mp4" type="video/mp4" />
      </video>

      <div className="absolute inset-0 bg-neutral-dark/30 flex items-end pb-12 justify-center">
        <div className="text-center text-neutral-light">
          <h1 className="text-4xl md:text-5xl font-bold font-playfair-display tracking-wider mb-4">
            Glam Up Anytime, Anywhere
          </h1>
          <p className="mx-auto text-sm md:text-lg max-w-100 md:max-w-132 font-light font-inter uppercase mb-4">
            Book trusted makeup artists for every occasion, from bridal to
            red-carpet glam.
          </p>
          <CTA />
        </div>
      </div>
    </div>
  );
};
