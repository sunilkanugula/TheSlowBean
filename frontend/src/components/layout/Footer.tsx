import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#DCE8D9] text-green-900 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* TOP GRID */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 pb-12 border-b border-green-200">
          
          {/* BRAND */}
          <div>
            <h3 className="text-2xl font-serif font-semibold mb-4">
              TheSlowBean
            </h3>
            <p className="text-sm text-green-800 leading-relaxed">
              Premium handcrafted coffee blends made with patience and care.
              Bringing warmth and authenticity to every cup.
            </p>

            {/* SOCIALS */}
            <div className="flex gap-4 mt-6">
              <Facebook className="w-5 h-5 cursor-pointer hover:text-green-600 transition" />
              <Instagram className="w-5 h-5 cursor-pointer hover:text-green-600 transition" />
              <Twitter className="w-5 h-5 cursor-pointer hover:text-green-600 transition" />
            </div>
          </div>

          {/* QUICK LINKS */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-3 text-sm text-green-800">
              <li>
                <Link to="/" className="hover:text-green-600 transition">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/products" className="hover:text-green-600 transition">
                  Products
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-green-600 transition">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-green-600 transition">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* SHOP */}
          <div>
            <h4 className="font-semibold mb-4">Shop</h4>
            <ul className="space-y-3 text-sm text-green-800">
              <li>
                <Link to="/products?collection=coffee" className="hover:text-green-600 transition">
                  Coffee
                </Link>
              </li>
              <li>
                <Link to="/products?collection=beans" className="hover:text-green-600 transition">
                  Beans
                </Link>
              </li>
              <li>
                <Link to="/products?collection=brewing" className="hover:text-green-600 transition">
                  Brewing Tools
                </Link>
              </li>
              <li>
                <Link to="/products?collection=offers" className="hover:text-green-600 transition">
                  Offers
                </Link>
              </li>
            </ul>
          </div>

          {/* NEWSLETTER */}
          <div>
            <h4 className="font-semibold mb-4">Stay Updated</h4>
            <p className="text-sm text-green-800 mb-4">
              Subscribe to receive special offers and updates.
            </p>

            <div className="flex">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 rounded-l-xl border border-green-300 focus:outline-none"
              />
              <button className="bg-green-700 text-white px-5 py-2 rounded-r-xl hover:bg-green-800 transition">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* BOTTOM */}
        <div className="mt-8 text-center text-sm text-green-700">
          © {new Date().getFullYear()} TheSlowBean. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
