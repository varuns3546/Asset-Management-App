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

const createHierarchyItem = async (projectId, itemData, token) => {
    const response = await projectApi.post(`/${projectId}/hierarchy/items`, itemData);
    return response.data;
}

const updateHierarchyItem = async (projectId, itemId, itemData, token) => {
    const response = await projectApi.put(`/${projectId}/hierarchy/items/${itemId}`, itemData);
    return response.data;
}

const deleteHierarchyItem = async (projectId, itemId, token) => {
    const response = await projectApi.delete(`/${projectId}/hierarchy/items/${itemId}`);
    return response.data;
}

const getHierarchyItemTypes = async (projectId, token) => {
    const response = await projectApi.get(`/${projectId}/hierarchy/item-types`);
    return response.data;
}

const createHierarchyItemType = async (projectId, itemTypeData, token) => {
    const response = await projectApi.post(`/${projectId}/hierarchy/item-types`, itemTypeData);
    return response.data;
}

const updateHierarchyItemType = async (projectId, itemTypeId, itemTypeData, token) => {
    const response = await projectApi.put(`/${projectId}/hierarchy/item-types/${itemTypeId}`, itemTypeData);
    return response.data;
}

const deleteHierarchyItemType = async (projectId, itemTypeId, token) => {
    const response = await projectApi.delete(`/${projectId}/hierarchy/item-types/${itemTypeId}`);
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

const projectService = {
    getProjects,
    getProject,
    createProject,
    updateProject,
    deleteProject,
    getHierarchy,
    updateHierarchy,
    deleteHierarchy,
    createHierarchyItem,
    updateHierarchyItem,
    deleteHierarchyItem,
    getHierarchyItemTypes,
    createHierarchyItemType,
    updateHierarchyItemType,
    deleteHierarchyItemType,
    getProjectUsers,
    addUserToProject,
    removeUserFromProject
}

export default projectService;