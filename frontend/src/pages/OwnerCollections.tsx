import { useEffect, useMemo, useState } from "react";
import { ImagePlus, Loader2, Sparkles } from "lucide-react";
import axios from "axios";

import AdminPanelNav from "../components/admin/AdminPanelNav";

const ADMIN_COLLECTIONS_API = "http://localhost:5000/api/admin/collections";

type CollectionItem = {
  id: number;
  name: string;
  imageUrl: string;
};

export default function OwnerCollections() {
  const token = localStorage.getItem("token");
  const [name, setName] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const previewUrl = useMemo(() => {
    if (!image) return "";
    return URL.createObjectURL(image);
  }, [image]);

  const fetchCollections = async () => {
    if (!token) return;
    try {
      const res = await axios.get<CollectionItem[]>(ADMIN_COLLECTIONS_API, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCollections(res.data || []);
    } catch {
      setCollections([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  const handleCreate = async () => {
    if (!token) {
      setError("Login required");
      return;
    }

    if (!name.trim()) {
      setError("Collection name is required");
      return;
    }

    if (!image) {
      setError("Collection image is required");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("image", image);

      await axios.post(ADMIN_COLLECTIONS_API, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setName("");
      setImage(null);
      setSuccess("Collection created");
      await fetchCollections();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create collection");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!token) {
      setError("Login required");
      return;
    }

    if (!confirm("Delete this collection?")) return;

    try {
      setError("");
      setSuccess("");
      await axios.delete(`${ADMIN_COLLECTIONS_API}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess("Collection deleted");
      await fetchCollections();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete collection");
    }
  };

  return (
    <div className="mx-auto max-w-7xl p-6">
      <AdminPanelNav />

      <section className="mb-6 rounded-3xl border border-[#d7dad7] bg-gradient-to-r from-[#57595d] via-[#666970] to-[#8d9197] p-6 text-white md:p-8">
        <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#eef2ed]">
          <Sparkles size={14} /> Collection Studio
        </p>
        <h1 className="mt-4 text-3xl font-semibold text-white md:text-4xl">Manage Collections</h1>
        <p className="mt-2 max-w-2xl text-sm text-[#eef2ed] md:text-base">
          Create collection names with hero images and use them while publishing products.
        </p>
      </section>

      {error ? (
        <div className="mb-4 rounded-2xl border border-[#d7dad7] bg-[#f3f5f3] px-4 py-3 text-sm font-medium text-[#6f7277]">{error}</div>
      ) : null}
      {success ? (
        <div className="mb-4 rounded-2xl border border-[#d7dad7] bg-[#f1f3f2] px-4 py-3 text-sm font-medium text-[#69b317]">{success}</div>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-3xl border border-[#d7dad7] bg-white p-5 shadow-[0_22px_55px_-35px_rgba(18,53,44,0.45)] md:p-6">
          <h2 className="text-lg font-semibold text-[#57595d]">Create Collection</h2>
          <p className="mt-1 text-sm text-[#8d9197]">Add a unique collection card image and title.</p>

          <label className="mt-5 block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-[#8d9197]">Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Dark Chocolates"
              className="w-full rounded-xl border border-[#d7dad7] bg-[#f5f6f5] px-3 py-2.5 text-sm text-[#57595d] outline-none transition focus:border-[#69b317] focus:ring-2 focus:ring-[#dfe7d7]"
            />
          </label>

          <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[#a8c3b7] bg-[#f3f5f3] px-4 py-8 text-center transition hover:bg-[#f3f5f3]">
            <ImagePlus size={24} className="text-[#69b317]" />
            <span className="mt-2 text-sm font-medium text-[#69b317]">
              {image ? image.name : "Choose Collection Image"}
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files?.[0] || null)}
              className="hidden"
            />
          </label>

          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Collection preview"
              className="mt-4 h-44 w-full rounded-2xl border border-[#d7dad7] object-cover"
            />
          ) : null}

          <button
            onClick={handleCreate}
            disabled={saving}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#57595d] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#5aa10f] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : null}
            {saving ? "Creating..." : "Create Collection"}
          </button>
        </div>

        <div className="rounded-3xl border border-[#d7dad7] bg-white p-5 shadow-[0_22px_55px_-35px_rgba(18,53,44,0.45)] md:p-6">
          <h2 className="text-lg font-semibold text-[#57595d]">Existing Collections</h2>
          <p className="mt-1 text-sm text-[#8d9197]">These appear on the homepage and product forms.</p>

          {loading ? (
            <div className="mt-6 text-sm text-[#8d9197]">Loading collections...</div>
          ) : collections.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-[#d7dad7] bg-[#f3f5f3] p-5 text-sm text-[#8d9197]">
              No collections yet.
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
              {collections.map((collection) => (
                <article
                  key={collection.id}
                  className="overflow-hidden rounded-2xl border border-[#d7dad7] bg-[#f9fcfa]"
                >
                  <img
                    src={collection.imageUrl}
                    alt={collection.name}
                    className="h-28 w-full object-cover"
                  />
                  <p className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#69b317]">
                    {collection.name}
                  </p>
                  <div className="px-3 pb-3">
                    <button
                      onClick={() => handleDelete(collection.id)}
                      className="inline-flex w-full items-center justify-center rounded-lg border border-[#d7dad7] bg-[#f3f5f3] px-2 py-1.5 text-xs font-semibold text-[#6f7277] transition hover:bg-[#f3f5f3]"
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}



