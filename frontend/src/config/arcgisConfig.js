// Default fallback coordinates (Vieques Island)
const DEFAULT_FALLBACK_CENTER = {
  longitude: -65.4401,
  latitude: 18.1263
};

// Function to get ArcGIS config with dynamic center based on selected project
export const getArcgisConfig = (selectedProject = null) => {
  // Use project coordinates if available, otherwise use fallback
  const defaultCenter = selectedProject && selectedProject.latitude && selectedProject.longitude
    ? {
        longitude: parseFloat(selectedProject.longitude),
        latitude: parseFloat(selectedProject.latitude)
      }
    : DEFAULT_FALLBACK_CENTER;

  return {
    // Replace with your actual ArcGIS API key
    apiKey: process.env.REACT_APP_ARCGIS_API_KEY || '',
    
    // Dynamic map center based on selected project
    defaultCenter: defaultCenter,
    
    // Default zoom level
    defaultZoom: 11,
    
    // Map style options
    mapStyles: {
      streets: 'arcgis/streets',
      satellite: 'arcgis/imagery',
      hybrid: 'arcgis/imagery-hybrid',
      terrain: 'arcgis/terrain',
      topo: 'arcgis/topographic'
    }
  };
};

// Default config for backward compatibility
const ARCGIS_CONFIG = getArcgisConfig();

export default ARCGIS_CONFIG;
