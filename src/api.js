import axios from "axios";

/**
 * Single axios instance for the whole app.
 *
 * The backend's auth middleware only accepts `Authorization: Bearer <token>`,
 * so attaching the header in one interceptor keeps every call consistent
 * instead of each page hand-rolling (and sometimes forgetting) the prefix.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? "https://gourmet-event-backend.onrender.com/api/v1" : "/api/v1"),
  withCredentials: true
});

export const getToken = () =>
  sessionStorage.getItem("adminToken") ||
  sessionStorage.getItem("userToken") ||
  "";

export const isAdmin = () => !!sessionStorage.getItem("adminToken");

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    // An expired session should drop the user back to the right login screen
    // rather than failing silently behind a generic error message.
    if (error.response?.status === 401) {
      const wasAdmin = isAdmin();
      sessionStorage.removeItem("adminToken");
      sessionStorage.removeItem("userToken");
      if (!window.location.pathname.match(/^\/(admin)?$/)) {
        window.location.replace(wasAdmin ? "/admin" : "/");
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Route a remote image through our own origin.
 *
 * S3 serves the objects publicly but without CORS headers, so a browser will
 * not paint them when `crossOrigin` is set — and html2canvas taints the canvas
 * when it isn't. Proxying makes them same-origin, so they display and export.
 */
export const imageUrl = (url) => {
  if (!url) return "";
  // Bundled assets and blob previews are already same-origin — leave them be.
  if (!/^https?:\/\//i.test(url)) return url;
  const base = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? "https://gourmet-event-backend.onrender.com/api/v1" : "/api/v1");
  return `${base}/media/image?url=${encodeURIComponent(url)}`;
};

/** Pull a human-readable message out of an axios error. */
export const errorMessage = (err, fallback = "Something went wrong") =>
  err?.response?.data?.message || err?.message || fallback;

export default api;
