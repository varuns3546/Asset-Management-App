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

// Export layers to GeoPackage
export const exportLayersToGeoPackage = async (projectId, layerIds = [], projectName = null) => {
  try {
    const response = await gisApi.post(
      `/${projectId}/export`,
      { layerIds },
      {
        responseType: 'blob' // Important for file downloads
      }
    );

    // Determine filename - prefer project name if provided, otherwise try to extract from headers
    let filename = `export_${Date.now()}.gpkg`;
    
    if (projectName) {
      // Use provided project name
      const sanitized = projectName.replace(/[^a-zA-Z0-9_-]/g, '_');
      filename = `${sanitized}.gpkg`;
    } else {
      // Try to extract from Content-Disposition header
      let contentDisposition = null;
      if (response.headers) {
        // Try multiple ways to access headers (axios may store them differently with blob responses)
        contentDisposition = response.headers['content-disposition'] || 
                            response.headers['Content-Disposition'] ||
                            (typeof response.headers.get === 'function' ? response.headers.get('content-disposition') : null);
      }
      
      if (contentDisposition) {
        // Match filename="value" or filename=value (handles both quoted and unquoted)
        const filenameMatch = contentDisposition.match(/filename\*?=["']?([^"';]+)["']?/i);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].trim();
        }
      }
    }
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return { success: true, message: 'Export completed successfully' };
  } catch (error) {
    console.error('Error exporting layers:', error);
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
  deleteFeature,
  exportLayersToGeoPackage
};

