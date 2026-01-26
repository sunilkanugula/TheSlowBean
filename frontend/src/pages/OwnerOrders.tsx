import { useEffect, useMemo, useState } from "react";
import axios from "axios";

const ADMIN_API = "http://localhost:5000/api/admin";
const PAGE_SIZE = 20;

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  SHIPPED: "bg-blue-100 text-blue-800",
  DELIVERED: "bg-green-100 text-green-800",
};

export default function OwnerOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "PENDING" | "SHIPPED" | "DELIVERED"
  >("ALL");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  /* ---------- Status Change State ---------- */
  const [openStatusMenu, setOpenStatusMenu] = useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [newStatus, setNewStatus] = useState<string>("PENDING");

  const token = localStorage.getItem("token");

  /* ---------- Fetch Orders ---------- */
  const fetchOrders = async (page = 1) => {
    const res = await axios.get(
      `${ADMIN_API}/orders?page=${page}&limit=${PAGE_SIZE}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    setOrders(res.data.orders);
    setCurrentPage(res.data.currentPage);
    setTotalPages(res.data.totalPages);
  };

  /* ---------- Update Status ---------- */
  const updateStatus = async () => {
    if (!selectedOrder) return;

    await axios.put(
      `${ADMIN_API}/orders/${selectedOrder.id}/status`,
      { status: newStatus },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    setConfirmOpen(false);
    setOpenStatusMenu(null);
    setSelectedOrder(null);
    fetchOrders(currentPage);
  };

  useEffect(() => {
    fetchOrders(1);
  }, []);

  /* ---------- Filter Orders ---------- */
  const filteredOrders = useMemo(() => {
    if (statusFilter === "ALL") return orders;
    return orders.filter((o) => o.status === statusFilter);
  }, [orders, statusFilter]);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">All Orders</h1>

      {/* ================= Status Filter ================= */}
      <div className="flex gap-2 mb-6">
        {(["ALL", "PENDING", "SHIPPED", "DELIVERED"] as const).map(
          (status) => (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status);
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded border text-sm font-medium ${
                statusFilter === status
                  ? "bg-black text-white"
                  : "hover:bg-gray-50"
              }`}
            >
              {status}
            </button>
          )
        )}
      </div>

      {/* ================= Orders ================= */}
      <div className="space-y-6">
        {filteredOrders.map((order) => (
          <div
            key={order.id}
            className="border rounded-lg p-5 bg-white shadow-sm"
          >
            {/* Header */}
            <div className="flex justify-between relative">
              <div>
                <p className="text-lg font-semibold">
                  Order #{order.id}
                </p>
                <p className="text-sm text-gray-500">
                  {new Date(order.createdAt).toLocaleString()}
                </p>
                <p className="text-sm mt-1">
                  {order.user.name} • {order.user.email}
                </p>
              </div>

              {/* ===== Compact Status Pill ===== */}
              <div className="relative">
                <button
                  onClick={() =>
                    setOpenStatusMenu(
                      openStatusMenu === order.id ? null : order.id
                    )
                  }
                  className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                    STATUS_COLORS[order.status]
                  }`}
                >
                  <span>{order.status}</span>
                  <span
                    className={`text-[10px] transition-transform ${
                      openStatusMenu === order.id ? "rotate-180" : ""
                    }`}
                  >
                    ▼
                  </span>
                </button>

                {/* Mini Dropdown */}
                {openStatusMenu === order.id && (
                  <div className="absolute right-0 mt-2 bg-white border rounded shadow text-sm z-10">
                    {["PENDING", "SHIPPED", "DELIVERED"].map(
                      (status) => (
                        <button
                          key={status}
                          onClick={() => {
                            setSelectedOrder(order);
                            setNewStatus(status);
                            setConfirmOpen(true);
                          }}
                          className="block w-full text-left px-4 py-2 hover:bg-gray-50"
                        >
                          {status}
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Items */}
            <div className="mt-4 border-t pt-4 space-y-3">
              {order.items.map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4"
                >
                  <img
                    src={item.product.images[0]}
                    className="w-14 h-14 object-cover rounded"
                  />
                  <div className="flex-1">
                    <p className="font-medium">
                      {item.product.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      Product ID: #{item.productId}
                    </p>
                  </div>
                  <div className="text-sm">
                    {item.quantity} × ₹{item.price}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 border-t pt-4 text-right font-semibold">
              Total: ₹ {order.totalAmount}/-
            </div>
          </div>
        ))}
      </div>

      {/* ================= Pagination ================= */}
      <div className="flex justify-center gap-3 mt-8">
        <button
          disabled={currentPage === 1}
          onClick={() => fetchOrders(currentPage - 1)}
          className="px-3 py-1 border rounded disabled:opacity-40"
        >
          Prev
        </button>

        <span className="text-sm mt-1">
          Page {currentPage} of {totalPages}
        </span>

        <button
          disabled={currentPage === totalPages}
          onClick={() => fetchOrders(currentPage + 1)}
          className="px-3 py-1 border rounded disabled:opacity-40"
        >
          Next
        </button>
      </div>

      {/* ================= Confirmation Modal ================= */}
      {confirmOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-2">
              Confirm Status Change
            </h2>

            <p className="text-sm text-gray-600">
              Change status of{" "}
              <span className="font-medium">
                Order #{selectedOrder.id}
              </span>{" "}
              to <b>{newStatus}</b>?
            </p>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setConfirmOpen(false);
                  setSelectedOrder(null);
                }}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>

              <button
                onClick={updateStatus}
                className="px-4 py-2 bg-black text-white rounded"
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
