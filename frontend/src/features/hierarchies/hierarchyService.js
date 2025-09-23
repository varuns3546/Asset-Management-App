import api from '../../utils/axiosInterceptor'

const API_URL = 'http://localhost:3001/api/projects/'

// Get hierarchy for a project
const getHierarchies = async (projectId, token) => {
    const response = await api.get(`${API_URL}${projectId}/hierarchy`)
    return response.data
}

// Create hierarchy for a project
const createHierarchy = async (hierarchyData, projectId, token) => {
    const response = await api.post(`${API_URL}${projectId}/hierarchy`, hierarchyData);
    return response.data
}

// Update hierarchy for a project
const updateHierarchy = async (hierarchyId, projectId, hierarchyData, token) => {
    const response = await api.put(`${API_URL}${projectId}/hierarchy`, hierarchyData);
    return response.data
}

// Delete hierarchy for a project
const deleteHierarchy = async (hierarchyId, projectId, token) => {
    const response = await api.delete(`${API_URL}${projectId}/hierarchy`);
    return response.data
}

const hierarchyService = {
    getHierarchies,
    createHierarchy,
    updateHierarchy,
    deleteHierarchy,
}

export default hierarchyService