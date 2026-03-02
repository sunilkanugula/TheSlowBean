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
    if (!confirm("Remove this item from cart?")) return;

    try {
      await api.delete(`/cart/${productId}`);
      setItems((prev) => prev.filter((item) => item.product.id !== productId));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to remove item");
    }
  };

  const total = items.reduce((sum, item) => {
    const price = item.product.discountPrice ?? item.product.price;
    return sum + price * item.quantity;
  }, 0);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <p>Loading cart...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">My Cart</h1>
        <p className="text-[#8d9197]">Your cart is empty.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">My Cart</h1>

      <div className="space-y-4">
        {items.map((item) => {
          const price = item.product.discountPrice ?? item.product.price;

          return (
            <div key={item.id} className="flex gap-4 border rounded-lg p-4">
              <img src={item.product.images[0]} className="w-24 h-24 object-cover rounded" alt={item.product.title} />

              <div className="flex-1">
                <h2 className="font-semibold">{item.product.title}</h2>

                <QuantityControl
                  quantity={item.quantity}
                  onIncrease={() => updateQuantity(item.product.id, item.quantity + 1)}
                  onDecrease={() => updateQuantity(item.product.id, item.quantity - 1)}
                />

                <p className="font-bold text-[#6f7277] mt-2">Rs {price * item.quantity}</p>
              </div>

              <button onClick={() => removeItem(item.product.id)} className="text-[#6f7277] font-semibold">
                Remove
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-6 border-t pt-4 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Total</h2>
          <h2 className="text-xl font-bold text-[#6f7277]">Rs {total}</h2>
        </div>

        <button
          onClick={() => navigate("/checkout")}
          className="w-full bg-[#57595d] text-white py-3 rounded-lg font-semibold hover:bg-[#57595d]"
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
}


