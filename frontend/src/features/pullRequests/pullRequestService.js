import axios from 'axios';

// Create a separate axios instance for pull request operations
const pullRequestApi = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL + '/api/pull-requests',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
pullRequestApi.interceptors.request.use(
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
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle 401 errors
pullRequestApi.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      console.log('Token expired or invalid, redirecting to login...');
      localStorage.removeItem('user');
      localStorage.removeItem('selectedProject');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

const createPullRequest = async (prData, token) => {
  const response = await pullRequestApi.post('', prData);
  return response.data;
};

const getPullRequests = async (filters = {}, token) => {
  const params = new URLSearchParams();
  if (filters.projectId) params.append('projectId', filters.projectId);
  if (filters.status) params.append('status', filters.status);
  if (filters.userId) params.append('userId', filters.userId);
  
  const response = await pullRequestApi.get(`?${params.toString()}`);
  return response.data;
};

const getPullRequest = async (prId, token) => {
  const response = await pullRequestApi.get(`/${prId}`);
  return response.data;
};

const updatePullRequestStatus = async (prId, status, token) => {
  const response = await pullRequestApi.patch(`/${prId}`, { status });
  return response.data;
};

const mergePullRequest = async (prId, resolutions = [], token) => {
  const response = await pullRequestApi.post(`/${prId}/merge`, { resolutions });
  return response.data;
};

const rejectPullRequest = async (prId, token) => {
  const response = await pullRequestApi.post(`/${prId}/reject`);
  return response.data;
};

const getPullRequestDiff = async (prId, token) => {
  const response = await pullRequestApi.get(`/${prId}/diff`);
  return response.data;
};

const addPullRequestComment = async (prId, commentData, token) => {
  const response = await pullRequestApi.post(`/${prId}/comments`, commentData);
  return response.data;
};

const getPullRequestComments = async (prId, token) => {
  const response = await pullRequestApi.get(`/${prId}/comments`);
  return response.data;
};

const addReview = async (prId, reviewData, token) => {
  const response = await pullRequestApi.post(`/${prId}/reviews`, reviewData);
  return response.data;
};

const pullRequestService = {
  createPullRequest,
  getPullRequests,
  getPullRequest,
  updatePullRequestStatus,
  mergePullRequest,
  rejectPullRequest,
  getPullRequestDiff,
  addPullRequestComment,
  getPullRequestComments,
  addReview
};

export default pullRequestService;

