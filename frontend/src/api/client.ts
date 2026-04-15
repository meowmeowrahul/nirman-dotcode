import axios from "axios";
import { useAuthStore } from "../store/authStore";

const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

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
