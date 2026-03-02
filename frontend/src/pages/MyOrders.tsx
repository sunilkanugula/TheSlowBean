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
  CREATED: "bg-[#f3f5f3] text-[#6f7277]",
  CONFIRMED: "bg-[#f3f5f3] text-[#6f7277]",
  PICKED_UP: "bg-[#f3f5f3] text-[#6f7277]",
  IN_TRANSIT: "bg-[#f3f5f3] text-[#6f7277]",
  OUT_FOR_DELIVERY: "bg-[#f3f5f3] text-[#6f7277]",
  DELIVERED: "bg-[#eef2ed] text-[#69b317]",
  FAILED: "bg-[#f3f5f3] text-[#6f7277]",
  RETURN_REQUESTED: "bg-[#f3f5f3] text-[#6f7277]",
  RETURNED: "bg-[#f3f5f3] text-[#6f7277]",
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
    return <div className="mx-auto max-w-6xl p-6 text-[#8d9197]">Loading orders...</div>;
  }

  if (orders.length === 0) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <h1 className="text-3xl font-semibold text-[#57595d]">My Orders</h1>
        <p className="mt-2 text-[#8d9197]">You have not placed any orders yet.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6 rounded-3xl border border-[#d7dad7] bg-gradient-to-r from-[#57595d] to-[#8d9197] p-6 text-white">
        <p className="text-xs uppercase tracking-[0.34em] text-[#d7dad7]">Customer Center</p>
        <h1 className="mt-2 text-3xl font-semibold">My Orders</h1>
      </div>

      <div className="space-y-5">
        {orders.map((order) => {
          const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
          return (
            <article
              key={order.id}
              className="overflow-hidden rounded-3xl border border-[#d7dad7] bg-white shadow-[0_22px_55px_-35px_rgba(18,53,44,0.48)]"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e4ece6] bg-[#f3f5f3] px-6 py-4">
                <button onClick={() => navigate(`/orders/${order.id}`)} className="text-left">
                  <p className="text-lg font-semibold text-[#57595d]">Order #{order.id}</p>
                  <p className="text-xs text-[#8d9197]">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
                </button>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    statusClasses[order.deliveryStatus] || "bg-[#f3f5f3] text-[#6f7277]"
                  }`}
                >
                  {order.deliveryStatus}
                </span>
              </div>

              <div className="grid gap-3 border-b border-[#d7dad7] px-6 py-3 text-sm text-[#365c50] md:grid-cols-3">
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
                  <div key={item.id} className="flex items-center gap-3 rounded-xl border border-[#d7dad7] p-3">
                    <img
                      src={item.product.images[0]}
                      className="h-16 w-16 rounded-lg border border-[#d7dad7] object-cover"
                      alt={item.product.title}
                    />
                    <div className="flex-1">
                      <p className="font-medium text-[#57595d]">{item.product.title}</p>
                      <p className="text-xs text-[#8d9197]">
                        Qty: {item.quantity} x Rs {item.price}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-[#57595d]">Rs {item.quantity * item.price}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#d7dad7] bg-[#f5f6f5] px-6 py-4">
                <div>
                  <button
                    onClick={() => navigate(`/orders/${order.id}/tracking`)}
                    className="mr-2 rounded-lg border border-[#57595d] px-4 py-2 text-sm font-semibold text-[#57595d] transition hover:bg-[#6f7277] hover:text-white"
                  >
                    Track Order
                  </button>
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
                      className="rounded-lg border border-[#57595d] px-4 py-2 text-sm font-semibold text-[#57595d] transition hover:bg-[#57595d] hover:text-white"
                    >
                      Request Return
                    </button>
                  ) : null}
                </div>
                <p className="text-lg font-semibold text-[#57595d]">Total Rs {order.totalAmount}</p>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}




