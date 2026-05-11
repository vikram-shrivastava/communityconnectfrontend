import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Crucial for sending/receiving httpOnly cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Axios interceptor to handle token expiration gracefully
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 Unauthorized and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Hit the refresh endpoint. The browser automatically sends the httpOnly refreshToken cookie.
        await axios.post(`${API_URL}/auth/refresh-token`, {}, { withCredentials: true });
        
        // If successful, the backend attached a new accessToken cookie. Retry the original request.
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails (token expired/invalid), redirect to login
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login';
        }
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;