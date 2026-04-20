import heroBg from "../../assets/chocoBean.webp"; // change filename

export default function ProductsHero() {
  return (
    <section className="premium-hero flex min-h-[440px] items-center md:min-h-[42vh]">
      
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroBg})` }}
      />

      {/* Logo Palette Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#202326]/82 via-[#202326]/54 to-[#287a55]/24" />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-14 text-center sm:px-6 md:py-16">
        
        <span className="mb-6 inline-block rounded-full border border-white/20 bg-white/12 px-5 py-2 text-sm font-semibold tracking-wide text-white backdrop-blur">
          Explore Our Products
        </span>

        <h1 className="text-4xl font-serif font-semibold leading-tight text-white sm:text-5xl md:text-6xl">
          Crafted with Care. <br />
          <span className="text-[#b6e27c]">Loved by Many.</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/82 md:text-lg">
          Discover our thoughtfully curated range of premium, handcrafted
          products designed to bring quality and sustainability together.
        </p>

      </div>
    </section>
  );
}

