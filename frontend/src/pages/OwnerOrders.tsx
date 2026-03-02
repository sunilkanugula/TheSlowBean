import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import ReceiptButton from "../components/admin/ReceiptButton";
import AdminPanelNav from "../components/admin/AdminPanelNav";

const ADMIN_API = "http://localhost:5000/api/admin";
const PAGE_SIZE = 20;

const STATUS_COLORS: Record<string, string> = {
  CREATED: "bg-[#f3f5f3] text-[#6f7277] border-[#d7dad7]",
  CONFIRMED: "bg-[#f3f5f3] text-[#6f7277] border-[#d7dad7]",
  PICKED_UP: "bg-[#f3f5f3] text-[#6f7277] border-[#d7dad7]",
  IN_TRANSIT: "bg-[#f3f5f3] text-[#6f7277] border-[#d7dad7]",
  OUT_FOR_DELIVERY: "bg-[#f3f5f3] text-[#6f7277] border-[#d7dad7]",
  DELIVERED: "bg-[#eef2ed] text-[#69b317] border-[#d7dad7]",
  FAILED: "bg-[#f3f5f3] text-[#6f7277] border-[#d7dad7]",
  RETURN_REQUESTED: "bg-[#f3f5f3] text-[#6f7277] border-[#d7dad7]",
  RETURNED: "bg-[#f3f5f3] text-[#6f7277] border-[#d7dad7]",
};

const ALL_STATUSES = [
  "CREATED",
  "CONFIRMED",
  "PICKED_UP",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "FAILED",
  "RETURN_REQUESTED",
  "RETURNED",
] as const;

const getAllowedNextStatuses = (current: string): string[] => {
  switch (current) {
    case "CREATED":
      return ["CONFIRMED"];
    default:
      return [];
  }
};

export default function OwnerOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<"ALL" | (typeof ALL_STATUSES)[number]>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [openStatusMenu, setOpenStatusMenu] = useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [newStatus, setNewStatus] = useState<string>("");

  const token = localStorage.getItem("token");

  const fetchOrders = async (page = 1) => {
    const res = await axios.get(`${ADMIN_API}/orders?page=${page}&limit=${PAGE_SIZE}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setOrders(res.data.orders);
    setCurrentPage(res.data.currentPage);
    setTotalPages(res.data.totalPages);
  };

  const updateStatus = async () => {
    if (!selectedOrder || !newStatus) return;
    await axios.put(
      `${ADMIN_API}/orders/${selectedOrder.id}/status`,
      { status: newStatus },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setConfirmOpen(false);
    setSelectedOrder(null);
    setNewStatus("");
    fetchOrders(currentPage);
  };

  const decideReturn = async (orderId: number, decision: "ACCEPT" | "REJECT") => {
    const reason = window.prompt(
      decision === "ACCEPT" ? "Reason for accepting return:" : "Reason for rejecting return:"
    );
    if (!reason || reason.trim().length < 2) return;

    await axios.post(
      `${ADMIN_API}/orders/${orderId}/return-decision`,
      { decision, reason: reason.trim() },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    fetchOrders(currentPage);
  };

  const downloadShiprocketInvoice = async (orderId: number) => {
    try {
      const res = await axios.get(
        `${ADMIN_API}/orders/${orderId}/shiprocket-document?type=invoice`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const url = res.data?.url;
      if (!url) {
        toast.error("Shiprocket invoice URL not available");
        return;
      }

      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to download Shiprocket invoice");
    }
  };

  useEffect(() => {
    fetchOrders(1);
  }, []);

  const filteredOrders = useMemo(() => {
    if (statusFilter === "ALL") return orders;
    return orders.filter((o) => o.deliveryStatus === statusFilter);
  }, [orders, statusFilter]);

  return (
    <div className="mx-auto max-w-7xl p-6">
      <AdminPanelNav />

      <div className="mb-6 rounded-3xl border border-[#d7dad7] bg-gradient-to-r from-[#57595d] via-[#666970] to-[#8d9197] p-6 text-white">
        <p className="text-xs uppercase tracking-[0.34em] text-[#d7dad7]">Admin Fulfillment</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Order Operations</h1>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {(["ALL", ...ALL_STATUSES] as const).map((status) => (
          <button
            key={status}
            onClick={() => {
              setStatusFilter(status);
              setCurrentPage(1);
            }}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold tracking-wide transition ${
              statusFilter === status
                ? "border-[#57595d] bg-[#57595d] text-white"
                : "border-[#d7dad7] bg-white text-[#6f7277] hover:bg-[#f3f5f3]"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      <div className="space-y-5">
        {filteredOrders.map((order) => {
          const a = order.address || {};
          const nextStatuses = getAllowedNextStatuses(order.deliveryStatus);
          return (
            <article
              key={order.id}
              className="rounded-3xl border border-[#d7dad7] bg-white p-6 shadow-[0_22px_55px_-35px_rgba(18,53,44,0.48)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xl font-semibold text-[#57595d]">Order #{order.id}</p>
                  <p className="mt-1 text-xs text-[#8d9197]">{new Date(order.createdAt).toLocaleString()}</p>
                  <p className="mt-2 text-sm text-[#6f7277]">
                    {order.user.name} <span className="text-[#a5a8ad]">({order.user.email})</span>
                  </p>
                </div>

                <div className="relative">
                  <button
                    onClick={() =>
                      nextStatuses.length
                        ? setOpenStatusMenu(openStatusMenu === order.id ? null : order.id)
                        : null
                    }
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                      STATUS_COLORS[order.deliveryStatus] || "bg-[#f3f5f3] text-[#6f7277] border-[#d7dad7]"
                    } ${nextStatuses.length ? "cursor-pointer" : "cursor-default"}`}
                  >
                    {order.deliveryStatus}
                    {nextStatuses.length ? " v" : ""}
                  </button>

                  {openStatusMenu === order.id ? (
                    <div className="absolute right-0 z-20 mt-2 min-w-44 rounded-xl border border-[#d7dad7] bg-white p-1.5 shadow-xl">
                      {nextStatuses.map((status) => (
                        <button
                          key={status}
                          onClick={() => {
                            setSelectedOrder(order);
                            setNewStatus(status);
                            setConfirmOpen(true);
                            setOpenStatusMenu(null);
                          }}
                          className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-[#6f7277] hover:bg-[#f3f5f3]"
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-[#d7dad7] bg-[#f5f6f5] p-4 text-sm text-[#6f7277]">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#8d9197]">Delivery Address</p>
                  <p className="mt-2 font-semibold text-[#57595d]">{a.name}</p>
                  <p>{a.phone}{a.altPhone ? ` / ${a.altPhone}` : ""}</p>
                  <p>{a.line1}, {a.city}, {a.state} - {a.pincode}</p>
                </div>
                <div className="rounded-2xl border border-[#d7dad7] bg-[#f5f6f5] p-4 text-sm text-[#6f7277]">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#8d9197]">Payment</p>
                  <p className="mt-2 font-semibold text-[#57595d]">{order.paymentStatus}</p>
                  {order.razorpayPaymentId ? (
                    <p className="mt-1 break-all text-xs text-[#8d9197]">Payment ID: {order.razorpayPaymentId}</p>
                  ) : null}
                </div>
              </div>

              <div className="mt-5 space-y-3 border-t border-[#d7dad7] pt-4">
                {order.items.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-3 rounded-xl border border-[#d7dad7] p-3">
                    <img
                      src={item.product.images[0]}
                      className="h-14 w-14 rounded-lg border border-[#d7dad7] object-cover"
                      alt={item.product.title}
                    />
                    <div className="flex-1">
                      <p className="font-medium text-[#57595d]">{item.product.title}</p>
                      <p className="text-xs text-[#8d9197]">Qty {item.quantity}</p>
                    </div>
                    <p className="text-sm font-semibold text-[#57595d]">Rs {item.quantity * item.price}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-[#d7dad7] pt-4">
                <ReceiptButton order={order} />
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => navigate(`/track-order?orderId=${order.id}&scope=admin`)}
                    className="rounded-lg border border-[#69b317] px-3 py-2 text-xs font-semibold text-[#6f7277] hover:bg-[#f3f5f3]"
                  >
                    Track Timeline
                  </button>
                  <button
                    onClick={() => downloadShiprocketInvoice(order.id)}
                    disabled={!order.shipment}
                    className="rounded-lg border border-[#69b317] px-3 py-2 text-xs font-semibold text-[#6f7277] hover:bg-[#f3f5f3] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Download Shiprocket Invoice
                  </button>
                  {order.deliveryStatus === "RETURN_REQUESTED" ? (
                    <>
                      <button
                        onClick={() => decideReturn(order.id, "ACCEPT")}
                        className="rounded-lg bg-[#69b317] px-3 py-2 text-xs font-semibold text-white"
                      >
                        Accept Return
                      </button>
                      <button
                        onClick={() => decideReturn(order.id, "REJECT")}
                        className="rounded-lg border border-[#d7dad7] px-3 py-2 text-xs font-semibold text-[#6f7277]"
                      >
                        Reject Return
                      </button>
                    </>
                  ) : null}
                  {order.shipment?.trackingUrl ? (
                    <a
                      href={order.shipment.trackingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold text-[#6f7277] underline"
                    >
                      Track on Shiprocket
                    </a>
                  ) : null}
                  <p className="text-lg font-semibold text-[#57595d]">Total Rs {order.totalAmount}/-</p>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-8 flex items-center justify-center gap-4">
        <button
          disabled={currentPage === 1}
          onClick={() => fetchOrders(currentPage - 1)}
          className="rounded-lg border border-[#d7dad7] px-3 py-1 text-sm font-medium text-[#6f7277] disabled:opacity-40"
        >
          Prev
        </button>
        <span className="text-sm text-[#8d9197]">
          Page {currentPage} of {totalPages}
        </span>
        <button
          disabled={currentPage === totalPages}
          onClick={() => fetchOrders(currentPage + 1)}
          className="rounded-lg border border-[#d7dad7] px-3 py-1 text-sm font-medium text-[#6f7277] disabled:opacity-40"
        >
          Next
        </button>
      </div>

      {confirmOpen && selectedOrder ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#57595d]/45 px-4">
          <div className="w-full max-w-md rounded-2xl border border-[#d7dad7] bg-white p-6">
            <h2 className="text-xl font-semibold text-[#57595d]">Update Delivery Status</h2>
            <p className="mt-2 text-sm text-[#8d9197]">
              Change order #{selectedOrder.id} to <strong>{newStatus}</strong>?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setConfirmOpen(false)}
                className="rounded-lg border border-[#d7dad7] px-4 py-2 text-sm text-[#6f7277]"
              >
                Cancel
              </button>
              <button
                onClick={updateStatus}
                className="rounded-lg bg-[#57595d] px-4 py-2 text-sm font-semibold text-white"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}




