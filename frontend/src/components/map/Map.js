import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip, useMap, Polyline, Polygon, Marker } from 'react-leaflet';
import L from 'leaflet';
import { ITEM_TYPE_ICON_MAP } from '../../constants/itemTypeIcons';
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

      // Only check periodically as a true fallback (very infrequent - increased interval to reduce performance impact)
      checkInterval = setInterval(() => {
        try {
          checkIfReady();
        } catch (error) {
          // Map might be destroyed, clear interval
          if (checkInterval) {
            clearInterval(checkInterval);
          }
        }
      }, 2000); // Increased from 1000ms to 2000ms to reduce performance impact

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

const Map = ({ panelWidth, selectedBasemap = 'street', projectCoordinates, features = [], featureTypes = [], showLabels = true, labelFontSize = 12, labelColor = '#000000', labelBackgroundColor = 'rgba(255, 255, 255, 0.6)', layers = [], layerFeatures = {} }) => {
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

  // Get color for a feature based on its type (memoized)
  const getFeatureColor = useCallback((feature) => {
    const typeInfo = featureTypeMap[feature.item_type_id];
    return typeInfo?.color || '#3388ff';
  }, [featureTypeMap]);

  // Get feature type name (memoized)
  const getFeatureTypeName = useCallback((feature) => {
    const typeInfo = featureTypeMap[feature.item_type_id];
    return typeInfo?.title || 'Unknown Type';
  }, [featureTypeMap]);

  // Get icon for a feature based on its type
  const getFeatureIcon = useCallback((feature) => {
    const typeInfo = featureTypeMap[feature.item_type_id];
    return typeInfo?.icon || 'marker';
  }, [featureTypeMap]);

  // Memoized icon cache - create icons once per symbol+color combination
  const iconCache = useMemo(() => {
    const MapConstructor = window.Map; // Use window.Map to avoid conflict with component name
    const cache = new MapConstructor();
    const allIcons = Object.keys(ITEM_TYPE_ICON_MAP);
    const commonColors = ['#dc3545', '#fd7e14', '#ffc107', '#198754', '#0dcaf0', '#0d6efd', '#6f42c1', '#3388ff'];
    
    // Pre-create icons for common combinations
    allIcons.forEach(symbol => {
      commonColors.forEach(color => {
        const key = `${symbol}:${color}:10`;
        const iconInfo = ITEM_TYPE_ICON_MAP[symbol] || ITEM_TYPE_ICON_MAP.marker;
        const symbolChar = iconInfo.preview;
        
        cache.set(key, L.divIcon({
          className: 'custom-marker-icon',
          html: `<div style="
            color: ${color};
            font-size: 20px;
            text-align: center;
            line-height: 20px;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));
          ">${symbolChar}</div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
          popupAnchor: [0, -10]
        }));
      });
    });
    
    return cache;
  }, []);

  // Create a custom DivIcon based on symbol type and color (with caching)
  const createCustomIcon = useCallback((symbol, color, size = 12) => {
    const key = `${symbol}:${color}:${size}`;
    
    // Check cache first
    if (iconCache.has(key)) {
      return iconCache.get(key);
    }
    
    // Create new icon if not in cache
    const iconInfo = ITEM_TYPE_ICON_MAP[symbol] || ITEM_TYPE_ICON_MAP.marker;
    const symbolChar = iconInfo.preview;
    
    const icon = L.divIcon({
      className: 'custom-marker-icon',
      html: `<div style="
        color: ${color};
        font-size: ${size * 2}px;
        text-align: center;
        line-height: ${size * 2}px;
        width: ${size * 2}px;
        height: ${size * 2}px;
        display: flex;
        align-items: center;
        justify-content: center;
        filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));
      ">${symbolChar}</div>`,
      iconSize: [size * 2, size * 2],
      iconAnchor: [size, size],
      popupAnchor: [0, -size]
    });
    
    // Cache it for future use
    iconCache.set(key, icon);
    return icon;
  }, [iconCache]);

  // Convert background color to 30% opacity (memoized)
  const getLabelBackgroundColor = useCallback((bgColor) => {
    if (!bgColor) return 'rgba(255, 255, 255, 0.3)';
    
    // If it's already rgba, extract RGB values and set alpha to 0.3
    const rgbaMatch = bgColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (rgbaMatch) {
      return `rgba(${rgbaMatch[1]}, ${rgbaMatch[2]}, ${rgbaMatch[3]}, 0.3)`;
    }
    // If it's hex, convert to rgba with 0.3 opacity
    const hexMatch = bgColor.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
    if (hexMatch) {
      const r = parseInt(hexMatch[1], 16);
      const g = parseInt(hexMatch[2], 16);
      const b = parseInt(hexMatch[3], 16);
      return `rgba(${r}, ${g}, ${b}, 0.3)`;
    }
    // Fallback: return default
    return 'rgba(255, 255, 255, 0.3)';
  }, []);

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
        {featuresWithCoordinates.map(feature => {
          // Memoize icon and color lookups
          const featureIcon = getFeatureIcon(feature);
          const featureColor = getFeatureColor(feature);
          const customIcon = createCustomIcon(featureIcon, featureColor, 10);
          const position = [
            parseFloat(feature.beginning_latitude),
            parseFloat(feature.beginning_longitude)
          ];
          
          return (
            <Marker
              key={feature.id}
              position={position}
              icon={customIcon}
            >
            {showLabels && (
              <Tooltip 
                permanent 
                direction="right" 
                offset={[8, 0]}
                className="feature-label"
                interactive={false}
              >
                <span style={{ 
                  fontSize: `${labelFontSize}px`, 
                  color: labelColor,
                  backgroundColor: getLabelBackgroundColor(labelBackgroundColor),
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
            </Marker>
          );
        })}
      </MarkerClusterGroup>

      {/* Render custom layer features */}
      {useMemo(() => {
        return layers.filter(layer => layer.visible).map(layer => {
          const features = layer.features || []; // Get features from layer object
          const layerStyle = layer.style || {};
          const layerColor = layerStyle.color || '#3388ff';
          const layerOpacity = layerStyle.opacity ?? 1;
          const layerWeight = layerStyle.weight ?? 3;
          const layerSymbol = layerStyle.symbol || 'marker';
          const customIcon = createCustomIcon(layerSymbol, layerColor, 10);
          
          return features.map(feature => {
          if (layer.geometryType === 'point') {
            // Point feature - coordinates are stored as [lat, lng]
            const [lat, lng] = feature.coordinates[0];
            
            return (
              <Marker
                key={`layer-${layer.id}-feature-${feature.id}`}
                position={[lat, lng]}
                icon={customIcon}
              >
                {showLabels && (
                  <Tooltip 
                    permanent 
                    direction="right" 
                    offset={[8, 0]}
                    className="feature-label"
                    interactive={false}
                  >
                    <span style={{ 
                      fontSize: `${labelFontSize}px`, 
                      color: labelColor,
                      backgroundColor: getLabelBackgroundColor(labelBackgroundColor),
                      padding: '2px 6px',
                      borderRadius: '3px',
                      display: 'inline-block'
                    }}>
                      {feature.name || feature.properties?.title || 'Unnamed'}
                    </span>
                  </Tooltip>
                )}
                <Popup>
                  <div style={{ minWidth: '150px' }}>
                    <strong style={{ fontSize: '14px' }}>{feature.name || 'Unnamed'}</strong>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                      Layer: {layer.name}
                    </div>
                    {Object.entries(feature.properties || {}).map(([key, value]) => (
                      <div key={key} style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
                        {key}: {value}
                      </div>
                    ))}
                  </div>
                </Popup>
              </Marker>
            );
          } else if (layer.geometryType === 'line' || layer.geometryType === 'linestring') {
            // Line feature - coordinates are already [lat, lng] arrays
            // Get midpoint for label placement
            const midIndex = Math.floor(feature.coordinates.length / 2);
            const labelPosition = feature.coordinates[midIndex] || feature.coordinates[0];
            return (
              <>
                <Polyline
                  key={`layer-${layer.id}-feature-${feature.id}`}
                  positions={feature.coordinates}
                  pathOptions={{
                    color: layerColor,
                    weight: layerWeight,
                    opacity: layerOpacity
                  }}
                >
                  <Popup>
                    <div style={{ minWidth: '150px' }}>
                      <strong style={{ fontSize: '14px' }}>{feature.name || 'Unnamed'}</strong>
                      <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                        Layer: {layer.name}
                      </div>
                      <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
                        Points: {feature.coordinates.length}
                      </div>
                      {Object.entries(feature.properties || {}).map(([key, value]) => (
                        <div key={key} style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
                          {key}: {value}
                        </div>
                      ))}
                    </div>
                  </Popup>
                </Polyline>
                {showLabels && (
                  <CircleMarker
                    key={`layer-${layer.id}-feature-${feature.id}-label`}
                    center={labelPosition}
                    radius={0}
                    pathOptions={{ fillOpacity: 0, opacity: 0 }}
                  >
                    <Tooltip 
                      permanent 
                      direction="right" 
                      offset={[8, 0]}
                      className="feature-label"
                      interactive={false}
                    >
                      <span style={{ 
                        fontSize: `${labelFontSize}px`, 
                        color: labelColor,
                        backgroundColor: labelBackgroundColor,
                        padding: '2px 6px',
                        borderRadius: '3px',
                        display: 'inline-block'
                      }}>
                        {feature.name || feature.properties?.title || 'Unnamed'}
                      </span>
                    </Tooltip>
                  </CircleMarker>
                )}
              </>
            );
          } else if (layer.geometryType === 'polygon') {
            // Polygon feature - coordinates are already [lat, lng] arrays
            // Calculate centroid for label placement (simple average of first ring)
            const ring = feature.coordinates[0] || feature.coordinates;
            const latSum = ring.reduce((sum, coord) => sum + coord[0], 0);
            const lngSum = ring.reduce((sum, coord) => sum + coord[1], 0);
            const centroid = [latSum / ring.length, lngSum / ring.length];
            return (
              <>
                <Polygon
                  key={`layer-${layer.id}-feature-${feature.id}`}
                  positions={feature.coordinates}
                  pathOptions={{
                    fillColor: layerColor,
                    fillOpacity: layerOpacity * 0.5, // Make fill slightly more transparent
                    color: layerColor,
                    weight: layerWeight,
                    opacity: layerOpacity
                  }}
                >
                  <Popup>
                    <div style={{ minWidth: '150px' }}>
                      <strong style={{ fontSize: '14px' }}>{feature.name || 'Unnamed'}</strong>
                      <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                        Layer: {layer.name}
                      </div>
                      <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
                        Points: {ring.length}
                      </div>
                      {Object.entries(feature.properties || {}).map(([key, value]) => (
                        <div key={key} style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
                          {key}: {value}
                        </div>
                      ))}
                    </div>
                  </Popup>
                </Polygon>
                {showLabels && (
                  <CircleMarker
                    key={`layer-${layer.id}-feature-${feature.id}-label`}
                    center={centroid}
                    radius={0}
                    pathOptions={{ fillOpacity: 0, opacity: 0 }}
                  >
                    <Tooltip 
                      permanent 
                      direction="center" 
                      offset={[0, 0]}
                      className="feature-label"
                      interactive={false}
                    >
                      <span style={{ 
                        fontSize: `${labelFontSize}px`, 
                        color: labelColor,
                        backgroundColor: labelBackgroundColor,
                        padding: '2px 6px',
                        borderRadius: '3px',
                        display: 'inline-block'
                      }}>
                        {feature.name || feature.properties?.title || 'Unnamed'}
                      </span>
                    </Tooltip>
                  </CircleMarker>
                )}
              </>
            );
          }
          return null;
        });
      });
      }, [layers, showLabels, labelFontSize, labelColor, labelBackgroundColor, createCustomIcon, getLabelBackgroundColor])}
        </MapContainer>
      </div>
    </div>
  );
};

export default Map;