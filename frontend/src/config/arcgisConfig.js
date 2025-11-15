<<<<<<< HEAD
// Default fallback coordinates (Vieques Island)
const DEFAULT_FALLBACK_CENTER = {
  longitude: -65.4401,
  latitude: 18.1263
=======
const ARCGIS_CONFIG = {
  // ArcGIS API key from environment variable
  apiKey: process.env.REACT_APP_ARCGIS_API_KEY,
  
        // Default map center (you can change this to your preferred location)
        defaultCenter: {
          longitude: -65.4401, // Vieques Island coordinates
          latitude: 18.1263
        },
  
  // Default zoom level
  defaultZoom: 11,
  
  // Map style options
  mapStyles: {
    streets: 'arcgis/streets',
    satellite: 'arcgis/satellite',
    hybrid: 'arcgis/hybrid',
    terrain: 'arcgis/terrain',
    topo: 'arcgis/topo'
  }
>>>>>>> b5a02f5537c311c90762edc164fad1e6acd1445a
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
    apiKey: 'AAPTxy8BH1VEsoebNVZXo8HurMCqwgNFjRJiI6A2DL4XYjqMLh52EKduHAEXwDnkotltAuH9Vm-4LmiAYb0gcYSa7u06uXwhDk5TqQutxhpwQ87W3saalOiVuMBTeEfgmQTe6oipJBRV0wqChHCtyZJaKeEYu-AuLYPxYsfKp-2jwOKP0cYwntQutXZjdWLMA3SBpu6XmXMOPmsdueJ36icHqwEc8bxNBUviGRbE7Cdfu58.AT1_KNgzHb7Q',
    
    // Dynamic map center based on selected project
    defaultCenter: defaultCenter,
    
    // Default zoom level
    defaultZoom: 11,
    
    // Map style options
    mapStyles: {
      streets: 'arcgis/streets',
      satellite: 'arcgis/satellite',
      hybrid: 'arcgis/hybrid',
      terrain: 'arcgis/terrain',
      topo: 'arcgis/topo'
    }
  };
};

// Default config for backward compatibility
const ARCGIS_CONFIG = getArcgisConfig();

export default ARCGIS_CONFIG;
