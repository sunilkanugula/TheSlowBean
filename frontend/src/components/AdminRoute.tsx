import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";

import { api } from "../services/api";

export default function AdminRoute() {
  const [state, setState] = useState<"loading" | "ok" | "forbidden">("loading");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setState("forbidden");
      return;
    }

    api
      .get("/auth/me")
      .then((res) => {
        const role = res.data?.user?.role;
        localStorage.setItem("user", JSON.stringify(res.data?.user || {}));
        localStorage.setItem("role", role || "USER");
        setState(role === "ADMIN" ? "ok" : "forbidden");
      })
      .catch(() => setState("forbidden"));
  }, []);

  if (state === "loading") {
    return <div className="p-6 text-sm text-[#8d9197]">Validating admin access...</div>;
  }

  if (state === "forbidden") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

