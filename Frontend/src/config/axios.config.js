import axios from 'axios';

// Use relative URL in dev (goes through Vite proxy), absolute URL in production
const API_BASE_URL = import.meta.env.PROD 
  ? (import.meta.env.VITE_API_URL || 'https://whisperdesk.onrender.com/api/v1')
  : '/api/v1';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true, // Important for cookies/sessions
});

// Request interceptor - token is sent via cookies from backend
axiosInstance.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // If 401, just clear user data - let the app handle routing
    // Don't redirect here to avoid infinite reload loops
    if (error.response?.status === 401) {
      localStorage.removeItem('user');
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
