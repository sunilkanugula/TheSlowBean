import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const ORDER_API = "http://localhost:5000/api/orders";

type OrderItem = {
  id: number;
  quantity: number;
  price: number;
  product: {
    id: number;
    title: string;
    images: string[];
  };
};

type Order = {
  id: number;
  totalAmount: number;
  paymentType: "ONLINE";
  paymentCompleted: boolean;
  createdAt: string;
  items: OrderItem[];
};

export default function MyOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  /* ---------- AUTH CHECK ---------- */
  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    axios
      .get(`${ORDER_API}/my`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => setOrders(res.data || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  /* ---------- UI STATES ---------- */
  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <p>Loading orders...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">My Orders</h1>
        <p className="text-gray-500">
          You have not placed any orders yet.
        </p>
      </div>
    );
  }

  /* ---------- MAIN UI ---------- */
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">My Orders</h1>

      {orders.map((order) => (
        <div
          key={order.id}
          onClick={() => navigate(`/orders/${order.id}`)}
          className="border rounded-lg p-4 space-y-4 cursor-pointer hover:shadow transition"
        >
          {/* ORDER HEADER */}
          <div className="flex flex-wrap justify-between gap-4">
            <div>
              <p className="font-semibold">
                Order #{order.id}
              </p>
              <p className="text-sm text-gray-500">
                {new Date(order.createdAt).toLocaleString()}
              </p>
            </div>

            <div className="text-right">
              <p className="font-bold text-green-600">
                ₹{order.totalAmount}
              </p>
              <p className="text-sm">
                Payment:{" "}
                <span className="font-semibold">ONLINE</span>
              </p>
              <p className="text-sm">
                Status:{" "}
                <span className="text-green-600 font-semibold">
                  Paid
                </span>
              </p>
            </div>
          </div>

          {/* ORDER ITEMS (PREVIEW) */}
          <div className="flex flex-wrap gap-4">
            {order.items.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="flex gap-3 items-center border rounded p-2"
              >
                <img
                  src={item.product.images[0]}
                  className="w-14 h-14 object-cover rounded"
                />
                <div>
                  <p className="text-sm font-semibold">
                    {item.product.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    Qty: {item.quantity}
                  </p>
                </div>
              </div>
            ))}

            {order.items.length > 3 && (
              <div className="text-sm text-gray-500 flex items-center">
                +{order.items.length - 3} more items
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
