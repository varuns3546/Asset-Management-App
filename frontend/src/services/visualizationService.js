import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

const visualizationApi = axios.create({
  baseURL: `${API_BASE_URL}/api/visualization`,
});

const getQuestionnaireStats = async (projectId, token) => {
  const response = await visualizationApi.get(`/${projectId}/questionnaire-stats`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.data;
};

const getAssetStats = async (projectId, token) => {
  const response = await visualizationApi.get(`/${projectId}/asset-stats`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.data;
};

const getProjectStats = async (projectId, token) => {
  const response = await visualizationApi.get(`/${projectId}/project-stats`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.data;
};

const visualizationService = {
  getQuestionnaireStats,
  getAssetStats,
  getProjectStats
};

export default visualizationService;

