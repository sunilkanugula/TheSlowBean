const craftPillars = [
  {
    title: "Fermentation",
    tag: "Step 01",
    description:
      "We work with naturally fermented beans, monitored for temperature and timing so flavor complexity develops before roasting begins.",
    accent: "from-[#287a55]/20 to-[#287a55]/10",
  },
  {
    title: "Roasting",
    tag: "Step 02",
    description:
      "Each origin follows a custom roasting curve. Small batches help preserve acidity, aroma, and clean balance without masking the bean.",
    accent: "from-[#287a55]/16 to-[#7abf36]/10",
  },
  {
    title: "Cocoa Butter",
    tag: "Step 03",
    description:
      "Only cocoa butter from the same origin is used. No substitutes, no deodorized fats, only texture, clarity, and a clean finish.",
    accent: "from-[#5f6568]/16 to-[#8b9290]/10",
  },
];

export function CraftDeepDive() {
  return (
    <section className="relative overflow-hidden bg-[#f6f7f4] py-20 text-[#202326] md:py-24">
      <div className="pointer-events-none absolute -left-20 top-8 h-52 w-52 rounded-full bg-[#dfe7d7]/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-8 h-56 w-56 rounded-full bg-[#edf2ee]/40 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-4 text-xs uppercase tracking-[0.35em] text-[#5f6568]">
            Craft Deep Dive
          </p>
          <h2 className="text-3xl font-serif font-semibold leading-tight md:text-5xl">
            Craft is our quiet advantage
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-[#202326] md:text-lg">
            Great chocolate is not rushed. It is built through patience,
            precision, and deep respect for every bean.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {craftPillars.map((pillar) => (
            <CraftCard
              key={pillar.title}
              title={pillar.title}
              tag={pillar.tag}
              description={pillar.description}
              accent={pillar.accent}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function CraftCard({
  title,
  tag,
  description,
  accent,
}: {
  title: string;
  tag: string;
  description: string;
  accent: string;
}) {
  return (
    <article className="group relative overflow-hidden rounded-lg border border-[#d9dfd8]/80 bg-white/85 p-7 shadow-[0_12px_35px_rgba(16,88,43,0.08)] backdrop-blur transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(16,88,43,0.14)] md:p-8">
      <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${accent}`} />

      <div className="mb-5 inline-flex items-center rounded-full border border-[#d9dfd8] bg-[#edf2ee] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-[#5f6568]">
        {tag}
      </div>

      <h3 className="text-2xl font-serif font-semibold text-[#202326]">{title}</h3>
      <p className="mt-4 text-base leading-relaxed text-[#202326]">{description}</p>
    </article>
  );
}



