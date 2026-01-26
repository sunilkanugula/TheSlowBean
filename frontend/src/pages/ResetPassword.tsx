import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../services/api";

import AuthWrapper from "../components/AuthWrapper";
import { Input } from "../components/Input";
import { Button } from "../components/Button";

export default function ResetPassword() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const email = state?.email;

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!email) navigate("/forgot-password");
  }, [email, navigate]);

  const submit = async () => {
    if (!password) {
      setError("Password is required");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await api.post("/auth/reset-password", {
        email,
        newPassword: password,
      });

      setSuccess("Password reset successful. You can now log in.");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Unable to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthWrapper title="Reset Password" error={error}>
      {success ? (
        <div className="text-center space-y-4">
          <p className="text-green-600 font-medium">{success}</p>
          <button
            onClick={() => navigate("/login")}
            className="text-blue-600 font-medium hover:underline"
          >
            Go to Login
          </button>
        </div>
      ) : (
        <>
          <Input
            label="New Password"
            type="password"
            value={password}
            onChange={(e: any) => setPassword(e.target.value)}
          />
          <Button loading={loading} onClick={submit} text="Reset Password" />
        </>
      )}
    </AuthWrapper>
  );
}
