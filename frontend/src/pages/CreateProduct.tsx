import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import axios from "axios";
import { ImagePlus, Loader2, Sparkles, UploadCloud } from "lucide-react";

import AdminPanelNav from "../components/admin/AdminPanelNav";

const API_URL = "http://localhost:5000/api/products";
const MAX_IMAGES = 4;

export default function CreateProduct() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    discountPrice: "",
    stock: "",
    weightGrams: "",
    isBestSelling: false,
  });

  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const token = localStorage.getItem("token");

  const imagePreviews = useMemo(() => {
    return images.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));
  }, [images]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const selectedFiles = Array.from(e.target.files);

    if (selectedFiles.length > MAX_IMAGES) {
      setError(`You can upload a maximum of ${MAX_IMAGES} images`);
      e.target.value = "";
      return;
    }

    setError("");
    setImages(selectedFiles);
  };

  const submit = async () => {
    if (images.length === 0) {
      setError("Please select at least one image");
      return;
    }
    if (!form.weightGrams || Number(form.weightGrams) <= 0) {
      setError("weightGrams must be a positive number");
      return;
    }
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const formData = new FormData();

      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("price", form.price);
      formData.append("stock", form.stock);
      formData.append("weightGrams", form.weightGrams);
      formData.append("isBestSelling", String(form.isBestSelling));

      if (form.discountPrice) {
        formData.append("discountPrice", form.discountPrice);
      }

      images.forEach((img) => {
        formData.append("images", img);
      });

      await axios.post(API_URL, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setSuccess("Product created successfully");
      setForm({
        title: "",
        description: "",
        price: "",
        discountPrice: "",
        stock: "",
        weightGrams: "",
        isBestSelling: false,
      });
      setImages([]);
    } catch (err: any) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl p-6">
      <AdminPanelNav />

      <section className="mb-6 rounded-lg border border-[#d9dfd8] bg-gradient-to-r from-[#202326] via-[#666970] to-[#8b9290] p-6 text-white md:p-8">
        <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#edf2ee]">
          <Sparkles size={14} /> Product Studio
        </p>
        <h1 className="mt-4 text-3xl font-semibold text-white md:text-4xl">Create Premium Product Listing</h1>
        <p className="mt-2 max-w-2xl text-sm text-[#edf2ee] md:text-base">
          Add polished product details and image set in one flow. This panel is optimized for fast catalog publishing.
        </p>
      </section>

      {error ? (
        <div className="mb-4 rounded-lg border border-[#d9dfd8] bg-[#edf2ee] px-4 py-3 text-sm font-medium text-[#5f6568]">{error}</div>
      ) : null}

      {success ? (
        <div className="mb-4 rounded-lg border border-[#d9dfd8] bg-[#f6f7f4] px-4 py-3 text-sm font-medium text-[#287a55]">{success}</div>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-lg border border-[#d9dfd8] bg-white p-5 shadow-[0_22px_55px_-35px_rgba(18,53,44,0.45)] md:p-6">
          <h2 className="text-lg font-semibold text-[#202326]">Product Information</h2>
          <p className="mt-1 text-sm text-[#8b9290]">Enter details exactly as customers should see them.</p>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Title">
              <input name="title" placeholder="Dark Almond Bar" value={form.title} onChange={handleChange} className="w-full rounded-lg border border-[#d9dfd8] bg-[#f6f7f4] px-3 py-2.5 text-sm text-[#202326] outline-none transition focus:border-[#287a55] focus:ring-2 focus:ring-[#dfe7d7]" />
            </Field>

            <Field label="Price (INR)">
              <input name="price" type="number" placeholder="249" value={form.price} onChange={handleChange} className="w-full rounded-lg border border-[#d9dfd8] bg-[#f6f7f4] px-3 py-2.5 text-sm text-[#202326] outline-none transition focus:border-[#287a55] focus:ring-2 focus:ring-[#dfe7d7]" />
            </Field>

            <Field label="Discount Price (optional)">
              <input name="discountPrice" type="number" placeholder="199" value={form.discountPrice} onChange={handleChange} className="w-full rounded-lg border border-[#d9dfd8] bg-[#f6f7f4] px-3 py-2.5 text-sm text-[#202326] outline-none transition focus:border-[#287a55] focus:ring-2 focus:ring-[#dfe7d7]" />
            </Field>

            <Field label="Stock">
              <input name="stock" type="number" placeholder="150" value={form.stock} onChange={handleChange} className="w-full rounded-lg border border-[#d9dfd8] bg-[#f6f7f4] px-3 py-2.5 text-sm text-[#202326] outline-none transition focus:border-[#287a55] focus:ring-2 focus:ring-[#dfe7d7]" />
            </Field>

            <Field label="Weight (grams)">
              <input
                name="weightGrams"
                type="number"
                min="1"
                step="1"
                placeholder="100"
                value={form.weightGrams}
                onChange={handleChange}
                className="w-full rounded-lg border border-[#d9dfd8] bg-[#f6f7f4] px-3 py-2.5 text-sm text-[#202326] outline-none transition focus:border-[#287a55] focus:ring-2 focus:ring-[#dfe7d7]"
              />
            </Field>
          </div>

          <Field label="Description" className="mt-4">
            <textarea
              name="description"
              placeholder="Crafted from slow-roasted cocoa beans with caramelized almond crunch."
              value={form.description}
              onChange={handleChange}
              rows={5}
              className="w-full min-h-[130px] resize-y rounded-lg border border-[#d9dfd8] bg-[#f6f7f4] px-3 py-2.5 text-sm text-[#202326] outline-none transition focus:border-[#287a55] focus:ring-2 focus:ring-[#dfe7d7]"
            />
          </Field>

          <label className="mt-5 inline-flex items-center gap-3 rounded-lg border border-[#d9dfd8] bg-[#edf2ee] px-4 py-3 text-sm font-medium text-[#5f6568]">
            <input
              type="checkbox"
              checked={form.isBestSelling}
              onChange={(e) => setForm((prev) => ({ ...prev, isBestSelling: e.target.checked }))}
              className="h-4 w-4 rounded border-[#b5bab6]"
            />
            Mark as Best Selling
          </label>
        </div>

        <div className="rounded-lg border border-[#d9dfd8] bg-white p-5 shadow-[0_22px_55px_-35px_rgba(18,53,44,0.45)] md:p-6">
          <h2 className="text-lg font-semibold text-[#202326]">Image Set</h2>
          <p className="mt-1 text-sm text-[#8b9290]">Upload up to {MAX_IMAGES} images. First image will be cover.</p>

          <label className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-[#a8c3b7] bg-[#edf2ee] px-4 py-8 text-center transition hover:bg-[#edf2ee]">
            <UploadCloud size={24} className="text-[#287a55]" />
            <span className="mt-2 text-sm font-medium text-[#287a55]">Choose Product Images</span>
            <span className="mt-1 text-xs text-[#8b9290]">PNG, JPG, WEBP supported</span>
            <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
          </label>

          <div className="mt-4 rounded-lg bg-[#f3f8f5] px-3 py-2 text-xs font-medium text-[#5f6568]">
            {images.length} / {MAX_IMAGES} selected
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            {imagePreviews.map((preview, idx) => (
              <div key={`${preview.file.name}-${idx}`} className="overflow-hidden rounded-lg border border-[#d9dfd8]">
                <img src={preview.url} alt={preview.file.name} className="h-28 w-full object-cover" />
              </div>
            ))}
            {images.length === 0 ? (
              <div className="col-span-2 flex min-h-[120px] items-center justify-center rounded-lg border border-dashed border-[#d9dfd8] text-sm text-[#8b9290]">
                <ImagePlus size={16} className="mr-2" /> No images selected
              </div>
            ) : null}
          </div>

          <button
            onClick={submit}
            disabled={loading}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#202326] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#319164] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            {loading ? "Publishing Product..." : "Create Product"}
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
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-[#8b9290]">{label}</span>
      {children}
    </label>
  );
}



