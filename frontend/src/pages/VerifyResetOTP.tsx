import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../services/api";

import AuthWrapper from "../components/AuthWrapper";
import { Input } from "../components/Input";
import { Button } from "../components/Button";

export default function VerifyResetOTP() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const email = state?.email;

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!email) navigate("/forgot-password");
  }, [email, navigate]);

  const submit = async () => {
    if (!otp) {
      setError("OTP is required");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await api.post("/auth/verify-reset-otp", { email, otp });

      navigate("/reset-password", { state: { email } });
    } catch (err: any) {
      setError(err?.response?.data?.message || "Invalid or expired OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthWrapper title="Verify OTP" error={error}>
      <Input
        label="Enter OTP"
        value={otp}
        onChange={(e: any) => setOtp(e.target.value)}
      />
      <Button loading={loading} onClick={submit} text="Verify OTP" />
    </AuthWrapper>
  );
}
