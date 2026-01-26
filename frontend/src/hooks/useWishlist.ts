import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "http://localhost:5000/api/wishlist";
const GUEST_KEY = "guest_wishlist";

export function useWishlist() {
  const token = localStorage.getItem("token");
  const [wishlist, setWishlist] = useState<number[]>([]);

  /* ---------- LOAD WISHLIST ---------- */
  useEffect(() => {
    // 🔐 Logged-in → load from DB
    if (token) {
      axios
        .get(API_URL, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          const ids = res.data.map((p: any) => p.id);
          setWishlist(ids);
        });
    } 
    // 👤 Guest → load from localStorage
    else {
      const stored = localStorage.getItem(GUEST_KEY);
      if (stored) {
        setWishlist(JSON.parse(stored));
      }
    }
  }, [token]);

  /* ---------- ADD ---------- */
  const add = async (productId: number) => {
    // 🔐 Logged-in
    if (token) {
      await axios.post(
        API_URL,
        { productId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setWishlist((prev) => [...prev, productId]);
    } 
    // 👤 Guest
    else {
      const updated = [...new Set([...wishlist, productId])];
      setWishlist(updated);
      localStorage.setItem(GUEST_KEY, JSON.stringify(updated));
    }
  };

  /* ---------- REMOVE ---------- */
  const remove = async (productId: number) => {
    // 🔐 Logged-in
    if (token) {
      await axios.delete(`${API_URL}/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWishlist((prev) => prev.filter((id) => id !== productId));
    } 
    // 👤 Guest
    else {
      const updated = wishlist.filter((id) => id !== productId);
      setWishlist(updated);
      localStorage.setItem(GUEST_KEY, JSON.stringify(updated));
    }
  };

  const isInWishlist = (productId: number) =>
    wishlist.includes(productId);

  return { wishlist, add, remove, isInWishlist };
}
