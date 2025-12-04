import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'react-leaflet-cluster/dist/assets/MarkerCluster.css';
import 'react-leaflet-cluster/dist/assets/MarkerCluster.Default.css';
import Spinner from '../Spinner';
import '../../styles/spinner.css';
// Fix for default marker icons in Leaflet with webpack
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
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      try {
        if (map && map.getContainer && map.invalidateSize) {
          const container = map.getContainer();
          if (container && container.parentNode) {
            map.invalidateSize({ animate: false });
          }
        }
      } catch (error) {
        // Map is being destroyed, ignore
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [panelWidth, map]);

  // Also invalidate on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        if (map && map.getContainer && map.invalidateSize) {
          const container = map.getContainer();
          if (container && container.parentNode) {
            map.invalidateSize({ animate: false });
          }
        }
      } catch (error) {
        // Map is being destroyed, ignore
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [map]);

  return null;
};

// Component to handle map center updates
const MapCenterHandler = ({ center, zoom, shouldUpdate }) => {
  const map = useMap();
  const previousCenterRef = useRef(null);

  useEffect(() => {
    // Only update if shouldUpdate is true and center actually changed
    if (!shouldUpdate) return;

    let isMounted = true;
    const currentCenter = center && Array.isArray(center) && center.length === 2 
      ? [center[0], center[1]] 
      : null;

    // Check if center actually changed
    const centerChanged = !previousCenterRef.current || 
      !currentCenter ||
      previousCenterRef.current[0] !== currentCenter[0] || 
      previousCenterRef.current[1] !== currentCenter[1];

    if (centerChanged && currentCenter && 
        typeof currentCenter[0] === 'number' && typeof currentCenter[1] === 'number' && 
        !isNaN(currentCenter[0]) && !isNaN(currentCenter[1]) && map && isMounted) {
      try {
        // Check if map and container still exist and are valid
        if (!map.getContainer || !map.getPane || !map.setView || !map.getZoom) {
          return;
        }
        
        const container = map.getContainer();
        if (!container || !container.parentNode) {
          // Map container has been removed from DOM
          return;
        }
        
        const mapPane = map.getPane('mapPane');
        if (!mapPane) {
          return;
        }
        
        // Only update center, preserve current zoom
        map.setView(currentCenter, map.getZoom(), { animate: true });
        previousCenterRef.current = currentCenter;
      } catch (error) {
        // Silently catch errors if map is being destroyed
        // Don't log to avoid console spam
      }
    }

    return () => {
      isMounted = false;
    };
  }, [center, shouldUpdate, map]);

  return null;
};

// Component to track when map is centered (simplified - only wait for centering)
const MapReadyTracker = ({ targetCenter, onMapReady }) => {
  const map = useMap();
  const hasCalledRef = useRef(false);

  useEffect(() => {
    if (!map) return;
    
    // Reset the flag when targetCenter changes
    hasCalledRef.current = false;

    let timeoutId;
    let checkInterval;
    let moveEndHandler;

    const checkIfReady = () => {
      if (hasCalledRef.current) return;

      // Ensure map and container still exist and are valid
      try {
        if (!map || !map.getContainer || !map.getPane) {
          return;
        }
        
        const container = map.getContainer();
        if (!container || !container.parentNode) {
          // Map container has been removed from DOM
          return;
        }

        const mapPane = map.getPane('mapPane');
        if (!mapPane) {
          return;
        }

        // Check if map is centered at target location
        const currentCenter = map.getCenter();
        if (currentCenter && typeof currentCenter.lat === 'number' && typeof currentCenter.lng === 'number') {
          const latDiff = Math.abs(currentCenter.lat - targetCenter[0]);
          const lngDiff = Math.abs(currentCenter.lng - targetCenter[1]);
          // Stricter tolerance: within 0.0001 degrees (roughly 10m) to ensure map is properly centered
          const mapCentered = latDiff < 0.0001 && lngDiff < 0.0001;
          
          if (mapCentered) {
            hasCalledRef.current = true;
            clearTimeout(timeoutId);
            clearInterval(checkInterval);
            try {
              if (map && moveEndHandler) {
                map.off('moveend', moveEndHandler);
              }
            } catch (e) {
              // Map might be destroyed, ignore
            }
            if (onMapReady) {
              onMapReady();
            }
          }
        }
      } catch (error) {
        // Map is being destroyed or not fully initialized
        return;
      }
    };

    // Handle no target center case separately
    if (!targetCenter || !Array.isArray(targetCenter) || targetCenter.length !== 2) {
      // No target center, consider it ready after a short delay
      timeoutId = setTimeout(() => {
        if (!hasCalledRef.current && onMapReady) {
          hasCalledRef.current = true;
          if (onMapReady) {
            onMapReady();
          }
        }
      }, 500);
      
      return () => {
        clearTimeout(timeoutId);
      };
    }

    // Listen for when the map is ready
    map.whenReady(() => {
      // Check on moveend (when map finishes moving/centering) - this is the key event
      // Wait a delay after moveend to ensure map animation has fully completed
      moveEndHandler = () => {
        // Delay to ensure map animation has fully completed and settled
        setTimeout(() => {
          try {
            checkIfReady();
          } catch (error) {
            // Map might be destroyed, ignore
          }
        }, 400);
      };
      
      try {
        map.on('moveend', moveEndHandler);
      } catch (error) {
        // Map might be destroyed, ignore
        return;
      }

      // Only check periodically as a true fallback (very infrequent)
      checkInterval = setInterval(() => {
        try {
          checkIfReady();
        } catch (error) {
          // Map might be destroyed, clear interval
          if (checkInterval) {
            clearInterval(checkInterval);
          }
        }
      }, 1000);

      // Fallback: hide spinner after max delay (increased to give more time)
      timeoutId = setTimeout(() => {
        if (!hasCalledRef.current && onMapReady) {
          hasCalledRef.current = true;
          if (checkInterval) {
            clearInterval(checkInterval);
          }
          try {
            if (map && map.off && moveEndHandler) {
              map.off('moveend', moveEndHandler);
            }
          } catch (e) {
            // Map might be destroyed, ignore
          }
          onMapReady();
        }
      }, 8000);
    });

    return () => {
      clearTimeout(timeoutId);
      if (checkInterval) {
        clearInterval(checkInterval);
      }
      try {
        if (map && map.off && moveEndHandler) {
          map.off('moveend', moveEndHandler);
        }
      } catch (error) {
        // Map is being destroyed, ignore
      }
    };
  }, [map, targetCenter, onMapReady]);

  return null;
};

const Map = ({ panelWidth, selectedBasemap = 'street', projectCoordinates, features = [], featureTypes = [], showLabels = true, labelFontSize = 12, labelColor = '#000000', labelBackgroundColor = 'rgba(255, 255, 255, 0.6)' }) => {
  const [isMapLoading, setIsMapLoading] = useState(true);
  const mapReadyCalledRef = useRef(false);
  
  // Use project coordinates if available, otherwise default to New York City
  const defaultPosition = [40.7128, -74.0060];
  const position = projectCoordinates || defaultPosition;
  const basemap = basemaps[selectedBasemap] || basemaps.street;

  const handleMapReady = useCallback(() => {
    if (!mapReadyCalledRef.current) {
      mapReadyCalledRef.current = true;
      setIsMapLoading(false);
    }
  }, []);

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

  // Reset loading state only when coordinates change (new project), not when basemap changes
  const prevCoordsRef = useRef(projectCoordinates);
  
  useEffect(() => {
    // Only reset if coordinates actually changed (not just reference)
    const coordsChanged = prevCoordsRef.current !== projectCoordinates && 
      (prevCoordsRef.current === null || projectCoordinates === null ||
       prevCoordsRef.current[0] !== projectCoordinates[0] || 
       prevCoordsRef.current[1] !== projectCoordinates[1]);
    
    if (coordsChanged) {
      mapReadyCalledRef.current = false;
      setIsMapLoading(true);
      prevCoordsRef.current = projectCoordinates;
    }
  }, [projectCoordinates]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', zIndex: 1 }}>
      {isMapLoading && (
        <div className="map-spinner-overlay" style={{ zIndex: 9999 }}>
          <Spinner />
        </div>
      )}
      <div style={{ 
        width: '100%', 
        height: '100%',
        position: 'relative',
        zIndex: 1
      }}>
        <MapContainer 
          center={position} 
          zoom={13} 
          maxZoom={18}
          className="leaflet-map-container"
          style={{ 
            width: '100%', 
            height: '100%'
          }}
          key={projectCoordinates ? `${projectCoordinates[0]}-${projectCoordinates[1]}` : 'default'}
          scrollWheelZoom={true}
          zoomControl={true}
          preferCanvas={true}
        >
        <MapResizeHandler panelWidth={panelWidth} />
        <MapReadyTracker 
          targetCenter={projectCoordinates || position} 
          onMapReady={handleMapReady} 
        />
        <MapCenterHandler 
          center={projectCoordinates || position} 
          shouldUpdate={!!projectCoordinates}
        />
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
      
      <MarkerClusterGroup
        chunkedLoading
        chunkDelay={200}
        maxClusterRadius={60}
        spiderfyOnMaxZoom={true}
        showCoverageOnHover={false}
        zoomToBoundsOnClick={true}
        zoomToBoundsOptions={{ padding: [100, 100], maxZoom: 15 }}
        disableClusteringAtZoom={13}
        removeOutsideVisibleBounds={true}
        animate={false}
        spiderfyDistanceMultiplier={2}
      >
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
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  boxShadow: 'none',
                  padding: 0
                }}
              >
                <span style={{ 
                  fontSize: `${labelFontSize}px`, 
                  color: labelColor,
                  backgroundColor: labelBackgroundColor,
                  padding: '2px 6px',
                  borderRadius: '3px',
                  display: 'inline-block'
                }}>
                  {feature.title}
                </span>
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
      </MarkerClusterGroup>
        </MapContainer>
      </div>
    </div>
  );
};

export default Map;