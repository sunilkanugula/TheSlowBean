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

  // 👤 CUSTOMER INFO
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  // 📍 ADDRESS
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  /* ---------- LOAD CART ---------- */
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

  /* ---------- TOTAL ---------- */
  const total = items.reduce((sum, item) => {
    const price =
      item.product.discountPrice ?? item.product.price;
    return sum + price * item.quantity;
  }, 0);

  /* ---------- PAY WITH RAZORPAY ---------- */
  const payNow = async () => {
    if (!name || !phone || !address || !city || !pincode) {
      alert("Please fill all required details");
      return;
    }

    if (!/^[6-9]\d{9}$/.test(phone)) {
      alert("Enter valid 10-digit phone number");
      return;
    }

    try {
      setLoading(true);

      // 1️⃣ Create Razorpay order
      const res = await axios.post(
        `${ORDER_API}/razorpay/create`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { orderId, key } = res.data;

      // 2️⃣ Razorpay popup
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
          // 3️⃣ Verify payment + save address
          const verifyRes = await axios.post(
            `${ORDER_API}/razorpay/verify`,
            {
              ...response,
              address: {
                name,
                phone,
                address,
                city,
                pincode,
              },
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          navigate(`/order-success/${verifyRes.data.orderId}`);
        },
        theme: {
          color: "#000000",
        },
      });

      razorpay.open();
    } catch {
      alert("Payment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Checkout</h1>

      {/* CUSTOMER INFO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <input
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border p-2 rounded"
        />

        <input
          placeholder="Phone Number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="border p-2 rounded"
        />
      </div>

      {/* ADDRESS */}
      <textarea
        placeholder="Street Address"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        className="w-full border p-2 rounded"
      />

      <div className="flex gap-2">
        <input
          placeholder="City"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="border p-2 rounded flex-1"
        />
        <input
          placeholder="Pincode"
          value={pincode}
          onChange={(e) => setPincode(e.target.value)}
          className="border p-2 rounded flex-1"
        />
      </div>

      {/* TOTAL */}
      <p className="font-bold text-green-600 text-lg">
        Total: ₹{total}
      </p>

      {/* PAY BUTTON */}
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
