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
    <section className="mt-28">
      <div className="mb-16 text-center">
        <h2 className="text-3xl md:text-4xl font-serif font-medium tracking-tight">You may also like</h2>
        <div className="mt-5 h-[2px] w-16 bg-gray-300 mx-auto" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-10">
        {products.map((product) => {
          const liked = isInWishlist(product.id);
          const isAdded = addedToCart === product.id;

          return (
            <div
              key={product.id}
              className="group h-[360px] flex flex-col rounded-3xl bg-white shadow-sm hover:shadow-lg transition overflow-hidden"
            >
              <div className="relative overflow-hidden h-[160px] sm:h-auto sm:flex-1">
                <Link to={`/products/${product.id}`}>
                  <img
                    src={product.images?.[0] || "/placeholder.png"}
                    alt={product.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </Link>

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
                  className="absolute top-4 right-4 opacity-0 scale-90 pointer-events-none transition-all duration-300 group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto"
                >
                  <Heart
                    size={18}
                    strokeWidth={1.8}
                    className={
                      liked
                        ? "fill-red-500 text-red-500"
                        : "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
                    }
                  />
                </button>

                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-3 pt-10 opacity-100 md:opacity-0 md:translate-y-4 transition-all duration-300 md:group-hover:opacity-100 md:group-hover:translate-y-0">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(product.id);
                      }}
                      className={`group/button relative flex-1 rounded-lg text-xs font-semibold py-2 transition-all duration-300 active:scale-95 ${
                        isAdded ? "bg-green-600 text-white" : "bg-white text-gray-900 hover:bg-gray-100"
                      }`}
                    >
                      {isAdded ? (
                        <span className="flex items-center justify-center gap-1">
                          <Check size={14} /> Added
                        </span>
                      ) : (
                        <span className="relative flex items-center justify-center">
                          <span className="group-hover/button:opacity-0 transition">Add to Cart</span>
                          <ShoppingCart size={14} className="absolute opacity-0 group-hover/button:opacity-100 transition" />
                        </span>
                      )}
                    </button>

                    <Link
                      to={`/checkout?productId=${product.id}&qty=1`}
                      className="flex-1 rounded-lg bg-gray-900 text-white text-xs font-semibold py-2 hover:bg-black transition text-center"
                    >
                      Buy Now
                    </Link>
                  </div>
                </div>
              </div>

              <div className="px-5 py-4">
                <h3 className="text-[14px] font-medium line-clamp-2">{product.title}</h3>

                <div className="mt-4 flex items-center justify-between">
                  {product.discountPrice ? (
                    <div className="flex gap-2">
                      <span className="font-semibold">Rs {product.discountPrice}</span>
                      <span className="text-xs text-gray-400 line-through">Rs {product.price}</span>
                    </div>
                  ) : (
                    <span className="font-semibold">Rs {product.price}</span>
                  )}

                  <Link
                    to={`/products/${product.id}`}
                    className="text-[11px] uppercase tracking-widest text-gray-500 hover:text-gray-900"
                  >
                    View &gt;
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
