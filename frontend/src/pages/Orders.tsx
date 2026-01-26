import { useEffect, useState } from "react";
import axios from "axios";

const ORDER_API = "http://localhost:5000/api/orders/my";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    axios
      .get(ORDER_API, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setOrders(res.data));
  }, []);

  if (orders.length === 0) {
    return <p className="p-6">No orders yet.</p>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">My Orders</h1>

      {orders.map((order: any) => (
        <div
          key={order.id}
          className="border rounded p-4 mb-4"
        >
          <p className="font-semibold">
            Order #{order.id}
          </p>
          <p>Status: {order.status}</p>
          <p>Total: ₹{order.totalAmount}</p>
        </div>
      ))}
    </div>
  );
}
