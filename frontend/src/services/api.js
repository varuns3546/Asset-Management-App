import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Update this URL to match your backend server
const BASE_URL = 'https://opulent-happiness-976vx9gg4wg4hx5j4-3000.app.github.dev/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

// Add token to requests if available
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token from storage:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  login: async (loginData) => {
    try {
      console.log('loginData in api.js', loginData)
      console.log('attempting login')
      const response = await api.post('/auth/login', loginData);
      console.log('response in api.js', response)
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error' };
    }
  },

  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error' };
    }
  },
};

export const entriesAPI = {
  
  getEntries: async (userId) => {
    try {
      const response = await api.get(`/data/${userId}/entries`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error' };
    }
  },

  
  createEntry: async (userId, entryData) => {
    try {
      const response = await api.post(`/data/${userId}/entries`, entryData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error' };
    }
  },

  deleteEntry: async (userId, entryId) => {
    try {
      const response = await api.delete(`/data/${userId}/entries/${entryId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error' };
    }
  },
  
};



export default api;