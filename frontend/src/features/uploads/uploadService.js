import axios from 'axios'
import {API_BASE_URL} from '@env'
//const API_URL = API_BASE_URL+'/api/entries/'
const API_URL = `${API_BASE_URL}/api/uploads/`

const uploadPhotos = async (photoData, token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
            // Don't set Content-Type for FormData, let axios set it automatically
        },
    }
    
    const response = await axios.post(API_URL + 'photos', photoData, config)
    return response.data.data || response.data
}

const uploadDocuments = async (documentData, token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
            // Don't set Content-Type for FormData, let axios set it automatically
        },
    }
    
    const response = await axios.post(API_URL + 'documents', documentData, config)
    return response.data.data || response.data
}

const getPhotos = async (token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    }
    const response = await axios.get(API_URL + 'photos', config)
    return response.data.data || response.data
}

const getDocuments = async (token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    }
    const response = await axios.get(API_URL + 'documents', config)
    return response.data.data || response.data
}

const getPhoto = async (fileName, token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    }
    const response = await axios.get(API_URL + 'photos/' + fileName, config)
    return response.data.data || response.data
}

const getDocument = async (fileName, token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    }
    const response = await axios.get(API_URL + 'documents/' + fileName, config)
    return response.data.data || response.data
}

const deletePhoto = async (fileName, token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    }
    const response = await axios.delete(API_URL + 'photos/' + fileName, config)
    return response.data.data || response.data
}

const deleteDocument = async (fileName, token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    }
    const response = await axios.delete(API_URL + 'documents/' + fileName, config)
    return response.data.data || response.data
}

const uploadService = {
    getDocuments,
    getPhotos,
    getDocument,
    getPhoto,
    uploadDocuments,
    uploadPhotos,
    deleteDocument,
    deletePhoto
}

export default uploadService