export default function WhyChooseUs() {
  const features = [
    {
      title: "Bean to Bar Craft",
      description:
        "Every step, from sourcing to bar, crafted in-house with patience and precision.",
    },
    {
      title: "In-House Cocoa Butter",
      description:
        "Pressed by us from the same beans we roast, for unmatched aroma and melt.",
    },
    {
      title: "Bespoke Roasting Profiles",
      description:
        "Each origin roasted uniquely to reveal its natural flavour character.",
    },
    {
      title: "Regenerative Cocoa",
      description:
        "Every bar supports Mahavanam Food Forest and living ecosystems.",
    },
    {
      title: "Creative Fermentation",
      description:
        "Thoughtfully fermented at the farm to unlock complex, natural flavour notes.",
    },
  ];

  return (
    <section className="relative overflow-hidden bg-[#e7eeeb] py-16 text-[#202326]">
      {/* Subtle texture overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.45),transparent_70%)]" />

      <div className="relative mx-auto max-w-7xl px-6">
        {/* Heading */}
        <div className="mb-12 text-center">
          <p className="mb-3 text-xs uppercase tracking-[0.35em] text-[#5f6568]">
            Why Choose Us
          </p>
          <h2 className="mx-auto max-w-2xl text-2xl font-serif font-semibold leading-tight md:text-3xl">
            Crafted Slowly.
            <span className="block text-[#202326]">
              Chosen Consciously.
            </span>
          </h2>
        </div>

        {/* Premium Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {features.map((item, index) => (
            <div
              key={index}
              className="group relative rounded-lg border border-[#d9dfd8]/60 bg-white/60 p-6 text-center backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-lg"
            >
              {/* Number badge */}
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-[#d9dfd8] bg-[#e7eeeb] text-[11px] font-medium tracking-[0.25em] text-[#202326] shadow-sm">
                {String(index + 1).padStart(2, "0")}
              </div>

              {/* Text */}
              <h3 className="mb-2 text-sm font-semibold tracking-wide">
                {item.title}
              </h3>
              <p className="text-xs leading-relaxed text-[#202326]/90">
                {item.description}
              </p>

              {/* Soft hover glow */}
              <div className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-[#d9dfd8]/0 transition group-hover:ring-[#d9dfd8]/30" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


