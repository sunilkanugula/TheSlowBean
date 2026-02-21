import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import ReceiptButton from "../components/admin/ReceiptButton";
import AdminPanelNav from "../components/admin/AdminPanelNav";

const ADMIN_API = "http://localhost:5000/api/admin";
const PAGE_SIZE = 20;

const STATUS_COLORS: Record<string, string> = {
  CREATED: "bg-[#edf4ef] text-[#275e4f] border-[#cadbcf]",
  CONFIRMED: "bg-[#e5f3ea] text-[#1f634f] border-[#c0ddcf]",
  PICKED_UP: "bg-[#e0f0ec] text-[#205b58] border-[#bcd8d4]",
  IN_TRANSIT: "bg-[#e2edf7] text-[#1f4f70] border-[#c5d7eb]",
  OUT_FOR_DELIVERY: "bg-[#e8eefb] text-[#2a4f87] border-[#cdd8f2]",
  DELIVERED: "bg-[#dff2e5] text-[#1f6946] border-[#badec8]",
  FAILED: "bg-[#fde8e8] text-[#8a1d1d] border-[#f2c0c0]",
  RETURN_REQUESTED: "bg-[#fcf2e1] text-[#7f5d1d] border-[#f0ddb8]",
  RETURNED: "bg-[#ececec] text-[#454545] border-[#d6d6d6]",
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

      <div className="mb-6 rounded-3xl border border-[#c5d5cc] bg-gradient-to-r from-[#12362c] to-[#1d5c4d] p-6 text-white">
        <p className="text-xs uppercase tracking-[0.34em] text-[#add3c0]">Admin Fulfillment</p>
        <h1 className="mt-2 text-3xl font-semibold">Order Operations</h1>
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
                ? "border-[#153e32] bg-[#153e32] text-white"
                : "border-[#c6d8ce] bg-white text-[#245647] hover:bg-[#edf5ef]"
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
              className="rounded-3xl border border-[#c8d8cf] bg-white p-6 shadow-[0_22px_55px_-35px_rgba(18,53,44,0.48)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xl font-semibold text-[#143b2f]">Order #{order.id}</p>
                  <p className="mt-1 text-xs text-[#5c786f]">{new Date(order.createdAt).toLocaleString()}</p>
                  <p className="mt-2 text-sm text-[#245647]">
                    {order.user.name} <span className="text-[#7a948b]">({order.user.email})</span>
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
                      STATUS_COLORS[order.deliveryStatus] || "bg-[#edf4ef] text-[#275e4f] border-[#cadbcf]"
                    } ${nextStatuses.length ? "cursor-pointer" : "cursor-default"}`}
                  >
                    {order.deliveryStatus}
                    {nextStatuses.length ? " v" : ""}
                  </button>

                  {openStatusMenu === order.id ? (
                    <div className="absolute right-0 z-20 mt-2 min-w-44 rounded-xl border border-[#d5e2da] bg-white p-1.5 shadow-xl">
                      {nextStatuses.map((status) => (
                        <button
                          key={status}
                          onClick={() => {
                            setSelectedOrder(order);
                            setNewStatus(status);
                            setConfirmOpen(true);
                            setOpenStatusMenu(null);
                          }}
                          className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-[#1f5445] hover:bg-[#eef6f0]"
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-[#e2ebe5] bg-[#f9fbfa] p-4 text-sm text-[#355d51]">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#6f8981]">Delivery Address</p>
                  <p className="mt-2 font-semibold text-[#143b2f]">{a.name}</p>
                  <p>{a.phone}{a.altPhone ? ` / ${a.altPhone}` : ""}</p>
                  <p>{a.line1}, {a.city}, {a.state} - {a.pincode}</p>
                </div>
                <div className="rounded-2xl border border-[#e2ebe5] bg-[#f9fbfa] p-4 text-sm text-[#355d51]">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#6f8981]">Payment</p>
                  <p className="mt-2 font-semibold text-[#143b2f]">{order.paymentStatus}</p>
                  {order.razorpayPaymentId ? (
                    <p className="mt-1 break-all text-xs text-[#5f7a71]">Payment ID: {order.razorpayPaymentId}</p>
                  ) : null}
                </div>
              </div>

              <div className="mt-5 space-y-3 border-t border-[#e8eeea] pt-4">
                {order.items.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-3 rounded-xl border border-[#e8eeea] p-3">
                    <img
                      src={item.product.images[0]}
                      className="h-14 w-14 rounded-lg border border-[#dbe7df] object-cover"
                      alt={item.product.title}
                    />
                    <div className="flex-1">
                      <p className="font-medium text-[#143b2f]">{item.product.title}</p>
                      <p className="text-xs text-[#5b776d]">Qty {item.quantity}</p>
                    </div>
                    <p className="text-sm font-semibold text-[#173f33]">Rs {item.quantity * item.price}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-[#e8eeea] pt-4">
                <ReceiptButton order={order} />
                <div className="flex items-center gap-3">
                  {order.deliveryStatus === "RETURN_REQUESTED" ? (
                    <>
                      <button
                        onClick={() => decideReturn(order.id, "ACCEPT")}
                        className="rounded-lg bg-[#1b6a4d] px-3 py-2 text-xs font-semibold text-white"
                      >
                        Accept Return
                      </button>
                      <button
                        onClick={() => decideReturn(order.id, "REJECT")}
                        className="rounded-lg border border-[#8a1d1d] px-3 py-2 text-xs font-semibold text-[#8a1d1d]"
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
                      className="text-xs font-semibold text-[#1f4f70] underline"
                    >
                      Track on Shiprocket
                    </a>
                  ) : null}
                  <p className="text-lg font-semibold text-[#143b2f]">Total Rs {order.totalAmount}/-</p>
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
          className="rounded-lg border border-[#bfd2c7] px-3 py-1 text-sm font-medium text-[#1e5647] disabled:opacity-40"
        >
          Prev
        </button>
        <span className="text-sm text-[#4f7066]">
          Page {currentPage} of {totalPages}
        </span>
        <button
          disabled={currentPage === totalPages}
          onClick={() => fetchOrders(currentPage + 1)}
          className="rounded-lg border border-[#bfd2c7] px-3 py-1 text-sm font-medium text-[#1e5647] disabled:opacity-40"
        >
          Next
        </button>
      </div>

      {confirmOpen && selectedOrder ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
          <div className="w-full max-w-md rounded-2xl border border-[#cad8d1] bg-white p-6">
            <h2 className="text-xl font-semibold text-[#143b2f]">Update Delivery Status</h2>
            <p className="mt-2 text-sm text-[#557167]">
              Change order #{selectedOrder.id} to <strong>{newStatus}</strong>?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setConfirmOpen(false)}
                className="rounded-lg border border-[#c7d6cd] px-4 py-2 text-sm text-[#2e5b4f]"
              >
                Cancel
              </button>
              <button
                onClick={updateStatus}
                className="rounded-lg bg-[#143b2f] px-4 py-2 text-sm font-semibold text-white"
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
