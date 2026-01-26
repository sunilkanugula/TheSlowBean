import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";

import AuthWrapper from "../components/AuthWrapper";
import { Input } from "../components/Input";
import { Button } from "../components/Button";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!email) {
      setError("Email is required");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await api.post("/auth/forgot-password", { email });

      navigate("/verify-reset-otp", { state: { email } });
    } catch (err: any) {
      setError(err?.response?.data?.message || "Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthWrapper title="Forgot Password" error={error}>
      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e: any) => setEmail(e.target.value)}
      />
      <Button loading={loading} onClick={submit} text="Send OTP" />
    </AuthWrapper>
  );
}
