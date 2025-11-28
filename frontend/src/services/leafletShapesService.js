import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Get auth token from localStorage
const getAuthToken = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  return user?.token;
};

// Get all shapes for a project
const getShapesByProject = async (projectId) => {
  const token = getAuthToken();
  const response = await axios.get(
    `${API_URL}/api/leaflet-shapes/${projectId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
  return response.data;
};

// Save shapes for a project
const saveShapes = async (projectId, shapes) => {
  const token = getAuthToken();
  const response = await axios.post(
    `${API_URL}/api/leaflet-shapes/${projectId}`,
    { shapes },
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
  return response.data;
};

// Update a specific shape
const updateShape = async (shapeId, shapeData) => {
  const token = getAuthToken();
  const response = await axios.put(
    `${API_URL}/api/leaflet-shapes/${shapeId}`,
    shapeData,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
  return response.data;
};

// Delete a specific shape
const deleteShape = async (shapeId) => {
  const token = getAuthToken();
  const response = await axios.delete(
    `${API_URL}/api/leaflet-shapes/${shapeId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
  return response.data;
};

// Delete all shapes for a project
const deleteAllShapesByProject = async (projectId) => {
  const token = getAuthToken();
  const response = await axios.delete(
    `${API_URL}/api/leaflet-shapes/project/${projectId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
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

