import axios from 'axios';

const API_URL = `${process.env.REACT_APP_API_BASE_URL}/api/projects/`;

const getProjectMetrics = async (projectId, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };

  const response = await axios.get(
    `${API_URL}${projectId}/metrics`,
    config
  );
  return response.data;
};

const getAllProjectsMetrics = async (token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };

  const response = await axios.get(
    `${API_URL}all-projects/metrics`,
    config
  );
  return response.data;
};

const exportProjectData = async (projectId, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    },
    responseType: 'blob'
  };

  const response = await axios.get(
    `${API_URL}${projectId}/export`,
    config
  );
  
  // Create download link
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `project_export_${Date.now()}.json`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
  
  return { success: true };
};

const metricsService = {
  getProjectMetrics,
  getAllProjectsMetrics,
  exportProjectData
};

export default metricsService;

