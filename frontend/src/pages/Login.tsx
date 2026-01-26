import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");
  const [emailNotVerified, setEmailNotVerified] = useState(false);

  const submit = async () => {
    try {
      setLoading(true);
      setError("");
      setEmailNotVerified(false);

      const res = await api.post("/auth/login", { email, password });

      localStorage.setItem("token", res.data.token);
      const payload = JSON.parse(atob(res.data.token.split(".")[1]));
      localStorage.setItem("role", payload.role);

      navigate("/");
    } catch (err: any) {
      if (err.response?.status === 403) {
        setEmailNotVerified(true);
      } else {
        setError("Invalid email or password");
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ resend OTP only from login page
  const handleVerifyEmail = async () => {
    try {
      setLoading(true);
      setError("");

      await api.post("/auth/resend-email-otp", { email });

      navigate("/verify-email", { state: { email } });
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Unable to resend verification email"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gray-100 px-4">
      {/* 🔵 LOADING OVERLAY */}
      {loading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-sm">
          <div className="flex flex-col items-center space-y-3">
            <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-700 font-medium">
              Please wait...
            </p>
          </div>
        </div>
      )}

      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 relative">
        <h1 className="text-2xl font-bold text-center mb-6">Login</h1>

        {/* ❌ Normal error */}
        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
            {error}
          </div>
        )}

        {/* ⚠️ Email not verified */}
        {emailNotVerified && (
          <div className="mb-4 text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded p-3">
            Your email is not verified. Please verify your email.
            <div className="mt-2">
              <button
                onClick={handleVerifyEmail}
                disabled={!email || loading}
                className="text-blue-600 hover:underline font-medium"
              >
                Verify Email
              </button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {/* Email */}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            className="w-full border px-4 py-2 rounded disabled:bg-gray-100"
          />

          {/* Password */}
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            className="w-full border px-4 py-2 rounded disabled:bg-gray-100"
          />

          {/* Links */}
          <div className="flex justify-between text-sm">
            <button
              onClick={() => navigate("/forgot-password")}
              disabled={loading}
              className="text-blue-600 hover:underline disabled:opacity-50"
            >
              Forgot password?
            </button>

            <button
              onClick={handleVerifyEmail}
              disabled={!email || loading}
              className="text-blue-600 hover:underline disabled:opacity-50"
            >
              Verify email
            </button>
          </div>

          {/* Login */}
          <button
            onClick={submit}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-60"
          >
            Login
          </button>

          {/* Register */}
          <p className="text-sm text-center">
            Don’t have an account?{" "}
            <button
              onClick={() => navigate("/register")}
              disabled={loading}
              className="text-blue-600 hover:underline disabled:opacity-50"
            >
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
