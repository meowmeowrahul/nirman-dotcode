import axios from "axios";
import { useAuthStore } from "../store/authStore";

const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL || "/api";

export const api = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const hasToken = Boolean(useAuthStore.getState().token);

    if (hasToken && (status === 401 || status === 403)) {
      useAuthStore.getState().logout();
    }

    return Promise.reject(error);
  },
);
