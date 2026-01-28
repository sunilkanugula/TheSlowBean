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

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {products.map((p) => {
          const id = Number(p.id);
          const wished = isInWishlist(id);

          return (
            <div
              key={id}
              className="relative bg-white border rounded-xl shadow-sm"
            >
              <Link to={`/products/${id}`}>
                <img
                  src={p.images?.[0] || "/placeholder.png"}
                  className="w-full h-48 object-cover rounded-t-xl"
                />
              </Link>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  wished ? remove(id) : add(id);
                }}
                className={`absolute bottom-3 right-3 p-2 rounded-full
                  ${
                    wished
                      ? "bg-red-100 text-red-600"
                      : "bg-white text-gray-400 hover:text-red-500"
                  }`}
              >
                {wished ? <FaHeart /> : <FiHeart />}
              </button>

              <div className="p-4">
                <h2 className="font-semibold">{p.title}</h2>
                <p className="text-green-600 font-bold">
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
