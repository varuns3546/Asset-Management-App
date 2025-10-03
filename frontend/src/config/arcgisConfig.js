const ARCGIS_CONFIG = {
  // Replace with your actual ArcGIS API key
  apiKey: 'AAPTxy8BH1VEsoebNVZXo8HurMCqwgNFjRJiI6A2DL4XYjqMLh52EKduHAEXwDnkotltAuH9Vm-4LmiAYb0gcYSa7u06uXwhDk5TqQutxhpwQ87W3saalOiVuMBTeEfgmQTe6oipJBRV0wqChHCtyZJaKeEYu-AuLYPxYsfKp-2jwOKP0cYwntQutXZjdWLMA3SBpu6XmXMOPmsdueJ36icHqwEc8bxNBUviGRbE7Cdfu58.AT1_KNgzHb7Q',
  
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
