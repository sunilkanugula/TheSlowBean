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
      localStorage.setItem("user", JSON.stringify(res.data.user));
      localStorage.setItem("role", res.data.user.role);
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

  const handleVerifyEmail = async () => {
    try {
      setLoading(true);
      setError("");
      await api.post("/auth/resend-email-otp", { email });
      navigate("/verify-email", { state: { email } });
    } catch (err: any) {
      setError(err.response?.data?.message || "Unable to resend verification email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f3efe6] px-4 py-10">
      <div className="pointer-events-none absolute -left-20 top-8 h-64 w-64 rounded-full bg-[#144434]/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-12 bottom-0 h-72 w-72 rounded-full bg-[#d39b3f]/20 blur-3xl" />

      {loading ? (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-white/65 backdrop-blur-sm">
          <div className="h-11 w-11 animate-spin rounded-full border-4 border-[#154434] border-t-transparent" />
        </div>
      ) : null}

      <div className="relative z-10 w-full max-w-4xl overflow-hidden rounded-[28px] border border-[#cbdbc7] bg-white/95 shadow-[0_35px_90px_-40px_rgba(18,53,44,0.5)]">
        <div className="grid md:grid-cols-2">
          <section className="bg-[#12362c] p-8 text-white md:p-10">
            <p className="text-xs uppercase tracking-[0.34em] text-[#a5cbb8]">Welcome Back</p>
            <h1 className="mt-3 text-4xl font-semibold leading-tight">Crafted chocolate, tracked beautifully.</h1>
            <p className="mt-4 text-sm leading-relaxed text-[#d0e5dc]">
              Access your account, check active orders, and manage your profile in a premium storefront experience.
            </p>
          </section>

          <section className="p-8 md:p-10">
            <p className="text-xs uppercase tracking-[0.22em] text-[#7f8f87]">The Slow Bean</p>
            <h2 className="mt-2 text-3xl font-semibold text-[#143b2f]">Login</h2>

            {error ? (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            {emailNotVerified ? (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                Your email is not verified.
                <button
                  onClick={handleVerifyEmail}
                  disabled={!email || loading}
                  className="ml-2 font-semibold text-amber-900 underline decoration-amber-600 underline-offset-2 disabled:opacity-50"
                >
                  Verify Email
                </button>
              </div>
            ) : null}

            <div className="mt-6 space-y-4">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full rounded-xl border border-[#c8d6c4] bg-[#fcfdfb] px-4 py-2.5 text-sm text-[#143b2f] transition focus:border-[#1d6e5a] focus:bg-white focus:outline-none"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full rounded-xl border border-[#c8d6c4] bg-[#fcfdfb] px-4 py-2.5 text-sm text-[#143b2f] transition focus:border-[#1d6e5a] focus:bg-white focus:outline-none"
              />
            </div>

            <div className="mt-4 flex items-center justify-between text-sm">
              <button onClick={() => navigate("/forgot-password")} className="font-medium text-[#1b6956] underline">
                Forgot password?
              </button>
              <button
                onClick={handleVerifyEmail}
                disabled={!email || loading}
                className="font-medium text-[#1b6956] underline disabled:opacity-50"
              >
                Verify email
              </button>
            </div>

            <button
              onClick={submit}
              disabled={loading}
              className="mt-5 w-full rounded-xl bg-[#143b2f] py-2.5 text-sm font-semibold text-white transition hover:bg-[#0f2f26] disabled:opacity-60"
            >
              Login
            </button>

            <p className="mt-4 text-center text-sm text-[#567068]">
              New here?{" "}
              <button onClick={() => navigate("/register")} className="font-semibold text-[#1b6956] underline">
                Create account
              </button>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
