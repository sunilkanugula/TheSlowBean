import { Link, useNavigate } from "react-router-dom";

export default function Header() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        
        {/* Logo */}
        <Link to="/" className="text-xl font-bold text-gray-800">
          TheSlowBean ☕
        </Link>

        {/* Nav */}
        <nav className="hidden md:flex gap-6 text-sm font-medium text-gray-600">
          <Link to="/" className="hover:text-blue-600">Home</Link>
          <Link to="/products" className="hover:text-blue-600">Products</Link>
          <Link to="/orders" className="hover:text-blue-600">Orders</Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search products..."
            className="hidden sm:block border border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            onClick={logout}
            className="text-sm text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
