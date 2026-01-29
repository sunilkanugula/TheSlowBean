import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const CART_API = "http://localhost:5000/api/cart";
const ORDER_API = "http://localhost:5000/api/orders";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function Checkout() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  /* 👤 CUSTOMER */
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [altPhone, setAltPhone] = useState("");

  /* 📍 ADDRESS */
  const [addressLine1, setAddressLine1] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");

  /* PIN UX */
  const [pinLoading, setPinLoading] = useState(false);
  const [pinError, setPinError] = useState("");

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  /* ================= LOAD CART ================= */
  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    axios
      .get(CART_API, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setItems(res.data.items || []));
  }, []);

  /* ================= TOTAL ================= */
  const total = items.reduce((sum, item) => {
    const price =
      item.product.discountPrice ?? item.product.price;
    return sum + price * item.quantity;
  }, 0);

  /* ================= PINCODE LOOKUP ================= */
  const fetchCityState = async (pin: string) => {
    if (pin.length !== 6) return;

    try {
      setPinLoading(true);
      setPinError("");

      const res = await axios.get(
        `https://api.postalpincode.in/pincode/${pin}`
      );

      const data = res.data?.[0];

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

  /* ================= PAY NOW ================= */
  const payNow = async () => {
    if (
      !name ||
      !phone ||
      !addressLine1 ||
      !city ||
      !state ||
      !pincode
    ) {
      alert("Please fill all required fields");
      return;
    }

    if (!/^[6-9]\d{9}$/.test(phone)) {
      alert("Enter valid primary phone number");
      return;
    }

    if (altPhone && !/^[6-9]\d{9}$/.test(altPhone)) {
      alert("Enter valid alternate phone number");
      return;
    }

    try {
      setLoading(true);

      /* 1️⃣ CREATE RAZORPAY ORDER */
      const res = await axios.post(
        `${ORDER_API}/razorpay/create`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { orderId, key } = res.data;

      /* 2️⃣ OPEN RAZORPAY */
      const razorpay = new window.Razorpay({
        key,
        amount: total * 100,
        currency: "INR",
        order_id: orderId,
        name: "TheSlowBean ☕",
        description: "Order Payment",

        prefill: {
          name,
          contact: phone,
        },

        handler: async (response: any) => {
          /* 3️⃣ VERIFY + SAVE ORDER */
          const verifyRes = await axios.post(
            `${ORDER_API}/razorpay/verify`,
            {
              ...response,
              address: {
                name,
                phone,
                altPhone,
                line1: addressLine1,
                city,
                state,
                pincode,
              },
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          navigate(`/order-success/${verifyRes.data.orderId}`);
        },

        theme: { color: "#000000" },
      });

      razorpay.open();
    } catch {
      alert("Payment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Checkout</h1>

      {/* 👤 CUSTOMER */}
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
          onChange={(e) =>
            setPhone(e.target.value.replace(/\D/g, ""))
          }
          className="border p-3 rounded"
        />

        <input
          placeholder="Alternate Phone (optional)"
          value={altPhone}
          maxLength={10}
          onChange={(e) =>
            setAltPhone(e.target.value.replace(/\D/g, ""))
          }
          className="border p-3 rounded"
        />
      </div>

      {/* 📍 ADDRESS */}
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

        <input
          placeholder="City"
          value={city}
          disabled
          className="border p-3 rounded bg-gray-100"
        />

        <input
          placeholder="State"
          value={state}
          disabled
          className="border p-3 rounded bg-gray-100"
        />
      </div>

      {pinLoading && (
        <p className="text-xs text-gray-500">
          Fetching city & state…
        </p>
      )}
      {pinError && (
        <p className="text-xs text-red-500">{pinError}</p>
      )}

      {/* 💰 TOTAL */}
      <div className="text-right text-lg font-semibold">
        Total: ₹{total}
      </div>

      {/* 💳 PAY */}
      <button
        onClick={payNow}
        disabled={loading}
        className="w-full bg-black text-white py-3 rounded-lg font-semibold disabled:opacity-50"
      >
        {loading ? "Processing Payment…" : "Pay with Razorpay"}
      </button>
    </div>
  );
}
