import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5000/api/products";

type Product = {
  id: number;
  title: string;
  category: string;
  subCategory: string;
  price: number;
  discountPrice?: number;
  stock: number;
  images: string[];
};

export default function OwnerProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const fetchProducts = async () => {
    const res = await axios.get(API_URL);
    setProducts(res.data);
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

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Products</h1>
        <button
          onClick={() => navigate("/owner/products/add")}
          className="bg-black text-white px-4 py-2 rounded"
        >
          + Add Product
        </button>
      </div>

      {/* Column Headings */}
      <div className="hidden md:grid grid-cols-12 gap-4 px-3 text-sm font-semibold text-gray-600 mb-2">
        <div className="col-span-1"></div>
        <div className="col-span-3">Title</div>
        <div className="col-span-2">Category</div>
        <div className="col-span-2">Sub-category</div>
        <div className="col-span-2">Price</div>
        <div className="col-span-1">Stock</div>
        <div className="col-span-1 text-right">Actions</div>
      </div>

      {/* Rows */}
      <div className="space-y-2">
        {products.map((p) => (
          <div
            key={p.id}
            className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center border rounded p-3 hover:bg-gray-50"
          >
            {/* Image */}
            <img
              src={p.images[0]}
              className="w-14 h-14 object-cover rounded md:col-span-1"
            />

            {/* Title + Product ID */}
            <div className="md:col-span-3">
              <div className="text-xs text-gray-500">ID: #{p.id}</div>
              <div className="font-medium">{p.title}</div>
            </div>

            {/* Category */}
            <div className="md:col-span-2 text-sm text-gray-600">
              {p.category}
            </div>

            {/* Sub-category */}
            <div className="md:col-span-2 text-sm text-gray-500">
              {p.subCategory}
            </div>

            {/* Price */}
            <div className="md:col-span-2 font-semibold">
              ₹{p.discountPrice ?? p.price}
            </div>

            {/* Stock */}
            <div className="md:col-span-1 text-sm">
              {p.stock}
            </div>

            {/* Actions */}
            <div className="md:col-span-1 flex justify-end items-center gap-4">
              <button
                onClick={() => navigate(`/owner/products/edit/${p.id}`)}
                className="text-sm text-gray-700 hover:underline"
              >
                Edit
              </button>
              <button
                onClick={() => deleteProduct(p.id)}
                className="text-xl text-gray-400 hover:text-black"
                title="Delete"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
