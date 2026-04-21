export default function HeroCarousel() {
  return (
    <section className="relative h-screen w-full overflow-hidden bg-[#202326]">
      {/* Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        className="absolute inset-0 h-full w-full object-cover"
      >
        <source
          src="https://res.cloudinary.com/djb2yxzad/video/upload/f_auto,q_auto/v1776751988/Intro-video_1_1_1_nlascb.mp4"
          type="video/mp4"
        />
      </video>

      {/* Overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#202326]/75 via-[#202326]/35 to-[#287a55]/20" />
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#fbfcf9] to-transparent" />

      {/* Content */}
      <div className="relative z-10 flex h-full items-center">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
          <div className="max-w-xl text-white">
            <h1 className="mb-4 text-3xl font-bold leading-tight md:text-5xl">
              Premium Bean-to-Bar Chocolate
            </h1>
            <p className="mb-6 max-w-[34rem] text-sm leading-relaxed text-white/90 sm:mb-8 md:text-lg">
              Ethically sourced cacao. Crafted in small batches for unmatched taste and texture.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
              <a
                href="/products"
                className="inline-flex justify-center rounded-lg bg-white px-7 py-3 text-sm font-semibold text-[#202326] transition hover:bg-[#edf2ee]"
              >
                Shop Now
              </a>
              <a
                href="/products"
                className="inline-flex justify-center rounded-lg border border-white/60 px-7 py-3 text-sm font-medium text-white transition hover:bg-white hover:text-[#202326]"
              >
                Learn More
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
