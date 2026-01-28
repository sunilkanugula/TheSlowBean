import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "http://localhost:5000/api/wishlist";
const GUEST_KEY = "guest_wishlist";

export function useWishlist() {
  const token = localStorage.getItem("token");
  const [wishlist, setWishlist] = useState<number[]>([]);

  /* ---------- LOAD ---------- */
  useEffect(() => {
    if (token) {
      axios
        .get(API_URL, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          const ids = res.data.map((p: any) => Number(p.id));
          setWishlist(ids);
        })
        .catch(() => setWishlist([]));
    } else {
      try {
        const stored = localStorage.getItem(GUEST_KEY);
        const parsed = stored ? JSON.parse(stored) : [];
        setWishlist(parsed.map(Number));
      } catch {
        setWishlist([]);
      }
    }
  }, [token]);

  /* ---------- ADD ---------- */
  const add = async (productId: number) => {
    const id = Number(productId);

    if (token) {
      await axios.post(
        API_URL,
        { productId: id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setWishlist((prev) =>
        prev.includes(id) ? prev : [...prev, id]
      );
    } else {
      const updated = wishlist.includes(id)
        ? wishlist
        : [...wishlist, id];

      setWishlist(updated);
      localStorage.setItem(GUEST_KEY, JSON.stringify(updated));
    }
  };

  /* ---------- REMOVE ---------- */
  const remove = async (productId: number) => {
    const id = Number(productId);

    if (token) {
      try {
        await axios.delete(`${API_URL}/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        // ignore (already removed)
      }

      setWishlist((prev) => prev.filter((x) => x !== id));
    } else {
      const updated = wishlist.filter((x) => x !== id);
      setWishlist(updated);
      localStorage.setItem(GUEST_KEY, JSON.stringify(updated));
    }
  };

  /* ---------- CHECK ---------- */
  const isInWishlist = (productId: number): boolean => {
    return wishlist.includes(Number(productId));
  };

  return {
    wishlist,
    add,
    remove,
    isInWishlist,
  };
}
