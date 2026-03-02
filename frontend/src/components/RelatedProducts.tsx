import { useEffect, useState } from "react";
import { Heart, Check, ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

import { useWishlist } from "../hooks/useWishlist";
import { api } from "../services/api";

type Product = {
  id: number;
  title: string;
  price: number;
  discountPrice?: number;
  images: string[];
};

export default function RelatedProducts({
  collection,
  currentProductId,
}: {
  collection?: string;
  currentProductId: number;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [addedToCart, setAddedToCart] = useState<number | null>(null);

  const { add, remove, isInWishlist } = useWishlist();

  useEffect(() => {
    if (!collection) return;

    api
      .get(`/products/related/${encodeURIComponent(collection)}`, {
        params: { excludeId: currentProductId },
      })
      .then((res) => setProducts(res.data || []))
      .catch(() => setProducts([]));
  }, [collection, currentProductId]);

  const handleAddToCart = async (productId: number) => {
    const token = localStorage.getItem("token");

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
      toast.error(err?.response?.data?.message || "Failed to add to cart");
    }
  };

  if (!products.length) return null;

  return (
    <section className="mt-16 md:mt-24">
      <div className="mb-10 text-center md:mb-14">
        <h2 className="text-3xl font-serif font-medium tracking-tight md:text-4xl">You may also like</h2>
        <div className="mx-auto mt-5 h-[2px] w-16 bg-[#d7dad7]" />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
        {products.map((product) => {
          const liked = isInWishlist(product.id);
          const isAdded = addedToCart === product.id;
          const salePrice = product.discountPrice ?? product.price;
          const hasDiscount =
            product.discountPrice !== undefined &&
            product.discountPrice !== null &&
            product.discountPrice < product.price;
          const discountPercent = hasDiscount
            ? Math.round(((product.price - salePrice) / product.price) * 100)
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
                <div className="relative aspect-[1/1] w-full overflow-hidden bg-[#f1f3f2] md:aspect-[4/5]">
                  <img
                    src={product.images?.[0] || "/placeholder.png"}
                    alt={product.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>

                <button
                  type="button"
                  onClick={async (e) => {
                    e.preventDefault();
                    try {
                      if (liked) {
                        await remove(product.id);
                        toast("Removed from wishlist");
                      } else {
                        await add(product.id);
                        toast.success("Added to wishlist");
                      }
                    } catch {
                      toast.error("Wishlist action failed");
                    }
                  }}
                  className="absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#57595d]/35 text-white backdrop-blur transition hover:bg-[#57595d]/50"
                >
                  <Heart
                    size={14}
                    strokeWidth={2}
                    className={liked ? "fill-[#69b317] text-[#69b317]" : "text-white"}
                  />
                </button>

                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#57595d]/40 via-[#57595d]/5 to-transparent" />

                {discountPercent ? (
                  <span className="absolute bottom-3 left-3 rounded-full bg-[#69b317] px-2 py-1 text-[9px] font-semibold text-white">
                    Save {discountPercent}%
                  </span>
                ) : null}
              </Link>

              <div className="min-w-0 px-1 pb-1 pt-3 text-center md:px-0 md:pt-3">
                <p className="text-[9px] uppercase tracking-[0.15em] text-[#69b317] md:text-[10px]">
                  Related Pick
                </p>

                <Link to={`/products/${product.id}`} className="block">
                  <h3
                    className="mt-1 h-[2.6em] overflow-hidden text-[13px] font-semibold leading-[1.3] text-[#57595d] md:text-[15px]"
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
                  <span className="text-[20px] font-extrabold leading-none text-[#57595d] md:text-[24px]">
                    Rs {salePrice}
                  </span>
                  {hasDiscount ? (
                    <span className="mb-0.5 text-[11px] text-[#9fa3a8] line-through">
                      Rs {product.price}
                    </span>
                  ) : null}
                </div>

                <div className="mt-3 grid w-[90%] grid-cols-1 gap-2 sm:w-[86%] sm:grid-cols-2 mx-auto">
                  <button
                    type="button"
                    onClick={() => handleAddToCart(product.id)}
                    className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-xl px-3 text-[11px] font-semibold transition ${
                      isAdded
                        ? "bg-[#84c83a] text-white"
                        : "bg-[#69b317] text-white hover:bg-[#5aa10f]"
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check size={13} />
                        Added
                      </>
                    ) : (
                      <>
                        <ShoppingCart size={13} />
                        Add to Cart
                      </>
                    )}
                  </button>

                  <Link
                    to={`/checkout?productId=${product.id}&qty=1`}
                    className="inline-flex h-9 items-center justify-center rounded-xl bg-[#57595d] px-3 text-[11px] font-semibold text-white transition hover:bg-[#6f7277]"
                  >
                    Buy Now
                  </Link>
                </div>

                <Link
                  to={`/products/${product.id}`}
                  className="mt-2 block text-[10px] uppercase tracking-[0.14em] text-[#8d9197] transition hover:text-[#57595d]"
                >
                  View Details
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}




