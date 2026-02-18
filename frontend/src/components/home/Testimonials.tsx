import { useState } from "react";
import customer1 from "../../assets/chocolate1.jpg";
import customer2 from "../../assets/chocolate2.jpg";
import customer3 from "../../assets/chocolate3.jpg";

const testimonials = [
  {
    image: customer1,
    name: "Aarav",
    text: "You can taste the care in every bite. Nothing feels overprocessed or artificial.",
  },
  {
    image: customer2,
    name: "Meera",
    text: "This is the first chocolate where origin actually means something to me.",
  },
  {
    image: customer3,
    name: "Rohan",
    text: "Balanced, honest, and deeply satisfying. It feels intentional.",
  },
];

export function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrev = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? testimonials.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    setCurrentIndex((prev) =>
      prev === testimonials.length - 1 ? 0 : prev + 1
    );
  };

  return (
    <section className="overflow-hidden bg-[#F2F6F1] py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-6 text-green-900">

        {/* Header */}
        <div className="mx-auto mb-10 max-w-3xl text-center md:mb-12">
          <p className="mb-4 text-xs uppercase tracking-[0.35em] text-green-700">
            Words from our community
          </p>
          <h2 className="text-3xl font-serif font-semibold md:text-4xl">
            What people notice first
          </h2>
        </div>

        {/* Carousel */}
        <div className="relative overflow-hidden px-10 md:px-12">
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous testimonial"
            className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full border border-green-300 bg-white/90 px-3 py-2 text-green-800 shadow-sm transition hover:bg-white"
          >
            &#8592;
          </button>

          <div
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {testimonials.map((testimonial) => (
              <Slide
                key={testimonial.name}
                image={testimonial.image}
                name={testimonial.name}
                text={testimonial.text}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={handleNext}
            aria-label="Next testimonial"
            className="absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full border border-green-300 bg-white/90 px-3 py-2 text-green-800 shadow-sm transition hover:bg-white"
          >
            &#8594;
          </button>
        </div>

        <div className="mt-6 flex justify-center gap-2">
          {testimonials.map((testimonial, index) => (
            <button
              key={testimonial.name}
              type="button"
              onClick={() => setCurrentIndex(index)}
              aria-label={`Go to testimonial ${index + 1}`}
              className={`h-2.5 w-2.5 rounded-full transition ${
                currentIndex === index ? "bg-green-800" : "bg-green-300"
              }`}
            />
          ))}
        </div>

      </div>
    </section>
  );
}

function Slide({
  image,
  name,
  text,
}: {
  image: string;
  name: string;
  text: string;
}) {
  return (
    <div className="flex min-w-full flex-col items-center text-center">

      {/* Image */}
      <img
        src={image}
        alt={name}
        className="mb-6 h-20 w-20 rounded-full object-cover md:h-24 md:w-24"
      />

      {/* Quote */}
      <p className="max-w-2xl text-lg font-light italic leading-relaxed text-green-800 md:text-xl">
        &ldquo;{text}&rdquo;
      </p>

      {/* Name */}
      <p className="mt-4 text-sm tracking-wide text-green-700">
        &mdash; {name}
      </p>
    </div>
  );
}
