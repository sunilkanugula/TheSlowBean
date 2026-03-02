import chocolateImg from "../../assets/chocolatetree.jpg";

export default function MahavanamFoodForest() {
  return (
    <section
      className="relative py-14 md:py-20 text-white"
      style={{
        backgroundImage: `url(${chocolateImg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
      }}
    >
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-[#57595d]/60" />

      <div className="relative mx-auto max-w-6xl px-6">

        {/* Header */}
        <div className="mb-10 max-w-3xl">
          <p className="mb-3 text-xs uppercase tracking-[0.35em] text-[#84c83a]">
            Our Impact
          </p>

          <h2 className="text-3xl font-serif font-semibold leading-snug md:text-4xl">
            Mahavanam Food Forest
          </h2>

          <p className="mt-4 text-base leading-relaxed text-[#d7dad7]">
            Every bar supports something larger than chocolate —
            the restoration of land, biodiversity, and long-term food security.
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid gap-10 md:grid-cols-2 items-start">

          {/* Left Content */}
          <div className="space-y-5 text-[#d7dad7]">
            <p className="text-base leading-relaxed">
              Mahavanam is our living commitment to the future — a regenerating
              food forest where native trees, fruit crops, medicinal plants,
              and pollinators thrive together.
            </p>

            <p className="text-base leading-relaxed">
              Designed on permaculture principles, the forest grows richer
              every year without chemical inputs, excessive irrigation,
              or soil degradation.
            </p>

            <p className="text-base leading-relaxed font-medium text-white">
              This is not charity. It is regeneration —
              slow, intentional, and measurable.
            </p>
          </div>

          {/* Right Metrics */}
          <div className="grid grid-cols-2 gap-5">
            <ImpactCard
              title="Native Trees"
              value="1,200+"
              subtitle="Planted & thriving"
            />
            <ImpactCard
              title="Land Regenerated"
              value="6 Acres"
              subtitle="Restored ecosystem"
            />
            <ImpactCard
              title="Water Use"
              value="↓ 70%"
              subtitle="Compared to conventional farming"
            />
            <ImpactCard
              title="Carbon Positive"
              value="Yes"
              subtitle="Biomass & soil sequestration"
            />
          </div>

        </div>

      </div>
    </section>
  );
}

/* Impact Card Component */
function ImpactCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string;
  subtitle: string;
}) {
  return (
    <div className="rounded-2xl bg-white/90 backdrop-blur-md p-5 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
      <p className="text-[11px] uppercase tracking-wider text-[#69b317]">
        {title}
      </p>

      <p className="mt-2 text-2xl font-semibold text-[#57595d]">
        {value}
      </p>

      <p className="mt-1 text-sm text-[#8d9197]">
        {subtitle}
      </p>
    </div>
  );
}

