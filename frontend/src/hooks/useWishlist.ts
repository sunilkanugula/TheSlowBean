import { useEffect, useState } from "react";

import { api } from "../services/api";

const GUEST_KEY = "guest_wishlist";

export function useWishlist() {
  const [wishlist, setWishlist] = useState<number[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      api
        .get("/wishlist", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          const ids = (res.data || []).map((p: any) => Number(p.id));
          setWishlist(ids);
        })
        .catch(() => setWishlist([]));
      return;
    }

    try {
      const stored = localStorage.getItem(GUEST_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      setWishlist(parsed.map(Number));
    } catch {
      setWishlist([]);
    }
  }, []);

  const add = async (productId: number) => {
    const id = Number(productId);
    const token = localStorage.getItem("token");

    if (token) {
      await api.post(
        "/wishlist",
        { productId: id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setWishlist((prev) => (prev.includes(id) ? prev : [...prev, id]));
      return;
    }

    setWishlist((prev) => {
      const updated = prev.includes(id) ? prev : [...prev, id];
      localStorage.setItem(GUEST_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const remove = async (productId: number) => {
    const id = Number(productId);
    const token = localStorage.getItem("token");

    if (token) {
      try {
        await api.delete(`/wishlist/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        // Keep UI idempotent.
      }
      setWishlist((prev) => prev.filter((x) => x !== id));
      return;
    }

    setWishlist((prev) => {
      const updated = prev.filter((x) => x !== id);
      localStorage.setItem(GUEST_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const isInWishlist = (productId: number): boolean => wishlist.includes(Number(productId));

  return { wishlist, add, remove, isInWishlist };
}
