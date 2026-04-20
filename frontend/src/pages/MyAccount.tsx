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
  MapPin,
  Plus,
  Trash2,
  Star,
} from "lucide-react";
import { toast } from "react-toastify";

type UserType = {
  name: string;
  email: string;
  emailVerified: boolean;
  role?: "USER" | "ADMIN";
};

type SavedAddress = {
  id: number;
  label: string;
  name: string;
  phone: string;
  altPhone?: string;
  line1: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
};

type Tab = "overview" | "addresses";

const PHONE_REGEX = /^[6-9]\d{9}$/;

export default function MyAccount() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const [user, setUser] = useState<UserType>({
    name: "",
    email: "",
    emailVerified: false,
    role: "USER",
  });
  const [nameDraft, setNameDraft] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Addresses state
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [addrLoading, setAddrLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const [addrLabel, setAddrLabel] = useState("");
  const [addrName, setAddrName] = useState("");
  const [addrPhone, setAddrPhone] = useState("");
  const [addrLine1, setAddrLine1] = useState("");
  const [addrPincode, setAddrPincode] = useState("");
  const [addrCity, setAddrCity] = useState("");
  const [addrState, setAddrState] = useState("");
  const [addrIsDefault, setAddrIsDefault] = useState(false);
  const [addrPinLoading, setAddrPinLoading] = useState(false);
  const [addrPinError, setAddrPinError] = useState("");
  const [addrSaving, setAddrSaving] = useState(false);

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

  useEffect(() => {
    if (activeTab === "addresses") fetchAddresses();
  }, [activeTab]);

  const fetchAddresses = async () => {
    try {
      setAddrLoading(true);
      const res = await api.get("/addresses");
      setAddresses(res.data || []);
    } catch {
      toast.error("Failed to load addresses");
    } finally {
      setAddrLoading(false);
    }
  };

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

  const fetchPinCity = async (pin: string) => {
    if (pin.length !== 6) return;
    try {
      setAddrPinLoading(true);
      setAddrPinError("");
      const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
      const json = await res.json();
      const data = json?.[0];
      if (data?.Status === "Success") {
        const po = data.PostOffice[0];
        setAddrCity(po.District);
        setAddrState(po.State);
      } else {
        setAddrPinError("Invalid pincode");
        setAddrCity("");
        setAddrState("");
      }
    } catch {
      setAddrPinError("Failed to fetch city/state");
    } finally {
      setAddrPinLoading(false);
    }
  };

  const resetAddressForm = () => {
    setAddrLabel("");
    setAddrName("");
    setAddrPhone("");
    setAddrLine1("");
    setAddrPincode("");
    setAddrCity("");
    setAddrState("");
    setAddrIsDefault(false);
    setAddrPinError("");
    setShowAddForm(false);
  };

  const saveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addrLabel || !addrName || !addrPhone || !addrLine1 || !addrPincode || !addrCity || !addrState) {
      toast.error("Please fill all required fields");
      return;
    }
    if (!PHONE_REGEX.test(addrPhone)) {
      toast.error("Enter a valid phone number");
      return;
    }
    try {
      setAddrSaving(true);
      await api.post("/addresses", {
        label: addrLabel,
        name: addrName,
        phone: addrPhone,
        line1: addrLine1,
        pincode: addrPincode,
        city: addrCity,
        state: addrState,
        isDefault: addrIsDefault,
      });
      toast.success("Address saved");
      resetAddressForm();
      fetchAddresses();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save address");
    } finally {
      setAddrSaving(false);
    }
  };

  const setDefaultAddress = async (id: number) => {
    try {
      await api.patch(`/addresses/${id}/default`);
      setAddresses((prev) =>
        prev.map((a) => ({ ...a, isDefault: a.id === id }))
      );
      toast.success("Default address updated");
    } catch {
      toast.error("Failed to update default address");
    }
  };

  const deleteAddress = async (id: number) => {
    if (!window.confirm("Delete this address?")) return;
    try {
      await api.delete(`/addresses/${id}`);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      toast.success("Address deleted");
    } catch {
      toast.error("Failed to delete address");
    }
  };

  return (
    <div className="premium-page">
      <div className="max-w-6xl mx-auto grid md:grid-cols-[280px_1fr] gap-6">
        {/* Sidebar */}
        <div className="premium-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#287a55] text-xl font-semibold text-white">
              {user.name.charAt(0).toUpperCase() || "U"}
            </div>
            <div>
              <p className="font-semibold text-[#202326]">{user.name}</p>
              <p className="text-sm text-[#8b9290]">{user.email}</p>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              {user.emailVerified ? (
                <ShieldCheck className="w-4 h-4 text-[#287a55]" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-[#8f3f52]" />
              )}
              <span className="text-[#5f6568]">
                {user.emailVerified ? "Email Verified" : "Email Not Verified"}
              </span>
            </div>

            {!user.emailVerified && (
              <button onClick={verifyEmail} disabled={loading} className="font-semibold text-[#287a55] hover:underline">
                Verify Email
              </button>
            )}

            {user.role === "ADMIN" && (
              <span className="inline-block mt-3 bg-[#edf2ee] text-[#287a55] text-xs font-semibold px-3 py-1 rounded-full">
                ADMIN
              </span>
            )}
          </div>

          {/* Tab navigation */}
          <div className="mt-8 space-y-1">
            <button
              type="button"
              onClick={() => setActiveTab("overview")}
              className={`w-full rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition ${
                activeTab === "overview"
                  ? "bg-[#287a55] text-white"
                  : "text-[#5f6568] hover:bg-[#edf2ee] hover:text-[#202326]"
              }`}
            >
              Overview
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("addresses")}
              className={`w-full rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition ${
                activeTab === "addresses"
                  ? "bg-[#287a55] text-white"
                  : "text-[#5f6568] hover:bg-[#edf2ee] hover:text-[#202326]"
              }`}
            >
              <span className="flex items-center gap-2">
                <MapPin size={14} /> Addresses
              </span>
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="premium-card p-6">
          {activeTab === "overview" && (
            <>
              <p className="premium-kicker">Customer Center</p>
              <h1 className="mb-6 mt-2 text-3xl font-semibold text-[#202326]">Account Overview</h1>

              {error && (
                <div className="mb-4 rounded-lg border border-[#d9dfd8] bg-[#edf2ee] px-3 py-2 text-sm text-[#5f6568]">{error}</div>
              )}

              <div className="mb-6 rounded-lg border border-black/10 bg-[#f6f7f4] p-4">
                <h2 className="font-semibold text-[#202326] mb-3">Profile</h2>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    className="premium-input flex-1 py-2"
                    placeholder="Your name"
                  />
                  <button
                    type="button"
                    onClick={saveProfile}
                    className="premium-button gap-2 px-4 py-2"
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
            </>
          )}

          {activeTab === "addresses" && (
            <>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="premium-kicker">Delivery</p>
                  <h1 className="mt-2 text-3xl font-semibold text-[#202326]">Saved Addresses</h1>
                </div>
                {!showAddForm && (
                  <button
                    type="button"
                    onClick={() => setShowAddForm(true)}
                    className="flex items-center gap-1.5 rounded-lg bg-[#287a55] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#319164]"
                  >
                    <Plus size={15} /> Add New
                  </button>
                )}
              </div>

              {addrLoading ? (
                <p className="text-sm text-[#8b9290]">Loading addresses...</p>
              ) : addresses.length === 0 && !showAddForm ? (
                <div className="rounded-lg border border-dashed border-[#d9dfd8] bg-[#f6f7f4] p-8 text-center">
                  <MapPin size={28} className="mx-auto mb-3 text-[#d9dfd8]" />
                  <p className="text-sm text-[#8b9290]">No saved addresses yet.</p>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(true)}
                    className="mt-4 rounded-lg bg-[#287a55] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#319164]"
                  >
                    Add Your First Address
                  </button>
                </div>
              ) : (
                <div className="space-y-3 mb-6">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className={`rounded-lg border p-4 text-sm transition ${
                        addr.isDefault
                          ? "border-[#287a55] bg-[#edf2ee]"
                          : "border-[#d9dfd8] bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="rounded bg-[#f6f7f4] px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-[#5f6568] border border-[#d9dfd8]">
                              {addr.label}
                            </span>
                            {addr.isDefault && (
                              <span className="flex items-center gap-1 rounded-full bg-[#287a55] px-2 py-0.5 text-[10px] font-semibold text-white">
                                <Star size={9} fill="currentColor" /> Default
                              </span>
                            )}
                          </div>
                          <p className="font-semibold text-[#202326]">{addr.name}</p>
                          <p className="text-[#5f6568]">{addr.line1}</p>
                          <p className="text-[#5f6568]">{addr.city}, {addr.state} - {addr.pincode}</p>
                          <p className="text-[#8b9290]">{addr.phone}</p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          {!addr.isDefault && (
                            <button
                              type="button"
                              onClick={() => setDefaultAddress(addr.id)}
                              className="rounded-lg border border-[#d9dfd8] px-2.5 py-1.5 text-[11px] font-semibold text-[#5f6568] transition hover:border-[#287a55] hover:text-[#287a55]"
                            >
                              Set Default
                            </button>
                          )}
                          <button
                            type="button"
                            aria-label="Delete address"
                            onClick={() => deleteAddress(addr.id)}
                            className="rounded-lg border border-[#d9dfd8] p-1.5 text-red-400 transition hover:border-red-200 hover:bg-red-50"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Address Form */}
              {showAddForm && (
                <form onSubmit={saveAddress} className="rounded-lg border border-[#d9dfd8] bg-[#f6f7f4] p-5 space-y-4">
                  <h2 className="flex items-center gap-2 text-base font-semibold text-[#202326]">
                    <Plus size={16} /> Add New Address
                  </h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      placeholder="Label (Home / Work / Other) *"
                      value={addrLabel}
                      onChange={(e) => setAddrLabel(e.target.value)}
                      className="premium-input"
                    />
                    <input
                      placeholder="Full Name *"
                      value={addrName}
                      onChange={(e) => setAddrName(e.target.value)}
                      className="premium-input"
                    />
                    <input
                      placeholder="Phone *"
                      value={addrPhone}
                      maxLength={10}
                      onChange={(e) => setAddrPhone(e.target.value.replace(/\D/g, ""))}
                      className="premium-input"
                    />
                    <input
                      placeholder="Pincode *"
                      value={addrPincode}
                      maxLength={6}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        setAddrPincode(val);
                        if (val.length === 6) fetchPinCity(val);
                      }}
                      className="premium-input"
                    />
                    <input
                      placeholder="City"
                      value={addrCity}
                      disabled
                      className="premium-input bg-white"
                    />
                    <input
                      placeholder="State"
                      value={addrState}
                      disabled
                      className="premium-input bg-white"
                    />
                  </div>
                  {addrPinLoading && <p className="text-xs text-[#8b9290]">Fetching city and state...</p>}
                  {addrPinError && <p className="text-xs text-red-500">{addrPinError}</p>}
                  <textarea
                    placeholder="House / Street / Area *"
                    value={addrLine1}
                    onChange={(e) => setAddrLine1(e.target.value)}
                    className="premium-input min-h-20 w-full"
                  />
                  <label className="flex items-center gap-2 text-sm text-[#5f6568] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={addrIsDefault}
                      onChange={(e) => setAddrIsDefault(e.target.checked)}
                      className="accent-[#287a55]"
                    />
                    Set as default address
                  </label>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={addrSaving}
                      className="rounded-lg bg-[#287a55] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#319164] disabled:opacity-50"
                    >
                      {addrSaving ? "Saving..." : "Save Address"}
                    </button>
                    <button
                      type="button"
                      onClick={resetAddressForm}
                      className="rounded-lg border border-[#d9dfd8] px-5 py-2.5 text-sm font-semibold text-[#5f6568] transition hover:bg-white"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
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
      className={`flex cursor-pointer items-center gap-4 rounded-lg border border-black/10 p-5 transition hover:-translate-y-0.5 hover:bg-[#edf2ee] hover:shadow-[0_18px_36px_-28px_rgba(26,38,31,0.6)] ${
        danger ? "text-[#8f3f52]" : "text-[#202326]"
      }`}
    >
      <div className="rounded-lg bg-[#edf2ee] p-3 text-[#287a55]">{icon}</div>
      <p className="font-medium">{title}</p>
    </div>
  );
}
