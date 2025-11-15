import React, { useEffect, useRef, useState } from 'react';
import Map from '@arcgis/core/Map';
import MapView from '@arcgis/core/views/MapView';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import Graphic from '@arcgis/core/Graphic';
import Point from '@arcgis/core/geometry/Point';
import Polyline from '@arcgis/core/geometry/Polyline';
import Polygon from '@arcgis/core/geometry/Polygon';
import SimpleMarkerSymbol from '@arcgis/core/symbols/SimpleMarkerSymbol';
import SimpleLineSymbol from '@arcgis/core/symbols/SimpleLineSymbol';
import SimpleFillSymbol from '@arcgis/core/symbols/SimpleFillSymbol';
import TextSymbol from '@arcgis/core/symbols/TextSymbol';
import config from '@arcgis/core/config';
import ARCGIS_CONFIG from '../config/arcgisConfig';
import '../styles/map.css';

const MapComponent = ({ 
  hierarchyItems = [], 
  selectedItem = null, 
  onItemSelect = null,
  selectedProject = null,
  height = '500px' 
}) => {
  const mapRef = useRef(null);
  const mapViewRef = useRef(null);
  const graphicsLayerRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);

  useEffect(() => {
    try {
      // Configure ArcGIS API
      config.apiKey = ARCGIS_CONFIG.apiKey;

    // Create map with fallback basemap if no API key
    const basemapStyle = ARCGIS_CONFIG.apiKey ? ARCGIS_CONFIG.mapStyles.streets : 'osm';
    const map = new Map({
      basemap: basemapStyle
    });

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
      if (mapView) {
        mapView.destroy();
      }
    };
    } catch (error) {
      console.error('MapComponent: Error initializing map:', error);
      setMapError(error.message);
    }
  }, [selectedProject]);

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

    // Create graphics for each item
    itemsWithCoordinates.forEach(item => {
      const isSelected = selectedItem?.id === item.id;
      const baseColor = isSelected ? '#ff0000' : '#007bff';
      
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

        symbol = new SimpleMarkerSymbol({
          color: baseColor,
          size: isSelected ? '20px' : '15px',
          outline: {
            color: '#ffffff',
            width: 2
          }
        });

        labelPoint = geometry;
      }

      // Create text symbol for label
      const textSymbol = new TextSymbol({
        color: '#000000',
        text: item.title,
        font: {
          size: 12,
          weight: 'bold'
        },
        haloColor: '#ffffff',
        haloSize: 1,
        yoffset: geometry.type === 'point' ? 15 : 0,
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
  }, [hierarchyItems, selectedItem, mapLoaded]);

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
};

export default MapComponent;
