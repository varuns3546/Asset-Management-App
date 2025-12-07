import axios from 'axios';
import store from '../app/store';
import { logout } from '../features/auth/authSlice';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Create axios instance
const shapesApi = axios.create({
  baseURL: `${API_URL}/api/leaflet-shapes`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
shapesApi.interceptors.request.use(
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
shapesApi.interceptors.response.use(
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

// Get all shapes for a project
const getShapesByProject = async (projectId) => {
  const response = await shapesApi.get(`/${projectId}`);
  return response.data;
};

// Save shapes for a project
const saveShapes = async (projectId, shapes) => {
  const response = await shapesApi.post(`/${projectId}`, { shapes });
  return response.data;
};

// Update a specific shape
const updateShape = async (shapeId, shapeData) => {
  const response = await shapesApi.put(`/${shapeId}`, shapeData);
  return response.data;
};

// Delete a specific shape
const deleteShape = async (shapeId) => {
  const response = await shapesApi.delete(`/${shapeId}`);
  return response.data;
};

// Delete all shapes for a project
const deleteAllShapesByProject = async (projectId) => {
  const response = await shapesApi.delete(`/project/${projectId}`);
  return response.data;
};

const leafletShapesService = {
  getShapesByProject,
  saveShapes,
  updateShape,
  deleteShape,
  deleteAllShapesByProject
};

export default leafletShapesService;

