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
  Menu,
  X,
  Search,
} from "lucide-react";
import logo from "../assets/logo1.jpg";
import { api } from "../services/api";
import { CART_UPDATED_EVENT, WISHLIST_UPDATED_EVENT } from "../services/cartEvents";

type CartResponse = {
  items?: Array<{ quantity?: number }>;
};

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialProductsSearch =
    location.pathname === "/products"
      ? new URLSearchParams(location.search).get("search") || ""
      : "";

  const role = localStorage.getItem("role");
  const token = localStorage.getItem("token");

  const [search, setSearch] = useState(initialProductsSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialProductsSearch);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  /* ---------- LOGOUT ---------- */
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    setCartCount(0);
    navigate("/login");
    setMobileOpen(false);
  };

  const goTo = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  useEffect(() => {
    if (!token) {
      setCartCount(0);
      return;
    }

    const syncCartCount = async () => {
      try {
        const res = await api.get<CartResponse>("/cart");
        const items = res.data?.items || [];
        const nextCount = items.reduce(
          (sum, item) => sum + (Number(item.quantity) || 0),
          0
        );
        setCartCount(nextCount);
      } catch {
        setCartCount(0);
      }
    };

    syncCartCount();
    window.addEventListener(CART_UPDATED_EVENT, syncCartCount);
    return () => {
      window.removeEventListener(CART_UPDATED_EVENT, syncCartCount);
    };
  }, [token]);

  useEffect(() => {
    if (!token) {
      setWishlistCount(0);
      return;
    }

    const syncWishlistCount = async () => {
      try {
        const res = await api.get<unknown[]>("/wishlist");
        setWishlistCount((res.data || []).length);
      } catch {
        setWishlistCount(0);
      }
    };

    syncWishlistCount();
    window.addEventListener(WISHLIST_UPDATED_EVENT, syncWishlistCount);
    return () => {
      window.removeEventListener(WISHLIST_UPDATED_EVENT, syncWishlistCount);
    };
  }, [token]);

  /* ---------- SYNC SEARCH FROM URL ---------- */
  useEffect(() => {
    if (location.pathname !== "/products") return;
    const params = new URLSearchParams(location.search);
    const urlSearch = params.get("search") || "";
    setSearch((prev) => (prev === urlSearch ? prev : urlSearch));
  }, [location.pathname, location.search]);

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
    const params = new URLSearchParams(location.search);
    const nextSearch = debouncedSearch.trim();

    if (nextSearch) {
      params.set("search", nextSearch);
    } else {
      params.delete("search");
    }

    const nextQuery = params.toString();
    const currentQuery = location.search.startsWith("?")
      ? location.search.slice(1)
      : location.search;

    if (nextQuery === currentQuery) return;

    navigate(
      {
        pathname: location.pathname,
        search: nextQuery ? `?${nextQuery}` : "",
      },
      { replace: true }
    );
  }, [debouncedSearch, location.pathname, location.search, navigate]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-black/10 bg-white/88 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
        {/* LOGO */}
        <Link to="/" className="flex items-center gap-3 text-xl font-bold text-[#202326]">
          <img src={logo} alt="The Slow Bean Logo" className="h-11 w-auto rounded-md border border-black/10 object-cover" />
        </Link>

        {/* NAV LINKS */}
        <nav className="hidden items-center gap-1 rounded-lg border border-black/10 bg-[#f6f7f4]/85 p-1 text-sm font-semibold text-[#5f6568] md:flex">
          <Link to="/" className="rounded-md px-3 py-2 transition hover:bg-white hover:text-[#202326]">Home</Link>
          <Link to="/products" className="rounded-md px-3 py-2 transition hover:bg-white hover:text-[#202326]">Products</Link>

          {token && role === "USER" && (
            <Link to="/orders" className="flex items-center gap-1 rounded-md px-3 py-2 transition hover:bg-white hover:text-[#202326]">
              <ShoppingBag size={16} />
              My Orders
            </Link>
          )}

          {role === "ADMIN" && (
            <>
              <Link
                to="/owner/dashboard"
                className="flex items-center gap-1 rounded-md px-3 py-2 text-[#287a55] transition hover:bg-white"
              >
                <LayoutDashboard size={16} />
                Dashboard
              </Link>

              <Link
                to="/owner/orders"
                className="flex items-center gap-1 rounded-md px-3 py-2 text-[#287a55] transition hover:bg-white"
              >
                <Package size={16} />
                Orders
              </Link>

              <Link
                to="/owner/products"
                className="flex items-center gap-1 rounded-md px-3 py-2 text-[#287a55] transition hover:bg-white"
              >
                <Tag size={16} />
                Products
              </Link>
            </>
          )}
        </nav>

        {/* ACTIONS */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* SEARCH */}
          <form
            className="hidden sm:block"
            onSubmit={(e) => {
              e.preventDefault();
              const q = search.trim();
              navigate(q ? `/products?search=${encodeURIComponent(q)}` : "/products");
            }}
          >
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="h-10 w-44 rounded-lg border border-black/10 bg-[#f6f7f4] px-3 text-sm text-[#202326] outline-none transition placeholder:text-[#8b9290] focus:border-[#287a55] focus:bg-white focus:ring-2 focus:ring-[#287a55]/15 lg:w-64"
            />
          </form>

          {/* WHEN LOGGED IN */}
          {token ? (
            <>
              <button
                onClick={() => navigate("/wishlist")}
                className="relative hidden h-10 w-10 items-center justify-center border border-black/10 bg-white text-[#5f6568] transition hover:border-[#287a55]/40 hover:text-[#287a55] sm:inline-flex"
                title="Wishlist"
              >
                <Heart size={22} />
                {wishlistCount > 0 ? (
                  <span className="absolute -right-2 -top-2 inline-flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#287a55] px-1 text-[10px] font-semibold leading-none text-white">
                    {wishlistCount > 99 ? "99+" : wishlistCount}
                  </span>
                ) : null}
              </button>

              <button
                onClick={() => navigate("/cart")}
                className="relative inline-flex h-10 w-10 items-center justify-center border border-black/10 bg-white text-[#5f6568] transition hover:border-[#287a55]/40 hover:text-[#202326]"
                title="Cart"
              >
                <ShoppingCart size={22} />
                {cartCount > 0 ? (
                  <span className="absolute -right-2 -top-2 inline-flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#287a55] px-1 text-[10px] font-semibold leading-none text-white">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                ) : null}
              </button>

              <button
                onClick={() => navigate("/my-account")}
                className="hidden items-center gap-1 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-[#5f6568] transition hover:text-[#202326] lg:flex"
              >
                <User size={20} />
                <span className="hidden sm:inline">My Account</span>
              </button>

              <button
                onClick={logout}
                className="hidden items-center gap-1 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-[#5f6568] transition hover:text-[#202326] lg:flex"
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
                className="hidden items-center gap-1 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-[#5f6568] transition hover:text-[#202326] sm:flex"
              >
                <LogIn size={20} />
                <span className="hidden sm:inline">Login</span>
              </button>

              <button
                onClick={() => navigate("/register")}
                className="premium-button hidden px-4 py-2 sm:inline-flex"
              >
                Register
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            className="inline-flex h-10 w-10 items-center justify-center border border-black/10 bg-white text-[#202326] transition hover:border-[#287a55]/40 md:hidden"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <div className="border-t border-black/10 bg-white/96 px-4 pb-4 shadow-[0_24px_50px_-36px_rgba(26,38,31,0.65)] backdrop-blur-xl md:hidden">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const nextSearch = search.trim();
              goTo(nextSearch ? `/products?search=${encodeURIComponent(nextSearch)}` : "/products");
            }}
            className="relative pt-4"
          >
            <Search className="pointer-events-none absolute left-3 top-[34px] text-[#8b9290]" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="h-12 w-full rounded-lg border border-black/10 bg-[#f6f7f4] pl-10 pr-3 text-sm text-[#202326] outline-none transition placeholder:text-[#8b9290] focus:border-[#287a55] focus:bg-white focus:ring-2 focus:ring-[#287a55]/15"
            />
          </form>

          <nav className="mt-4 grid gap-2 text-sm font-semibold text-[#202326]">
            <button type="button" onClick={() => goTo("/")} className="rounded-lg border border-black/10 bg-white px-4 py-3 text-left">
              Home
            </button>
            <button type="button" onClick={() => goTo("/products")} className="rounded-lg border border-black/10 bg-white px-4 py-3 text-left">
              Products
            </button>

            {token && role === "USER" ? (
              <button type="button" onClick={() => goTo("/orders")} className="inline-flex items-center gap-2 rounded-lg border border-black/10 bg-white px-4 py-3 text-left">
                <ShoppingBag size={17} /> My Orders
              </button>
            ) : null}

            {role === "ADMIN" ? (
              <>
                <button type="button" onClick={() => goTo("/owner/dashboard")} className="inline-flex items-center gap-2 rounded-lg border border-black/10 bg-white px-4 py-3 text-left text-[#287a55]">
                  <LayoutDashboard size={17} /> Dashboard
                </button>
                <button type="button" onClick={() => goTo("/owner/orders")} className="inline-flex items-center gap-2 rounded-lg border border-black/10 bg-white px-4 py-3 text-left text-[#287a55]">
                  <Package size={17} /> Orders
                </button>
                <button type="button" onClick={() => goTo("/owner/products")} className="inline-flex items-center gap-2 rounded-lg border border-black/10 bg-white px-4 py-3 text-left text-[#287a55]">
                  <Tag size={17} /> Products
                </button>
              </>
            ) : null}
          </nav>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {token ? (
              <>
                <button type="button" onClick={() => goTo("/wishlist")} className="inline-flex items-center justify-center gap-2 rounded-lg border border-black/10 bg-[#f6f7f4] px-3 py-3 text-sm font-semibold text-[#202326]">
                  <Heart size={17} /> Wishlist {wishlistCount > 0 ? `(${wishlistCount > 99 ? "99+" : wishlistCount})` : ""}
                </button>
                <button type="button" onClick={() => goTo("/cart")} className="inline-flex items-center justify-center gap-2 rounded-lg border border-black/10 bg-[#f6f7f4] px-3 py-3 text-sm font-semibold text-[#202326]">
                  <ShoppingCart size={17} /> Cart {cartCount > 0 ? `(${cartCount > 99 ? "99+" : cartCount})` : ""}
                </button>
                <button type="button" onClick={() => goTo("/my-account")} className="inline-flex items-center justify-center gap-2 rounded-lg border border-black/10 bg-[#f6f7f4] px-3 py-3 text-sm font-semibold text-[#202326]">
                  <User size={17} /> Account
                </button>
                <button type="button" onClick={logout} className="inline-flex items-center justify-center gap-2 rounded-lg border border-black/10 bg-[#f6f7f4] px-3 py-3 text-sm font-semibold text-[#8f3f52]">
                  <LogOut size={17} /> Logout
                </button>
              </>
            ) : (
              <>
                <button type="button" onClick={() => goTo("/login")} className="inline-flex items-center justify-center gap-2 rounded-lg border border-black/10 bg-[#f6f7f4] px-3 py-3 text-sm font-semibold text-[#202326]">
                  <LogIn size={17} /> Login
                </button>
                <button type="button" onClick={() => goTo("/register")} className="premium-button py-3">
                  Register
                </button>
              </>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}




