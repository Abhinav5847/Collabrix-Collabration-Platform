import axios from "axios";

/**
 * AI API Instance
 * Points to the /ai/ prefix in Nginx which routes to ai_service:8001
 */
export const aiApi = axios.create({
  // Nginx listens on port 80 (or 4000 if that's your mapped host port)
  // We use /ai/ so Nginx knows to send this to the FastAPI service
  baseURL: "http://127.0.0.1:4000/ai/", 
  
  withCredentials: true, // IMPORTANT: Passes the access_token cookie to the AI service
  headers: {
    "Content-Type": "application/json",
  },
});

// Response Interceptor: If AI returns 401, trigger the same refresh logic
aiApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // IMPORTANT: Refresh happens via the MAIN backend (Django), not the AI service
        // We use a relative path or the main 'api' instance here
        await axios.post("http://127.0.0.1:4000/api/accounts/token/refresh/", {}, { withCredentials: true });

        // Retry the AI request now that the cookie is updated
        return aiApi(originalRequest);
      } catch (refreshError) {
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);