import axios from 'axios';

const API_URL = 'http://localhost:3001/api/questionnaire/';

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

const questionnaireService = {
  getAssetQuestionnaire,
  submitResponses,
  getProjectResponses
};

export default questionnaireService;

