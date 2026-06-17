import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30s default timeout
});

// Request interceptor — attach JWT token + extend timeout for AI endpoints
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("synapseai_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // AI chat and processing can take a long time (Ollama inference)
    if (config.url?.includes("/ai/")) {
      config.timeout = 180000; // 3 minutes for AI requests
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 (token expired)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("synapseai_token");
      localStorage.removeItem("synapseai_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
