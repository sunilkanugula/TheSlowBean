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
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-20 text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-medium tracking-tight">My Wishlist</h1>
          <div className="mt-5 h-[2px] w-16 bg-gray-300 mx-auto" />
        </div>

        {products.length === 0 ? (
          <p className="text-center text-gray-500">Your wishlist is empty</p>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-10">
            {products.map((product) => {
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
                      onClick={() => handleRemoveWishlist(product.id)}
                      className="absolute top-4 right-4 opacity-0 scale-90 pointer-events-none transition-all duration-300 group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto"
                    >
                      <Heart size={18} className="fill-red-500 text-red-500" />
                    </button>

                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-3 pt-10 opacity-100 md:opacity-0 md:translate-y-4 transition-all duration-300 md:group-hover:opacity-100 md:group-hover:translate-y-0">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAddToCart(product.id)}
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
                              <ShoppingCart
                                size={14}
                                className="absolute opacity-0 group-hover/button:opacity-100 transition"
                              />
                            </span>
                          )}
                        </button>
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
        )}
      </div>
    </section>
  );
}
