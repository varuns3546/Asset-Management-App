import axios from 'axios';

const API_URL = `${process.env.REACT_APP_API_BASE_URL}/api/questionnaire/`;

// Get asset questionnaire with attributes
const getAssetQuestionnaire = async (projectId, assetId, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };

  const response = await axios.get(
    `${API_URL}${projectId}/asset/${assetId}`,
    config
  );
  return response.data;
};

// Submit questionnaire responses
const submitResponses = async (projectId, assetId, responses, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };

  const response = await axios.post(
    `${API_URL}${projectId}/asset/${assetId}/submit`,
    { responses },
    config
  );
  return response.data;
};

// Get all responses for a project
const getProjectResponses = async (projectId, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };

  const response = await axios.get(
    `${API_URL}${projectId}/responses`,
    config
  );
  return response.data;
};

// Get asset types for a project
const getAssetTypes = async (projectId, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };

  const response = await axios.get(
    `${process.env.REACT_APP_API_BASE_URL}/api/projects/${projectId}/hierarchy/feature-types`,
    config
  );
  return response.data;
};

// Upload photo for questionnaire
const uploadPhoto = async (projectId, assetId, attributeId, file, token) => {
  const formData = new FormData();
  formData.append('photo', file);
  formData.append('attributeId', attributeId);

  const config = {
    headers: {
      'Content-Type': 'multipart/form-data',
      Authorization: `Bearer ${token}`
    }
  };

  const response = await axios.post(
    `${API_URL}${projectId}/asset/${assetId}/upload-photo`,
    formData,
    config
  );
  return response.data;
};

// Delete photo from storage
const deletePhoto = async (filePath, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };

  const response = await axios.delete(
    `${API_URL}photo?path=${encodeURIComponent(filePath)}`,
    config
  );
  return response.data;
};

const questionnaireService = {
  getAssetQuestionnaire,
  submitResponses,
  getProjectResponses,
  getAssetTypes,
  uploadPhoto,
  deletePhoto
};

export default questionnaireService;

