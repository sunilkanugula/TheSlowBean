import { useState } from "react";
import axios from "axios";

const API_URL = "http://localhost:5000/api/products";
const MAX_IMAGES = 4;

export default function CreateProduct() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    subCategory: "",
    price: "",
    discountPrice: "",
    stock: "",
  });

  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const token = localStorage.getItem("token");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const selectedFiles = Array.from(e.target.files);

    if (selectedFiles.length > MAX_IMAGES) {
      setError("You can upload a maximum of 4 images only");
      e.target.value = ""; // reset file input
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

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const formData = new FormData();

      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("category", form.category);
      formData.append("subCategory", form.subCategory);
      formData.append("price", form.price);
      formData.append("stock", form.stock);

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
        category: "",
        subCategory: "",
        price: "",
        discountPrice: "",
        stock: "",
      });

      setImages([]);
    } catch (err: any) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Create Product</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input name="title" placeholder="Title" value={form.title} onChange={handleChange} className="border p-2 rounded" />
        <input name="category" placeholder="Category" value={form.category} onChange={handleChange} className="border p-2 rounded" />
        <input name="subCategory" placeholder="Sub Category" value={form.subCategory} onChange={handleChange} className="border p-2 rounded" />
        <input name="price" type="number" placeholder="Price" value={form.price} onChange={handleChange} className="border p-2 rounded" />
        <input name="discountPrice" type="number" placeholder="Discount Price" value={form.discountPrice} onChange={handleChange} className="border p-2 rounded" />
        <input name="stock" type="number" placeholder="Stock" value={form.stock} onChange={handleChange} className="border p-2 rounded" />
      </div>

      <textarea
        name="description"
        placeholder="Description"
        value={form.description}
        onChange={handleChange}
        className="border p-2 rounded w-full mt-4"
        rows={4}
      />

      <div className="mt-6">
        <label className="font-semibold block mb-2">
          Product Images (max 4)
        </label>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleImageChange}
          className="border p-2 w-full rounded"
        />

        {images.length > 0 && (
          <p className="text-sm text-gray-600 mt-2">
            {images.length} / {MAX_IMAGES} images selected
          </p>
        )}
      </div>

      <button
        onClick={submit}
        disabled={loading}
        className="mt-6 bg-green-600 text-white px-6 py-3 rounded font-semibold"
      >
        {loading ? "Creating..." : "Create Product"}
      </button>
    </div>
  );
}
