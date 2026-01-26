import { useEffect, useState } from "react";
import axios from "axios";
import QuantityControl from "../components/QuantityControl";
import { useNavigate } from "react-router-dom";

const CART_API = "http://localhost:5000/api/cart";
const ORDER_API = "http://localhost:5000/api/orders";

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
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [paymentType, setPaymentType] = useState<"ONLINE" | "COD">("COD");

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  /* ---------- FETCH CART ---------- */
  useEffect(() => {
    const fetchCart = async () => {
      try {
        const res = await axios.get(CART_API, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setItems(res.data?.items || []);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, []);

  /* ---------- UPDATE QUANTITY ---------- */
  const updateQuantity = async (productId: number, quantity: number) => {
    if (quantity < 1) return;

    try {
      await axios.put(
        `${CART_API}/quantity`,
        { productId, quantity },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setItems((prev) =>
        prev.map((item) =>
          item.product.id === productId
            ? { ...item, quantity }
            : item
        )
      );
    } catch {
      alert("Failed to update quantity");
    }
  };

  /* ---------- REMOVE ITEM ---------- */
  const removeItem = async (productId: number) => {
    if (!confirm("Remove this item from cart?")) return;

    try {
      await axios.delete(`${CART_API}/${productId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setItems((prev) =>
        prev.filter((item) => item.product.id !== productId)
      );
    } catch {
      alert("Failed to remove item");
    }
  };

  /* ---------- CHECKOUT ---------- */
  const checkout = async () => {
    if (items.length === 0) return;

    try {
      setCheckoutLoading(true);

      await axios.post(
        `${ORDER_API}/checkout`,
        {
          paymentType, // ✅ ONLINE or COD
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Order placed successfully");

      setItems([]);
      navigate("/orders");
    } catch {
      alert("Checkout failed");
    } finally {
      setCheckoutLoading(false);
    }
  };

  /* ---------- TOTAL ---------- */
  const total = items.reduce((sum, item) => {
    const price =
      item.product.discountPrice ?? item.product.price;
    return sum + price * item.quantity;
  }, 0);

  /* ---------- UI STATES ---------- */
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
        <p className="text-gray-500">Your cart is empty.</p>
      </div>
    );
  }

  /* ---------- MAIN UI ---------- */
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">My Cart</h1>

      <div className="space-y-4">
        {items.map((item) => {
          const price =
            item.product.discountPrice ?? item.product.price;

          return (
            <div
              key={item.id}
              className="flex gap-4 border rounded-lg p-4"
            >
              <img
                src={item.product.images[0]}
                className="w-24 h-24 object-cover rounded"
              />

              <div className="flex-1">
                <h2 className="font-semibold">
                  {item.product.title}
                </h2>

                <QuantityControl
                  quantity={item.quantity}
                  onIncrease={() =>
                    updateQuantity(
                      item.product.id,
                      item.quantity + 1
                    )
                  }
                  onDecrease={() =>
                    updateQuantity(
                      item.product.id,
                      item.quantity - 1
                    )
                  }
                />

                <p className="font-bold text-green-600 mt-2">
                  ₹{price * item.quantity}
                </p>
              </div>

              <button
                onClick={() => removeItem(item.product.id)}
                className="text-red-600 font-semibold"
              >
                Remove
              </button>
            </div>
          );
        })}
      </div>

      {/* PAYMENT TYPE */}
      <div className="mt-6 space-y-2">
        <h3 className="font-semibold">Payment Method</h3>

        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="payment"
            checked={paymentType === "COD"}
            onChange={() => setPaymentType("COD")}
          />
          Cash on Delivery
        </label>

        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="payment"
            checked={paymentType === "ONLINE"}
            onChange={() => setPaymentType("ONLINE")}
          />
          Online Payment
        </label>
      </div>

      {/* TOTAL + CHECKOUT */}
      <div className="mt-6 border-t pt-4 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Total</h2>
          <h2 className="text-xl font-bold text-green-600">
            ₹{total}
          </h2>
        </div>

        <button
          onClick={checkout}
          disabled={checkoutLoading}
          className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-900 disabled:opacity-50"
        >
          {checkoutLoading ? "Placing Order..." : "Proceed to Checkout"}
        </button>
      </div>
    </div>
  );
}
