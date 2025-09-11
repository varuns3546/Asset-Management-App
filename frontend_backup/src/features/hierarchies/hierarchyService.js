import axios from 'axios'

const API_URL = `${process.env.API_BASE_URL}/api/hierarchies/`

// Get user entries
const getHierarchies = async (token) => {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  
    const response = await axios.get(API_URL, config)
    return response.data
  }

  
const getHierarchy = async (hierarchyId, token) => {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  
    const response = await axios.get(API_URL + hierarchyId, config)
    return response.data
  }

const createHierarchy = async (hierarchyData, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }

  const response = await axios.post(API_URL, hierarchyData, config)
  return response.data
}

const updateHierarchy = async (hierarchyId, hierarchyData, token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    }

    const response = await axios.put(API_URL + hierarchyId, hierarchyData, config)
    return response.data
}

// Delete user entry
const deleteHierarchy = async (hierarchyId, token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    }

    const response = await axios.delete(API_URL + hierarchyId, config)
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