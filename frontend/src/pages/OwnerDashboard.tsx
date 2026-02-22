import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  ArrowUpRight,
  Box,
  CircleDollarSign,
  Clock3,
  PackageSearch,
  ShoppingBag,
} from "lucide-react";

import AdminPanelNav from "../components/admin/AdminPanelNav";

const ADMIN_API = "http://localhost:5000/api/admin";

type DashboardOverview = {
  kpis: {
    totalOrders: number;
    paidOrders: number;
    pendingOrders: number;
    returnRequestedOrders: number;
    totalRevenue: number;
    monthlyRevenue: number;
    averageOrderValue: number;
  };
  salesTrend: Array<{ date: string; revenue: number }>;
  lowStockProducts: Array<{
    id: number;
    title: string;
    stock: number;
    images: string[];
    category: string;
  }>;
  topProducts: Array<{
    id: number;
    title: string;
    stock: number;
    images: string[];
    category: string;
    unitsSold: number;
  }>;
  recentOrders: Array<{
    id: number;
    createdAt: string;
    deliveryStatus: string;
    paymentStatus: string;
    totalAmount: number;
    itemsCount: number;
    user: {
      id: number;
      name: string;
      email: string;
    };
  }>;
};

const currency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const ORDER_HEALTH_COLORS: Record<string, string> = {
  Paid: "#15803d",
  Pending: "#d97706",
  "Return Requested": "#b91c1c",
};

export default function OwnerDashboard() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    async function loadOverview() {
      try {
        setLoading(true);
        const res = await axios.get(`${ADMIN_API}/overview`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOverview(res.data);
      } catch {
        setError("Failed to load admin overview");
      } finally {
        setLoading(false);
      }
    }

    loadOverview();
  }, [token]);

  const statusPieData = useMemo(() => {
    if (!overview) return [];
    return [
      { name: "Paid", value: overview.kpis.paidOrders },
      { name: "Pending", value: overview.kpis.pendingOrders },
      {
        name: "Return Requested",
        value: overview.kpis.returnRequestedOrders,
      },
    ];
  }, [overview]);

  if (loading) {
    return <div className="mx-auto max-w-7xl p-6">Loading advanced dashboard...</div>;
  }

  if (error || !overview) {
    return (
      <div className="mx-auto max-w-7xl p-6">
        <AdminPanelNav />
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
          {error || "Unable to load dashboard"}
        </div>
      </div>
    );
  }

  const { kpis, salesTrend, lowStockProducts, topProducts, recentOrders } = overview;

  return (
    <div className="mx-auto max-w-7xl p-6">
      <AdminPanelNav />

      <div className="mb-6 rounded-3xl bg-gradient-to-r from-green-900 to-green-700 p-6 text-white md:p-8">
        <p className="text-xs uppercase tracking-[0.3em] text-green-100">Admin Control Center</p>
        <h1 className="mt-2 text-2xl font-semibold md:text-3xl">Advanced Commerce Command Panel</h1>
        <p className="mt-2 text-sm text-green-100 md:text-base">
          Monitor revenue, orders, stock risk, and fulfillment from one place.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Total Revenue" value={currency(kpis.totalRevenue)} icon={<CircleDollarSign size={18} />} />
        <KpiCard title="This Month" value={currency(kpis.monthlyRevenue)} icon={<ArrowUpRight size={18} />} />
        <KpiCard title="Total Orders" value={String(kpis.totalOrders)} icon={<ShoppingBag size={18} />} />
        <KpiCard title="Avg Order Value" value={currency(kpis.averageOrderValue)} icon={<Clock3 size={18} />} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-green-100 bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-semibold text-green-900">Revenue Trend (Last 7 Days)</h2>
          <div className="mt-4 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTrend}>
                <defs>
                  <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#166534" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#166534" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => currency(Number(v || 0))} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#166534"
                  fill="url(#trendFill)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl border border-green-100 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-green-900">Order Health</h2>
          <div className="mt-4 h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPieData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={84}
                  innerRadius={44}
                  paddingAngle={2}
                >
                  {statusPieData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={ORDER_HEALTH_COLORS[entry.name] || "#166534"}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 rounded-xl bg-slate-50 p-3 text-xs font-semibold">
            <span className="rounded-full bg-green-100 px-3 py-1 text-green-800">
              Paid: {kpis.paidOrders}
            </span>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-800">
              Pending: {kpis.pendingOrders}
            </span>
            <span className="rounded-full bg-red-100 px-3 py-1 text-red-800">
              Return Requested: {kpis.returnRequestedOrders}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-green-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-green-900">Low Stock Alerts</h2>
            <AlertTriangle className="text-amber-600" size={18} />
          </div>

          {lowStockProducts.length === 0 ? (
            <p className="text-sm text-green-700">No low stock products right now.</p>
          ) : (
            <div className="space-y-3">
              {lowStockProducts.map((product) => (
                <div key={product.id} className="flex items-center gap-3 rounded-xl border border-green-100 p-3">
                  <img
                    src={product.images[0]}
                    alt={product.title}
                    className="h-12 w-12 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-green-900">{product.title}</p>
                    <p className="text-xs text-green-700">{product.category}</p>
                  </div>
                  <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                    {product.stock} left
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-green-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-green-900">Top Products</h2>
            <PackageSearch className="text-green-700" size={18} />
          </div>

          {topProducts.length === 0 ? (
            <p className="text-sm text-green-700">Not enough order data yet.</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((product) => (
                <div key={product.id} className="flex items-center gap-3 rounded-xl border border-green-100 p-3">
                  <img
                    src={product.images[0]}
                    alt={product.title}
                    className="h-12 w-12 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-green-900">{product.title}</p>
                    <p className="text-xs text-green-700">Stock: {product.stock}</p>
                  </div>
                  <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-800">
                    {product.unitsSold} sold
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-green-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-green-900">Recent Orders</h2>
          <Link
            to="/owner/orders"
            className="inline-flex items-center gap-1 text-sm font-medium text-green-700 hover:text-green-900"
          >
            View all <ArrowUpRight size={14} />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-green-100 text-left text-xs uppercase tracking-wide text-green-600">
                <th className="py-2 pr-3">Order</th>
                <th className="py-2 pr-3">Customer</th>
                <th className="py-2 pr-3">Items</th>
                <th className="py-2 pr-3">Amount</th>
                <th className="py-2 pr-3">Payment</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} className="border-b border-green-50 text-green-900">
                  <td className="py-3 pr-3 font-medium">#{order.id}</td>
                  <td className="py-3 pr-3">{order.user.name}</td>
                  <td className="py-3 pr-3">{order.itemsCount}</td>
                  <td className="py-3 pr-3">{currency(order.totalAmount)}</td>
                  <td className="py-3 pr-3">{order.paymentStatus}</td>
                  <td className="py-3">
                    <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-800">
                      {order.deliveryStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <QuickAction title="Manage Orders" to="/owner/orders" icon={<ShoppingBag size={16} />} />
        <QuickAction title="Manage Products" to="/owner/products" icon={<Box size={16} />} />
        <QuickAction title="Add New Product" to="/owner/products/add" icon={<ArrowUpRight size={16} />} />
      </div>
    </div>
  );
}

function KpiCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-green-100 bg-white p-4 shadow-sm">
      <div className="mb-3 inline-flex rounded-lg bg-green-50 p-2 text-green-700">{icon}</div>
      <p className="text-sm text-green-700">{title}</p>
      <p className="mt-1 text-2xl font-semibold text-green-900">{value}</p>
    </div>
  );
}

function QuickAction({
  title,
  to,
  icon,
}: {
  title: string;
  to: string;
  icon: ReactNode;
}) {
  return (
    <Link
      to={to}
      className="inline-flex items-center justify-between rounded-2xl border border-green-100 bg-white px-4 py-3 text-sm font-medium text-green-800 shadow-sm transition hover:bg-green-50"
    >
      {title}
      {icon}
    </Link>
  );
}
