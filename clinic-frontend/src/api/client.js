import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: baseURL.replace(/\/$/, "") + "/api/",
});

export function setAuthTokens({ access, refresh }) {
  if (access) localStorage.setItem("access", access);
  if (refresh) localStorage.setItem("refresh", refresh);
}

export function clearAuthTokens() {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
}

export function getAccessToken() {
  return localStorage.getItem("access");
}

export function getRefreshToken() {
  return localStorage.getItem("refresh");
}

// Attach access token
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
let refreshing = false;
let queue = [];

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    const status = err?.response?.status;

    if (status !== 401 || original?._retry) {
      throw err;
    }

    original._retry = true;
    const refresh = getRefreshToken();
    if (!refresh) throw err;

    if (refreshing) {
      return new Promise((resolve, reject) => {
        queue.push({ resolve, reject });
      }).then(() => api(original));
    }

    refreshing = true;
    try {
      const r = await axios.post(
        baseURL.replace(/\/$/, "") + "/api/auth/token/refresh/",
        { refresh }
      );
      const newAccess = r.data?.access;
      if (!newAccess) throw err;
      setAuthTokens({ access: newAccess });
      queue.forEach((p) => p.resolve());
      queue = [];
      return api(original);
    } catch (e) {
      queue.forEach((p) => p.reject(e));
      queue = [];
      clearAuthTokens();
      throw e;
    } finally {
      refreshing = false;
    }
  }
);
