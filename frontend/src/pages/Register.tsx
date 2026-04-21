import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import logo from "../assets/logo1.jpg";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const googleBtnRef = useRef<HTMLDivElement | null>(null);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const submit = async () => {
    try {
      setLoading(true);
      setError("");
      await api.post("/auth/register", form);
      navigate("/verify-email", { state: { email: form.email } });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!googleClientId || !googleBtnRef.current) return;

    const handleGoogleCredential = async (response: { credential: string }) => {
      try {
        setLoading(true);
        setError("");
        const res = await api.post("/auth/google", { idToken: response.credential });
        const payload = res.data as { token: string; user: { role: string } };
        localStorage.setItem("token", payload.token);
        localStorage.setItem("user", JSON.stringify(payload.user));
        localStorage.setItem("role", payload.user.role);
        navigate("/");
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
        setError(msg || "Google sign-up failed");
      } finally {
        setLoading(false);
      }
    };

    const initGoogle = () => {
      if (!window.google?.accounts?.id || !googleBtnRef.current) return false;
      window.google.accounts.id.initialize({ client_id: googleClientId, callback: handleGoogleCredential });
      googleBtnRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: "outline", size: "large", shape: "pill", text: "signup_with", width: 320,
      });
      return true;
    };

    if (!initGoogle()) {
      const interval = setInterval(() => { if (initGoogle()) clearInterval(interval); }, 100);
      return () => clearInterval(interval);
    }
  }, [googleClientId, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(135deg,rgba(40,122,85,0.08),transparent_32%),linear-gradient(180deg,#fbfcf9_0%,#e7eeeb_100%)] px-4 py-10">
      {loading && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-white/65 backdrop-blur-sm">
          <div className="h-11 w-11 animate-spin rounded-full border-4 border-[#287a55] border-t-transparent" />
        </div>
      )}

      <div className="premium-card w-full max-w-4xl overflow-hidden">
        <div className="grid md:grid-cols-2">

          {/* Left panel */}
          <section className="premium-hero flex flex-col justify-between p-8 text-white md:p-10">
            <div>
              <img src={logo} alt="The Slow Bean" className="h-12 w-12 rounded-xl object-cover shadow-lg" />
              <p className="mt-6 text-xs uppercase tracking-[0.34em] text-white/60">The Slow Bean</p>
              <h1 className="mt-3 text-4xl font-semibold leading-tight text-white">
                Join a community that cares about craft.
              </h1>
              <p className="mt-4 text-sm leading-relaxed text-white/70">
                Create your account to track orders, save favourites, and experience bean-to-bar chocolate the way it was meant to be.
              </p>
            </div>
            <ul className="mt-10 space-y-2 text-sm text-white/60">
              {["Free account, no hidden fees", "Track every order in real time", "Exclusive member-only offers"].map(item => (
                <li key={item} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#7abf36]" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          {/* Right panel */}
          <section className="p-8 md:p-10">
            <p className="text-xs uppercase tracking-[0.22em] text-[#8b9290]">New here?</p>
            <h2 className="mt-2 text-3xl font-semibold text-[#202326]">Create Account</h2>

            {error && (
              <div className="mt-4 rounded-lg border border-[#d9dfd8] bg-[#edf2ee] px-3 py-2 text-sm text-[#5f6568]">
                {error}
              </div>
            )}

            <div className="mt-6 space-y-4">
              <input
                type="text"
                placeholder="Full name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                disabled={loading}
                className="premium-input py-2.5"
              />
              <input
                type="email"
                placeholder="Email address"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                disabled={loading}
                className="premium-input py-2.5"
              />
              <input
                type="password"
                placeholder="Password (min. 8 characters)"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                disabled={loading}
                className="premium-input py-2.5"
              />
            </div>

            <button
              type="button"
              onClick={submit}
              disabled={loading}
              className="premium-button mt-5 w-full py-2.5 disabled:opacity-60"
            >
              Create Account
            </button>

            <div className="my-4 flex items-center gap-3 text-xs text-[#8b9290]">
              <div className="h-px flex-1 bg-[#d9dfd8]" />
              <span>OR</span>
              <div className="h-px flex-1 bg-[#d9dfd8]" />
            </div>

            {googleClientId ? (
              <div className="flex justify-center">
                <div ref={googleBtnRef} />
              </div>
            ) : (
              <p className="text-center text-xs text-[#8b9290]">Google sign-up unavailable — set VITE_GOOGLE_CLIENT_ID.</p>
            )}

            <p className="mt-5 text-center text-sm text-[#8b9290]">
              Already have an account?{" "}
              <button type="button" onClick={() => navigate("/login")} className="font-semibold text-[#287a55] underline">
                Login
              </button>
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
