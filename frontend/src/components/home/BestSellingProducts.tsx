import { useEffect, useState } from "react";
import axios from "axios";
import { Check, Heart, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

// FEATURE IMAGES
import SmallBatch from "../../assets/SmallBatch.avif";
import NoPalmOil from "../../assets/NOPALMOIL.avif";
import Organic from "../../assets/OrganicChocolate.avif";
import Sustainable from "../../assets/SustainablySourced.avif";
import Insulated from "../../assets/InsulatedShipping.avif";

// WISHLIST HOOK
import { useWishlist } from "../../hooks/useWishlist";
import { api } from "../../services/api";

const API_URL = "http://localhost:5000/api/products/best-selling";
const TOKEN_KEY = "token";

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

  const handleAddToCart = async (productId: number) => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);

      if (!token) {
        toast.info("Please login to add items to cart");
        return;
      }

      await api.post("/cart", { productId, quantity: 1 });
      setAddedToCart(productId);
      setTimeout(() => setAddedToCart(null), 1200);
      toast.success("Added to cart");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to add to cart");
    }
  };

  if (loading) {
    return (
      <section className="bg-[#f6f1e8] py-16 md:py-24">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-2.5 px-2.5 md:grid-cols-3 md:gap-5 md:px-6 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-[290px] animate-pulse rounded-2xl bg-white/80 shadow-sm md:h-[360px]"
            />
          ))}
        </div>
      </section>
    );
  }

  if (!products.length) return null;

  return (
    <>
      <section className="bg-[#f9f4ea] py-14 md:py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 text-center sm:grid-cols-3 lg:grid-cols-5">
            {[
              { img: SmallBatch, label: "Small Batch" },
              { img: NoPalmOil, label: "No Palm Oil" },
              { img: Organic, label: "Organic Chocolate" },
              { img: Sustainable, label: "Sustainably Sourced" },
              { img: Insulated, label: "Insulated Shipping" },
            ].map(({ img, label }, index) => (
              <div key={label} className="relative flex flex-col items-center">
                <img src={img} alt={label} className="h-11 w-11 opacity-85" />
                <p className="mt-6 text-[11px] tracking-[0.28em] uppercase text-gray-600">
                  {label}
                </p>
                <span className="mt-4 h-[1px] w-6 bg-black/10" />
                {index !== 4 && (
                  <span className="absolute right-[-22px] top-1/2 hidden h-12 w-px bg-black/10 lg:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[radial-gradient(circle_at_20%_10%,#eef7eb_0%,#e7f0e4_35%,#e1ebde_100%)] py-14 md:py-22">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mb-8 text-center md:mb-14">
            <h2 className="text-4xl font-serif font-medium tracking-tight md:text-5xl">
              Best Sellers
            </h2>
            <div className="mx-auto mt-5 h-[2px] w-16 bg-gray-300" />
            <p className="mx-auto mt-5 max-w-2xl text-[15px] text-gray-600">
              Crafted favourites trusted by our customers - timeless, refined,
              and consistently loved.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => {
              const liked = isInWishlist(product.id);
              const isAdded = addedToCart === product.id;
              const salePrice = product.discountPrice ?? product.price;
              const hasDiscount =
                product.discountPrice !== undefined &&
                product.discountPrice < product.price;
              const discountPercent = hasDiscount
                ? Math.round(
                    ((product.price - (product.discountPrice as number)) /
                      product.price) *
                      100
                  )
                : null;

              return (
                <article
                  key={product.id}
                  className="group min-w-0 transition duration-300 hover:-translate-y-1.5"
                >
                  <Link
                    to={`/products/${product.id}`}
                    className="relative block overflow-hidden rounded-2xl border border-white/80 bg-white/70 shadow-[0_14px_32px_rgba(16,56,38,0.14)]"
                  >
                    <div className="relative aspect-[1/1] w-full overflow-hidden bg-emerald-50 md:aspect-[4/5]">
                      <img
                        src={product.images[0]}
                        alt={product.title}
                        className={`h-full w-full object-cover transition-all duration-500 ${
                          product.images[1]
                            ? "opacity-100 group-hover:opacity-0"
                            : "group-hover:scale-105"
                        }`}
                      />
                      {product.images[1] ? (
                        <img
                          src={product.images[1]}
                          alt={`${product.title} alternate view`}
                          className="absolute inset-0 h-full w-full object-cover opacity-0 transition-all duration-500 group-hover:opacity-100 group-hover:scale-105"
                        />
                      ) : null}
                    </div>
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 via-black/5 to-transparent" />

                    <span className="absolute left-3 top-3 rounded-full border border-white/50 bg-white/90 px-2.5 py-1 text-[9px] uppercase tracking-[0.14em] text-slate-800 backdrop-blur">
                      Best Seller
                    </span>

                    {discountPercent ? (
                      <span className="absolute bottom-3 left-3 rounded-full bg-emerald-900 px-2 py-1 text-[9px] font-semibold text-white">
                        Save {discountPercent}%
                      </span>
                    ) : null}

                    <button
                      onClick={async (event) => {
                        event.preventDefault();
                        try {
                          if (liked) {
                            await remove(product.id);
                            toast.info("Removed from wishlist");
                          } else {
                            await add(product.id);
                            toast.success("Added to wishlist");
                          }
                        } catch {
                          toast.error("Wishlist action failed");
                        }
                      }}
                      className="absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur transition hover:bg-black/50"
                    >
                      <Heart
                        size={14}
                        strokeWidth={2}
                        className={liked ? "fill-rose-500 text-rose-500" : "text-white"}
                      />
                    </button>
                  </Link>

                  <div className="min-w-0 px-1 pb-1 pt-3 text-center md:px-0 md:pt-3">
                    <p className="text-[9px] uppercase tracking-[0.15em] text-emerald-700 md:text-[10px]">
                      Signature Craft
                    </p>

                    <Link to={`/products/${product.id}`} className="block">
                      <h3
                        className="mt-1 h-[2.6em] overflow-hidden text-[13px] font-semibold leading-[1.3] text-slate-900 md:text-[15px]"
                        style={{
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                        }}
                      >
                        {product.title}
                      </h3>
                    </Link>

                    <div className="mt-2.5 flex items-end justify-center gap-1">
                      <span className="text-[20px] font-extrabold leading-none text-emerald-900 md:text-[24px]">
                        Rs {salePrice}
                      </span>
                      {hasDiscount ? (
                        <span className="mb-0.5 text-[11px] text-slate-400 line-through">
                          Rs {product.price}
                        </span>
                      ) : null}
                    </div>

                    <button
                      onClick={() => handleAddToCart(product.id)}
                      className={`mt-3 inline-flex h-10 w-full items-center justify-center gap-1.5 whitespace-nowrap self-center rounded-xl px-3 text-[11px] font-semibold transition md:h-9 md:w-[86%] md:text-[12px] ${
                        isAdded
                          ? "bg-emerald-600 text-white"
                          : "bg-emerald-900 text-white hover:bg-emerald-950"
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Check size={13} />
                          Added
                        </>
                      ) : (
                        <>
                          <ShoppingBag size={13} />
                          Add to Cart
                        </>
                      )}
                    </button>

                    <Link
                      to={`/products/${product.id}`}
                      className="mt-2 hidden text-[10px] uppercase tracking-[0.14em] text-slate-500 transition hover:text-slate-800 md:block"
                    >
                      View Details
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
