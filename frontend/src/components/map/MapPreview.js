import React, { useEffect, useState, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Marker, Polyline, Polygon, useMap } from 'react-leaflet';
import L from 'leaflet';
import { basemaps } from './Map';
import { getGisLayers, getLayerFeatures } from '../../services/gisLayerService';
import { ITEM_TYPE_ICON_MAP } from '../../constants/itemTypeIcons';
import 'leaflet/dist/leaflet.css';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';

// Fix Leaflet default icon issue
const DefaultIcon = L.icon({
  iconUrl: icon,
  iconRetinaUrl: iconRetina,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Component to fit map bounds to features
const FitBoundsHandler = ({ features }) => {
  const map = useMap();

  useEffect(() => {
    if (!features || features.length === 0) return;

    try {
      const bounds = [];
      
      features.forEach(feature => {
        if (feature.geometry && feature.geometry.type) {
          if (feature.geometry.type === 'Point') {
            const [lng, lat] = feature.geometry.coordinates;
            if (!isNaN(lat) && !isNaN(lng)) {
              bounds.push([lat, lng]);
            }
          } else if (feature.geometry.type === 'LineString' || feature.geometry.type === 'MultiLineString') {
            const coords = feature.geometry.type === 'LineString' 
              ? feature.geometry.coordinates 
              : feature.geometry.coordinates.flat();
            coords.forEach(([lng, lat]) => {
              if (!isNaN(lat) && !isNaN(lng)) {
                bounds.push([lat, lng]);
              }
            });
          } else if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
            const coords = feature.geometry.type === 'Polygon'
              ? feature.geometry.coordinates[0]
              : feature.geometry.coordinates[0][0];
            coords.forEach(([lng, lat]) => {
              if (!isNaN(lat) && !isNaN(lng)) {
                bounds.push([lat, lng]);
              }
            });
          }
        } else if (feature.beginning_latitude && feature.beginning_longitude) {
          const lat = parseFloat(feature.beginning_latitude);
          const lng = parseFloat(feature.beginning_longitude);
          if (!isNaN(lat) && !isNaN(lng)) {
            bounds.push([lat, lng]);
          }
        }
      });

      if (bounds.length > 0) {
        const latLngBounds = L.latLngBounds(bounds);
        map.fitBounds(latLngBounds, { padding: [20, 20], maxZoom: 12 });
      }
    } catch (error) {
      console.error('Error fitting bounds:', error);
    }
  }, [features, map]);

  return null;
};

// Create custom icon from symbol and color
const createCustomIcon = (symbol, color, size = 10) => {
  const iconInfo = ITEM_TYPE_ICON_MAP[symbol] || ITEM_TYPE_ICON_MAP.marker;
  const symbolChar = iconInfo.preview;
  
  return L.divIcon({
    className: 'custom-marker-icon',
    html: `<div class="custom-marker-icon-inner" style="
      color: ${color};
      font-size: ${size * 2}px;
      width: ${size * 2}px;
      height: ${size * 2}px;
      line-height: ${size * 2}px;
    ">${symbolChar}</div>`,
    iconSize: [size * 2, size * 2],
    iconAnchor: [size, size],
    popupAnchor: [0, -size]
  });
};

// Render a feature on the map
const FeatureMarker = ({ feature, layerStyle }) => {
  const symbol = layerStyle?.symbol || 'marker';
  const color = layerStyle?.color || '#3388ff';
  
  // Handle GeoJSON geometry
  if (feature.geometry && feature.geometry.type === 'Point') {
    const [lng, lat] = feature.geometry.coordinates;
    if (isNaN(lat) || isNaN(lng)) return null;
    
    return <Marker position={[lat, lng]} icon={createCustomIcon(symbol, color, 8)} />;
  }
  
  // Handle lat/lng coordinates
  if (feature.beginning_latitude && feature.beginning_longitude) {
    const lat = parseFloat(feature.beginning_latitude);
    const lng = parseFloat(feature.beginning_longitude);
    if (isNaN(lat) || isNaN(lng)) return null;
    
    return <CircleMarker 
      center={[lat, lng]} 
      radius={6}
      pathOptions={{ 
        fillColor: color, 
        color: color, 
        fillOpacity: 0.7,
        weight: 2
      }}
    />;
  }
  
  return null;
};

const MapPreview = ({ projectId, projectCoordinates }) => {
  const [layers, setLayers] = useState([]);
  const [layerFeatures, setLayerFeatures] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mapKey, setMapKey] = useState(0);
  const mapContainerRef = useRef(null);

  // Default position
  const defaultPosition = [40.7128, -74.0060];
  const position = projectCoordinates || defaultPosition;
  const basemap = basemaps.street;

  // Force map remount when projectId changes or on error
  useEffect(() => {
    setMapKey(prev => prev + 1);
    // Reset state when project changes
    setLayers([]);
    setLayerFeatures({});
    setError(null);
  }, [projectId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean up any map instances
      if (mapContainerRef.current) {
        const mapElements = mapContainerRef.current.querySelectorAll('.leaflet-container');
        mapElements.forEach(el => {
          if (el._leaflet_id) {
            try {
              const map = el._leaflet_map;
              if (map) {
                map.remove();
              }
            } catch (e) {
              // Silently ignore cleanup errors
            }
          }
        });
      }
    };
  }, []);

  // Fetch layers and features
  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    const loadMapData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get all layers for the project
        const layersResponse = await getGisLayers(projectId);
        if (!layersResponse.success) {
          throw new Error('Failed to load layers');
        }

        const allLayers = layersResponse.data || [];
        // Only show visible layers
        const visibleLayers = allLayers.filter(layer => layer.visible !== false);
        
        setLayers(visibleLayers);

        // Fetch features for each layer
        const featuresMap = {};
        for (const layer of visibleLayers) {
          try {
            const featuresResponse = await getLayerFeatures(projectId, layer.id);
            if (featuresResponse.success && featuresResponse.data) {
              featuresMap[layer.id] = featuresResponse.data;
            }
          } catch (err) {
            console.warn(`Failed to load features for layer ${layer.id}:`, err);
          }
        }

        setLayerFeatures(featuresMap);
      } catch (err) {
        console.error('Error loading map preview:', err);
        setError('Failed to load map preview');
      } finally {
        setLoading(false);
      }
    };

    loadMapData();
  }, [projectId]);

  // Collect all features for bounds calculation
  const allFeatures = useMemo(() => {
    const features = [];
    Object.values(layerFeatures).forEach(featureArray => {
      features.push(...(featureArray || []));
    });
    return features;
  }, [layerFeatures]);

  if (loading) {
    return (
      <div style={{ 
        width: '100%', 
        height: '300px', 
        background: '#f0f0f0', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        borderRadius: '8px'
      }}>
        <div>Loading map...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        width: '100%', 
        height: '300px', 
        background: '#f0f0f0', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        borderRadius: '8px',
        color: '#666'
      }}>
        {error}
      </div>
    );
  }

  // Parse layer styles
  const getLayerStyle = (layer) => {
    if (!layer.style) return {};
    if (typeof layer.style === 'string') {
      try {
        return JSON.parse(layer.style);
      } catch (e) {
        return {};
      }
    }
    return layer.style;
  };

  return (
    <div 
      ref={mapContainerRef}
      style={{ width: '100%', height: '300px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #ddd' }}
    >
      <MapContainer
        key={`map-${projectId}-${mapKey}`}
        center={position}
        zoom={allFeatures.length > 0 ? 10 : 2}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        attributionControl={true}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        dragging={true}
        touchZoom={true}
      >
        <TileLayer
          url={basemap.url}
          attribution={basemap.attribution}
        />
        
        {allFeatures.length > 0 && (
          <FitBoundsHandler features={allFeatures} />
        )}
        
        {layers.map(layer => {
          const features = layerFeatures[layer.id] || [];
          const layerStyle = getLayerStyle(layer);
          
          return features.map((feature, index) => (
            <FeatureMarker 
              key={`${layer.id}-${feature.id || index}`}
              feature={feature}
              layerStyle={layerStyle}
            />
          ));
        })}
      </MapContainer>
    </div>
  );
};

export default MapPreview;
