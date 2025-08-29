import axios from 'axios';

const API_URL = 'http://localhost:5000/api/projects';

const getProject = async (projectId) => {
    const response = await axios.get(`${API_URL}/${projectId}`);
    return response.data;
}

const getProjects = async () => {
    const response = await axios.get(API_URL);
    return response.data;
}

const createProject = async (projectData) => {
    const response = await axios.post(API_URL, projectData);
    return response.data;
}

const deleteProject = async (projectId) => {
    const response = await axios.delete(`${API_URL}/${projectId}`);
    return response.data;
}

const updateProject = async (projectId, projectData) => {
    const response = await axios.put(`${API_URL}/${projectId}`, projectData);
    return response.data;
}


const projectService = {
    getProject,
    getProjects,        
    createProject,
    deleteProject,
    updateProject
}   