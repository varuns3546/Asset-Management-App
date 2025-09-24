import api from '../../utils/axiosInterceptor';

const API_URL = 'http://localhost:3001/api/projects/'
const getProject = async (projectId, token) => {
    const response = await api.get(`${API_URL}/${projectId}`);
    return response.data;
}

const getProjects = async (token) => {
    const response = await api.get(API_URL);
    return response.data;
}

const createProject = async (projectData, token) => {
    const response = await api.post(API_URL, projectData);
    return response.data;
}

const deleteProject = async (projectId, token) => {
    const response = await api.delete(`${API_URL}/${projectId}`);
    return response.data;
}
    
const updateProject = async (projectId, projectData, token) => {
    const response = await api.put(`${API_URL}/${projectId}`, projectData);
    return response.data;
}

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


const projectService = {
    getProject,
    getProjects,        
    createProject,
    deleteProject,  
    updateProject,
    getHierarchy,
    updateHierarchy,
    deleteHierarchy
}   

export default projectService