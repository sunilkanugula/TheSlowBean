import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Plus, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { api } from "../services/api";
import AdminPanelNav from "../components/admin/AdminPanelNav";

type Coupon = {
  id: number;
  code: string;
  discountType: "PERCENT" | "FLAT";
  discountValue: number;
  minOrderValue: number;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
};

export default function OwnerCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"PERCENT" | "FLAT">("PERCENT");
  const [discountValue, setDiscountValue] = useState("");
  const [minOrderValue, setMinOrderValue] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => { fetchCoupons(); }, []);

  const fetchCoupons = async () => {
    try {
      const res = await api.get("/coupons");
      setCoupons(res.data);
    } catch { toast.error("Failed to load coupons"); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !discountValue) { toast.error("Code and discount value are required"); return; }
    try {
      setCreating(true);
      await api.post("/coupons", {
        code,
        discountType,
        discountValue: Number(discountValue),
        minOrderValue: minOrderValue ? Number(minOrderValue) : 0,
        maxUses: maxUses ? Number(maxUses) : undefined,
        expiresAt: expiresAt || undefined,
      });
      toast.success("Coupon created");
      setCode(""); setDiscountValue(""); setMinOrderValue(""); setMaxUses(""); setExpiresAt("");
      fetchCoupons();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create coupon");
    } finally { setCreating(false); }
  };

  const toggleCoupon = async (id: number) => {
    try {
      const res = await api.patch(`/coupons/${id}`);
      setCoupons((prev) => prev.map((c) => c.id === id ? { ...c, isActive: res.data.isActive } : c));
    } catch { toast.error("Failed to update coupon"); }
  };

  const deleteCoupon = async (id: number) => {
    if (!window.confirm("Delete this coupon?")) return;
    try {
      await api.delete(`/coupons/${id}`);
      setCoupons((prev) => prev.filter((c) => c.id !== id));
      toast.success("Coupon deleted");
    } catch { toast.error("Failed to delete coupon"); }
  };

  return (
    <div className="premium-page">
      <div className="premium-shell max-w-5xl space-y-6">
        <AdminPanelNav />

        <div className="rounded-lg border border-[#d9dfd8] bg-gradient-to-r from-[#202326] to-[#5f6568] p-6 text-white">
          <p className="text-xs uppercase tracking-[0.34em] text-[#d9dfd8]">Admin Panel</p>
          <h1 className="mt-2 text-3xl font-semibold">Manage Coupons</h1>
        </div>

        {/* Create Form */}
        <form onSubmit={handleCreate} className="rounded-lg border border-[#d9dfd8] bg-white p-5 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[#202326]">
            <Plus size={18} /> Create New Coupon
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Coupon Code *"
              className="premium-input uppercase"
            />
            <select
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value as "PERCENT" | "FLAT")}
              className="premium-input"
            >
              <option value="PERCENT">Percentage (%)</option>
              <option value="FLAT">Flat Amount (Rs)</option>
            </select>
            <input
              type="number"
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              placeholder={`Discount ${discountType === "PERCENT" ? "%" : "Rs"} *`}
              className="premium-input"
              min="0"
            />
            <input
              type="number"
              value={minOrderValue}
              onChange={(e) => setMinOrderValue(e.target.value)}
              placeholder="Min Order Value (Rs)"
              className="premium-input"
              min="0"
            />
            <input
              type="number"
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              placeholder="Max Uses (optional)"
              className="premium-input"
              min="1"
            />
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              placeholder="Expires At"
              className="premium-input"
            />
          </div>
          <button
            type="submit"
            disabled={creating}
            className="mt-4 rounded-lg bg-[#287a55] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#319164] disabled:opacity-50"
          >
            {creating ? "Creating..." : "Create Coupon"}
          </button>
        </form>

        {/* Coupons List */}
        {loading ? (
          <div className="text-[#8b9290]">Loading coupons...</div>
        ) : coupons.length === 0 ? (
          <div className="rounded-lg border border-[#d9dfd8] bg-white p-6 text-center text-[#8b9290]">
            No coupons yet.
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-[#d9dfd8] bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-[#f6f7f4] text-[11px] uppercase tracking-wider text-[#5f6568]">
                <tr>
                  <th className="px-4 py-3 text-left">Code</th>
                  <th className="px-4 py-3 text-left">Discount</th>
                  <th className="px-4 py-3 text-left">Min Order</th>
                  <th className="px-4 py-3 text-left">Uses</th>
                  <th className="px-4 py-3 text-left">Expires</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e4ece6]">
                {coupons.map((c) => (
                  <tr key={c.id} className="hover:bg-[#f6f7f4]">
                    <td className="px-4 py-3 font-semibold text-[#202326]">{c.code}</td>
                    <td className="px-4 py-3 text-[#202326]">
                      {c.discountType === "PERCENT" ? `${c.discountValue}%` : `Rs ${c.discountValue}`}
                    </td>
                    <td className="px-4 py-3 text-[#5f6568]">Rs {c.minOrderValue}</td>
                    <td className="px-4 py-3 text-[#5f6568]">
                      {c.usedCount}{c.maxUses !== null ? ` / ${c.maxUses}` : ""}
                    </td>
                    <td className="px-4 py-3 text-[#5f6568]">
                      {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          c.isActive
                            ? "bg-[#edf2ee] text-[#287a55]"
                            : "bg-red-50 text-red-500"
                        }`}
                      >
                        {c.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          aria-label={c.isActive ? "Deactivate coupon" : "Activate coupon"}
                          onClick={() => toggleCoupon(c.id)}
                          className="rounded p-1 text-[#5f6568] transition hover:bg-[#edf2ee]"
                        >
                          {c.isActive
                            ? <ToggleRight size={16} className="text-[#287a55]" />
                            : <ToggleLeft size={16} />
                          }
                        </button>
                        <button
                          type="button"
                          aria-label="Delete coupon"
                          onClick={() => deleteCoupon(c.id)}
                          className="rounded p-1 text-red-400 transition hover:bg-red-50"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
