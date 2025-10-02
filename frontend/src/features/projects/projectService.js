import api from '../../utils/axiosInterceptor';

const API_URL = 'http://localhost:3001/api/projects'


const getProjects = async (token) => {
    const response = await api.get(API_URL);
    return response.data;
}

const getProject = async (projectId, token) => {
    const response = await api.get(`${API_URL}/${projectId}`);
    return response.data;
}

const createProject = async (projectData, token) => {
    const response = await api.post(API_URL, projectData);
    return response.data;
}

const updateProject = async (projectId, projectData, token) => {
    const response = await api.put(`${API_URL}/${projectId}`, projectData);
    return response.data;
}

const deleteProject = async (projectId, token) => {
    const response = await api.delete(`${API_URL}/${projectId}`);
    return response.data;
}

const getHierarchy = async (projectId, token) => {
    try {
        const response = await api.get(`${API_URL}/${projectId}/hierarchy`)
        return response.data
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}

const updateHierarchy = async (projectId, hierarchyData, token) => {
    const response = await api.put(`${API_URL}/${projectId}/hierarchy`, hierarchyData);
    return response.data;
}

const deleteHierarchy = async (projectId, token) => {
    const response = await api.delete(`${API_URL}/${projectId}/hierarchy`);
    return response.data;
}

const createHierarchyItem = async (projectId, itemData, token) => {
    const response = await api.post(`${API_URL}/${projectId}/hierarchy/items`, itemData);
    return response.data;
}

const deleteHierarchyItem = async (projectId, itemId, token) => {
    const response = await api.delete(`${API_URL}/${projectId}/hierarchy/items/${itemId}`);
    return response.data;
}

const getHierarchyItemTypes = async (projectId, token) => {
    const response = await api.get(`${API_URL}/${projectId}/hierarchy/item-types`);
    return response.data;
}

const updateHierarchyItemTypes = async (projectId, itemTypesData, token) => {
    const response = await api.put(`${API_URL}/${projectId}/hierarchy/item-types`, itemTypesData);
    return response.data;
}

const createHierarchyItemType = async (projectId, itemTypeData, token) => {
    const response = await api.post(`${API_URL}/${projectId}/hierarchy/item-types`, itemTypeData);
    return response.data;
}

const deleteHierarchyItemType = async (projectId, itemTypeId, token) => {
    const response = await api.delete(`${API_URL}/${projectId}/hierarchy/item-types/${itemTypeId}`);
    return response.data;
}

const getProjectUsers = async (projectId, token) => {
    const response = await api.get(`${API_URL}/${projectId}/users`);
    return response.data;
}

const addUserToProject = async (projectId, userData, token) => {
    const response = await api.post(`${API_URL}/${projectId}/users`, userData);
    return response.data;
}

const removeUserFromProject = async (projectId, userId, token) => {
    const response = await api.delete(`${API_URL}/${projectId}/users/${userId}`);
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
    deleteHierarchyItem,
    getHierarchyItemTypes,
    updateHierarchyItemTypes,
    createHierarchyItemType,
    deleteHierarchyItemType,
    getProjectUsers,
    addUserToProject,
    removeUserFromProject
}

export default projectService;