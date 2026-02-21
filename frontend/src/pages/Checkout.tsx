import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";

import { api } from "../services/api";

const PHONE_REGEX = /^[6-9]\d{9}$/;

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function Checkout() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [altPhone, setAltPhone] = useState("");

  const [addressLine1, setAddressLine1] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");

  const [pinLoading, setPinLoading] = useState(false);
  const [pinError, setPinError] = useState("");

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const buyNowProductId = Number(searchParams.get("productId"));
    const buyNowQty = Number(searchParams.get("qty")) || 1;

    const bootstrap = async () => {
      try {
        if (buyNowProductId) {
          await api.post("/cart", {
            productId: buyNowProductId,
            quantity: Math.max(1, buyNowQty),
          });
        }

        const cartRes = await api.get("/cart");
        setItems(cartRes.data?.items || []);
      } catch {
        setItems([]);
      }
    };

    bootstrap();
  }, [navigate, searchParams]);

  const total = items.reduce((sum, item) => {
    const price = item.product.discountPrice ?? item.product.price;
    return sum + price * item.quantity;
  }, 0);

  const fetchCityState = async (pin: string) => {
    if (pin.length !== 6) return;

    try {
      setPinLoading(true);
      setPinError("");

      const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
      const json = await res.json();
      const data = json?.[0];

      if (data?.Status === "Success") {
        const po = data.PostOffice[0];
        setCity(po.District);
        setState(po.State);
      } else {
        setPinError("Invalid pincode");
        setCity("");
        setState("");
      }
    } catch {
      setPinError("Failed to fetch city/state");
    } finally {
      setPinLoading(false);
    }
  };

  const payNow = async () => {
    if (!name || !phone || !addressLine1 || !city || !state || !pincode) {
      toast.error("Please fill all required fields");
      return;
    }

    if (!PHONE_REGEX.test(phone)) {
      toast.error("Enter valid primary phone number");
      return;
    }

    if (altPhone && !PHONE_REGEX.test(altPhone)) {
      toast.error("Enter valid alternate phone number");
      return;
    }

    if (!items.length) {
      toast.error("Your cart is empty");
      return;
    }

    if (!window.Razorpay) {
      toast.error("Razorpay SDK not loaded. Please refresh and try again.");
      return;
    }

    try {
      setLoading(true);

      const createRes = await api.post("/orders/razorpay/create", {});
      const { orderId, key, amount } = createRes.data;
      const idempotencyKey = `${orderId}:${Date.now()}`;

      const razorpay = new window.Razorpay({
        key,
        amount,
        currency: "INR",
        order_id: orderId,
        name: "TheSlowBean",
        description: "Order Payment",
        prefill: { name, contact: phone },
        handler: async (response: any) => {
          try {
            const verifyRes = await api.post("/orders/razorpay/verify", {
              ...response,
              idempotencyKey,
              address: {
                name,
                phone,
                altPhone,
                line1: addressLine1,
                city,
                state,
                pincode,
              },
            });

            navigate(`/order-success/${verifyRes.data.orderId}`);
          } catch {
            toast.warning("Payment captured, but order verification failed. Please check My Orders.");
            navigate("/orders");
          }
        },
        theme: { color: "#000000" },
      });

      razorpay.open();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Checkout</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          placeholder="Full Name *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border p-3 rounded"
        />

        <input
          placeholder="Primary Phone *"
          value={phone}
          maxLength={10}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
          className="border p-3 rounded"
        />

        <input
          placeholder="Alternate Phone (optional)"
          value={altPhone}
          maxLength={10}
          onChange={(e) => setAltPhone(e.target.value.replace(/\D/g, ""))}
          className="border p-3 rounded"
        />
      </div>

      <textarea
        placeholder="House / Street / Area *"
        value={addressLine1}
        onChange={(e) => setAddressLine1(e.target.value)}
        className="border p-3 rounded w-full"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <input
          placeholder="Pincode *"
          value={pincode}
          maxLength={6}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, "");
            setPincode(val);
            if (val.length === 6) fetchCityState(val);
          }}
          className="border p-3 rounded"
        />

        <input placeholder="City" value={city} disabled className="border p-3 rounded bg-gray-100" />

        <input placeholder="State" value={state} disabled className="border p-3 rounded bg-gray-100" />
      </div>

      {pinLoading && <p className="text-xs text-gray-500">Fetching city and state...</p>}
      {pinError && <p className="text-xs text-red-500">{pinError}</p>}

      <div className="text-right text-lg font-semibold">Total: Rs {total}</div>

      <button
        onClick={payNow}
        disabled={loading}
        className="w-full bg-black text-white py-3 rounded-lg font-semibold disabled:opacity-50"
      >
        {loading ? "Processing Payment..." : "Pay with Razorpay"}
      </button>
    </div>
  );
}
