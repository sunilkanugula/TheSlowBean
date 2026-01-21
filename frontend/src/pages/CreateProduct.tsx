import { useState } from "react";
import axios from "axios";

const API_URL = "http://localhost:5000/api/products";

export default function CreateProduct() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    subCategory: "",
    price: "",
    discountPrice: "",
    stock: "",
    images: ["", "", "", ""],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const token = localStorage.getItem("token");

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageChange = (index: number, value: string) => {
    const updatedImages = [...form.images];
    updatedImages[index] = value;
    setForm({ ...form, images: updatedImages });
  };

  const submit = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const payload = {
        ...form,
        price: Number(form.price),
        discountPrice: form.discountPrice
          ? Number(form.discountPrice)
          : undefined,
        stock: Number(form.stock),
        images: form.images.filter(Boolean),
      };

      await axios.post(API_URL, payload, {
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
        images: ["", "", "", ""],
      });
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
        <input
          name="title"
          placeholder="Product Title"
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
        placeholder="Product Description"
        value={form.description}
        onChange={handleChange}
        className="border p-2 rounded w-full mt-4"
        rows={4}
      />

      <div className="mt-6">
        <h2 className="font-semibold mb-2">Product Images (max 4)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {form.images.map((img, index) => (
            <input
              key={index}
              placeholder={`Image URL ${index + 1}`}
              value={img}
              onChange={(e) =>
                handleImageChange(index, e.target.value)
              }
              className="border p-2 rounded"
            />
          ))}
        </div>
      </div>

      <button
        onClick={submit}
        disabled={loading}
        className="mt-6 bg-green-600 text-white px-6 py-3 rounded font-semibold hover:bg-green-700 transition"
      >
        {loading ? "Creating..." : "Create Product"}
      </button>
    </div>
  );
}
