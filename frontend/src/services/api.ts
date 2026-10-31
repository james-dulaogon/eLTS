import axios from "axios";
import { useAuthStore } from "../context/useAuthStore";
import { notify } from "../context/NotificationContext";

const api = axios.create({
  baseURL:
    (import.meta as ImportMeta & { env: { VITE_API_BASE_URL?: string } }).env
      .VITE_API_BASE_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// =========================================================
// INTERCEPTOR 1: INJECT AUTH TOKEN & LAST ACTIVITY HEADERS
// =========================================================
api.interceptors.request.use(
  (config) => {
    const { token, lastActivity, updateActivity } = useAuthStore.getState();

    // Attach Bearer JWT security token
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    // Attach current activity epoch to let backend calculate idle bounds
    config.headers["x-last-activity"] = lastActivity.toString();

    // Increment local track state parameter instantly upon user request
    updateActivity();

    return config;
  },
  (error) => Promise.reject(error),
);

// =========================================================
// INTERCEPTOR 2: CAPTURE TIMEOUT AND LOGOUT LOGIC
// =========================================================
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { logout } = useAuthStore.getState();

    if (error.response) {
      const { status, data } = error.response;

      // Handle explicit 10-minute timeout or invalid token expirations
      if (
        status === 401 ||
        (status === 403 && data?.error?.code === "SESSION_IDLE_TIMEOUT")
      ) {
        notify(
          data?.error?.message ||
            "Your session has ended due to 10 minutes of inactivity.",
          "warning",
        );
        logout();
        window.setTimeout(() => {
          window.location.href = "/login"; // Redirect to workspace authentication gate
        }, 2000);
      }
    }
    return Promise.reject(error);
  },
);

export default api;
