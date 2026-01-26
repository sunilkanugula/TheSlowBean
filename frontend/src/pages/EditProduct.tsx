import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

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

  /* ---------- LOAD PRODUCT ---------- */
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

  /* ---------- FORM CHANGE ---------- */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  /* ---------- IMAGE REPLACE ---------- */
  const handleReplaceImage = (index: number, file: File) => {
    setReplaceImages((prev) => ({
      ...prev,
      [index]: file,
    }));
  };

  /* ---------- UPDATE ---------- */
  const submit = async () => {
    if (!token) {
      setError("Login required");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const formData = new FormData();

      // text fields
      Object.entries(form).forEach(([key, value]) => {
        formData.append(key, value);
      });

      // image replacements
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

      navigate("/products");
    } catch (err: any) {
      setError(err.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="p-6">Loading...</p>;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Edit Product</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* ---------- FORM ---------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          name="title"
          placeholder="Title"
          value={form.title}
          onChange={handleChange}
          className="border p-2 rounded"
        />

        <input
          name="category"
          placeholder="Category"
          value={form.category}
          onChange={handleChange}
          className="border p-2 rounded"
        />

        <input
          name="subCategory"
          placeholder="Sub Category"
          value={form.subCategory}
          onChange={handleChange}
          className="border p-2 rounded"
        />

        <input
          name="price"
          type="number"
          placeholder="Price"
          value={form.price}
          onChange={handleChange}
          className="border p-2 rounded"
        />

        <input
          name="discountPrice"
          type="number"
          placeholder="Discount Price"
          value={form.discountPrice}
          onChange={handleChange}
          className="border p-2 rounded"
        />

        <input
          name="stock"
          type="number"
          placeholder="Stock"
          value={form.stock}
          onChange={handleChange}
          className="border p-2 rounded"
        />
      </div>

      <textarea
        name="description"
        placeholder="Description"
        value={form.description}
        onChange={handleChange}
        className="border p-2 rounded w-full mt-4"
        rows={4}
      />

      {/* ---------- CURRENT IMAGES ---------- */}
      <div className="mt-8">
        <h2 className="font-semibold mb-3">Product Images</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {currentImages.map((img, index) => (
            <div key={index}>
              <img
                src={img}
                alt={`Image ${index + 1}`}
                className="w-full h-32 object-cover rounded border"
              />

              <input
                type="file"
                accept="image/*"
                className="mt-2 text-sm"
                onChange={(e) =>
                  e.target.files &&
                  handleReplaceImage(index, e.target.files[0])
                }
              />

              {replaceImages[index] && (
                <p className="text-xs text-green-600 mt-1">
                  New image selected
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ---------- ACTION ---------- */}
      <button
        onClick={submit}
        disabled={saving}
        className="mt-8 bg-blue-600 text-white px-6 py-3 rounded font-semibold"
      >
        {saving ? "Updating..." : "Update Product"}
      </button>
    </div>
  );
}
