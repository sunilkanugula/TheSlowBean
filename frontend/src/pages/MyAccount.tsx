import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import {
  ShieldCheck,
  ShieldAlert,
  LogOut,
  Lock,
  Heart,
  Package,
  ShoppingCart,
} from "lucide-react";

type UserType = {
  name: string;
  email: string;
  emailVerified: boolean;
  role?: "USER" | "ADMIN";
};

export default function MyAccount() {
  const navigate = useNavigate();

  const [user, setUser] = useState<UserType>({
    name: "",
    email: "",
    emailVerified: false,
    role: "USER",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/login");
      return;
    }
    setUser(JSON.parse(storedUser));
  }, [navigate]);

  const verifyEmail = async () => {
    try {
      setLoading(true);
      setError("");
      await api.post("/auth/resend-email-otp", { email: user.email });
      navigate("/verify-email", { state: { email: user.email } });
    } catch (err: any) {
      setError(err.response?.data?.message || "Unable to resend email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-6xl mx-auto grid md:grid-cols-[280px_1fr] gap-6">
        {/* LEFT PROFILE SIDEBAR */}
        <div className="bg-white rounded-2xl shadow p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-12 w-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-semibold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-gray-800">{user.name}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              {user.emailVerified ? (
                <ShieldCheck className="w-4 h-4 text-green-600" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-yellow-600" />
              )}
              <span className="text-gray-700">
                {user.emailVerified ? "Email Verified" : "Email Not Verified"}
              </span>
            </div>

            {!user.emailVerified && (
              <button
                onClick={verifyEmail}
                disabled={loading}
                className="text-blue-600 hover:underline"
              >
                Verify Email
              </button>
            )}

            {user.role === "ADMIN" && (
              <span className="inline-block mt-3 bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full">
                ADMIN
              </span>
            )}
          </div>
        </div>

        {/* RIGHT CONTENT */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h1 className="text-2xl font-semibold text-gray-800 mb-6">
            Account Overview
          </h1>

          {error && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 border rounded px-3 py-2">
              {error}
            </div>
          )}

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Tile
              icon={<Package />}
              title="My Orders"
              onClick={() => navigate("/orders")}
            />

            <Tile
              icon={<ShoppingCart />}
              title="My Cart"
              onClick={() => navigate("/cart")}
            />

            <Tile
              icon={<Heart />}
              title="Wishlist"
              onClick={() => navigate("/wishlist")}
            />

            <Tile
              icon={<Lock />}
              title="Change Password"
              onClick={() => navigate("/change-password")}
            />

            <Tile
              icon={<LogOut />}
              title="Logout"
              danger
              onClick={() => {
                localStorage.clear();
                navigate("/login");
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Tile({
  icon,
  title,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  title: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      className={`cursor-pointer rounded-xl border p-5 flex items-center gap-4 hover:shadow-md transition ${
        danger
          ? "border-red-200 text-red-600 hover:bg-red-50"
          : "hover:bg-gray-50"
      }`}
    >
      <div
        className={`p-3 rounded-lg ${
          danger ? "bg-red-100" : "bg-gray-100"
        }`}
      >
        {icon}
      </div>
      <p className="font-medium">{title}</p>
    </div>
  );
}
