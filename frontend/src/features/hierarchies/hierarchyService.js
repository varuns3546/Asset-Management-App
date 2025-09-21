import axios from 'axios'

const API_URL = 'http://localhost:3001/api/hierarchies/'
// Get user entries
const getHierarchies = async (projectId, token) => {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  
    const response = await axios.get(`${API_URL}?project_id=${projectId}`, config)
    return response.data
  }

  
const getHierarchy = async (hierarchyId, projectId, token) => {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  
    const response = await axios.get(`${API_URL}/${hierarchyId}?project_id=${projectId}`, config);
    return response.data
  }

const createHierarchy = async (hierarchyData, projectId, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }

  const response = await axios.post(`${API_URL}?project_id=${projectId}`, hierarchyData, config);
  return response.data
}

const updateHierarchy = async (hierarchyId, projectId, hierarchyData, token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    }

    const response = await axios.put(`${API_URL}/${hierarchyId}?project_id=${projectId}`, hierarchyData, config);
    return response.data
}

// Delete user entry
const deleteHierarchy = async (hierarchyId, projectId, token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    }

    const response = await axios.delete(`${API_URL}/${hierarchyId}?project_id=${projectId}`, config);
    return response.data
}

const hierarchyService = {
    getHierarchies,
    getHierarchy,
    createHierarchy,
    updateHierarchy,
    deleteHierarchy,
}

export default hierarchyService