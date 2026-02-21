import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
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
