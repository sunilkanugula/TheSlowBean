import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "http://localhost:5000/api/wishlist";
const PRODUCTS_API = "http://localhost:5000/api/products";
const GUEST_KEY = "guest_wishlist";

export default function Wishlist() {
  const [products, setProducts] = useState<any[]>([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    // 🔐 Logged-in user → load from DB
    if (token) {
      axios
        .get(API_URL, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => setProducts(res.data))
        .catch(() => setProducts([]));
    }
    // 👤 Guest user → load from localStorage
    else {
      const stored = localStorage.getItem(GUEST_KEY);
      if (!stored) {
        setProducts([]);
        return;
      }

      const ids: number[] = JSON.parse(stored);

      if (ids.length === 0) {
        setProducts([]);
        return;
      }

      // Fetch products by IDs
      axios
        .get(PRODUCTS_API)
        .then((res) => {
          const allProducts = res.data;
          const wishedProducts = allProducts.filter((p: any) =>
            ids.includes(p.id)
          );
          setProducts(wishedProducts);
        })
        .catch(() => setProducts([]));
    }
  }, [token]);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">My Wishlist</h1>

      {products.length === 0 ? (
        <p>No wishlist items</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {products.map((p) => (
            <div key={p.id} className="border rounded shadow">
              <img
                src={p.images[0]}
                alt={p.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h2 className="font-semibold">{p.title}</h2>
                <p className="font-bold">₹{p.price}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
