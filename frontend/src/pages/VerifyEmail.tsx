import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../services/api";

import AuthWrapper from "../components/AuthWrapper";
import { Input } from "../components/Input";
import { Button } from "../components/Button";

export default function VerifyEmail() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [autoResent, setAutoResent] = useState(false);

  // ✅ Set email from navigation state
  useEffect(() => {
    if (state?.email) {
      setEmail(state.email);
    }
  }, [state]);

  // ✅ AUTO RESEND OTP (when email is ready)
  useEffect(() => {
    if (state?.resendOtp && email && !autoResent) {
      resendOTP();
      setAutoResent(true);
    }
    // eslint-disable-next-line
  }, [email]);

  const resendOTP = async () => {
    try {
      setLoading(true);
      setError("");
      setInfo("");

      console.log("Resending OTP to:", email);

      await api.post("/auth/resend-email-otp", { email });

      setInfo("A new OTP has been sent to your email");
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Unable to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    try {
      setLoading(true);
      setError("");
      setInfo("");

      await api.post("/auth/verify-email-otp", { email, otp });

      navigate("/login");
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid or expired OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthWrapper title="Verify Email" error={error}>
      {info && (
        <div className="mb-4 text-sm text-green-600 bg-green-50 border border-green-200 rounded p-2">
          {info}
        </div>
      )}

      <Input
        label="Email"
        value={email}
        onChange={(e: any) => setEmail(e.target.value)}
      />

      <Input
        label="OTP"
        value={otp}
        onChange={(e: any) => setOtp(e.target.value)}
      />

      <Button
        loading={loading}
        onClick={verifyOTP}
        text="Verify Email"
      />

      <button
        onClick={resendOTP}
        disabled={!email || loading}
        className="text-sm text-blue-600 hover:underline text-center w-full"
      >
        Resend OTP
      </button>
    </AuthWrapper>
  );
}
