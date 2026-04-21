import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (response: { credential: string }) => void }) => void;
          renderButton: (
            parent: HTMLElement,
            options: Record<string, string | number | boolean>
          ) => void;
          prompt: () => void;
        };
      };
    };
  }
}

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement | null>(null);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const persistAuth = (payload: any) => {
    localStorage.setItem("token", payload.token);
    localStorage.setItem("user", JSON.stringify(payload.user));
    localStorage.setItem("role", payload.user.role);
    navigate("/");
  };

  const submit = async () => {
    try {
      setLoading(true);
      setError("");
      setEmailNotVerified(false);

      const res = await api.post("/auth/login", { email, password });
      persistAuth(res.data);
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

  useEffect(() => {
    if (!googleClientId || !googleBtnRef.current) return;

    const handleGoogleCredential = async (response: { credential: string }) => {
      try {
        setLoading(true);
        setError("");
        const res = await api.post("/auth/google", { idToken: response.credential });
        persistAuth(res.data);
      } catch (err: any) {
        setError(err?.response?.data?.message || "Google login failed");
      } finally {
        setLoading(false);
      }
    };

    const initGoogle = () => {
      if (!window.google?.accounts?.id || !googleBtnRef.current) return false;
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleCredential,
      });
      googleBtnRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: "outline",
        size: "large",
        shape: "pill",
        text: "continue_with",
        width: 320,
      });
      return true;
    };

    if (!initGoogle()) {
      const interval = setInterval(() => {
        if (initGoogle()) clearInterval(interval);
      }, 100);
      return () => clearInterval(interval);
    }
  }, [googleClientId]);

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
    <div className="premium-page flex items-center justify-center">
      {loading ? (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-white/65 backdrop-blur-sm">
          <div className="h-11 w-11 animate-spin rounded-full border-4 border-[#287a55] border-t-transparent" />
        </div>
      ) : null}

      <div className="premium-card relative z-10 w-full max-w-4xl overflow-hidden">
        <div className="grid md:grid-cols-2">
          <section className="premium-hero p-8 text-white md:p-10">
            <p className="text-xs uppercase tracking-[0.34em] text-[#d9dfd8]">Welcome Back</p>
            <h1 className="mt-3 text-4xl font-semibold leading-tight text-white">Crafted chocolate, tracked beautifully.</h1>
            <p className="mt-4 text-sm leading-relaxed text-white/82">
              Access your account, check active orders, and manage your profile in a premium storefront experience.
            </p>
          </section>

          <section className="p-8 md:p-10">
            <p className="text-xs uppercase tracking-[0.22em] text-[#8b9290]">The Slow Bean</p>
            <h2 className="mt-2 text-3xl font-semibold text-[#202326]">Login</h2>

            {error ? (
              <div className="mt-4 rounded-lg border border-[#d9dfd8] bg-[#edf2ee] px-3 py-2 text-sm text-[#5f6568]">
                {error}
              </div>
            ) : null}

            {emailNotVerified ? (
              <div className="mt-4 rounded-lg border border-[#d9dfd8] bg-[#edf2ee] px-3 py-2 text-sm text-[#202326]">
                Your email is not verified.
                <button
                  onClick={handleVerifyEmail}
                  disabled={!email || loading}
                  className="ml-2 font-semibold text-[#202326] underline decoration-[#287a55] underline-offset-2 disabled:opacity-50"
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
                className="premium-input py-2.5"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="premium-input py-2.5"
              />
            </div>

            <div className="mt-4 flex items-center justify-between text-sm">
              <button onClick={() => navigate("/forgot-password")} className="font-medium text-[#287a55] underline">
                Forgot password?
              </button>
              <button
                onClick={handleVerifyEmail}
                disabled={!email || loading}
                className="font-medium text-[#287a55] underline disabled:opacity-50"
              >
                Verify email
              </button>
            </div>

            <button
              onClick={submit}
              disabled={loading}
              className="premium-button mt-5 w-full py-2.5 disabled:opacity-60"
            >
              Login
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
              <p className="text-center text-xs text-[#8b9290]">
                Google login is not configured. Set `VITE_GOOGLE_CLIENT_ID`.
              </p>
            )}

            <p className="mt-4 text-center text-sm text-[#8b9290]">
              New here?{" "}
              <button onClick={() => navigate("/register")} className="font-semibold text-[#287a55] underline">
                Create account
              </button>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}




