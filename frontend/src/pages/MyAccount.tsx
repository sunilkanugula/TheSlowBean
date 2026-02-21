import { useEffect, useState } from "react";
import type { ReactNode } from "react";
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
  Save,
} from "lucide-react";
import { toast } from "react-toastify";

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
  const [nameDraft, setNameDraft] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    api
      .get("/auth/me")
      .then((res) => {
        setUser(res.data.user);
        setNameDraft(res.data.user.name || "");
        localStorage.setItem("user", JSON.stringify(res.data.user));
        localStorage.setItem("role", res.data.user.role || "USER");
      })
      .catch(() => navigate("/login"));
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

  const saveProfile = async () => {
    if (!nameDraft.trim()) {
      toast.error("Name is required");
      return;
    }

    try {
      const res = await api.put("/auth/profile", { name: nameDraft.trim() });
      setUser(res.data.user);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      toast.success("Profile updated");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    }
  };

  const logoutAll = async () => {
    try {
      await api.post("/auth/logout-all");
    } finally {
      localStorage.clear();
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-6xl mx-auto grid md:grid-cols-[280px_1fr] gap-6">
        <div className="bg-white rounded-2xl shadow p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-12 w-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-semibold">
              {user.name.charAt(0).toUpperCase() || "U"}
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
              <button onClick={verifyEmail} disabled={loading} className="text-blue-600 hover:underline">
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

        <div className="bg-white rounded-2xl shadow p-6">
          <h1 className="text-2xl font-semibold text-gray-800 mb-6">Account Overview</h1>

          {error && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 border rounded px-3 py-2">{error}</div>
          )}

          <div className="mb-6 rounded-xl border p-4">
            <h2 className="font-semibold text-gray-800 mb-3">Profile</h2>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                className="flex-1 rounded-lg border px-3 py-2"
                placeholder="Your name"
              />
              <button
                onClick={saveProfile}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white"
              >
                <Save size={14} /> Save
              </button>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Tile icon={<Package />} title="My Orders" onClick={() => navigate("/orders")} />
            <Tile icon={<ShoppingCart />} title="My Cart" onClick={() => navigate("/cart")} />
            <Tile icon={<Heart />} title="Wishlist" onClick={() => navigate("/wishlist")} />
            <Tile icon={<Lock />} title="Change Password" onClick={() => navigate("/change-password")} />
            <Tile icon={<LogOut />} title="Logout" danger onClick={() => {
              localStorage.clear();
              navigate("/login");
            }} />
            <Tile icon={<LogOut />} title="Logout All Sessions" danger onClick={logoutAll} />
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
  icon: ReactNode;
  title: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      className={`cursor-pointer rounded-xl border p-5 flex items-center gap-4 hover:shadow-md transition ${
        danger ? "border-red-200 text-red-600 hover:bg-red-50" : "hover:bg-gray-50"
      }`}
    >
      <div className={`p-3 rounded-lg ${danger ? "bg-red-100" : "bg-gray-100"}`}>{icon}</div>
      <p className="font-medium">{title}</p>
    </div>
  );
}
