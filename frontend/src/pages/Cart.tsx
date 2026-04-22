import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import QuantityControl from "../components/QuantityControl";
import { api } from "../services/api";

type CartItem = {
  id: number;
  quantity: number;
  product: {
    id: number;
    title: string;
    price: number;
    discountPrice?: number;
    images: string[];
  };
};

export default function Cart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    api
      .get("/cart")
      .then((res) => setItems(res.data?.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [navigate]);

  const updateQuantity = async (productId: number, quantity: number) => {
    if (quantity < 1) return;

    try {
      await api.put("/cart/quantity", { productId, quantity });
      setItems((prev) =>
        prev.map((item) => (item.product.id === productId ? { ...item, quantity } : item))
      );
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update quantity");
    }
  };

  const removeItem = async (productId: number) => {
    try {
      await api.delete(`/cart/${productId}`);
      setItems((prev) => prev.filter((item) => item.product.id !== productId));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to remove item";
      toast.error(msg);
    } finally {
      setConfirmId(null);
    }
  };

  const total = items.reduce((sum, item) => {
    const price = item.product.discountPrice ?? item.product.price;
    return sum + price * item.quantity;
  }, 0);

  if (loading) {
    return (
      <div className="premium-page">
        <div className="premium-shell text-[#5f6568]">Loading cart...</div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="premium-page">
        <div className="premium-shell">
          <div className="premium-card mx-auto max-w-xl p-8 text-center">
            <p className="premium-kicker">Cart</p>
            <h1 className="mt-2 text-3xl font-semibold text-[#202326]">My Cart</h1>
            <p className="mt-3 text-[#8b9290]">Your cart is empty.</p>
            <button onClick={() => navigate("/products")} className="premium-button mt-6">
              Explore Products
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="premium-page">
      <div className="premium-shell max-w-5xl">
      <div className="mb-6">
        <p className="premium-kicker">Checkout Ready</p>
        <h1 className="mt-2 text-4xl font-semibold text-[#202326]">My Cart</h1>
      </div>

      <div className="space-y-4">
        {items.map((item) => {
          const price = item.product.discountPrice ?? item.product.price;

          return (
            <div key={item.id} className="premium-card flex flex-col gap-4 p-4 sm:flex-row">
              <img src={item.product.images[0]} className="h-28 w-28 rounded-lg border border-black/10 object-cover" alt={item.product.title} />

              <div className="flex-1">
                <h2 className="font-semibold text-[#202326]">{item.product.title}</h2>

                <QuantityControl
                  quantity={item.quantity}
                  onIncrease={() => updateQuantity(item.product.id, item.quantity + 1)}
                  onDecrease={() => updateQuantity(item.product.id, item.quantity - 1)}
                />

                <p className="mt-2 font-bold text-[#287a55]">Rs {price * item.quantity}</p>
              </div>

              <button onClick={() => setConfirmId(item.product.id)} className="self-start rounded-lg border border-black/10 px-4 py-2 text-sm font-semibold text-[#5f6568] transition hover:bg-[#edf2ee] sm:self-center">
                Remove
              </button>
            </div>
          );
        })}
      </div>

      <div className="premium-card mt-6 space-y-4 p-5">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-[#202326]">Total</h2>
          <h2 className="text-xl font-bold text-[#287a55]">Rs {total}</h2>
        </div>

        <button
          onClick={() => navigate("/checkout")}
          className="premium-button w-full"
        >
          Proceed to Checkout
        </button>
      </div>
      </div>

      {confirmId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="premium-card mx-4 w-full max-w-sm p-6 text-center shadow-2xl">
            <div className="mb-1 text-3xl">🗑️</div>
            <h2 className="mt-2 text-lg font-semibold text-[#202326]">Remove item?</h2>
            <p className="mt-1 text-sm text-[#8b9290]">This item will be removed from your cart.</p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmId(null)}
                className="flex-1 rounded-lg border border-black/10 py-2 text-sm font-semibold text-[#5f6568] transition hover:bg-[#edf2ee]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => removeItem(confirmId)}
                className="flex-1 rounded-lg bg-red-500 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


