import axios from 'axios';

const API_URL = `${process.env.REACT_APP_API_BASE_URL}/api/questionnaire/`;

// Get asset survey with attributes
const getAssetSurvey = async (projectId, assetId, token) => {
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

// Submit attribute values
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

// Upload photo for survey
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

// Preview import from spreadsheet
const previewImport = async (projectId, file, token) => {
  const formData = new FormData();
  formData.append('file', file);

  const config = {
    headers: {
      'Content-Type': 'multipart/form-data',
      Authorization: `Bearer ${token}`
    }
  };

  const response = await axios.post(
    `${API_URL}${projectId}/import/preview`,
    formData,
    config
  );
  return response.data;
};

// Import responses from spreadsheet
const importResponses = async (projectId, file, assetColumn, attributeMappings, token) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('assetColumn', assetColumn);
  formData.append('attributeMappings', JSON.stringify(attributeMappings));

  const config = {
    headers: {
      'Content-Type': 'multipart/form-data',
      Authorization: `Bearer ${token}`
    }
  };

  const response = await axios.post(
    `${API_URL}${projectId}/import`,
    formData,
    config
  );
  return response.data;
};

// Download import template
const downloadTemplate = async (projectId, assetTypeId, token) => {
  if (!projectId) {
    throw new Error('Project ID is required');
  }
  
  if (!token) {
    throw new Error('Authentication token is required');
  }

  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    },
    responseType: 'blob'
  };

  const url = assetTypeId 
    ? `${API_URL}${projectId}/import/template?assetTypeId=${assetTypeId}`
    : `${API_URL}${projectId}/import/template`;

  const response = await axios.get(url, config);
  
  // Check if response is an error (JSON error response from server)
  if (response.data.type === 'application/json') {
    const text = await response.data.text();
    const errorData = JSON.parse(text);
    throw new Error(errorData.error || 'Failed to download template');
  }
  
  // Create download link
  const blob = new Blob([response.data], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = 'survey_template.xlsx';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
  
  return { success: true };
};

const surveyService = {
  getAssetSurvey,
  submitResponses,
  getProjectResponses,
  getAssetTypes,
  uploadPhoto,
  deletePhoto,
  previewImport,
  importResponses,
  downloadTemplate
};

export default surveyService;

