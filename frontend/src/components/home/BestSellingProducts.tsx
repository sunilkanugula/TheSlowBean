import { useEffect, useState } from "react";
import axios from "axios";
import { Heart, Check } from "lucide-react";

// FEATURE IMAGES
import SmallBatch from "../../assets/SmallBatch.avif";
import NoPalmOil from "../../assets/NOPALMOIL.avif";
import Organic from "../../assets/OrganicChocolate.avif";
import Sustainable from "../../assets/SustainablySourced.avif";
import Insulated from "../../assets/InsulatedShipping.avif";

// WISHLIST HOOK
import { useWishlist } from "../../hooks/useWishlist";

const API_URL = "http://localhost:5000/api/products/best-selling";

type Product = {
  id: number;
  title: string;
  price: number;
  discountPrice?: number;
  images: string[];
};

export default function BestSellingProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const { add, remove, isInWishlist } = useWishlist();

  // cart animation state
  const [addedToCart, setAddedToCart] = useState<number | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get(API_URL);
        setProducts(res.data);
      } catch {
        console.error("Failed to fetch best selling products");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  /* ---------------- CART HANDLERS ---------------- */

  const handleAddToCart = (productId: number) => {
    console.log("Added to cart:", productId);
    setAddedToCart(productId);
    setTimeout(() => setAddedToCart(null), 1200);
  };

  const handleQuickBuy = (productId: number) => {
    window.location.href = `/checkout?productId=${productId}&qty=1`;
  };

  if (loading) {
    return (
      <section className="py-24 bg-[#faf7f2]">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 gap-10">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-[360px] rounded-3xl bg-white/80 shadow-sm animate-pulse"
            />
          ))}
        </div>
      </section>
    );
  }

  if (!products.length) return null;

  return (
    <>
      {/* ================= FEATURE STRIP ================= */}
      <section className="bg-[#fbf8f3] py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-y-16 gap-x-10 text-center">
            {[
              { img: SmallBatch, label: "Small Batch" },
              { img: NoPalmOil, label: "No Palm Oil" },
              { img: Organic, label: "Organic Chocolate" },
              { img: Sustainable, label: "Sustainably Sourced" },
              { img: Insulated, label: "Insulated Shipping" },
            ].map(({ img, label }, index) => (
              <div key={label} className="relative flex flex-col items-center">
                <img src={img} alt={label} className="w-11 h-11 opacity-85" />
                <p className="mt-6 text-[11px] tracking-[0.28em] uppercase text-gray-600">
                  {label}
                </p>
                <span className="mt-4 h-[1px] w-6 bg-black/10" />
                {index !== 4 && (
                  <span className="hidden lg:block absolute right-[-22px] top-1/2 h-12 w-px bg-black/10" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= BEST SELLERS ================= */}
      <section className="py-24 bg-[#EAF2E8]">
        <div className="max-w-7xl mx-auto px-6">
          {/* HEADER */}
          <div className="mb-20 text-center">
            <h2 className="text-4xl md:text-5xl font-serif font-medium tracking-tight">
              Best Sellers
            </h2>
            <div className="mt-5 h-[2px] w-16 bg-gray-300 mx-auto" />
            <p className="mt-6 text-[15px] text-gray-600 max-w-2xl mx-auto">
              Crafted favourites trusted by our customers — timeless,
              refined, and consistently loved.
            </p>
          </div>

          {/* GRID */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-10">
            {products.map((product) => {
              const liked = isInWishlist(product.id);
              const isAdded = addedToCart === product.id;

              return (
                <div
                  key={product.id}
                  className="group h-[360px] flex flex-col rounded-3xl bg-white shadow-sm hover:shadow-lg transition overflow-hidden"
                >
                  {/* IMAGE */}
                  <div className="relative overflow-hidden h-[160px] sm:h-auto sm:flex-1">
                    <img
                      src={product.images[0]}
                      alt={product.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />

                    {/* BADGES */}
                    <span className="absolute top-4 left-4 text-[10px] tracking-widest uppercase bg-white/90 px-3 py-1 rounded-full">
                      Best Seller
                    </span>

                    {/* WISHLIST */}
                    <button
                      onClick={() =>
                        liked ? remove(product.id) : add(product.id)
                      }
                      className="
                        absolute top-4 right-4
                        opacity-0 scale-90
                        pointer-events-none
                        transition-all duration-300
                        group-hover:opacity-100
                        group-hover:scale-100
                        group-hover:pointer-events-auto
                      "
                    >
                      <Heart
                        size={18}
                        strokeWidth={1.8}
                        className={
                          liked
                            ? "fill-red-500 text-red-500 drop-shadow-sm"
                            : "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
                        }
                      />
                    </button>

                    {/* ACTION OVERLAY */}
                    <div
                      className="
                        absolute inset-x-0 bottom-0
                        bg-gradient-to-t from-black/70 to-transparent
                        px-3 pb-3 pt-10
                        opacity-0 translate-y-4
                        transition-all duration-300
                        group-hover:opacity-100
                        group-hover:translate-y-0
                      "
                    >
                      <div className="flex gap-2">
                        {/* ADD TO CART */}
                        <button
                          onClick={() => handleAddToCart(product.id)}
                          className={`
                            flex-1 rounded-lg text-xs font-semibold py-2
                            transition-all duration-300
                            ${
                              isAdded
                                ? "bg-green-600 text-white"
                                : "bg-white text-gray-900 hover:bg-gray-100"
                            }
                          `}
                        >
                          {isAdded ? (
                            <span className="flex items-center justify-center gap-1">
                              <Check size={14} /> Added
                            </span>
                          ) : (
                            "Add to Cart"
                          )}
                        </button>

                        {/* BUY NOW */}
                        <button
                          onClick={() => handleQuickBuy(product.id)}
                          className="flex-1 rounded-lg bg-gray-900 text-white text-xs font-semibold py-2 hover:bg-black transition"
                        >
                          Buy Now
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* CONTENT */}
                  <div className="px-5 py-4">
                    <h3 className="text-[14px] font-medium leading-snug line-clamp-2">
                      {product.title}
                    </h3>

                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {product.discountPrice ? (
                          <>
                            <span className="text-base font-semibold">
                              ₹{product.discountPrice}
                            </span>
                            <span className="text-xs text-gray-400 line-through">
                              ₹{product.price}
                            </span>
                          </>
                        ) : (
                          <span className="text-base font-semibold">
                            ₹{product.price}
                          </span>
                        )}
                      </div>

                      <span className="text-[11px] tracking-widest uppercase text-gray-500 hover:text-gray-900 cursor-pointer">
                        View →
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
