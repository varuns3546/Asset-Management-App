import axios from 'axios';
import store from '../app/store';
import { logout } from '../features/auth/authSlice';

const API_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

// Create axios instance with interceptors
const gisApi = axios.create({
  baseURL: `${API_URL}/api/gis`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
gisApi.interceptors.request.use(
  (config) => {
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
  (error) => Promise.reject(error)
);

// Add response interceptor to handle 401 errors (session expired)
gisApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.log('Session expired, logging out...');
      store.dispatch(logout());
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Get all layers for a project
export const getGisLayers = async (projectId) => {
  try {
    const response = await gisApi.get(`/${projectId}/layers`);
    return response.data;
  } catch (error) {
    console.error('Error fetching GIS layers:', error);
    throw error;
  }
};

// Create a new layer
export const createGisLayer = async (projectId, layerData) => {
  try {
    const response = await gisApi.post(`/${projectId}/layers`, layerData);
    return response.data;
  } catch (error) {
    console.error('Error creating GIS layer:', error);
    throw error;
  }
};

// Update a layer
export const updateGisLayer = async (projectId, layerId, updates) => {
  try {
    const response = await gisApi.put(`/${projectId}/layers/${layerId}`, updates);
    return response.data;
  } catch (error) {
    console.error('Error updating GIS layer:', error);
    throw error;
  }
};

// Delete a layer
export const deleteGisLayer = async (projectId, layerId) => {
  try {
    const response = await gisApi.delete(`/${projectId}/layers/${layerId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting GIS layer:', error);
    throw error;
  }
};

// Get all features for a layer
export const getLayerFeatures = async (projectId, layerId) => {
  try {
    const response = await gisApi.get(`/${projectId}/layers/${layerId}/features`);
    return response.data;
  } catch (error) {
    console.error('Error fetching layer features:', error);
    throw error;
  }
};

// Add a feature to a layer
export const addFeature = async (projectId, layerId, featureData) => {
  try {
    const response = await gisApi.post(`/${projectId}/layers/${layerId}/features`, featureData);
    return response.data;
  } catch (error) {
    console.error('Error adding feature:', error);
    throw error;
  }
};

// Delete a feature
export const deleteFeature = async (projectId, layerId, featureId) => {
  try {
    const response = await gisApi.delete(`/${projectId}/layers/${layerId}/features/${featureId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting feature:', error);
    throw error;
  }
};

export default {
  getGisLayers,
  createGisLayer,
  updateGisLayer,
  deleteGisLayer,
  getLayerFeatures,
  addFeature,
  deleteFeature
};

