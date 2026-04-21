import { Link } from "react-router-dom";

export function FinalCTA() {
  return (
    <section className="bg-[#0F2E1F] py-28 text-[#edf2ee]">
      <div className="mx-auto max-w-4xl px-6 text-center">

        <h2 className="text-3xl font-serif font-semibold text-white md:text-4xl">
          Chocolate, made with intention
        </h2>

        <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-[#edf2ee]">
          From regenerative forests to carefully roasted beans,
          every decision is deliberate.
          If that matters to you, you’re in the right place.
        </p>

        <div className="mt-12">
          <Link to="/products" className="rounded-full bg-[#edf2ee] px-10 py-4 text-sm font-medium text-[#202326] transition hover:bg-white">
            Explore Our Bars
          </Link>
        </div>

      </div>
    </section>
  );
}


