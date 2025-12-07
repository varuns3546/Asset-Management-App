import axios from 'axios';
import store from '../app/store';
import { logout } from '../features/auth/authSlice';

const API_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

// Create axios instance for file operations
const fileApi = axios.create({
  baseURL: `${API_URL}/api/files`,
});

// Add request interceptor to include auth token
fileApi.interceptors.request.use(
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
fileApi.interceptors.response.use(
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

// Upload a file to Supabase Storage
export const uploadFile = async (projectId, file, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fileApi.post(`/${projectId}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress ? (progressEvent) => {
      const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
      onProgress(percentCompleted);
    } : undefined
  });
  
  return response.data;
};

// List all files for a project
export const listFiles = async (projectId) => {
  const response = await fileApi.get(`/${projectId}`);
  return response.data;
};

// Get signed URL for a file (for download/preview)
export const getFileUrl = async (projectId, fileId) => {
  const response = await fileApi.get(`/${projectId}/${fileId}/url`);
  return response.data;
};

// Download file content (returns base64 buffer)
export const downloadFile = async (projectId, fileId) => {
  const response = await fileApi.get(`/${projectId}/${fileId}/download`);
  return response.data;
};

// Delete a file
export const deleteFile = async (projectId, fileId) => {
  const response = await fileApi.delete(`/${projectId}/${fileId}`);
  return response.data;
};

// Helper: Convert base64 to File object
export const base64ToFile = (base64, fileName, mimeType) => {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new File([byteArray], fileName, { type: mimeType });
};

// Helper: Format file size
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Helper: Get file icon based on mime type
export const getFileIcon = (mimeType) => {
  if (!mimeType) return '📄';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('csv')) return '📊';
  if (mimeType.includes('image')) return '🖼️';
  if (mimeType.includes('pdf')) return '📕';
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
  if (mimeType.includes('zip') || mimeType.includes('archive')) return '📦';
  return '📄';
};

export default {
  uploadFile,
  listFiles,
  getFileUrl,
  downloadFile,
  deleteFile,
  base64ToFile,
  formatFileSize,
  getFileIcon
};

