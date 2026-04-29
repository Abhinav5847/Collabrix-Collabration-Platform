import axios from "axios";

export const api = axios.create({
  /**
   * IMPORTANT: 
   * We point to port 4000 (Nginx Gateway) and include the /api/ prefix.
   * This ensures Nginx routes the request to the Docker backend.
   */
  baseURL: "http://127.0.0.1:4000/api/", 
  
  withCredentials: true, // MANDATORY: Sends HttpOnly cookies (access_token)
  headers: {
    "Content-Type": "application/json",
  },
});

// 1. Request Interceptor
api.interceptors.request.use(
  (config) => {
    /**
     * Because we use HttpOnly cookies and are on the same domain (127.0.0.1:4000),
     * the browser automatically attaches the cookie. 
     * No need to manually set the Authorization header.
     */
    return config;
  },
  (error) => Promise.reject(error)
);

// 2. Response Interceptor: Handling Token Refresh & Session Expiry
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    /**
     * If the backend returns 401 (Unauthorized), the Access Token is likely expired.
     * We try to use the Refresh Token (stored in a cookie) to get a new Access Token.
     */
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Hits: http://127.0.0.1:4000/api/accounts/token/refresh/
        const res = await api.post("accounts/token/refresh/");

        if (res.status === 200) {
          /**
           * Success! The backend set a new access_token cookie.
           * We now retry the original request that failed.
           */
          return api(originalRequest);
        }
      } catch (refreshError) {
        /**
         * If refresh fails (e.g., Refresh Token expired), 
         * we clear the session and send the user to login.
         */
        console.warn("Session expired. Redirecting to login...");
        
        // Only redirect if we aren't already on the login page to avoid loops
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);