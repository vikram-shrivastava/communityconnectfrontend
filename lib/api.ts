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

    // 🌟 FIX: Do not intercept requests made to the authentication endpoints!
    // If a user types a wrong password, we want the component to handle the 401 error, 
    // not the interceptor.
    const isAuthRoute = originalRequest.url?.includes('/auth/login') || 
                        originalRequest.url?.includes('/auth/register') || 
                        originalRequest.url?.includes('/auth/verify');

    // If 401 Unauthorized, we haven't retried yet, AND it's not an auth route
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
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
    
    // For all auth routes and non-401 errors, just pass the error back to the component
    return Promise.reject(error);
  }
);

export default api;