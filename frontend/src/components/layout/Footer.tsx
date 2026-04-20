import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-black/10 bg-[#202326] pb-8 pt-16 text-white">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 gap-12 border-b border-white/10 pb-12 md:grid-cols-4">
          <div>
            <h3 className="mb-4 text-2xl font-serif font-semibold text-white">
              TheSlowBean
            </h3>
            <p className="text-sm leading-relaxed text-white/70">
              Handcrafted bean-to-bar chocolate made with patience, precision,
              and a deep respect for cacao.
            </p>

            <div className="mt-6 flex gap-4">
              <Facebook className="h-5 w-5 cursor-pointer text-white/70 transition hover:text-[#b6e27c]" />
              <Instagram className="h-5 w-5 cursor-pointer text-white/70 transition hover:text-[#b6e27c]" />
              <Twitter className="h-5 w-5 cursor-pointer text-white/70 transition hover:text-[#b6e27c]" />
            </div>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-white">Quick Links</h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/" className="text-white/70 transition hover:text-white">Home</Link></li>
              <li><Link to="/products" className="text-white/70 transition hover:text-white">Products</Link></li>
              <li><Link to="/orders" className="text-white/70 transition hover:text-white">My Orders</Link></li>
              <li><Link to="/track-order" className="text-white/70 transition hover:text-white">Track Order</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-white">Shop</h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/products" className="text-white/70 transition hover:text-white">All Products</Link></li>
              <li><Link to="/products?sort=newest" className="text-white/70 transition hover:text-white">New Arrivals</Link></li>
              <li><Link to="/products?inStock=true" className="text-white/70 transition hover:text-white">In Stock</Link></li>
              <li><Link to="/products?sort=price_asc" className="text-white/70 transition hover:text-white">Offers</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-white">Stay Updated</h4>
            <p className="mb-4 text-sm text-white/70">
              Receive new releases and small-batch updates.
            </p>

            <div className="grid gap-2 sm:flex">
              <input
                type="email"
                placeholder="Enter your email"
                className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/10 px-4 py-2 text-sm text-white outline-none placeholder:text-white/50 focus:border-[#b6e27c] sm:rounded-l-lg sm:rounded-r-none"
              />
              <button className="rounded-lg bg-[#287a55] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#319164] sm:rounded-l-none sm:rounded-r-lg">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-white/55">
          Copyright {new Date().getFullYear()} TheSlowBean. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
