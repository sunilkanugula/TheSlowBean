import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";

export default function ChangePassword() {
  const navigate = useNavigate();

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const submit = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      setError("All fields are required");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      await api.post("/auth/change-password", {
        oldPassword,
        newPassword,
      });

      setSuccess("Password updated successfully");

      setTimeout(() => {
        localStorage.clear();
        navigate("/login");
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || "Unable to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center px-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold text-[#57595d]">
            Change Password
          </h1>
          <p className="text-sm text-[#8d9197] mt-2">
            Keep your account secure by updating your password
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 rounded-lg bg-[#f3f5f3] border border-[#d7dad7] text-[#6f7277] px-4 py-2 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-lg bg-[#f3f5f3] border border-[#d7dad7] text-[#6f7277] px-4 py-2 text-sm">
            {success}
          </div>
        )}

        {/* Form */}
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-[#6f7277] mb-1">
              Current Password
            </label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              disabled={loading}
              className="w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#69b317]"
              placeholder="Enter current password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#6f7277] mb-1">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={loading}
              className="w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#69b317]"
              placeholder="Create a new password"
            />
            <p className="text-xs text-[#9fa3a8] mt-1">
              Must be at least 8 characters
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#6f7277] mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              className="w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#69b317]"
              placeholder="Re-enter new password"
            />
          </div>

          {/* Actions */}
          <button
            onClick={submit}
            disabled={loading}
            className="w-full rounded-lg bg-[#69b317] text-white py-2.5 font-medium hover:bg-[#5aa10f] transition disabled:opacity-60"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>

          <button
            onClick={() => navigate("/my-account")}
            className="w-full text-sm text-[#8d9197] hover:text-[#57595d] transition"
          >
            ← Back to My Account
          </button>
        </div>
      </div>
    </div>
  );
}



