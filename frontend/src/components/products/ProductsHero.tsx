import heroBg from "../../assets/chocoBean.webp"; // change filename

export default function ProductsHero() {
  return (
    <section className="relative min-h-[36vh] flex items-center overflow-hidden">
      
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroBg})` }}
      />

      {/* Logo Palette Overlay */}
      <div className="absolute inset-0 bg-[#eef2ed]/68" />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 text-center py-16">
        
        <span className="inline-block mb-6 rounded-full bg-[#e9efe2] px-5 py-2 text-sm font-medium tracking-wide text-[#69b317]">
          Explore Our Collection
        </span>

        <h1 className="text-4xl font-serif font-semibold leading-tight text-[#57595d] md:text-6xl">
          Crafted with Care. <br />
          <span className="text-[#69b317]">Loved by Many.</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-[#6f7277]">
          Discover our thoughtfully curated range of premium, handcrafted
          products designed to bring quality and sustainability together.
        </p>

      </div>
    </section>
  );
}

