import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

import { api } from "../services/api";

const ORDER_API = "/orders";

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
  deliveryStatus: string;
  createdAt: string;
  items: OrderItem[];
};

const statusClasses: Record<string, string> = {
  CREATED: "bg-[#edf4ef] text-[#275e4f]",
  CONFIRMED: "bg-[#e5f3ea] text-[#1f634f]",
  PICKED_UP: "bg-[#e0f0ec] text-[#205b58]",
  IN_TRANSIT: "bg-[#e2edf7] text-[#1f4f70]",
  OUT_FOR_DELIVERY: "bg-[#e8eefb] text-[#2a4f87]",
  DELIVERED: "bg-[#dff2e5] text-[#1f6946]",
  FAILED: "bg-[#fde8e8] text-[#8a1d1d]",
  RETURN_REQUESTED: "bg-[#fcf2e1] text-[#7f5d1d]",
  RETURNED: "bg-[#ececec] text-[#454545]",
};

export default function MyOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    api
      .get(`${ORDER_API}/my`)
      .then((res) => setOrders(res.data || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [navigate]);

  if (loading) {
    return <div className="mx-auto max-w-6xl p-6 text-[#38594f]">Loading orders...</div>;
  }

  if (orders.length === 0) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <h1 className="text-3xl font-semibold text-[#143b2f]">My Orders</h1>
        <p className="mt-2 text-[#58756c]">You have not placed any orders yet.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6 rounded-3xl border border-[#c6d7ce] bg-gradient-to-r from-[#12362c] to-[#1d5c4d] p-6 text-white">
        <p className="text-xs uppercase tracking-[0.34em] text-[#afd6c2]">Customer Center</p>
        <h1 className="mt-2 text-3xl font-semibold">My Orders</h1>
      </div>

      <div className="space-y-5">
        {orders.map((order) => {
          const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
          return (
            <article
              key={order.id}
              className="overflow-hidden rounded-3xl border border-[#c7d8ce] bg-white shadow-[0_22px_55px_-35px_rgba(18,53,44,0.48)]"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e4ece6] bg-[#f8fbf9] px-6 py-4">
                <button onClick={() => navigate(`/orders/${order.id}`)} className="text-left">
                  <p className="text-lg font-semibold text-[#153a2f]">Order #{order.id}</p>
                  <p className="text-xs text-[#58756c]">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
                </button>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    statusClasses[order.deliveryStatus] || "bg-[#edf4ef] text-[#275e4f]"
                  }`}
                >
                  {order.deliveryStatus}
                </span>
              </div>

              <div className="grid gap-3 border-b border-[#ecf2ee] px-6 py-3 text-sm text-[#365c50] md:grid-cols-3">
                <p>
                  Items: <strong>{totalItems}</strong>
                </p>
                <p>
                  Payment: <strong>Online</strong>
                </p>
                <p>
                  Order Value: <strong>Rs {order.totalAmount}</strong>
                </p>
              </div>

              <div className="space-y-3 px-6 py-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 rounded-xl border border-[#e6ede8] p-3">
                    <img
                      src={item.product.images[0]}
                      className="h-16 w-16 rounded-lg border border-[#dbe7df] object-cover"
                      alt={item.product.title}
                    />
                    <div className="flex-1">
                      <p className="font-medium text-[#143b2f]">{item.product.title}</p>
                      <p className="text-xs text-[#5a776d]">
                        Qty: {item.quantity} x Rs {item.price}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-[#173f33]">Rs {item.quantity * item.price}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#ecf2ee] bg-[#f9fbfa] px-6 py-4">
                <div>
                  {order.deliveryStatus === "DELIVERED" ? (
                    <button
                      onClick={async () => {
                        try {
                          const reason = window.prompt("Reason for return:");
                          if (!reason || reason.trim().length < 2) {
                            toast.error("Please enter a valid return reason");
                            return;
                          }
                          await api.post(`${ORDER_API}/${order.id}/return`, { reason: reason.trim() });
                          setOrders((prev) =>
                            prev.map((o) =>
                              o.id === order.id ? { ...o, deliveryStatus: "RETURN_REQUESTED" } : o
                            )
                          );
                        } catch (err: any) {
                          if (axios.isAxiosError(err)) {
                            toast.error(err.response?.data?.message || "Failed to request return");
                            return;
                          }
                          toast.error("Failed to request return");
                        }
                      }}
                      className="rounded-lg border border-[#143b2f] px-4 py-2 text-sm font-semibold text-[#143b2f] transition hover:bg-[#143b2f] hover:text-white"
                    >
                      Request Return
                    </button>
                  ) : null}
                </div>
                <p className="text-lg font-semibold text-[#143b2f]">Total Rs {order.totalAmount}</p>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
