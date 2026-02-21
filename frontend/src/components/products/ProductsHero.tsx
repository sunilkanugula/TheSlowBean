import heroBg from "../../assets/chocoBean.webp"; // change filename

export default function ProductsHero() {
  return (
    <section className="relative min-h-[36vh] flex items-center overflow-hidden">
      
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroBg})` }}
      />

      {/* Green Overlay */}
      <div className="absolute inset-0 bg-[#EAF2E8]/60" />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 text-center py-16">
        
        <span className="inline-block mb-6 px-5 py-2 rounded-full bg-green-100 text-green-700 text-sm font-medium tracking-wide">
          Explore Our Collection
        </span>

        <h1 className="text-4xl md:text-6xl font-serif font-semibold text-green-900 leading-tight">
          Crafted with Care. <br />
          <span className="text-green-600">Loved by Many.</span>
        </h1>

        <p className="mt-6 text-lg text-slate-700 max-w-2xl mx-auto">
          Discover our thoughtfully curated range of premium, handcrafted
          products designed to bring quality and sustainability together.
        </p>

      </div>
    </section>
  );
}
