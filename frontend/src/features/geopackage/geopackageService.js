import axios from 'axios'
import {API_BASE_URL} from '@env'
import { Platform } from 'react-native'

const API_URL = `${API_BASE_URL}/api/geopackage/`
console.log('Service: API_BASE_URL:', API_BASE_URL);
console.log('Service: Full API URL:', API_URL);

// Export data as GeoPackage
const exportGeoPackage = async (token) => {
  console.log('Service: Starting export with token:', !!token);
  
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    responseType: 'blob', // Important for file downloads
  }

  try {
    console.log('Service: Making API call to:', API_URL + 'export');
    const response = await axios.get(API_URL + 'export', config)
    console.log('Service: API call successful, response size:', response.data.size);
    console.log('Service: Response headers:', response.headers);
    
    // Handle file download based on platform
    if (Platform.OS === 'web') {
      console.log('Service: Processing for web platform');
      
      // Web platform - use blob download
      const blob = new Blob([response.data], { type: 'application/geopackage+sqlite3' })
      console.log('Service: Blob created, size:', blob.size);
      
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      
      // Get filename from response headers or create default
      const contentDisposition = response.headers['content-disposition']
      let filename = 'asset_data_export.gpkg'
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }
      
      console.log('Service: Downloading file as:', filename);
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      console.log('Service: Download triggered successfully');
      return { success: true, filename }
    } else {
      console.log('Service: Processing for mobile platform');
      
      // Mobile platform - return the blob data for manual handling
      const contentDisposition = response.headers['content-disposition']
      let filename = 'asset_data_export.gpkg'
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }
      
      return { 
        success: true, 
        filename,
        data: response.data,
        message: 'GeoPackage file ready for download. On mobile, you may need to manually save the file.'
      }
    }
  } catch (error) {
    console.error('Service: Export error:', error);
    console.error('Service: Error response:', error.response);
    throw error;
  }
}

// Get export statistics
const getExportStats = async (token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }

  const response = await axios.get(API_URL + 'stats', config)
  return response.data
}

const geopackageService = {
  exportGeoPackage,
  getExportStats,
}

export default geopackageService
