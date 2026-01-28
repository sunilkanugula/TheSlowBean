import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  ShoppingCart,
  ShoppingBag,
  Heart,
  LayoutDashboard,
  Package,
  Tag,
  User,
  LogOut,
  LogIn,
} from "lucide-react";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();

  const role = localStorage.getItem("role");
  const token = localStorage.getItem("token");

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  /* ---------- LOGOUT ---------- */
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    navigate("/login");
  };

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
  }, [debouncedSearch, location.pathname, navigate]);

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

          {token && role === "USER" && (
            <Link to="/orders" className="flex items-center gap-1">
              <ShoppingBag size={16} />
              My Orders
            </Link>
          )}

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
                className="flex items-center gap-1 text-blue-600 font-semibold"
              >
                <Tag size={16} />
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

          {/* WHEN LOGGED IN */}
          {token ? (
            <>
              <button
                onClick={() => navigate("/wishlist")}
                className="text-gray-700 hover:text-red-500"
                title="Wishlist"
              >
                <Heart size={22} />
              </button>

              <button
                onClick={() => navigate("/cart")}
                className="text-gray-700 hover:text-black"
                title="Cart"
              >
                <ShoppingCart size={22} />
              </button>

              <button
                onClick={() => navigate("/my-account")}
                className="flex items-center gap-1 text-sm text-gray-700 hover:text-black"
              >
                <User size={20} />
                <span className="hidden sm:inline">My Account</span>
              </button>

              <button
                onClick={logout}
                className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
              >
                <LogOut size={20} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          ) : (
            /* WHEN LOGGED OUT */
            <>
              <button
                onClick={() => navigate("/login")}
                className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-black"
              >
                <LogIn size={20} />
                <span className="hidden sm:inline">Login</span>
              </button>

              <button
                onClick={() => navigate("/register")}
                className="text-sm font-medium bg-black text-white px-4 py-1.5 rounded-lg hover:bg-gray-800"
              >
                Register
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
