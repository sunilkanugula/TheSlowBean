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

const ADMIN_API = `${import.meta.env.VITE_API_URL}/api/admin`;

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
  }>;
  topProducts: Array<{
    id: number;
    title: string;
    stock: number;
    images: string[];
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
  Paid: "#287a55",
  Pending: "#7abf36",
  "Return Requested": "#5f6568",
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
    return <div className="premium-page"><div className="premium-shell">Loading advanced dashboard...</div></div>;
  }

  if (error || !overview) {
    return (
      <div className="premium-page">
        <div className="premium-shell">
        <AdminPanelNav />
        <div className="rounded-lg border border-[#d9dfd8] bg-[#edf2ee] p-5 text-[#5f6568]">
          {error || "Unable to load dashboard"}
        </div>
        </div>
      </div>
    );
  }

  const { kpis, salesTrend, lowStockProducts, topProducts, recentOrders } = overview;

  return (
    <div className="premium-page">
      <div className="premium-shell">
      <AdminPanelNav />

      <div className="relative mb-6 overflow-hidden rounded-lg bg-gradient-to-r from-[#202326] via-[#666970] to-[#5f6568] p-6 text-white md:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#7abf36]/15 blur-2xl" />
        <div className="pointer-events-none absolute -left-14 bottom-0 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
        <p className="text-xs uppercase tracking-[0.3em] text-[#edf2ee]">Admin Control Center</p>
        <h1 className="mt-2 text-2xl font-semibold text-white md:text-3xl">Advanced Commerce Command Panel</h1>
        <p className="mt-2 text-sm text-[#edf2ee] md:text-base">
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
        <div className="rounded-lg border border-[#d9dfd8] bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-semibold text-[#202326]">Revenue Trend (Last 7 Days)</h2>
          <div className="mt-4 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTrend}>
                <defs>
                  <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#287a55" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#287a55" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => currency(Number(v || 0))} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#287a55"
                  fill="url(#trendFill)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border border-[#d9dfd8] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-[#202326]">Order Health</h2>
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
                      fill={ORDER_HEALTH_COLORS[entry.name] || "#287a55"}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 rounded-lg bg-[#edf2ee] p-3 text-xs font-semibold">
            <span className="rounded-full bg-[#287a55] px-3 py-1 text-white">
              Paid: {kpis.paidOrders}
            </span>
            <span className="rounded-full bg-[#dfe7d7] px-3 py-1 text-[#202326]">
              Pending: {kpis.pendingOrders}
            </span>
            <span className="rounded-full bg-[#edf2ee] px-3 py-1 text-[#202326]">
              Return Requested: {kpis.returnRequestedOrders}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-[#d9dfd8] bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#202326]">Low Stock Alerts</h2>
            <AlertTriangle className="text-[#287a55]" size={18} />
          </div>

          {lowStockProducts.length === 0 ? (
            <p className="text-sm text-[#5f6568]">No low stock products right now.</p>
          ) : (
            <div className="space-y-3">
              {lowStockProducts.map((product) => (
                <div key={product.id} className="flex items-center gap-3 rounded-lg border border-[#d9dfd8] p-3">
                  <img
                    src={product.images[0]}
                    alt={product.title}
                    className="h-12 w-12 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[#202326]">{product.title}</p>
                    <p className="text-xs text-[#5f6568]">Stock watch</p>
                  </div>
                  <span className="rounded-full bg-[#edf2ee] px-3 py-1 text-xs font-semibold text-[#202326]">
                    {product.stock} left
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-[#d9dfd8] bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#202326]">Top Products</h2>
            <PackageSearch className="text-[#5f6568]" size={18} />
          </div>

          {topProducts.length === 0 ? (
            <p className="text-sm text-[#5f6568]">Not enough order data yet.</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((product) => (
                <div key={product.id} className="flex items-center gap-3 rounded-lg border border-[#d9dfd8] p-3">
                  <img
                    src={product.images[0]}
                    alt={product.title}
                    className="h-12 w-12 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[#202326]">{product.title}</p>
                    <p className="text-xs text-[#5f6568]">Stock: {product.stock}</p>
                  </div>
                  <span className="rounded-full bg-[#edf2ee] px-3 py-1 text-xs font-semibold text-[#202326]">
                    {product.unitsSold} sold
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-[#d9dfd8] bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#202326]">Recent Orders</h2>
          <Link
            to="/owner/orders"
            className="inline-flex items-center gap-1 text-sm font-medium text-[#5f6568] hover:text-[#202326]"
          >
            View all <ArrowUpRight size={14} />
          </Link>
        </div>

        <div className="responsive-table-wrap">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-[#d9dfd8] text-left text-xs uppercase tracking-wide text-[#5f6568]">
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
                <tr key={order.id} className="border-b border-[#edf2ee] text-[#202326]">
                  <td className="py-3 pr-3 font-medium">#{order.id}</td>
                  <td className="py-3 pr-3">{order.user.name}</td>
                  <td className="py-3 pr-3">{order.itemsCount}</td>
                  <td className="py-3 pr-3">{currency(order.totalAmount)}</td>
                  <td className="py-3 pr-3">{order.paymentStatus}</td>
                  <td className="py-3">
                    <span className="rounded-full bg-[#edf2ee] px-2.5 py-1 text-xs font-medium text-[#202326]">
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
    <div className="rounded-lg border border-[#d9dfd8] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_14px_26px_-20px_rgba(87,89,93,0.5)]">
      <div className="mb-3 inline-flex rounded-lg bg-[#edf2ee] p-2 text-[#287a55]">{icon}</div>
      <p className="text-sm text-[#5f6568]">{title}</p>
      <p className="mt-1 text-2xl font-semibold text-[#202326]">{value}</p>
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
      className="inline-flex items-center justify-between rounded-lg border border-[#d9dfd8] bg-white px-4 py-3 text-sm font-medium text-[#202326] shadow-sm transition hover:bg-[#edf2ee]"
    >
      {title}
      {icon}
    </Link>
  );
}




