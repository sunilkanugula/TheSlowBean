import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { ShoppingCart, Heart, LayoutDashboard, Package } from "lucide-react";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const role = localStorage.getItem("role");

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  /* ---------- SYNC SEARCH FROM URL ---------- */
  useEffect(() => {
    if (location.pathname === "/products") {
      const params = new URLSearchParams(location.search);
      setSearch(params.get("search") || "");
    }
  }, [location]);

  /* ---------- DEBOUNCE SEARCH ---------- */
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  /* ---------- UPDATE URL ---------- */
  useEffect(() => {
    if (location.pathname !== "/products") return;

    if (!debouncedSearch.trim()) {
      navigate("/products", { replace: true });
    } else {
      navigate(
        `/products?search=${encodeURIComponent(debouncedSearch)}`,
        { replace: true }
      );
    }
  }, [debouncedSearch, location.pathname]);

  /* ---------- LOGOUT ---------- */
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login");
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* LOGO */}
        <Link to="/" className="text-xl font-bold text-gray-800">
          TheSlowBean ☕
        </Link>

        {/* NAV LINKS */}
        <nav className="hidden md:flex gap-6 text-sm font-medium text-gray-600">
          <Link to="/">Home</Link>
          <Link to="/products">Products</Link>
          <Link to="/orders">My Orders</Link>

          {/* OWNER / ADMIN LINKS */}
          {role === "ADMIN" && (
            <>
              <Link
                to="/owner/dashboard"
                className="flex items-center gap-1 text-blue-600 font-semibold"
              >
                <LayoutDashboard size={16} />
                Dashboard
              </Link>

              <Link
                to="/owner/orders"
                className="flex items-center gap-1 text-blue-600 font-semibold"
              >
                <Package size={16} />
                Orders
              </Link>

              <Link
                to="/owner/products"
                className="text-blue-600 font-semibold"
              >
                Products
              </Link>
            </>
          )}
        </nav>

        {/* ACTIONS */}
        <div className="flex items-center gap-4">
          {/* SEARCH */}
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="hidden sm:block border border-gray-300 rounded-lg px-3 py-1 text-sm"
          />

          {/* ❤️ WISHLIST */}
          <button
            onClick={() => navigate("/wishlist")}
            className="text-gray-700 hover:text-red-500"
            title="My Wishlist"
          >
            <Heart size={22} />
          </button>

          {/* 🛒 CART */}
          <button
            onClick={() => navigate("/cart")}
            className="text-gray-700 hover:text-black"
            title="My Cart"
          >
            <ShoppingCart size={22} />
          </button>

          {/* LOGOUT */}
          <button
            onClick={logout}
            className="text-sm text-white bg-blue-600 px-3 py-1.5 rounded-lg"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
