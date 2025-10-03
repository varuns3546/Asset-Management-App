import React, { useEffect, useRef, useState } from 'react';
import Map from '@arcgis/core/Map';
import MapView from '@arcgis/core/views/MapView';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import Graphic from '@arcgis/core/Graphic';
import Point from '@arcgis/core/geometry/Point';
import SimpleMarkerSymbol from '@arcgis/core/symbols/SimpleMarkerSymbol';
import TextSymbol from '@arcgis/core/symbols/TextSymbol';
import config from '@arcgis/core/config';
import ARCGIS_CONFIG from '../config/arcgisConfig';
import '../styles/map.css';

const MapComponent = ({ 
  hierarchyItems = [], 
  selectedItem = null, 
  onItemSelect = null,
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

    // Create map view
    const mapView = new MapView({
      container: mapRef.current,
      map: map,
      center: [ARCGIS_CONFIG.defaultCenter.longitude, ARCGIS_CONFIG.defaultCenter.latitude],
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
  }, []);

  // Update markers when hierarchy items change
  useEffect(() => {
    if (!mapLoaded || !graphicsLayerRef.current) return;

    // Clear existing graphics
    graphicsLayerRef.current.removeAll();

    // Filter items that have coordinates
    const itemsWithCoordinates = hierarchyItems.filter(item => 
      item.coordinates && 
      item.coordinates.latitude && 
      item.coordinates.longitude
    );

    // Create markers for each item
    itemsWithCoordinates.forEach(item => {
      // Create point geometry
      const longitude = parseFloat(item.coordinates.longitude);
      const latitude = parseFloat(item.coordinates.latitude);
      
      // Check if coordinates are valid
      if (isNaN(longitude) || isNaN(latitude)) {
        console.error('MapComponent: Invalid coordinates for item:', item.title, longitude, latitude);
        return;
      }
      
      const point = new Point({
        longitude: longitude,
        latitude: latitude
      });

      // Create marker symbol
      const markerSymbol = new SimpleMarkerSymbol({
        color: selectedItem?.id === item.id ? '#ff0000' : '#007bff',
        size: selectedItem?.id === item.id ? '20px' : '15px',
        outline: {
          color: '#ffffff',
          width: 2
        }
      });

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
        verticalAlignment: 'top',
        horizontalAlignment: 'center'
      });

      // Create graphics
      const markerGraphic = new Graphic({
        geometry: point,
        symbol: markerSymbol,
        attributes: {
          id: item.id,
          title: item.title,
          item_type: item.item_type?.title || 'No Type'
        }
      });

      const labelGraphic = new Graphic({
        geometry: point,
        symbol: textSymbol,
        attributes: {
          id: item.id,
          title: item.title
        }
      });

      // Add graphics to layer
      graphicsLayerRef.current.add(markerGraphic);
      graphicsLayerRef.current.add(labelGraphic);
    });

    // If there are items with coordinates, fit the view to show all markers
    if (itemsWithCoordinates.length > 0 && graphicsLayerRef.current.queryExtent) {
      graphicsLayerRef.current.queryExtent().then(result => {
        if (result.extent) {
          mapViewRef.current.goTo(result.extent.expand(1.2));
        }
      }).catch(error => {
        console.log('Could not fit view to graphics:', error);
        // Fallback: center on first item
        if (itemsWithCoordinates.length > 0) {
          const firstItem = itemsWithCoordinates[0];
          mapViewRef.current.goTo({
            center: [parseFloat(firstItem.coordinates.longitude), parseFloat(firstItem.coordinates.latitude)],
            zoom: 15
          });
        }
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
          {hierarchyItems.filter(item => 
            item.coordinates && item.coordinates.latitude && item.coordinates.longitude
          ).length} assets with coordinates
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
