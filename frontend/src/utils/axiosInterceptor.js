import axios from 'axios';

// Create axios instance
const api = axios.create();

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        if (userData.token) {
          config.headers.Authorization = `Bearer ${userData.token}`;
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Global response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      console.log('Token expired or invalid, redirecting to login...');
      
      // Clear localStorage
      localStorage.removeItem('user');
      localStorage.removeItem('selectedProject');
      
      // Redirect to login page
      window.location.href = '/';
    }
    
    return Promise.reject(error);
  }
);

export default api;
