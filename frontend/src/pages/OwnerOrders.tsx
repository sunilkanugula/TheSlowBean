import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import ReceiptButton from "../components/admin/ReceiptButton";
import AdminPanelNav from "../components/admin/AdminPanelNav";

const ADMIN_API = "http://localhost:5000/api/admin";
const PAGE_SIZE = 20;

const STATUS_COLORS: Record<string, string> = {
  CREATED: "bg-[#edf2ee] text-[#5f6568] border-[#d9dfd8]",
  CONFIRMED: "bg-[#edf2ee] text-[#5f6568] border-[#d9dfd8]",
  PICKED_UP: "bg-[#edf2ee] text-[#5f6568] border-[#d9dfd8]",
  IN_TRANSIT: "bg-[#edf2ee] text-[#5f6568] border-[#d9dfd8]",
  OUT_FOR_DELIVERY: "bg-[#edf2ee] text-[#5f6568] border-[#d9dfd8]",
  DELIVERED: "bg-[#edf2ee] text-[#287a55] border-[#d9dfd8]",
  FAILED: "bg-[#edf2ee] text-[#5f6568] border-[#d9dfd8]",
  RETURN_REQUESTED: "bg-[#edf2ee] text-[#5f6568] border-[#d9dfd8]",
  RETURNED: "bg-[#edf2ee] text-[#5f6568] border-[#d9dfd8]",
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

type StatusValue = (typeof ALL_STATUSES)[number];

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
  const [statusFilter, setStatusFilter] = useState<"ALL" | StatusValue>("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [openStatusMenu, setOpenStatusMenu] = useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [newStatus, setNewStatus] = useState<string>("");

  const token = localStorage.getItem("token");

  const buildQuery = (page: number, status: "ALL" | StatusValue, from: string, to: string) => {
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
    if (status !== "ALL") params.set("status", status);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    return params.toString();
  };

  const fetchOrders = async (
    page = 1,
    status: "ALL" | StatusValue = statusFilter,
    from = dateFrom,
    to = dateTo,
  ) => {
    const res = await axios.get(`${ADMIN_API}/orders?${buildQuery(page, status, from, to)}`, {
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

  // When filters change, reset to page 1 and re-fetch
  const applyStatusFilter = (status: "ALL" | StatusValue) => {
    setStatusFilter(status);
    setCurrentPage(1);
    fetchOrders(1, status, dateFrom, dateTo);
  };

  const applyDateFilter = (from: string, to: string) => {
    setDateFrom(from);
    setDateTo(to);
    setCurrentPage(1);
    fetchOrders(1, statusFilter, from, to);
  };

  const clearFilters = () => {
    setStatusFilter("ALL");
    setDateFrom("");
    setDateTo("");
    setCurrentPage(1);
    fetchOrders(1, "ALL", "", "");
  };

  const hasActiveFilters = statusFilter !== "ALL" || dateFrom !== "" || dateTo !== "";

  const filteredOrders = useMemo(() => orders, [orders]);

  return (
    <div className="premium-page">
      <div className="premium-shell">
      <AdminPanelNav />

      <div className="mb-6 rounded-lg border border-[#d9dfd8] bg-gradient-to-r from-[#202326] via-[#666970] to-[#8b9290] p-6 text-white">
        <p className="text-xs uppercase tracking-[0.34em] text-[#d9dfd8]">Admin Fulfillment</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Order Operations</h1>
      </div>

      {/* Status pill filters */}
      <div className="mb-4 flex flex-wrap gap-2">
        {(["ALL", ...ALL_STATUSES] as const).map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => applyStatusFilter(status)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold tracking-wide transition ${
              statusFilter === status
                ? "border-[#202326] bg-[#202326] text-white"
                : "border-[#d9dfd8] bg-white text-[#5f6568] hover:bg-[#edf2ee]"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Date range + clear filters bar */}
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-lg border border-[#d9dfd8] bg-white p-3">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-[#5f6568]">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => applyDateFilter(e.target.value, dateTo)}
            className="rounded-lg border border-[#d9dfd8] bg-[#f6f7f4] px-3 py-1.5 text-xs text-[#202326] outline-none focus:ring-1 focus:ring-[#287a55]"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-[#5f6568]">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => applyDateFilter(dateFrom, e.target.value)}
            className="rounded-lg border border-[#d9dfd8] bg-[#f6f7f4] px-3 py-1.5 text-xs text-[#202326] outline-none focus:ring-1 focus:ring-[#287a55]"
          />
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-lg border border-[#d9dfd8] px-3 py-1.5 text-xs font-semibold text-[#5f6568] transition hover:border-[#287a55] hover:text-[#287a55]"
          >
            Clear Filters
          </button>
        )}
      </div>

      <div className="space-y-5">
        {filteredOrders.map((order) => {
          const a = order.address || {};
          const nextStatuses = getAllowedNextStatuses(order.deliveryStatus);
          return (
            <article
              key={order.id}
              className="rounded-lg border border-[#d9dfd8] bg-white p-4 shadow-[0_22px_55px_-35px_rgba(18,53,44,0.48)] sm:p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xl font-semibold text-[#202326]">Order #{order.id}</p>
                  <p className="mt-1 text-xs text-[#8b9290]">{new Date(order.createdAt).toLocaleString()}</p>
                  <p className="mt-2 text-sm text-[#5f6568]">
                    {order.user.name} <span className="text-[#8b9290]">({order.user.email})</span>
                  </p>
                </div>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() =>
                      nextStatuses.length
                        ? setOpenStatusMenu(openStatusMenu === order.id ? null : order.id)
                        : null
                    }
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                      STATUS_COLORS[order.deliveryStatus] || "bg-[#edf2ee] text-[#5f6568] border-[#d9dfd8]"
                    } ${nextStatuses.length ? "cursor-pointer" : "cursor-default"}`}
                  >
                    {order.deliveryStatus}
                    {nextStatuses.length ? " v" : ""}
                  </button>

                  {openStatusMenu === order.id ? (
                    <div className="absolute right-0 z-20 mt-2 min-w-44 rounded-lg border border-[#d9dfd8] bg-white p-1.5 shadow-xl">
                      {nextStatuses.map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => {
                            setSelectedOrder(order);
                            setNewStatus(status);
                            setConfirmOpen(true);
                            setOpenStatusMenu(null);
                          }}
                          className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-[#5f6568] hover:bg-[#edf2ee]"
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-[#d9dfd8] bg-[#f6f7f4] p-4 text-sm text-[#5f6568]">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#8b9290]">Delivery Address</p>
                  <p className="mt-2 font-semibold text-[#202326]">{a.name}</p>
                  <p>{a.phone}{a.altPhone ? ` / ${a.altPhone}` : ""}</p>
                  <p>{a.line1}, {a.city}, {a.state} - {a.pincode}</p>
                </div>
                <div className="rounded-lg border border-[#d9dfd8] bg-[#f6f7f4] p-4 text-sm text-[#5f6568]">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#8b9290]">Payment</p>
                  <p className="mt-2 font-semibold text-[#202326]">{order.paymentStatus}</p>
                  {order.razorpayPaymentId ? (
                    <p className="mt-1 break-all text-xs text-[#8b9290]">Payment ID: {order.razorpayPaymentId}</p>
                  ) : null}
                </div>
              </div>

              <div className="mt-5 space-y-3 border-t border-[#d9dfd8] pt-4">
                {order.items.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-3 rounded-lg border border-[#d9dfd8] p-3">
                    <img
                      src={item.product.images[0]}
                      className="h-14 w-14 rounded-lg border border-[#d9dfd8] object-cover"
                      alt={item.product.title}
                    />
                    <div className="flex-1">
                      <p className="font-medium text-[#202326]">{item.product.title}</p>
                      <p className="text-xs text-[#8b9290]">Qty {item.quantity}</p>
                    </div>
                    <p className="text-sm font-semibold text-[#202326]">Rs {item.quantity * item.price}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex flex-col gap-4 border-t border-[#d9dfd8] pt-4 lg:flex-row lg:items-center lg:justify-between">
                <ReceiptButton order={order} />
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => navigate(`/track-order?orderId=${order.id}&scope=admin`)}
                    className="rounded-lg border border-[#287a55] px-3 py-2 text-xs font-semibold text-[#5f6568] hover:bg-[#edf2ee]"
                  >
                    Track Timeline
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadShiprocketInvoice(order.id)}
                    disabled={!order.shipment}
                    className="rounded-lg border border-[#287a55] px-3 py-2 text-xs font-semibold text-[#5f6568] hover:bg-[#edf2ee] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Download Shiprocket Invoice
                  </button>
                  {order.deliveryStatus === "RETURN_REQUESTED" ? (
                    <>
                      <button
                        type="button"
                        onClick={() => decideReturn(order.id, "ACCEPT")}
                        className="rounded-lg bg-[#287a55] px-3 py-2 text-xs font-semibold text-white"
                      >
                        Accept Return
                      </button>
                      <button
                        type="button"
                        onClick={() => decideReturn(order.id, "REJECT")}
                        className="rounded-lg border border-[#d9dfd8] px-3 py-2 text-xs font-semibold text-[#5f6568]"
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
                      className="text-xs font-semibold text-[#5f6568] underline"
                    >
                      Track on Shiprocket
                    </a>
                  ) : null}
                  <p className="text-lg font-semibold text-[#202326]">Total Rs {order.totalAmount}/-</p>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-8 flex items-center justify-center gap-4">
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() => fetchOrders(currentPage - 1)}
          className="rounded-lg border border-[#d9dfd8] px-3 py-1 text-sm font-medium text-[#5f6568] disabled:opacity-40"
        >
          Prev
        </button>
        <span className="text-sm text-[#8b9290]">
          Page {currentPage} of {totalPages}
        </span>
        <button
          type="button"
          disabled={currentPage === totalPages}
          onClick={() => fetchOrders(currentPage + 1)}
          className="rounded-lg border border-[#d9dfd8] px-3 py-1 text-sm font-medium text-[#5f6568] disabled:opacity-40"
        >
          Next
        </button>
      </div>

      {confirmOpen && selectedOrder ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#202326]/45 px-4">
          <div className="w-full max-w-md rounded-lg border border-[#d9dfd8] bg-white p-6">
            <h2 className="text-xl font-semibold text-[#202326]">Update Delivery Status</h2>
            <p className="mt-2 text-sm text-[#8b9290]">
              Change order #{selectedOrder.id} to <strong>{newStatus}</strong>?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="rounded-lg border border-[#d9dfd8] px-4 py-2 text-sm text-[#5f6568]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={updateStatus}
                className="rounded-lg bg-[#202326] px-4 py-2 text-sm font-semibold text-white"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      ) : null}
      </div>
    </div>
  );
}
