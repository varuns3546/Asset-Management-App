import axios from 'axios';

const API_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

const generateReport = async (projectId, options, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    responseType: 'blob', // Important for file downloads
  };
  
  const response = await axios.post(
    `${API_URL}/api/reports/${projectId}/generate`,
    options,
    config
  );
  
  return response.data;
};

const downloadReport = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

const reportService = {
  generateReport,
  downloadReport,
};

export default reportService;

