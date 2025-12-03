import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import Map from '@arcgis/core/Map';
import MapView from '@arcgis/core/views/MapView';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import MapImageLayer from '@arcgis/core/layers/MapImageLayer';
import TileLayer from '@arcgis/core/layers/TileLayer';
import VectorTileLayer from '@arcgis/core/layers/VectorTileLayer';
import Graphic from '@arcgis/core/Graphic';
import Point from '@arcgis/core/geometry/Point';
import Polyline from '@arcgis/core/geometry/Polyline';
import Polygon from '@arcgis/core/geometry/Polygon';
import SimpleLineSymbol from '@arcgis/core/symbols/SimpleLineSymbol';
import SimpleFillSymbol from '@arcgis/core/symbols/SimpleFillSymbol';
import TextSymbol from '@arcgis/core/symbols/TextSymbol';
import SimpleMarkerSymbol from '@arcgis/core/symbols/SimpleMarkerSymbol';
import config from '@arcgis/core/config';
import ARCGIS_CONFIG from '../../config/arcgisConfig';
import { ITEM_TYPE_ICON_MAP, DEFAULT_ITEM_TYPE_ICON } from '../../constants/itemTypeIcons';
import '../../styles/map.css';

const MapComponent = forwardRef(({ 
  hierarchyItems = [], 
  itemTypes = [],
  selectedItem = null,
  onItemSelect = null,
  selectedProject = null,
  height = '500px',
  mapStyle = 'streets'
}, ref) => {
  const mapRef = useRef(null);
  const mapViewRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const graphicsLayerRef = useRef(null);
  const externalLayersRef = useRef([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [externalLayers, setExternalLayers] = useState([]);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    addLayer: async (layerInfo) => {
      console.log('Map.addLayer called:', layerInfo);
      console.log('Map instance available:', !!mapInstanceRef.current);
      console.log('Map loaded:', mapLoaded);
      
      if (!mapInstanceRef.current) {
        throw new Error('Map instance is not available');
      }
      
      if (!mapLoaded) {
        throw new Error('Map is not fully loaded yet. Please wait a moment and try again.');
      }

      let layer;
      const { url, type, name } = layerInfo;

      try {
        console.log('Creating layer of type:', type);
        // Create the appropriate layer type
        switch (type) {
          case 'feature':
            layer = new FeatureLayer({
              url: url,
              title: name
            });
            break;
          case 'map-image':
            layer = new MapImageLayer({
              url: url,
              title: name
            });
            break;
          case 'tile':
            layer = new TileLayer({
              url: url,
              title: name
            });
            break;
          case 'vector-tile':
            layer = new VectorTileLayer({
              url: url,
              title: name
            });
            break;
          default:
            throw new Error(`Unsupported layer type: ${type}`);
        }

        console.log('Layer created, adding to map...');
        // Add layer to map
        mapInstanceRef.current.add(layer);

        console.log('Waiting for layer to load...');
        // Wait for layer to load
        await layer.load();
        console.log('Layer loaded successfully');

        // Store layer reference
        const layerId = `layer_${Date.now()}`;
        const layerData = {
          id: layerId,
          layer: layer,
          info: layerInfo
        };

        externalLayersRef.current.push(layerData);
        setExternalLayers([...externalLayersRef.current]);
        
        console.log('Layer added with ID:', layerId);
        return layerId;
      } catch (error) {
        console.error('Error adding layer:', error);
        console.error('Error details:', error.details || error.message);
        if (layer && mapInstanceRef.current) {
          console.log('Removing failed layer from map');
          mapInstanceRef.current.remove(layer);
        }
        throw new Error(`Failed to add layer: ${error.message || 'Unknown error'}`);
      }
    },
    removeLayer: (layerId) => {
      const layerIndex = externalLayersRef.current.findIndex(l => l.id === layerId);
      if (layerIndex !== -1) {
        const layerData = externalLayersRef.current[layerIndex];
        if (mapInstanceRef.current && layerData.layer) {
          mapInstanceRef.current.remove(layerData.layer);
        }
        externalLayersRef.current.splice(layerIndex, 1);
        setExternalLayers([...externalLayersRef.current]);
      }
    },
    getExternalLayers: () => {
      return externalLayersRef.current;
    }
  }), [mapLoaded]);

  useEffect(() => {
    try {
      setMapLoaded(false);
      setMapError(null);

      // Configure ArcGIS API
      config.apiKey = ARCGIS_CONFIG.apiKey;

    // Create map with fallback basemap if no API key
    const availableStyles = ARCGIS_CONFIG.mapStyles || {};
    const defaultArcgisStyle = availableStyles.streets || 'arcgis/streets';
    const requestedStyle = availableStyles[mapStyle] || defaultArcgisStyle;
    const basemapStyle = ARCGIS_CONFIG.apiKey ? requestedStyle : 'osm';
    const map = new Map({
      basemap: basemapStyle
    });

    // Store map instance reference
    mapInstanceRef.current = map;

    // Determine map center - use project coordinates if available, otherwise use default
    let mapCenter = [ARCGIS_CONFIG.defaultCenter.longitude, ARCGIS_CONFIG.defaultCenter.latitude];
    if (selectedProject && selectedProject.latitude && selectedProject.longitude) {
      mapCenter = [parseFloat(selectedProject.longitude), parseFloat(selectedProject.latitude)];
    }

    // Create map view
    const mapView = new MapView({
      container: mapRef.current,
      map: map,
      center: mapCenter,
      zoom: ARCGIS_CONFIG.defaultZoom
    });

    // Create graphics layer for markers
    const graphicsLayer = new GraphicsLayer();
    map.add(graphicsLayer);

    // Store references
    mapViewRef.current = mapView;
    graphicsLayerRef.current = graphicsLayer;

    // Wait for map to load
    mapView.when(() => {
      setMapLoaded(true);
      setMapError(null);
    }).catch((error) => {
      console.error('MapComponent: Error loading map:', error);
      setMapError(error.message);
    });

    // Cleanup function
    return () => {
      // Remove all external layers
      externalLayersRef.current.forEach(layerData => {
        if (layerData.layer && map) {
          map.remove(layerData.layer);
        }
      });
      externalLayersRef.current = [];
      setExternalLayers([]);

      if (mapView) {
        mapView.destroy();
      }
      
      mapInstanceRef.current = null;
    };
    } catch (error) {
      console.error('MapComponent: Error initializing map:', error);
      setMapError(error.message);
    }
  }, [selectedProject, mapStyle]);

  // Update markers when hierarchy items change
  useEffect(() => {
    if (!mapLoaded || !graphicsLayerRef.current) return;

    // Clear existing graphics
    graphicsLayerRef.current.removeAll();

    // Helper function to determine if item has coordinates
    const hasCoordinates = (item) => {
      // New coordinate format
      if (item.beginning_latitude || item.end_latitude || item.beginning_longitude || item.end_longitude) {
        return true;
      }
      // Old coordinate format
      if (item.coordinates && item.coordinates.latitude && item.coordinates.longitude) {
        return true;
      }
      return false;
    };

    // Filter items that have coordinates
    const itemsWithCoordinates = hierarchyItems.filter(hasCoordinates);

    // Helper to get icon meta for an item
    const getItemIcon = (item) => {
      const typeIcon =
        item.item_type?.icon ||
        item.icon ||
        itemTypes.find(type => type.id === item.item_type_id)?.icon ||
        DEFAULT_ITEM_TYPE_ICON;
      const iconKey = ITEM_TYPE_ICON_MAP[typeIcon] ? typeIcon : DEFAULT_ITEM_TYPE_ICON;
      return {
        key: iconKey,
        meta: ITEM_TYPE_ICON_MAP[iconKey] || ITEM_TYPE_ICON_MAP[DEFAULT_ITEM_TYPE_ICON]
      };
    };
    const getIconSize = (baseSize, key) => {
      if (key === 'hexagon') return baseSize * 0.55;
      if (key === 'star' || key === 'cross') return baseSize * 0.65;
      return baseSize;
    };
    // Create graphics for each item
    itemsWithCoordinates.forEach(item => {
      const isSelected = selectedItem?.id === item.id;
      const baseColor = isSelected ? '#ff0000' : '#007bff';
      const { key: iconKey, meta: iconMeta } = getItemIcon(item);
      const colorOverride =
        item.item_type?.icon_color ||
        item.icon_color ||
        itemTypes.find(type => type.id === item.item_type_id)?.icon_color ||
        null;
      const pointColor = colorOverride || baseColor;
      
      // Parse coordinates
      const beginLat = item.beginning_latitude ? parseFloat(item.beginning_latitude) : null;
      const endLat = item.end_latitude ? parseFloat(item.end_latitude) : null;
      const beginLng = item.beginning_longitude ? parseFloat(item.beginning_longitude) : null;
      const endLng = item.end_longitude ? parseFloat(item.end_longitude) : null;

      // Determine geometry type and create appropriate graphic
      let geometry = null;
      let symbol = null;
      let labelPoint = null;

      // Check if all four coordinates are present - draw rectangle
      if (beginLat !== null && endLat !== null && beginLng !== null && endLng !== null) {
        // Create rectangle (polygon)
        const rings = [[
          [beginLng, beginLat],
          [endLng, beginLat],
          [endLng, endLat],
          [beginLng, endLat],
          [beginLng, beginLat]
        ]];
        
        geometry = new Polygon({
          rings: rings
        });

        symbol = new SimpleFillSymbol({
          color: [
            parseInt(baseColor.slice(1, 3), 16),
            parseInt(baseColor.slice(3, 5), 16),
            parseInt(baseColor.slice(5, 7), 16),
            0.3
          ],
          outline: {
            color: baseColor,
            width: isSelected ? 3 : 2
          }
        });

        // Label at center of rectangle
        labelPoint = new Point({
          longitude: (beginLng + endLng) / 2,
          latitude: (beginLat + endLat) / 2
        });
      }
      // Check if it's a line (one lat and two longs, or one long and two lats)
      else if (
        (beginLat !== null && endLat === null && beginLng !== null && endLng !== null) || // Same lat, different longs
        (beginLat === null && endLat !== null && beginLng !== null && endLng !== null) || // Same lat, different longs
        (beginLat !== null && endLat !== null && beginLng !== null && endLng === null) || // Different lats, same long
        (beginLat !== null && endLat !== null && beginLng === null && endLng !== null)    // Different lats, same long
      ) {
        // Determine line coordinates
        let lat1, lat2, lng1, lng2;
        
        if (beginLat !== null && endLat === null && beginLng !== null && endLng !== null) {
          // Same beginning latitude, different longitudes
          lat1 = lat2 = beginLat;
          lng1 = beginLng;
          lng2 = endLng;
        } else if (beginLat === null && endLat !== null && beginLng !== null && endLng !== null) {
          // Same end latitude, different longitudes
          lat1 = lat2 = endLat;
          lng1 = beginLng;
          lng2 = endLng;
        } else if (beginLat !== null && endLat !== null && beginLng !== null && endLng === null) {
          // Different latitudes, same beginning longitude
          lat1 = beginLat;
          lat2 = endLat;
          lng1 = lng2 = beginLng;
        } else {
          // Different latitudes, same end longitude
          lat1 = beginLat;
          lat2 = endLat;
          lng1 = lng2 = endLng;
        }

        geometry = new Polyline({
          paths: [[[lng1, lat1], [lng2, lat2]]]
        });

        symbol = new SimpleLineSymbol({
          color: baseColor,
          width: isSelected ? 4 : 3
        });

        // Label at midpoint of line
        labelPoint = new Point({
          longitude: (lng1 + lng2) / 2,
          latitude: (lat1 + lat2) / 2
        });
      }
      // Otherwise, draw a point
      else {
        // Try new coordinate format first
        let latitude = beginLat || endLat;
        let longitude = beginLng || endLng;

        // Fallback to old coordinate format
        if (!latitude || !longitude) {
          if (item.coordinates) {
            latitude = parseFloat(item.coordinates.latitude);
            longitude = parseFloat(item.coordinates.longitude);
          }
        }

        if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
          console.error('MapComponent: Invalid coordinates for item:', item.title);
          return;
        }

        geometry = new Point({
          longitude: longitude,
          latitude: latitude
        });

        if (iconKey === 'hexagon') {
          symbol = new SimpleMarkerSymbol({
            style: 'path',
            path: 'M 0 -1 L 0.866 -0.5 L 0.866 0.5 L 0 1 L -0.866 0.5 L -0.866 -0.5 Z',
            color: pointColor,
            outline: {
              color: '#ffffff',
              width: 1.5
            },
            size: getIconSize(isSelected ? 24 : 20, iconKey)
          });
        } else {
          symbol = new TextSymbol({
            text: iconMeta.preview,
            color: pointColor,
            font: {
              size: getIconSize(isSelected ? 24 : 20, iconKey),
              weight: 'bold',
              family: 'Segoe UI Symbol, Arial, sans-serif'
            },
            haloColor: '#ffffff',
            haloSize: 2,
            yoffset: 0,
            verticalAlignment: 'middle',
            horizontalAlignment: 'center'
          });
        }

        labelPoint = geometry;
      }

      // Create text symbol for label with icon
      const textSymbol = new TextSymbol({
        color: '#000000',
        text: item.title || '',
        font: {
          size: 12,
          weight: 'bold',
          family: 'Segoe UI Symbol, Arial, sans-serif'
        },
        haloColor: '#ffffff',
        haloSize: 1,
        yoffset: geometry.type === 'point' ? 20 : 0,
        verticalAlignment: 'bottom',
        horizontalAlignment: 'center'
      });

      // Create graphics
      const shapeGraphic = new Graphic({
        geometry: geometry,
        symbol: symbol,
        attributes: {
          id: item.id,
          title: item.title,
          item_type: item.item_type?.title || 'No Type'
        }
      });

      const labelGraphic = new Graphic({
        geometry: labelPoint,
        symbol: textSymbol,
        attributes: {
          id: item.id,
          title: item.title
        }
      });

      // Add graphics to layer
      graphicsLayerRef.current.add(shapeGraphic);
      graphicsLayerRef.current.add(labelGraphic);
    });

    // If there are items with coordinates, fit the view to show all graphics
    if (itemsWithCoordinates.length > 0 && graphicsLayerRef.current.queryExtent) {
      graphicsLayerRef.current.queryExtent().then(result => {
        if (result.extent) {
          mapViewRef.current.goTo(result.extent.expand(1.2));
        }
      }).catch(error => {
        console.log('Could not fit view to graphics:', error);
      });
    }
  }, [hierarchyItems, itemTypes, selectedItem, mapLoaded]);

  // Handle marker clicks
  useEffect(() => {
    if (!mapLoaded || !mapViewRef.current || !onItemSelect) return;

    const handleClick = (event) => {
      mapViewRef.current.hitTest(event).then((response) => {
        if (response.results.length > 0) {
          const graphic = response.results.find(result => result.graphic.attributes.id);
          if (graphic) {
            const itemId = graphic.graphic.attributes.id;
            const item = hierarchyItems.find(item => item.id === itemId);
            if (item) {
              onItemSelect(item);
            }
          }
        }
      });
    };

    const mapView = mapViewRef.current;
    if (mapView) {
      mapView.on('click', handleClick);
    }

    // No cleanup needed - the map view will be destroyed when the component unmounts
    // which will automatically clean up all event listeners
    return () => {
      // Empty cleanup function
    };
  }, [hierarchyItems, onItemSelect, mapLoaded]);

  return (
    <div className="map-container">
      <div className="map-header">
        <h3>Asset Locations</h3>
        <div className="map-stats">
          {hierarchyItems.filter(item => {
            // New coordinate format
            if (item.beginning_latitude || item.end_latitude || item.beginning_longitude || item.end_longitude) {
              return true;
            }
            // Old coordinate format
            if (item.coordinates && item.coordinates.latitude && item.coordinates.longitude) {
              return true;
            }
            return false;
          }).length} assets with coordinates
          {externalLayers.length > 0 && (
            <span className="external-layers-count"> | {externalLayers.length} external layer{externalLayers.length !== 1 ? 's' : ''}</span>
          )}
        </div>
      </div>
      
      {mapError ? (
        <div className="map-error">
          <h4>Map Error</h4>
          <p>{mapError}</p>
          <p>Please check your ArcGIS API key configuration.</p>
        </div>
      ) : (
        <div 
          ref={mapRef} 
          className="map-view"
          style={{ height }}
        />
      )}
      
      {!mapLoaded && !mapError && (
        <div className="map-loading">
          <p>Loading map...</p>
        </div>
      )}
    </div>
  );
});

MapComponent.displayName = 'MapComponent';

export default MapComponent;
