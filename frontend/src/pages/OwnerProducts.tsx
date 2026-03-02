import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Plus, PencilLine, Trash2, Sparkles, Search } from "lucide-react";

import AdminPanelNav from "../components/admin/AdminPanelNav";

const API_URL = "http://localhost:5000/api/products";

type Product = {
  id: number;
  title: string;
  collection: string;
  price: number;
  discountPrice?: number;
  stock: number;
  images: string[];
};

export default function OwnerProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const fetchProducts = async () => {
    const res = await axios.get(API_URL);
    setProducts(res.data || []);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const deleteProduct = async (id: number) => {
    if (!confirm("Delete this product?")) return;

    await axios.delete(`${API_URL}/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    fetchProducts();
  };

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) =>
      [p.title, p.collection, String(p.id)].join(" ").toLowerCase().includes(q)
    );
  }, [products, query]);

  const lowStockCount = products.filter((p) => p.stock < 10).length;

  return (
    <div className="mx-auto max-w-7xl p-6">
      <AdminPanelNav />

      <section className="mb-6 rounded-3xl border border-[#d7dad7] bg-gradient-to-r from-[#57595d] via-[#666970] to-[#8d9197] p-6 text-white md:p-8">
        <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#eef2ed]">
          <Sparkles size={14} /> Catalog Manager
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-white md:text-4xl">Premium Product Operations</h1>
            <p className="mt-2 text-sm text-[#eef2ed] md:text-base">Control pricing, stock, and product content from one elevated workspace.</p>
          </div>
          <button
            onClick={() => navigate("/owner/products/add")}
            className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-[#57595d] transition hover:bg-[#f3f5f3]"
          >
            <Plus size={16} /> Add Product
          </button>
        </div>
      </section>

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Products" value={String(products.length)} />
        <StatCard label="Low Stock (<10)" value={String(lowStockCount)} />
        <StatCard label="Visible Rows" value={String(filteredProducts.length)} />
      </div>

      <div className="mb-4 rounded-2xl border border-[#d7dad7] bg-white p-3 shadow-sm">
        <label className="flex items-center gap-2 rounded-xl border border-[#d1dfd8] bg-[#f3f5f3] px-3 py-2">
          <Search size={15} className="text-[#8d9197]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, collection, ID"
            className="w-full bg-transparent text-sm text-[#57595d] outline-none"
          />
        </label>
      </div>

      <div className="space-y-3">
        {filteredProducts.map((p) => (
          <article
            key={p.id}
            className="grid grid-cols-1 items-center gap-4 rounded-2xl border border-[#d7dad7] bg-white p-4 shadow-[0_14px_30px_-24px_rgba(18,53,44,0.5)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-24px_rgba(18,53,44,0.6)] md:grid-cols-[72px_1.6fr_1fr_1fr_auto]"
          >
            <img src={p.images[0]} className="h-[72px] w-[72px] rounded-xl border border-[#d7dad7] object-cover" alt={p.title} />

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8d9197]">ID #{p.id}</p>
              <p className="mt-1 text-sm font-semibold text-[#57595d]">{p.title}</p>
            </div>

            <div>
              <p className="text-[11px] uppercase tracking-[0.12em] text-[#8d9197]">Collection</p>
              <p className="mt-1 text-sm text-[#6f7277]">{p.collection}</p>
            </div>

            <div className="flex items-center justify-between gap-4 md:block">
              <div>
                <p className="text-[11px] uppercase tracking-[0.12em] text-[#8d9197]">Price</p>
                <p className="mt-1 text-sm font-semibold text-[#57595d]">Rs {p.discountPrice ?? p.price}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${p.stock < 10 ? "bg-[#f3f5f3] text-[#6f7277]" : "bg-[#f1f3f2] text-[#69b317]"}`}>
                Stock {p.stock}
              </span>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => navigate(`/owner/products/edit/${p.id}`)}
                className="inline-flex items-center gap-1 rounded-xl border border-[#d7dad7] px-3 py-2 text-xs font-semibold text-[#6f7277] transition hover:bg-[#f3f5f3]"
              >
                <PencilLine size={14} /> Edit
              </button>
              <button
                onClick={() => deleteProduct(p.id)}
                className="inline-flex items-center gap-1 rounded-xl border border-[#d7dad7] px-3 py-2 text-xs font-semibold text-[#6f7277] transition hover:bg-[#f3f5f3]"
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </article>
        ))}

        {filteredProducts.length === 0 ? (
          <div className="rounded-2xl border border-[#d7dad7] bg-white p-8 text-center text-[#8d9197]">No products found for this search.</div>
        ) : null}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#d7dad7] bg-white p-4 shadow-sm">
      <p className="text-xs uppercase tracking-[0.12em] text-[#8d9197]">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[#57595d]">{value}</p>
    </div>
  );
}




