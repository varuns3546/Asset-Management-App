import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon issue in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Basemap configurations
export const basemaps = {
  street: {
    name: 'Street',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  },
  topographic: {
    name: 'Topographic',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a> contributors'
  },
  terrain: {
    name: 'Terrain',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; <a href="https://www.esri.com">Esri</a>'
  },
  satellite: {
    name: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; <a href="https://www.esri.com">Esri</a>'
  },
  hybrid: {
    name: 'Hybrid',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; <a href="https://www.esri.com">Esri</a>',
    overlay: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}'
  },
  light: {
    name: 'Light',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com">CARTO</a>'
  }
};

// Component to handle map resize
const MapResizeHandler = ({ panelWidth }) => {
  const map = useMap();

  useEffect(() => {
    map.invalidateSize({ animate: false });
  }, [panelWidth, map]);

  return null;
};

// Component to handle map center updates
const MapCenterHandler = ({ center, zoom }) => {
  const map = useMap();

  useEffect(() => {
    let isMounted = true;

    if (center && Array.isArray(center) && center.length === 2 && 
        typeof center[0] === 'number' && typeof center[1] === 'number' && 
        !isNaN(center[0]) && !isNaN(center[1]) && map && isMounted) {
      try {
        // Check if map container still exists
        if (map.getContainer() && map.getPane('mapPane')) {
          map.setView(center, zoom || map.getZoom(), { animate: true });
        }
      } catch (error) {
        // Silently catch errors if map is being destroyed
        console.debug('Map update skipped during unmount');
      }
    }

    return () => {
      isMounted = false;
    };
  }, [center, zoom, map]);

  return null;
};

const Leaflet = ({ panelWidth, selectedBasemap = 'street', projectCoordinates }) => {
  // Use project coordinates if available, otherwise default to New York City
  const defaultPosition = [40.7128, -74.0060];
  const position = projectCoordinates || defaultPosition;
  const basemap = basemaps[selectedBasemap] || basemaps.street;

  return (
    <MapContainer 
      center={position} 
      zoom={13} 
      className="leaflet-map-container"
      key={projectCoordinates ? `${projectCoordinates[0]}-${projectCoordinates[1]}` : 'default'}
    >
      <MapResizeHandler panelWidth={panelWidth} />
      <MapCenterHandler center={projectCoordinates || position} zoom={13} />
      <TileLayer
        key={selectedBasemap}
        attribution={basemap.attribution}
        url={basemap.url}
      />
      {basemap.overlay && (
        <TileLayer
          url={basemap.overlay}
          attribution=""
        />
      )}
    </MapContainer>
  );
};

export default Leaflet;