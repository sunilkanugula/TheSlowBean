import { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

const ADMIN_API = "http://localhost:5000/api/admin";

type DashboardStats = {
  todayOrders: number;
  todayPendingOrders: number;
  totalOrders: number;
  totalPendingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  todayRevenue: number;
  monthlyRevenue: number;
};

export default function OwnerDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [filter, setFilter] = useState<"TODAY" | "ALL">("TODAY");

  const token = localStorage.getItem("token");

  useEffect(() => {
    axios
      .get(`${ADMIN_API}/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setStats(res.data));
  }, []);

  if (!stats) {
    return <div className="p-6">Loading dashboard...</div>;
  }

  /* ---------- FILTERED VALUES ---------- */
  const orders =
    filter === "TODAY" ? stats.todayOrders : stats.totalOrders;

  const pending =
    filter === "TODAY"
      ? stats.todayPendingOrders
      : stats.totalPendingOrders;

  /* ---------- CHART DATA (PROPER) ---------- */
  const chartData = [
    {
      name: "Orders",
      Pending: pending,
      Shipped: stats.shippedOrders,
      Delivered: stats.deliveredOrders,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold">Owner Dashboard</h1>

      {/* ---------- FILTER ---------- */}
      <div className="flex gap-3">
        {["TODAY", "ALL"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`px-4 py-2 rounded ${
              filter === f
                ? "bg-black text-white"
                : "bg-gray-200"
            }`}
          >
            {f === "TODAY" ? "Today" : "All Time"}
          </button>
        ))}
      </div>

      {/* ---------- STATS ---------- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title={filter === "TODAY" ? "Today's Orders" : "Total Orders"}
          value={orders}
        />
        <StatCard
          title={
            filter === "TODAY"
              ? "Today's Pending Orders"
              : "Pending Orders (All)"
          }
          value={pending}
        />
        <StatCard
          title="Today's Revenue"
          value={`₹${stats.todayRevenue}`}
        />
        <StatCard
          title="This Month Revenue"
          value={`₹${stats.monthlyRevenue}`}
        />
      </div>

      {/* ---------- STATUS CHART ---------- */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">
          Order Status Breakdown ({filter})
        </h2>

        <ResponsiveContainer width="100%" height={320}>
          <BarChart
            data={chartData}
            barSize={50}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />

            <Bar dataKey="Pending" fill="#f59e0b" />
            <Bar dataKey="Shipped" fill="#3b82f6" />
            <Bar dataKey="Delivered" fill="#22c55e" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ---------- CARD ---------- */
function StatCard({
  title,
  value,
}: {
  title: string;
  value: number | string;
}) {
  return (
    <div className="border rounded-lg p-4 shadow-sm">
      <p className="text-gray-500 text-sm">{title}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}
