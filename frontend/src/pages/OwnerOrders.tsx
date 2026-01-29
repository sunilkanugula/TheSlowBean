import { useEffect, useMemo, useState } from "react";
import axios from "axios";

const ADMIN_API = "http://localhost:5000/api/admin";
const PAGE_SIZE = 20;

/* ================= STATUS COLORS ================= */
const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-green-50 text-green-700 border border-green-200",
  SHIPPED: "bg-green-100 text-green-800 border border-green-300",
  DELIVERED: "bg-green-200 text-green-900 border border-green-400",

  RETURN_REQUESTED: "bg-yellow-50 text-yellow-800 border border-yellow-300",
  RETURN_APPROVED: "bg-blue-50 text-blue-800 border border-blue-300",
  RETURN_REJECTED: "bg-red-50 text-red-700 border border-red-300",
  RETURNED: "bg-gray-100 text-gray-800 border border-gray-300",
};

/* ================= ALL STATUSES (FILTER) ================= */
const ALL_STATUSES = [
  "PENDING",
  "SHIPPED",
  "DELIVERED",
  "RETURN_REQUESTED",
  "RETURN_APPROVED",
  "RETURN_REJECTED",
  "RETURNED",
];

/* ================= STATUS FLOW (KEY LOGIC) ================= */
const getAllowedNextStatuses = (current: string): string[] => {
  switch (current) {
    case "PENDING":
      return ["SHIPPED"];

    case "SHIPPED":
      return ["DELIVERED"];

    case "RETURN_REQUESTED":
      return ["RETURN_APPROVED", "RETURN_REJECTED"];

    case "RETURN_APPROVED":
      return ["RETURNED"];

    default:
      return [];
  }
};

export default function OwnerOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | (typeof ALL_STATUSES)[number]
  >("ALL");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [openStatusMenu, setOpenStatusMenu] = useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [newStatus, setNewStatus] = useState<string>("");

  const token = localStorage.getItem("token");

  /* ================= FETCH ================= */
  const fetchOrders = async (page = 1) => {
    const res = await axios.get(
      `${ADMIN_API}/orders?page=${page}&limit=${PAGE_SIZE}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setOrders(res.data.orders);
    setCurrentPage(res.data.currentPage);
    setTotalPages(res.data.totalPages);
  };

  /* ================= UPDATE STATUS ================= */
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

  useEffect(() => {
    fetchOrders(1);
  }, []);

  const filteredOrders = useMemo(() => {
    if (statusFilter === "ALL") return orders;
    return orders.filter((o) => o.orderStatus === statusFilter);
  }, [orders, statusFilter]);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-semibold text-green-800">
        Orders (Admin)
      </h1>

      {/* ================= FILTER ================= */}
      <div className="flex flex-wrap gap-2">
        {(["ALL", ...ALL_STATUSES] as const).map((s) => (
          <button
            key={s}
            onClick={() => {
              setStatusFilter(s);
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-full text-sm border transition ${
              statusFilter === s
                ? "bg-green-600 text-white border-green-600"
                : "bg-white text-green-700 border-green-300 hover:bg-green-50"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* ================= ORDERS ================= */}
      {filteredOrders.map((order) => {
        const a = order.address || {};
        const nextStatuses = getAllowedNextStatuses(order.orderStatus);

        return (
          <div
            key={order.id}
            className="bg-white rounded-2xl border border-green-100 shadow-sm p-6 space-y-6"
          >
            {/* HEADER */}
            <div className="flex justify-between items-start gap-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-6">
                  <p className="text-lg font-semibold text-green-900">
                    Order #{order.id}
                  </p>

                  <div className="flex items-center gap-1">
                    <span className="text-xs text-green-600">
                      Name:
                    </span>
                    <span className="text-sm font-medium text-green-900">
                      {order.user.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-xs text-green-600">
                      Email:
                    </span>
                    <span className="text-xs text-green-700">
                      {order.user.email}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-green-600">
                  {new Date(order.createdAt).toLocaleString()}
                </p>
              </div>

              {/* STATUS */}
              <div className="relative">
                <button
                  onClick={() =>
                    nextStatuses.length
                      ? setOpenStatusMenu(
                          openStatusMenu === order.id
                            ? null
                            : order.id
                        )
                      : null
                  }
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    STATUS_COLORS[order.orderStatus]
                  } ${nextStatuses.length ? "cursor-pointer" : "cursor-default"}`}
                >
                  {order.orderStatus}
                  {nextStatuses.length ? " ▼" : ""}
                </button>

                {openStatusMenu === order.id && (
                  <div className="absolute right-0 mt-2 bg-white border border-green-200 rounded-lg shadow z-10">
                    {nextStatuses.map((s) => (
                      <button
                        key={s}
                        onClick={() => {
                          setSelectedOrder(order);
                          setNewStatus(s);
                          setConfirmOpen(true);
                          setOpenStatusMenu(null);
                        }}
                        className="block w-full px-4 py-2 text-sm text-green-800 hover:bg-green-50 text-left"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ADDRESS + PAYMENT */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-lg bg-green-50/40 border border-green-100 p-4 text-sm">
                <p className="text-xs uppercase text-green-600 mb-2">
                  Delivery Address
                </p>
                <p className="font-medium text-green-900">
                  {a.name}
                </p>
                <p className="text-xs text-green-700">
                  {a.phone}
                  {a.altPhone && ` / ${a.altPhone}`}
                </p>
                <p className="text-xs text-green-700">
                  {a.line1}, {a.city}, {a.state} - {a.pincode}
                </p>
              </div>

              <div className="rounded-lg bg-green-50/40 border border-green-100 p-4 text-sm">
                <p className="text-xs uppercase text-green-600 mb-2">
                  Payment
                </p>
                <p className="font-medium text-green-900">
                  {order.paymentStatus}
                </p>
                {order.razorpayPaymentId && (
                  <p className="text-xs text-green-700 break-all">
                    Payment ID: {order.razorpayPaymentId}
                  </p>
                )}
              </div>
            </div>

            {/* ITEMS */}
            <div className="border-t border-green-100 pt-4 space-y-4">
              {order.items.map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4"
                >
                  <img
                    src={item.product.images[0]}
                    className="w-14 h-14 rounded-lg object-cover border border-green-200"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-green-900">
                      {item.product.title}
                    </p>
                    <p className="text-xs text-green-600">
                      Qty {item.quantity}
                    </p>
                  </div>
                  <div className="text-sm font-medium text-green-800">
                    ₹{item.quantity * item.price}
                  </div>
                </div>
              ))}
            </div>

            {/* TOTAL */}
            <div className="border-t border-green-100 pt-4 text-right text-lg font-semibold text-green-800">
              Total ₹ {order.totalAmount}/-
            </div>
          </div>
        );
      })}

      {/* ================= PAGINATION ================= */}
      <div className="flex justify-center gap-4">
        <button
          disabled={currentPage === 1}
          onClick={() => fetchOrders(currentPage - 1)}
          className="px-3 py-1 border border-green-300 rounded text-green-700 disabled:opacity-40"
        >
          Prev
        </button>
        <span className="text-sm text-green-700">
          Page {currentPage} of {totalPages}
        </span>
        <button
          disabled={currentPage === totalPages}
          onClick={() => fetchOrders(currentPage + 1)}
          className="px-3 py-1 border border-green-300 rounded text-green-700 disabled:opacity-40"
        >
          Next
        </button>
      </div>

      {/* ================= CONFIRM MODAL ================= */}
      {confirmOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-green-800">
              Update Order Status
            </h2>
            <p className="text-sm text-green-700 mt-2">
              Change order #{selectedOrder.id} to{" "}
              <b>{newStatus}</b>?
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setConfirmOpen(false)}
                className="px-4 py-2 border border-green-300 rounded text-green-700"
              >
                Cancel
              </button>
              <button
                onClick={updateStatus}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
