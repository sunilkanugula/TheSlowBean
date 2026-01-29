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

type Address = {
  name: string;
  phone: string;
  altPhone?: string;
  line1: string;
  city: string;
  state: string;
  pincode: string;
};


type Order = {
  id: number;
  totalAmount: number;
  paymentStatus?: string;
  orderStatus?: string;
  createdAt: string;
  address?: Address;
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

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-6 text-green-700">
        Loading order details...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        Order not found
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* PAGE TITLE */}
      <h1 className="text-2xl font-semibold text-green-800">
        Order #{order.id}
      </h1>

      {/* ORDER SUMMARY */}
      <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-5 flex flex-wrap justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm text-green-600">
            Placed on
          </p>
          <p className="font-medium text-green-900">
            {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-sm text-green-600">
            Payment
          </p>
          <p className="font-medium text-green-900">
            Paid (Online)
          </p>
        </div>

        {order.orderStatus && (
          <div className="space-y-1">
            <p className="text-sm text-green-600">
              Status
            </p>
            <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
              {order.orderStatus}
            </span>
          </div>
        )}

        <div className="space-y-1 text-right">
          <p className="text-sm text-green-600">
            Order Total
          </p>
          <p className="text-xl font-bold text-green-800">
            ₹{order.totalAmount}
          </p>
        </div>
      </div>

     {/* DELIVERY ADDRESS */}
{order.address && (
  <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-5">
    <h3 className="text-lg font-semibold text-green-800 mb-3">
      Delivery Address
    </h3>

    <div className="space-y-2 text-sm text-green-900">
      {/* NAME */}
      <p className="font-semibold text-base">
        {order.address.name}
      </p>

      {/* ADDRESS LINE */}
      <p className="leading-relaxed">
        {order.address.line1}
      </p>

      {/* CITY / STATE / PIN */}
      <p>
        {order.address.city},{" "}
        {order.address.state} -{" "}
        <span className="font-medium">
          {order.address.pincode}
        </span>
      </p>

      {/* PHONES */}
      <div className="pt-2 text-green-700 space-y-1">
        <p>
          <span className="font-medium">Phone:</span>{" "}
          {order.address.phone}
        </p>

        {order.address.altPhone && (
          <p>
            <span className="font-medium">
              Alternate Phone:
            </span>{" "}
            {order.address.altPhone}
          </p>
        )}
      </div>
    </div>
  </div>
)}

      {/* ORDER ITEMS */}
      <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-5 space-y-4">
        <h3 className="text-lg font-semibold text-green-800">
          Items in this order
        </h3>

        {order.items.map((item) => (
          <div
            key={item.id}
            className="flex gap-4 items-center border-b border-green-100 pb-4 last:border-none last:pb-0"
          >
            <img
              src={item.product.images[0]}
              className="w-20 h-20 object-cover rounded-lg border border-green-200"
            />

            <div className="flex-1">
              <p className="font-medium text-green-900">
                {item.product.title}
              </p>
              <p className="text-sm text-green-600">
                Qty: {item.quantity} × ₹{item.price}
              </p>
            </div>

            <div className="font-semibold text-green-800">
              ₹{item.quantity * item.price}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
