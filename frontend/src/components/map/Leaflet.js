import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

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

const Leaflet = ({ panelWidth, selectedBasemap = 'street', projectCoordinates, features = [], featureTypes = [], showLabels = true, labelFontSize = 12, labelColor = '#000000' }) => {
  // Use project coordinates if available, otherwise default to New York City
  const defaultPosition = [40.7128, -74.0060];
  const position = projectCoordinates || defaultPosition;
  const basemap = basemaps[selectedBasemap] || basemaps.street;

  // Create a map of feature type IDs to their colors/icons
  const featureTypeMap = useMemo(() => {
    const map = {};
    featureTypes.forEach(type => {
      map[type.id] = {
        title: type.title,
        color: type.icon_color || '#3388ff',
        icon: type.icon
      };
    });
    return map;
  }, [featureTypes]);

  // Filter features that have valid coordinates
  const featuresWithCoordinates = useMemo(() => {
    return features.filter(feature => 
      feature.beginning_latitude != null && 
      feature.beginning_longitude != null &&
      !isNaN(parseFloat(feature.beginning_latitude)) &&
      !isNaN(parseFloat(feature.beginning_longitude))
    );
  }, [features]);

  // Get color for a feature based on its type
  const getFeatureColor = (feature) => {
    const typeInfo = featureTypeMap[feature.item_type_id];
    return typeInfo?.color || '#3388ff';
  };

  // Get feature type name
  const getFeatureTypeName = (feature) => {
    const typeInfo = featureTypeMap[feature.item_type_id];
    return typeInfo?.title || 'Unknown Type';
  };

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
      
      {featuresWithCoordinates.map(feature => (
        <CircleMarker
          key={feature.id}
          center={[
            parseFloat(feature.beginning_latitude),
            parseFloat(feature.beginning_longitude)
          ]}
          radius={4}
          pathOptions={{
            fillColor: getFeatureColor(feature),
            fillOpacity: 0.8,
            color: '#333',
            weight: 2
          }}
        >
          {showLabels && (
            <Tooltip 
              permanent 
              direction="right" 
              offset={[8, 0]}
              className="feature-label"
            >
              <span style={{ fontSize: `${labelFontSize}px`, color: labelColor }}>{feature.title}</span>
            </Tooltip>
          )}
          <Popup>
            <div style={{ minWidth: '150px' }}>
              <strong style={{ fontSize: '14px' }}>{feature.title}</strong>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                Type: {getFeatureTypeName(feature)}
              </div>
              <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>
                Lat: {parseFloat(feature.beginning_latitude).toFixed(6)}<br />
                Lng: {parseFloat(feature.beginning_longitude).toFixed(6)}
              </div>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
};

export default Leaflet;