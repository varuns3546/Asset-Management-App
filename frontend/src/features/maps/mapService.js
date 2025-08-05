import axios from 'axios'
import {API_BASE_URL} from '@env'

const API_URL = `${API_BASE_URL}/api/maps/`

const createMap = async (mapData, token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    }

    const response = await axios.post(API_URL, mapData, config)
    return response.data
}

const createLocation = async (locationData, token) => { 
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    }

    const response = await axios.post(API_URL + 'locations', locationData, config)
    return response.data
}

const getMaps = async (token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    }
    const response = await axios.get(API_URL, config)
    return response.data
}

const getLocations = async (map_id, token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    }
    const response = await axios.get(API_URL + 'locations/' + map_id, config)
    return response.data
}

const mapService = {
    createMap,  
    createLocation,
    getMaps,
    getLocations,
}

export default mapService
