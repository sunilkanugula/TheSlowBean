import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";

import AuthWrapper from "../components/AuthWrapper";
import { Input } from "../components/Input";
import { Button } from "../components/Button";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    try {
      setLoading(true);
      setError("");

      await api.post("/auth/register", form);

      navigate("/verify-email", { state: { email: form.email } });
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthWrapper title="Create Account" error={error}>
      <Input
        label="Name"
        placeholder="Full name"
        onChange={(e: any) => setForm({ ...form, name: e.target.value })}
      />
      <Input
        label="Email"
        type="email"
        placeholder="name@email.com"
        onChange={(e: any) => setForm({ ...form, email: e.target.value })}
      />
      <Input
        label="Password"
        type="password"
        placeholder="At least 8 characters"
        onChange={(e: any) => setForm({ ...form, password: e.target.value })}
      />
      <Button loading={loading} onClick={submit} text="Register" />
      <p className="pt-1 text-center text-sm text-[#8b9290]">
        Already have an account?{" "}
        <button onClick={() => navigate("/login")} className="font-semibold text-[#287a55] underline">
          Login
        </button>
      </p>
    </AuthWrapper>
  );
}

