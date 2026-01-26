import { useEffect, useState } from "react";
import axios from "axios";

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
  status: string;
  paymentType: "ONLINE" | "COD";
  paymentCompleted: boolean;
  createdAt: string;
  items: OrderItem[];
};

export default function MyOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  /* ---------- FETCH ORDERS ---------- */
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axios.get(`${ORDER_API}/my`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setOrders(res.data || []);
      } catch {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
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
        <p className="text-gray-500">You have not placed any orders yet.</p>
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
          className="border rounded-lg p-4 space-y-4"
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
                <span className="font-semibold">
                  {order.paymentType}
                </span>
              </p>
              <p className="text-sm">
                Status:{" "}
                <span
                  className={
                    order.paymentCompleted
                      ? "text-green-600 font-semibold"
                      : "text-orange-500 font-semibold"
                  }
                >
                  {order.paymentCompleted ? "Paid" : "Pending"}
                </span>
              </p>
            </div>
          </div>

          {/* ORDER ITEMS */}
          <div className="space-y-3">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex gap-4 border rounded p-3"
              >
                <img
                  src={item.product.images[0]}
                  className="w-20 h-20 object-cover rounded"
                />

                <div className="flex-1">
                  <h3 className="font-semibold">
                    {item.product.title}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Quantity: {item.quantity}
                  </p>
                  <p className="text-sm text-gray-500">
                    Price: ₹{item.price}
                  </p>
                </div>

                <div className="font-semibold">
                  ₹{item.price * item.quantity}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
