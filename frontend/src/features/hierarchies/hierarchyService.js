import api from '../../utils/axiosInterceptor'

const API_URL = 'http://localhost:3001/api/projects/'

// Get hierarchy for a project
const getHierarchy = async (projectId, token) => {
    const response = await api.get(`${API_URL}${projectId}/hierarchy`)
    return response.data
}

// Update hierarchy for a project
const updateHierarchy = async (projectId, hierarchyData, token) => {
    const response = await api.put(`${API_URL}${projectId}/hierarchy`, hierarchyData);
    return response.data
}

// Delete hierarchy for a project
const deleteHierarchy = async (projectId, token) => {
    const response = await api.delete(`${API_URL}${projectId}/hierarchy`);
    return response.data
}

const hierarchyService = {
    getHierarchy,
    updateHierarchy,
    deleteHierarchy,
}

export default hierarchyService