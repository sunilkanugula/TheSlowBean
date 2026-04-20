import sourcingImg from "../../assets/sourcing.webp";
import fermentationImg from "../../assets/fermentation.jpg";
import roastingImg from "../../assets/roasting.jpg";
import grindingImg from "../../assets/grinding.webp";
import conchingImg from "../../assets/conching.webp";
import temperingImg from "../../assets/tempering.jpg";
import wrappingImg from "../../assets/wrapping.jpg";

const process = [
  {
    title: "Sourcing",
    description: "Ethically sourced fine-flavour cocoa.",
    image: sourcingImg,
  },
  {
    title: "Fermentation",
    description: "Naturally fermented to develop flavour.",
    image: fermentationImg,
  },
  {
    title: "Roasting",
    description: "Slow, bespoke roasting profiles.",
    image: roastingImg,
  },
  {
    title: "Grinding",
    description: "Stone-ground into chocolate liquor.",
    image: grindingImg,
  },
  {
    title: "Conching",
    description: "Patient refinement for silky texture.",
    image: conchingImg,
  },
  {
    title: "Tempering",
    description: "Glossy finish and clean snap.",
    image: temperingImg,
  },
  {
    title: "Wrapping",
    description: "Finished and wrapped for freshness.",
    image: wrappingImg,
  },
];

export default function BeanToBarRoadmap() {
  return (
    <section className="bg-[#eff2ef] py-28 text-[#202326]">
      <div className="mx-auto max-w-7xl px-6">

        {/* Header */}
        <div className="mb-20 text-center">
          <p className="mb-4 text-xs uppercase tracking-[0.4em] text-[#5f6568]">
            Our Process
          </p>
          <h2 className="mx-auto max-w-2xl text-3xl font-serif font-semibold md:text-4xl">
            From Bean to Bar
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-[#5f6568]">
            A slow, intentional journey where flavour is shaped patiently at
            every stage.
          </p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Connector line */}
          <div className="absolute left-0 right-0 top-16 hidden h-px bg-[#dfe7d7]/60 md:block" />

          <div className="grid gap-14 md:grid-cols-7">
            {process.map((step, index) => (
              <div
                key={index}
                className="group relative flex flex-col items-center text-center"
              >
                {/* Image */}
                <div className="relative z-10 mb-5 h-28 w-28 overflow-hidden rounded-full border border-[#d9dfd8] bg-white shadow-sm transition-all duration-300 group-hover:shadow-xl">
                  <img
                    src={step.image}
                    alt={step.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>

                {/* Step number */}
                <span className="mb-2 text-[10px] tracking-[0.3em] text-[#5f6568]">
                  {String(index + 1).padStart(2, "0")}
                </span>

                {/* Text */}
                <h3 className="text-sm font-medium tracking-wide">
                  {step.title}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-[#5f6568]">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}

