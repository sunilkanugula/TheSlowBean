import { useEffect, useState } from "react";
import axios from "axios";
import { useWishlist } from "../hooks/useWishlist";
import { useLocation, Link } from "react-router-dom";
import { FiHeart } from "react-icons/fi";
import { FaHeart } from "react-icons/fa";

const API_URL = "http://localhost:5000/api/products";

type Product = {
  id: number;
  title: string;
  price: number;
  discountPrice?: number;
  images: string[];
};

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const { add, remove, isInWishlist } = useWishlist();
  const location = useLocation();

  /* ---------- FETCH PRODUCTS ---------- */
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const search = params.get("search");

    const url = search
      ? `${API_URL}?search=${encodeURIComponent(search)}`
      : API_URL;

    axios.get(url).then((res) => setProducts(res.data));
  }, [location.search]);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Products</h1>

      {products.length === 0 && (
        <p className="text-gray-500">No products found.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {products.map((p) => {
          const wished = isInWishlist(p.id);

          return (
            <div
              key={p.id}
              className="relative bg-white border rounded-xl shadow-sm hover:shadow-lg transition"
            >
              {/* Image */}
              <Link to={`/products/${p.id}`}>
                <img
                  src={p.images[0]}
                  alt={p.title}
                  className="w-full h-48 object-cover rounded-t-xl"
                />
              </Link>

              {/* Wishlist icon – bottom right */}
              <button
                title={
                  wished ? "Remove from wishlist" : "Add to wishlist"
                }
                onClick={(e) => {
                  e.preventDefault();
                  wished ? remove(p.id) : add(p.id);
                }}
                className={`absolute bottom-3 right-3 z-10 p-2 rounded-full transition-all
                  ${
                    wished
                      ? "bg-red-100 text-red-600 scale-105"
                      : "bg-white text-gray-400 hover:text-red-500 hover:scale-105"
                  }`}
              >
                {wished ? <FaHeart size={16} /> : <FiHeart size={16} />}
              </button>

              {/* Details */}
              <div className="p-4">
                <Link to={`/products/${p.id}`}>
                  <h2 className="font-semibold text-gray-800 truncate">
                    {p.title}
                  </h2>
                </Link>

                <p className="mt-1 font-bold text-green-600">
                  ₹{p.discountPrice ?? p.price}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
