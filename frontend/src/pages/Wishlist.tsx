import { useEffect, useState } from "react";
import { Heart, ShoppingCart, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

import { useWishlist } from "../hooks/useWishlist";
import { api } from "../services/api";

const GUEST_KEY = "guest_wishlist";

type Product = {
  id: number;
  title: string;
  price: number;
  discountPrice?: number;
  images: string[];
};

export default function Wishlist() {
  const [products, setProducts] = useState<Product[]>([]);
  const [addedToCart, setAddedToCart] = useState<number | null>(null);

  const { remove } = useWishlist();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      api
        .get("/wishlist", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => setProducts(res.data || []))
        .catch(() => setProducts([]));
      return;
    }

    const stored = localStorage.getItem(GUEST_KEY);
    if (!stored) {
      setProducts([]);
      return;
    }

    const ids: number[] = JSON.parse(stored);
    if (!ids.length) {
      setProducts([]);
      return;
    }

    api
      .get("/products")
      .then((res) => {
        const wished = (res.data || []).filter((p: Product) => ids.includes(p.id));
        setProducts(wished);
      })
      .catch(() => setProducts([]));
  }, []);

  const handleAddToCart = async (productId: number) => {
    const token = localStorage.getItem("token");

    if (!token) {
      toast.warning("Please login to add items to cart");
      return;
    }

    try {
      await api.post("/cart", { productId, quantity: 1 });
      setAddedToCart(productId);
      toast.success("Added to cart");
      setTimeout(() => setAddedToCart(null), 1200);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to add to cart");
    }
  };

  const handleRemoveWishlist = async (id: number) => {
    try {
      await remove(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      toast("Removed from wishlist");
    } catch {
      toast.error("Failed to update wishlist");
    }
  };

  return (
    <section className="bg-[radial-gradient(circle_at_20%_10%,#f3f4f3_0%,#eceeed_45%,#e5e7e6_100%)] py-14 md:py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="mb-10 text-center md:mb-14">
          <h1 className="text-4xl font-serif font-medium tracking-tight md:text-5xl">My Wishlist</h1>
          <div className="mx-auto mt-5 h-[2px] w-16 bg-[#d7dad7]" />
          <p className="mx-auto mt-4 max-w-2xl text-sm text-[#6f7277] md:text-base">
            Saved favorites ready for checkout whenever you are.
          </p>
        </div>

        {products.length === 0 ? (
          <div className="mx-auto max-w-xl rounded-2xl border border-[#d7dad7] bg-white p-8 text-center shadow-sm">
            <p className="text-[#8d9197]">Your wishlist is empty</p>
            <Link
              to="/products"
              className="mt-5 inline-flex rounded-xl bg-[#69b317] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#5aa10f]"
            >
              Explore Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => {
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
                      aria-label="Remove from wishlist"
                      onClick={() => handleRemoveWishlist(product.id)}
                      className="absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#57595d]/35 text-white backdrop-blur transition hover:bg-[#57595d]/50"
                    >
                      <Heart size={14} className="fill-[#69b317] text-[#69b317]" />
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
                      Wishlist Pick
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

                    <button
                      onClick={() => handleAddToCart(product.id)}
                      className={`mt-3 inline-flex h-10 w-[88%] items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-3 text-[11px] font-semibold transition md:h-9 md:w-[75%] md:text-[12px] ${
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

                    <button
                      type="button"
                      onClick={() => handleRemoveWishlist(product.id)}
                      className="mt-2 inline-flex text-[10px] uppercase tracking-[0.14em] text-[#8d9197] transition hover:text-[#57595d]"
                    >
                      Remove
                    </button>

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
        )}
      </div>
    </section>
  );
}




