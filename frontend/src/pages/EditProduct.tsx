import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { ImageUp, Loader2, PencilRuler, Sparkles } from "lucide-react";

import AdminPanelNav from "../components/admin/AdminPanelNav";

const API_URL = "http://localhost:5000/api/products";
const COLLECTIONS_API_URL = "http://localhost:5000/api/products/collections";

type ReplaceMap = {
  [index: number]: File;
};

type CollectionItem = {
  id: number;
  name: string;
  imageUrl: string;
};

export default function EditProduct() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    discountPrice: "",
    stock: "",
    isBestSelling: false,
  });
  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<number[]>([]);

  const [currentImages, setCurrentImages] = useState<string[]>([]);
  const [replaceImages, setReplaceImages] = useState<ReplaceMap>({});

  const replacePreviews = useMemo(() => {
    return Object.entries(replaceImages).reduce<Record<number, string>>((acc, [idx, file]) => {
      acc[Number(idx)] = URL.createObjectURL(file);
      return acc;
    }, {});
  }, [replaceImages]);

  useEffect(() => {
    if (!id) return;

    axios
      .get<CollectionItem[]>(COLLECTIONS_API_URL)
      .then((res) => setCollections(res.data || []))
      .catch(() => setCollections([]));

    axios
      .get(`${API_URL}/${id}`)
      .then((res) => {
        const p = res.data;

        setForm({
          title: p.title || "",
          description: p.description || "",
          price: String(p.price),
          discountPrice: p.discountPrice ? String(p.discountPrice) : "",
          stock: String(p.stock),
          isBestSelling: Boolean(p.isBestSelling),
        });
        setSelectedCollectionIds(Array.isArray(p.collectionIds) ? p.collectionIds : []);

        setCurrentImages(p.images || []);
      })
      .catch(() => {
        setError("Failed to load product");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleReplaceImage = (index: number, file: File) => {
    setReplaceImages((prev) => ({
      ...prev,
      [index]: file,
    }));
  };

  const submit = async () => {
    if (!token) {
      setError("Login required");
      return;
    }
    if (selectedCollectionIds.length === 0) {
      setError("Select at least one collection");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const formData = new FormData();

      Object.entries(form).forEach(([key, value]) => {
        formData.append(key, typeof value === "boolean" ? String(value) : value);
      });
      selectedCollectionIds.forEach((collectionId) =>
        formData.append("collectionIds", String(collectionId))
      );

      const indexes = Object.keys(replaceImages).map(Number);
      indexes.forEach((index) => {
        formData.append("images", replaceImages[index]);
      });

      if (indexes.length > 0) {
        formData.append("imageIndexes", JSON.stringify(indexes));
      }

      await axios.put(`${API_URL}/${id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      navigate("/owner/products");
    } catch (err: any) {
      setError(err.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl p-6">
        <AdminPanelNav />
        <div className="rounded-2xl border border-[#d7dad7] bg-white p-6 text-[#6f7277]">Loading product...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-6">
      <AdminPanelNav />

      <section className="mb-6 rounded-3xl border border-[#d7dad7] bg-gradient-to-r from-[#57595d] via-[#666970] to-[#8d9197] p-6 text-white md:p-8">
        <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#eef2ed]">
          <Sparkles size={14} /> Product Studio
        </p>
        <h1 className="mt-4 text-3xl font-semibold text-white md:text-4xl">Edit Product Experience</h1>
        <p className="mt-2 max-w-2xl text-sm text-[#eef2ed] md:text-base">
          Refine product narrative, pricing, and image stack with controlled updates.
        </p>
      </section>

      {error ? (
        <div className="mb-4 rounded-2xl border border-[#d7dad7] bg-[#f3f5f3] px-4 py-3 text-sm font-medium text-[#6f7277]">{error}</div>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-[#d7dad7] bg-white p-5 shadow-[0_22px_55px_-35px_rgba(18,53,44,0.45)] md:p-6">
          <h2 className="inline-flex items-center gap-2 text-lg font-semibold text-[#57595d]">
            <PencilRuler size={18} /> Core Details
          </h2>
          <p className="mt-1 text-sm text-[#8d9197]">Update text and commerce attributes for this SKU.</p>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Title">
              <input name="title" value={form.title} onChange={handleChange} className="w-full rounded-xl border border-[#d7dad7] bg-[#f5f6f5] px-3 py-2.5 text-sm text-[#57595d] outline-none transition focus:border-[#69b317] focus:ring-2 focus:ring-[#dfe7d7]" />
            </Field>

            <Field label="Price (INR)">
              <input name="price" type="number" value={form.price} onChange={handleChange} className="w-full rounded-xl border border-[#d7dad7] bg-[#f5f6f5] px-3 py-2.5 text-sm text-[#57595d] outline-none transition focus:border-[#69b317] focus:ring-2 focus:ring-[#dfe7d7]" />
            </Field>

            <Field label="Discount Price">
              <input name="discountPrice" type="number" value={form.discountPrice} onChange={handleChange} className="w-full rounded-xl border border-[#d7dad7] bg-[#f5f6f5] px-3 py-2.5 text-sm text-[#57595d] outline-none transition focus:border-[#69b317] focus:ring-2 focus:ring-[#dfe7d7]" />
            </Field>

            <Field label="Stock">
              <input name="stock" type="number" value={form.stock} onChange={handleChange} className="w-full rounded-xl border border-[#d7dad7] bg-[#f5f6f5] px-3 py-2.5 text-sm text-[#57595d] outline-none transition focus:border-[#69b317] focus:ring-2 focus:ring-[#dfe7d7]" />
            </Field>
          </div>

          <Field label="Description" className="mt-4">
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={5}
              className="w-full min-h-[130px] resize-y rounded-xl border border-[#d7dad7] bg-[#f5f6f5] px-3 py-2.5 text-sm text-[#57595d] outline-none transition focus:border-[#69b317] focus:ring-2 focus:ring-[#dfe7d7]"
            />
          </Field>

          <Field label="Collections" className="mt-4">
            {collections.length === 0 ? (
              <div className="rounded-xl border border-[#d7dad7] bg-[#f3f5f3] px-3 py-2 text-sm text-[#8d9197]">
                No collections found. Create from Admin {">"} Collections.
              </div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {collections.map((item) => {
                  const checked = selectedCollectionIds.includes(item.id);
                  return (
                    <label
                      key={item.id}
                      className="inline-flex items-center gap-2 rounded-xl border border-[#d7dad7] bg-[#f3f5f3] px-3 py-2 text-sm text-[#69b317]"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCollectionIds((prev) => Array.from(new Set([...prev, item.id])));
                          } else {
                            setSelectedCollectionIds((prev) => prev.filter((id) => id !== item.id));
                          }
                        }}
                        className="h-4 w-4 rounded border-[#b5bab6]"
                      />
                      {item.name}
                    </label>
                  );
                })}
              </div>
            )}
          </Field>

          <label className="mt-5 inline-flex items-center gap-3 rounded-2xl border border-[#d7dad7] bg-[#f3f5f3] px-4 py-3 text-sm font-medium text-[#6f7277]">
            <input
              type="checkbox"
              checked={form.isBestSelling}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, isBestSelling: e.target.checked }))
              }
              className="h-4 w-4 rounded border-[#b5bab6]"
            />
            Mark as Best Selling
          </label>
        </div>

        <div className="rounded-3xl border border-[#d7dad7] bg-white p-5 shadow-[0_22px_55px_-35px_rgba(18,53,44,0.45)] md:p-6">
          <h2 className="inline-flex items-center gap-2 text-lg font-semibold text-[#57595d]">
            <ImageUp size={18} /> Image Replacements
          </h2>
          <p className="mt-1 text-sm text-[#8d9197]">Replace individual images without disturbing the rest.</p>

          <div className="mt-5 space-y-4">
            {currentImages.map((img, index) => (
              <div key={index} className="rounded-2xl border border-[#d7dad7] bg-[#f5f6f5] p-3">
                <div className="grid grid-cols-[88px_1fr] gap-3">
                  <img
                    src={replacePreviews[index] || img}
                    alt={`Image ${index + 1}`}
                    className="h-20 w-20 rounded-xl border border-[#d7dad7] object-cover"
                  />

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8d9197]">Image Slot {index + 1}</p>
                    <label className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#d7dad7] bg-white px-3 py-2 text-xs font-semibold text-[#69b317] hover:bg-[#f3f8f5]">
                      <ImageUp size={14} /> Replace
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => e.target.files && handleReplaceImage(index, e.target.files[0])}
                      />
                    </label>
                    {replaceImages[index] ? (
                      <p className="mt-2 text-xs text-[#69b317]">New image selected</p>
                    ) : (
                      <p className="mt-2 text-xs text-[#8d9197]">No replacement selected</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={submit}
            disabled={saving}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#57595d] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#5aa10f] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : null}
            {saving ? "Updating Product..." : "Update Product"}
          </button>
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-[#8d9197]">{label}</span>
      {children}
    </label>
  );
}



