import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { X } from "lucide-react";

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

const STATUS_LABEL: Record<string, string> = {
  CREATED: "Order Placed",
  CONFIRMED: "Confirmed",
  PICKED_UP: "Picked Up",
  IN_TRANSIT: "In Transit",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  FAILED: "Cancelled",
  RETURN_REQUESTED: "Return Requested",
  RETURNED: "Returned",
};

const statusClasses: Record<string, string> = {
  CREATED: "bg-blue-50 text-blue-600",
  CONFIRMED: "bg-[#edf2ee] text-[#287a55]",
  PICKED_UP: "bg-[#edf2ee] text-[#287a55]",
  IN_TRANSIT: "bg-amber-50 text-amber-600",
  OUT_FOR_DELIVERY: "bg-amber-50 text-amber-700",
  DELIVERED: "bg-[#edf2ee] text-[#287a55]",
  FAILED: "bg-red-50 text-red-500",
  RETURN_REQUESTED: "bg-orange-50 text-orange-600",
  RETURNED: "bg-[#edf2ee] text-[#5f6568]",
};

export default function MyOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [returnModal, setReturnModal] = useState<{ orderId: number } | null>(null);
  const [returnReason, setReturnReason] = useState("");
  const [submittingReturn, setSubmittingReturn] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }
    api.get(`${ORDER_API}/my`).then((res) => setOrders(res.data || [])).catch(() => setOrders([])).finally(() => setLoading(false));
  }, [navigate]);

  const submitReturn = async () => {
    if (!returnModal) return;
    if (!returnReason.trim() || returnReason.trim().length < 5) {
      toast.error("Please enter a return reason (at least 5 characters)");
      return;
    }
    try {
      setSubmittingReturn(true);
      await api.post(`${ORDER_API}/${returnModal.orderId}/return`, { reason: returnReason.trim() });
      setOrders((prev) => prev.map((o) => o.id === returnModal.orderId ? { ...o, deliveryStatus: "RETURN_REQUESTED" } : o));
      toast.success("Return request submitted successfully");
      setReturnModal(null);
      setReturnReason("");
    } catch (err) {
      if (axios.isAxiosError(err)) { toast.error(err.response?.data?.message || "Failed to request return"); return; }
      toast.error("Failed to request return");
    } finally {
      setSubmittingReturn(false);
    }
  };

  if (loading) return <div className="premium-page"><div className="premium-shell text-[#8b9290]">Loading orders...</div></div>;

  if (orders.length === 0) {
    return (
      <div className="premium-page">
        <div className="premium-shell">
          <h1 className="text-3xl font-semibold text-[#202326]">My Orders</h1>
          <p className="mt-2 text-[#8b9290]">You have not placed any orders yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="premium-page">
      {/* Return Modal */}
      {returnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-[#d9dfd8] bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#202326]">Request Return</h3>
              <button
                type="button"
                aria-label="Close return modal"
                onClick={() => { setReturnModal(null); setReturnReason(""); }}
                className="rounded-full p-1 transition hover:bg-[#edf2ee]"
              >
                <X size={18} />
              </button>
            </div>
            <p className="mt-2 text-sm text-[#5f6568]">Please describe why you'd like to return this order. Our team will review your request.</p>
            <textarea
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              placeholder="e.g. Product damaged, wrong item received..."
              rows={4}
              className="mt-4 w-full rounded-lg border border-[#d9dfd8] bg-[#f6f7f4] px-4 py-3 text-sm text-[#202326] outline-none ring-[#287a55] transition focus:ring"
            />
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => { setReturnModal(null); setReturnReason(""); }}
                className="flex-1 rounded-lg border border-[#d9dfd8] py-2.5 text-sm font-medium text-[#5f6568] transition hover:bg-[#f6f7f4]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitReturn}
                disabled={submittingReturn}
                className="flex-1 rounded-lg bg-[#287a55] py-2.5 text-sm font-semibold text-white transition hover:bg-[#319164] disabled:opacity-50"
              >
                {submittingReturn ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="premium-shell max-w-6xl">
        <div className="mb-6 rounded-lg border border-[#d9dfd8] bg-gradient-to-r from-[#202326] to-[#8b9290] p-6 text-white">
          <p className="text-xs uppercase tracking-[0.34em] text-[#d9dfd8]">Customer Center</p>
          <h1 className="mt-2 text-3xl font-semibold">My Orders</h1>
        </div>

        <div className="space-y-5">
          {orders.map((order) => {
            const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
            return (
              <article key={order.id} className="overflow-hidden rounded-lg border border-[#d9dfd8] bg-white shadow-[0_22px_55px_-35px_rgba(18,53,44,0.48)]">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e4ece6] bg-[#edf2ee] px-6 py-4">
                  <button type="button" onClick={() => navigate(`/orders/${order.id}`)} className="text-left">
                    <p className="text-lg font-semibold text-[#202326]">Order #{order.id}</p>
                    <p className="text-xs text-[#8b9290]">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
                  </button>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[order.deliveryStatus] || "bg-[#edf2ee] text-[#5f6568]"}`}>
                    {STATUS_LABEL[order.deliveryStatus] || order.deliveryStatus}
                  </span>
                </div>

                <div className="grid gap-3 border-b border-[#d9dfd8] px-6 py-3 text-sm text-[#365c50] md:grid-cols-3">
                  <p>Items: <strong>{totalItems}</strong></p>
                  <p>Payment: <strong>Online</strong></p>
                  <p>Order Value: <strong>Rs {order.totalAmount}</strong></p>
                </div>

                <div className="space-y-3 px-6 py-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 rounded-lg border border-[#d9dfd8] p-3">
                      <img src={item.product.images[0]} className="h-16 w-16 rounded-lg border border-[#d9dfd8] object-cover" alt={item.product.title} />
                      <div className="flex-1">
                        <p className="font-medium text-[#202326]">{item.product.title}</p>
                        <p className="text-xs text-[#8b9290]">Qty: {item.quantity} × Rs {item.price}</p>
                      </div>
                      <p className="shrink-0 text-sm font-semibold text-[#202326]">Rs {item.quantity * item.price}</p>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-3 border-t border-[#d9dfd8] bg-[#f6f7f4] px-4 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-6">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => navigate(`/orders/${order.id}/tracking`)}
                      className="rounded-lg border border-[#202326] px-4 py-2 text-sm font-semibold text-[#202326] transition hover:bg-[#5f6568] hover:text-white"
                    >
                      Track Order
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(`/orders/${order.id}`)}
                      className="rounded-lg border border-[#d9dfd8] px-4 py-2 text-sm font-medium text-[#5f6568] transition hover:bg-white"
                    >
                      View Details
                    </button>
                    {order.deliveryStatus === "DELIVERED" && (
                      <button
                        type="button"
                        onClick={() => setReturnModal({ orderId: order.id })}
                        className="rounded-lg border border-orange-300 px-4 py-2 text-sm font-semibold text-orange-600 transition hover:bg-orange-50"
                      >
                        Request Return
                      </button>
                    )}
                  </div>
                  <p className="text-lg font-semibold text-[#202326]">Total Rs {order.totalAmount}</p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
