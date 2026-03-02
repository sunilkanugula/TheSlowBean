import { useEffect, useRef, useState } from "react";

/* Image imports */
import slowWorldImg from "../../assets/bannerImg.png";
import craftImg from "../../assets/chocolate1.jpg";
import beanToBarImg from "../../assets/chocolate2.jpg";
import cocoaButterImg from "../../assets/chocolate3.jpg";

interface Slide {
  headline: string;
  subtext: string;
  ctaText: string;
  secondaryCta?: string;
  ctaLink: string;
  image: string;
}

const slides: Slide[] = [
  {
    headline: "Premium Bean-to-Bar Chocolate",
    subtext:
      "Ethically sourced cacao. Crafted in small batches for unmatched taste and texture.",
    ctaText: "Shop Now",
    secondaryCta: "Learn More",
    ctaLink: "/shop",
    image: slowWorldImg,
  },
  {
    headline: "Crafted, Not Manufactured",
    subtext:
      "From fermentation to roasting, every step is carefully controlled in-house.",
    ctaText: "Explore Process",
    secondaryCta: "Our Story",
    ctaLink: "/process",
    image: craftImg,
  },
  {
    headline: "True Bean-to-Bar Experience",
    subtext:
      "No shortcuts. No additives. Just pure cocoa transformed with precision.",
    ctaText: "What is Bean-to-Bar",
    secondaryCta: "Why It Matters",
    ctaLink: "/bean-to-bar",
    image: beanToBarImg,
  },
  {
    headline: "In-House Cocoa Butter Pressing",
    subtext:
      "For a smoother melt, cleaner snap, and refined chocolate finish.",
    ctaText: "Discover Craft",
    secondaryCta: "View Products",
    ctaLink: "/craft",
    image: cocoaButterImg,
  },
];

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  /* Detect mobile */
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  /* Autoplay (desktop only) */
  useEffect(() => {
    if (isMobile) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [isMobile]);

  /* Swipe handlers */
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    if (distance > 50) setCurrent((prev) => (prev + 1) % slides.length);
    if (distance < -50)
      setCurrent((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
    touchStartX.current = null;
    touchEndX.current = null;
  };

  return (
    <section
      className="relative h-[60vh] md:h-[70vh] w-full overflow-hidden bg-[#57595d]"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {slides.map((slide, index) => {
        const isActive = isMobile ? index === 0 : index === current;

        return (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-700 ${
              isActive ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
          >
            {/* Background */}
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${slide.image})` }}
            />

            {/* Clean dark overlay */}
            <div className="absolute inset-0 bg-[#57595d]/50" />

            {/* Content */}
            <div className="relative z-20 flex h-full items-center">
              <div className="mx-auto w-full max-w-7xl px-6">
                <div className="max-w-xl text-white">
                  <h1 className="mb-4 text-3xl font-bold tracking-tight md:text-5xl">
                    {slide.headline}
                  </h1>

                  <p className="mb-8 text-sm leading-relaxed text-white/90 md:text-lg">
                    {slide.subtext}
                  </p>

                  <div className="flex flex-wrap gap-4">
                    <a
                      href={slide.ctaLink}
                      className="rounded-md bg-white px-7 py-3 text-sm font-semibold text-[#57595d] transition hover:bg-[#eef2ed]"
                    >
                      {slide.ctaText}
                    </a>

                    {slide.secondaryCta && (
                      <a
                        href={slide.ctaLink}
                        className="rounded-md border border-white/60 px-7 py-3 text-sm font-medium text-white transition hover:bg-white hover:text-[#57595d]"
                      >
                        {slide.secondaryCta}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Dots */}
      {!isMobile && (
        <div className="absolute bottom-6 left-1/2 z-30 flex -translate-x-1/2 gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrent(index)}
              className={`h-2 w-2 rounded-full transition ${
                index === current ? "bg-white" : "bg-white/40"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

