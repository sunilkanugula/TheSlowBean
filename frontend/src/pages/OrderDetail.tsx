import { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

const ORDER_API = "http://localhost:5000/api/orders";

type OrderItem = {
  id: number;
  quantity: number;
  price: number;
  product: {
    title: string;
    images: string[];
  };
};

type Order = {
  id: number;
  totalAmount: number;
  paymentCompleted: boolean;
  paymentType: string;
  createdAt: string;
  address?: {
    address: string;
    city: string;
    pincode: string;
  };
  items: OrderItem[];
};

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  useEffect(() => {
    axios
      .get(`${ORDER_API}/my`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const found = res.data.find(
          (o: Order) => o.id === Number(id)
        );
        setOrder(found || null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="p-6">Loading order...</p>;
  if (!order) return <p className="p-6">Order not found</p>;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">
        Order #{order.id}
      </h1>

      {/* ORDER META */}
      <div className="border rounded p-4">
        <p>
          <strong>Date:</strong>{" "}
          {new Date(order.createdAt).toLocaleString()}
        </p>
        <p>
          <strong>Payment:</strong>{" "}
          {order.paymentCompleted ? "Paid (Online)" : "Pending"}
        </p>
        <p className="font-bold text-green-600">
          Total: ₹{order.totalAmount}
        </p>
      </div>

      {/* ADDRESS */}
      {order.address && (
        <div className="border rounded p-4">
          <h3 className="font-semibold mb-2">Delivery Address</h3>
          <p>{order.address.address}</p>
          <p>
            {order.address.city} – {order.address.pincode}
          </p>
        </div>
      )}

      {/* ITEMS */}
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
  );
}
