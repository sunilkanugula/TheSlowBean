import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const ORDER_API = "http://localhost:5000/api/orders";

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
  orderStatus: string;
  createdAt: string;
  items: OrderItem[];
};

export default function MyOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  /* ================= FETCH ORDERS ================= */
  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    axios
      .get(`${ORDER_API}/my`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setOrders(res.data || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  /* ================= STATES ================= */
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6 text-gray-700">
        Loading orders...
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          My Orders
        </h1>
        <p className="text-gray-600">
          You have not placed any orders yet.
        </p>
      </div>
    );
  }

  /* ================= UI ================= */
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">
        My Orders
      </h1>

      {orders.map((order) => {
        const totalItems = order.items.reduce(
          (sum, i) => sum + i.quantity,
          0
        );

        return (
          <div
            key={order.id}
            className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
          >
            {/* ================= HEADER ================= */}
            <div
              className="flex items-center justify-between px-6 py-4 cursor-pointer"
              onClick={() => navigate(`/orders/${order.id}`)}
            >
              <div>
                <p className="font-semibold text-gray-900">
                  Order #{order.id}
                </p>
                <p className="text-xs text-gray-500">
                  Placed on{" "}
                  {new Date(order.createdAt).toLocaleDateString()}
                </p>
              </div>

              <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-900 text-white">
                {order.orderStatus}
              </span>
            </div>

            {/* ================= META ================= */}
            <div className="flex gap-8 px-6 py-3 text-sm border-t border-b border-gray-100 text-gray-700">
              <div>
                <span className="font-medium text-gray-900">
                  Items:
                </span>{" "}
                {totalItems}
              </div>
              <div>
                <span className="font-medium text-gray-900">
                  Payment:
                </span>{" "}
                Online
              </div>
              <div>
                <span className="font-medium text-gray-900">
                  Order Value:
                </span>{" "}
                ₹{order.totalAmount}
              </div>
            </div>

            {/* ================= ITEMS ================= */}
            <div className="px-6 py-4 space-y-4">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4"
                >
                  {/* IMAGE */}
                  <img
                    src={item.product.images[0]}
                    className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                  />

                  {/* DETAILS */}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {item.product.title}
                    </p>
                    <p className="text-xs text-gray-600">
                      Qty: {item.quantity} × ₹{item.price}
                    </p>
                  </div>

                  {/* PRICE */}
                  <div className="text-sm font-semibold text-gray-900">
                    ₹{item.quantity * item.price}
                  </div>
                </div>
              ))}
            </div>

            {/* ================= TOTAL ================= */}
            <div className="flex justify-end px-6 py-4 border-t border-gray-200 text-lg font-semibold text-gray-900">
              Total ₹{order.totalAmount}
            </div>

            {/* ================= ACTION ================= */}
            <div className="px-6 py-4 bg-gray-50">
              {/* RETURN BUTTON */}
              {order.orderStatus === "DELIVERED" && (
                <button
                  onClick={async (e) => {
                    e.stopPropagation();

                    try {
                      await axios.post(
                        `${ORDER_API}/${order.id}/return`,
                        {},
                        {
                          headers: {
                            Authorization: `Bearer ${token}`,
                          },
                        }
                      );

                      // ✅ UPDATE UI
                      setOrders((prev) =>
                        prev.map((o) =>
                          o.id === order.id
                            ? {
                                ...o,
                                orderStatus: "RETURN_REQUESTED",
                              }
                            : o
                        )
                      );
                    } catch (err: any) {
                      alert(
                        err?.response?.data?.message ||
                          "Failed to request return"
                      );
                    }
                  }}
                  className="px-4 py-2 text-sm font-medium border border-gray-900 text-gray-900 rounded-lg hover:bg-gray-900 hover:text-white transition"
                >
                  Request Return
                </button>
              )}

              {/* RETURN STATES */}
              {order.orderStatus === "RETURN_REQUESTED" && (
                <p className="text-sm font-medium text-gray-700">
                  Return requested
                </p>
              )}

              {order.orderStatus === "RETURNED" && (
                <p className="text-sm font-semibold text-gray-900">
                  Order returned
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
