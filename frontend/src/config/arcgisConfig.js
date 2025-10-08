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
};

export default ARCGIS_CONFIG;
