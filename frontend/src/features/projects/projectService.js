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


const projectService = {
    getProject,
    getProjects,        
    createProject,
    deleteProject,
    updateProject
}   

export default projectService