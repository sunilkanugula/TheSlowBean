import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { ImageUp, Loader2, PencilRuler, Sparkles } from "lucide-react";

import AdminPanelNav from "../components/admin/AdminPanelNav";

const API_URL = "http://localhost:5000/api/products";

type ReplaceMap = {
  [index: number]: File;
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
    category: "",
    subCategory: "",
    price: "",
    discountPrice: "",
    stock: "",
  });

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
      .get(`${API_URL}/${id}`)
      .then((res) => {
        const p = res.data;

        setForm({
          title: p.title || "",
          description: p.description || "",
          category: p.category || "",
          subCategory: p.subCategory || "",
          price: String(p.price),
          discountPrice: p.discountPrice ? String(p.discountPrice) : "",
          stock: String(p.stock),
        });

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

    try {
      setSaving(true);
      setError("");

      const formData = new FormData();

      Object.entries(form).forEach(([key, value]) => {
        formData.append(key, value);
      });

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
        <div className="rounded-2xl border border-[#d6e3dc] bg-white p-6 text-[#2f5e50]">Loading product...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-6">
      <AdminPanelNav />

      <section className="mb-6 rounded-3xl border border-[#c5d5cc] bg-gradient-to-r from-[#12362c] via-[#194e40] to-[#1d5c4d] p-6 text-white md:p-8">
        <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#d6efe3]">
          <Sparkles size={14} /> Product Studio
        </p>
        <h1 className="mt-4 text-3xl font-semibold md:text-4xl">Edit Product Experience</h1>
        <p className="mt-2 max-w-2xl text-sm text-[#d4e8df] md:text-base">
          Refine product narrative, pricing, and image stack with controlled updates.
        </p>
      </section>

      {error ? (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-[#d5e1da] bg-white p-5 shadow-[0_22px_55px_-35px_rgba(18,53,44,0.45)] md:p-6">
          <h2 className="inline-flex items-center gap-2 text-lg font-semibold text-[#153d31]">
            <PencilRuler size={18} /> Core Details
          </h2>
          <p className="mt-1 text-sm text-[#607c73]">Update text and commerce attributes for this SKU.</p>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Title">
              <input name="title" value={form.title} onChange={handleChange} className="w-full rounded-xl border border-[#c8d9d0] bg-[#fcfefd] px-3 py-2.5 text-sm text-[#143b2f] outline-none transition focus:border-[#2b6f5c] focus:ring-2 focus:ring-[#c6dfd3]" />
            </Field>

            <Field label="Category">
              <input name="category" value={form.category} onChange={handleChange} className="w-full rounded-xl border border-[#c8d9d0] bg-[#fcfefd] px-3 py-2.5 text-sm text-[#143b2f] outline-none transition focus:border-[#2b6f5c] focus:ring-2 focus:ring-[#c6dfd3]" />
            </Field>

            <Field label="Sub Category">
              <input name="subCategory" value={form.subCategory} onChange={handleChange} className="w-full rounded-xl border border-[#c8d9d0] bg-[#fcfefd] px-3 py-2.5 text-sm text-[#143b2f] outline-none transition focus:border-[#2b6f5c] focus:ring-2 focus:ring-[#c6dfd3]" />
            </Field>

            <Field label="Price (INR)">
              <input name="price" type="number" value={form.price} onChange={handleChange} className="w-full rounded-xl border border-[#c8d9d0] bg-[#fcfefd] px-3 py-2.5 text-sm text-[#143b2f] outline-none transition focus:border-[#2b6f5c] focus:ring-2 focus:ring-[#c6dfd3]" />
            </Field>

            <Field label="Discount Price">
              <input name="discountPrice" type="number" value={form.discountPrice} onChange={handleChange} className="w-full rounded-xl border border-[#c8d9d0] bg-[#fcfefd] px-3 py-2.5 text-sm text-[#143b2f] outline-none transition focus:border-[#2b6f5c] focus:ring-2 focus:ring-[#c6dfd3]" />
            </Field>

            <Field label="Stock">
              <input name="stock" type="number" value={form.stock} onChange={handleChange} className="w-full rounded-xl border border-[#c8d9d0] bg-[#fcfefd] px-3 py-2.5 text-sm text-[#143b2f] outline-none transition focus:border-[#2b6f5c] focus:ring-2 focus:ring-[#c6dfd3]" />
            </Field>
          </div>

          <Field label="Description" className="mt-4">
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={5}
              className="w-full min-h-[130px] resize-y rounded-xl border border-[#c8d9d0] bg-[#fcfefd] px-3 py-2.5 text-sm text-[#143b2f] outline-none transition focus:border-[#2b6f5c] focus:ring-2 focus:ring-[#c6dfd3]"
            />
          </Field>
        </div>

        <div className="rounded-3xl border border-[#d5e1da] bg-white p-5 shadow-[0_22px_55px_-35px_rgba(18,53,44,0.45)] md:p-6">
          <h2 className="inline-flex items-center gap-2 text-lg font-semibold text-[#153d31]">
            <ImageUp size={18} /> Image Replacements
          </h2>
          <p className="mt-1 text-sm text-[#607c73]">Replace individual images without disturbing the rest.</p>

          <div className="mt-5 space-y-4">
            {currentImages.map((img, index) => (
              <div key={index} className="rounded-2xl border border-[#d8e4dd] bg-[#fafcfb] p-3">
                <div className="grid grid-cols-[88px_1fr] gap-3">
                  <img
                    src={replacePreviews[index] || img}
                    alt={`Image ${index + 1}`}
                    className="h-20 w-20 rounded-xl border border-[#cfddd6] object-cover"
                  />

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#5a7a6f]">Image Slot {index + 1}</p>
                    <label className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#c8d9d0] bg-white px-3 py-2 text-xs font-semibold text-[#1f5d4d] hover:bg-[#f3f8f5]">
                      <ImageUp size={14} /> Replace
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => e.target.files && handleReplaceImage(index, e.target.files[0])}
                      />
                    </label>
                    {replaceImages[index] ? (
                      <p className="mt-2 text-xs text-emerald-700">New image selected</p>
                    ) : (
                      <p className="mt-2 text-xs text-[#6f8d83]">No replacement selected</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={submit}
            disabled={saving}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#153d31] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#102f26] disabled:cursor-not-allowed disabled:opacity-60"
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
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-[#55776b]">{label}</span>
      {children}
    </label>
  );
}
