import axios from "axios";
import { notifyCartUpdated } from "./cartEvents";

export const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    const method = response.config?.method?.toLowerCase();
    const url = response.config?.url || "";
    const isCartMutation =
      (method === "post" || method === "put" || method === "delete") &&
      url.startsWith("/cart");

    if (isCartMutation) {
      notifyCartUpdated();
    }

    return response;
  },
  (error) => {
    const requestAuthHeader =
      error?.config?.headers?.Authorization ||
      error?.config?.headers?.authorization;
    const hadAuthOnRequest = Boolean(requestAuthHeader);

    if (error?.response?.status === 401 && hadAuthOnRequest) {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("user");

      const isAuthPage =
        window.location.pathname === "/login" ||
        window.location.pathname === "/register";

      if (!isAuthPage) {
        window.location.assign("/login");
      }
    }
    return Promise.reject(error);
  }
);
