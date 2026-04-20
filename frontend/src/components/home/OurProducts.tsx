import { useEffect, useState } from "react";
import { Check, Heart, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

import { useWishlist } from "../../hooks/useWishlist";
import { api } from "../../services/api";

const TOKEN_KEY = "token";

type Product = {
  id: number;
  title: string;
  price: number;
  discountPrice?: number | null;
  images: string[];
  isBestSelling?: boolean;
};

export default function OurProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [addedToCart, setAddedToCart] = useState<number | null>(null);

  const { add, remove, isInWishlist } = useWishlist();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get("/products/catalog", {
          params: { sort: "newest", limit: 8, page: 1 },
        });
        setProducts(res.data.items);
      } catch {
        console.error("Failed to fetch products");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleAddToCart = async (productId: number) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      toast.info("Please login to add items to cart");
      return;
    }
    try {
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
      <section className="bg-[#f1f5f1] py-16 md:py-24">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-5 px-4 min-[420px]:grid-cols-2 md:px-6 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="h-[290px] animate-pulse rounded-lg bg-white/80 shadow-sm md:h-[360px]"
            />
          ))}
        </div>
      </section>
    );
  }

  if (!products.length) return null;

  return (
    <section className="bg-[radial-gradient(circle_at_80%_90%,#f1f5f1_0%,#e7eeeb_50%,#dde8e3_100%)] py-14 md:py-22">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="mb-8 text-center md:mb-14">
          <h2 className="text-4xl font-serif font-medium tracking-tight md:text-5xl">
            Our Products
          </h2>
          <div className="mx-auto mt-5 h-[2px] w-16 bg-gray-300" />
          <p className="mx-auto mt-5 max-w-2xl text-[15px] text-[#5f6568]">
            Explore our latest artisan chocolates — small-batch crafted with
            the finest organic ingredients.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 min-[420px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => {
            const liked = isInWishlist(product.id);
            const isAdded = addedToCart === product.id;
            const salePrice = product.discountPrice ?? product.price;
            const hasDiscount =
              product.discountPrice !== undefined &&
              product.discountPrice !== null &&
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
                  className="relative block overflow-hidden rounded-lg border border-white/80 bg-white/70 shadow-[0_14px_32px_rgba(16,56,38,0.14)]"
                >
                  <div className="relative aspect-[1/1] w-full overflow-hidden bg-[#f6f7f4] md:aspect-[4/5]">
                    <img
                      src={product.images?.[0]}
                      alt={product.title}
                      className={`h-full w-full object-cover transition-all duration-500 ${
                        product.images?.[1]
                          ? "opacity-100 group-hover:opacity-0"
                          : "group-hover:scale-105"
                      }`}
                    />
                    {product.images?.[1] ? (
                      <img
                        src={product.images[1]}
                        alt={`${product.title} alternate view`}
                        className="absolute inset-0 h-full w-full object-cover opacity-0 transition-all duration-500 group-hover:opacity-100 group-hover:scale-105"
                      />
                    ) : null}
                  </div>
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#202326]/40 via-[#202326]/5 to-transparent" />

                  {product.isBestSelling && (
                    <span className="absolute left-3 top-3 rounded-full border border-white/50 bg-white/90 px-2.5 py-1 text-[9px] uppercase tracking-[0.14em] text-[#202326] backdrop-blur">
                      Best Seller
                    </span>
                  )}

                  {discountPercent ? (
                    <span className="absolute bottom-3 left-3 rounded-full bg-[#287a55] px-2 py-1 text-[9px] font-semibold text-white">
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
                    className="absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#202326]/35 text-white backdrop-blur transition hover:bg-[#202326]/50"
                  >
                    <Heart
                      size={14}
                      strokeWidth={2}
                      className={
                        liked ? "fill-[#287a55] text-[#287a55]" : "text-white"
                      }
                    />
                  </button>
                </Link>

                <div className="min-w-0 px-1 pb-1 pt-3 text-center md:px-0 md:pt-3">
                  <p className="text-[9px] uppercase tracking-[0.15em] text-[#287a55] md:text-[10px]">
                    Signature Craft
                  </p>

                  <Link to={`/products/${product.id}`} className="block">
                    <h3
                      className="mt-1 h-[2.6em] overflow-hidden text-[13px] font-semibold leading-[1.3] text-[#202326] md:text-[15px]"
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
                    <span className="text-[20px] font-extrabold leading-none text-[#202326] md:text-[24px]">
                      Rs {salePrice}
                    </span>
                    {hasDiscount ? (
                      <span className="mb-0.5 text-[11px] text-[#8b9290] line-through">
                        Rs {product.price}
                      </span>
                    ) : null}
                  </div>

                  <button
                    onClick={() => handleAddToCart(product.id)}
                    className={`mt-3 inline-flex h-10 w-full items-center justify-center gap-1.5 whitespace-nowrap self-center rounded-lg px-3 text-[11px] font-semibold transition md:h-9 md:w-[86%] md:text-[12px] ${
                      isAdded
                        ? "bg-[#7abf36] text-white"
                        : "bg-[#287a55] text-white hover:bg-[#319164]"
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
                    className="mt-2 hidden text-[10px] uppercase tracking-[0.14em] text-[#8b9290] transition hover:text-[#202326] md:block"
                  >
                    View Details
                  </Link>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <Link
            to="/products"
            className="inline-flex h-12 items-center gap-2 rounded-lg border border-[#287a55] px-8 text-[13px] font-semibold uppercase tracking-[0.12em] text-[#287a55] transition hover:bg-[#287a55] hover:text-white"
          >
            View All Products
          </Link>
        </div>
      </div>
    </section>
  );
}
