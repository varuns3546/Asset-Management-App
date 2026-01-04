import axios from 'axios';

// Create a separate axios instance for project operations to avoid circular dependency
const projectApi = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL + '/api/projects',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
projectApi.interceptors.request.use(
  (config) => {
    // Get token from localStorage
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
projectApi.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      console.log('Token expired or invalid, redirecting to login...');
      
      // Clear localStorage
      localStorage.removeItem('user');
      localStorage.removeItem('selectedProject');
      
      // Redirect to login page
      window.location.href = '/';
    }
    
    return Promise.reject(error);
  }
);

const getProjects = async (token) => {
    const response = await projectApi.get('');
    return response.data;
}

const getSharedProjects = async (token) => {
    const response = await projectApi.get('/shared');
    return response.data;
}

const getProject = async (projectId, token) => {
    const response = await projectApi.get(`/${projectId}`);
    return response.data;
}

const createProject = async (projectData, token) => {
    const response = await projectApi.post('', projectData);
    return response.data;
}

const updateProject = async (projectId, projectData, token) => {
    const response = await projectApi.put(`/${projectId}`, projectData);
    return response.data;
}

const deleteProject = async (projectId, token) => {
    const response = await projectApi.delete(`/${projectId}`);
    return response.data;
}

const getHierarchy = async (projectId, token) => {
    try {
        const response = await projectApi.get(`/${projectId}/hierarchy`)
        return response.data
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}

const updateHierarchy = async (projectId, hierarchyData, token) => {
    const response = await projectApi.put(`/${projectId}/hierarchy`, hierarchyData);
    return response.data;
}

const deleteHierarchy = async (projectId, token) => {
    const response = await projectApi.delete(`/${projectId}/hierarchy`);
    return response.data;
}

const createFeature = async (projectId, featureData, token) => {
    const response = await projectApi.post(`/${projectId}/hierarchy/features`, featureData);
    return response.data;
}

const updateFeature = async (projectId, featureId, featureData, token) => {
    const response = await projectApi.put(`/${projectId}/hierarchy/features/${featureId}`, featureData);
    return response.data;
}

const deleteFeature = async (projectId, featureId, token) => {
    const response = await projectApi.delete(`/${projectId}/hierarchy/features/${featureId}`);
    return response.data;
}

const getFeatureTypes = async (projectId, token) => {
    const response = await projectApi.get(`/${projectId}/hierarchy/feature-types`);
    return response.data;
}

const createFeatureType = async (projectId, featureTypeData, token) => {
    const response = await projectApi.post(`/${projectId}/hierarchy/feature-types`, featureTypeData);
    return response.data;
}

const updateFeatureType = async (projectId, featureTypeId, featureTypeData, token) => {
    const response = await projectApi.put(`/${projectId}/hierarchy/feature-types/${featureTypeId}`, featureTypeData);
    return response.data;
}

const deleteFeatureType = async (projectId, featureTypeId, token) => {
    const response = await projectApi.delete(`/${projectId}/hierarchy/feature-types/${featureTypeId}`);
    return response.data;
}

const uploadHierarchyFile = async (projectId, file, token) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await projectApi.post(`/${projectId}/hierarchy/upload`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
}

const importHierarchyData = async (projectId, mappings, data, token) => {
    const response = await projectApi.post(`/${projectId}/hierarchy/import`, {
        mappings,
        data
    });
    return response.data;
}

const getProjectUsers = async (projectId, token) => {
    const response = await projectApi.get(`/${projectId}/users`);
    return response.data;
}

const addUserToProject = async (projectId, userData, token) => {
    const response = await projectApi.post(`/${projectId}/users`, userData);
    return response.data;
}

const removeUserFromProject = async (projectId, userId, token) => {
    const response = await projectApi.delete(`/${projectId}/users/${userId}`);
    return response.data;
}

// User profile service functions - use user API endpoint
const getUserSelectedProject = async () => {
    // Get token from localStorage
    const user = localStorage.getItem('user');
    if (!user) {
        throw new Error('User not authenticated');
    }
    const userData = JSON.parse(user);
    const token = userData.token;

    const userApi = axios.create({
        baseURL: process.env.REACT_APP_API_BASE_URL + '/api/users',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
    });
    const response = await userApi.get('/selected-project');
    return response.data;
}

const setUserSelectedProject = async (projectId) => {
    // Get token from localStorage
    const user = localStorage.getItem('user');
    if (!user) {
        throw new Error('User not authenticated');
    }
    const userData = JSON.parse(user);
    const token = userData.token;

    const userApi = axios.create({
        baseURL: process.env.REACT_APP_API_BASE_URL + '/api/users',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
    });
    const response = await userApi.put('/selected-project', { projectId });
    return response.data;
}

const cloneProject = async (projectId, cloneData, token) => {
    const response = await projectApi.post(`/${projectId}/clone`, cloneData);
    return response.data;
}

const getMasterProjects = async (token) => {
    const response = await projectApi.get('/masters');
    return response.data;
}

const setProjectAsMaster = async (projectId, master, token) => {
    const response = await projectApi.patch(`/${projectId}/master`, { master });
    return response.data;
}

const uploadMapSnapshot = async (projectId, snapshotFile, token) => {
    const formData = new FormData();
    formData.append('snapshot', snapshotFile);
    
    const response = await projectApi.post(`/${projectId}/snapshot`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
}

const getSurveyStatistics = async (projectId, token) => {
    const response = await projectApi.get(`/${projectId}/survey-statistics`);
    return response.data;
}

const projectService = {
    getProjects,
    getSharedProjects,
    getProject,
    createProject,
    updateProject,
    deleteProject,
    getHierarchy,
    updateHierarchy,
    deleteHierarchy,
    createFeature,
    updateFeature,
    deleteFeature,
    getFeatureTypes,
    createFeatureType,
    updateFeatureType,
    deleteFeatureType,
    uploadHierarchyFile,
    importHierarchyData,
    getProjectUsers,
    addUserToProject,
    removeUserFromProject,
    getUserSelectedProject,
    setUserSelectedProject,
    cloneProject,
    getMasterProjects,
    setProjectAsMaster,
    uploadMapSnapshot,
    getSurveyStatistics
}

export default projectService;