import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Platform, Text, TouchableOpacity, Modal } from 'react-native';

// Map styles configuration
const MAP_STYLES = {
  standard: {
    name: 'Standard',
    web: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    mobile: 'standard',
    attribution: '© OpenStreetMap contributors'
  },
  satellite: {
    name: 'Satellite',
    web: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    mobile: 'satellite',
    attribution: '© Esri'
  },
  terrain: {
    name: 'Terrain',
    web: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    mobile: 'hybrid',
    attribution: '© OpenTopoMap'
  },
  dark: {
    name: 'Dark',
    web: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    mobile: 'standard',
    attribution: '© CartoDB'
  },
  light: {
    name: 'Light',
    web: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    mobile: 'standard',
    attribution: '© CartoDB'
  }
};

// Web Map Component using Leaflet
const WebMap = ({ 
  initialRegion, 
  markers = [], 
  onPress, 
  style, 
  mapStyle = 'standard',
  onMarkerPress 
}) => {
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markersRef = useRef([]);
  const [currentMapStyle, setCurrentMapStyle] = useState(mapStyle);

  useEffect(() => {
    // Load Leaflet CSS and JS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js';
    script.onload = initializeMap;
    document.head.appendChild(script);

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
      }
      if (document.head.contains(link)) document.head.removeChild(link);
      if (document.head.contains(script)) document.head.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (leafletMapRef.current && markers) {
      updateMarkers();
    }
  }, [markers]);

  useEffect(() => {
    if (leafletMapRef.current && currentMapStyle !== mapStyle) {
      setCurrentMapStyle(mapStyle);
    }
  }, [mapStyle]);

  useEffect(() => {
    if (leafletMapRef.current && currentMapStyle) {
      // Small delay to ensure state is updated
      setTimeout(() => {
        updateMapStyle();
      }, 0);
    }
  }, [currentMapStyle]);

  const initializeMap = () => {
    if (typeof L !== 'undefined' && mapRef.current) {
      leafletMapRef.current = L.map(mapRef.current).setView(
        [initialRegion.latitude, initialRegion.longitude],
        13
      );

      // Initialize with current map style
      setCurrentMapStyle(mapStyle);
      updateMapStyle();

      // Add click handler
      leafletMapRef.current.on('click', (e) => {
        if (onPress) {
          onPress({
            coordinate: {
              latitude: e.latlng.lat,
              longitude: e.latlng.lng
            }
          });
        }
      });

      updateMarkers();
    }
  };

  const updateMapStyle = () => {
    if (!leafletMapRef.current) return;

    // Remove existing tile layer
    leafletMapRef.current.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        leafletMapRef.current.removeLayer(layer);
      }
    });

    // Add new tile layer based on style
    const styleConfig = MAP_STYLES[currentMapStyle];
    L.tileLayer(styleConfig.web, {
      attribution: styleConfig.attribution
    }).addTo(leafletMapRef.current);
  };

  const updateMarkers = () => {
    if (!leafletMapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => {
      leafletMapRef.current.removeLayer(marker);
    });
    markersRef.current = [];

    // Add new markers
    markers.forEach(markerData => {
      const marker = L.marker([
        markerData.coordinate.latitude,
        markerData.coordinate.longitude
      ]).addTo(leafletMapRef.current);

      if (markerData.title || markerData.description) {
        marker.bindPopup(`
          <div style="min-width: 200px;">
            <strong>${markerData.title || 'Marker'}</strong>
            ${markerData.description ? `<br/>${markerData.description}` : ''}
            ${markerData.category ? `<br/><span style="color: #007AFF;">${markerData.category}</span>` : ''}
          </div>
        `);
      }

      // Add click handler for markers
      marker.on('click', () => {
        if (onMarkerPress) {
          onMarkerPress(markerData);
        }
      });

      markersRef.current.push(marker);
    });
  };

  return (
    <div
      ref={mapRef}
      style={{
        width: '100%',
        height: '100%',
        ...style
      }}
    />
  );
};

// Mobile Map Component using react-native-maps
const MobileMap = ({ 
  initialRegion, 
  markers = [], 
  onPress, 
  style, 
  mapStyle = 'standard',
  onMarkerPress 
}) => {
  const [MapView, setMapView] = useState(null);
  const [Marker, setMarker] = useState(null);
  const [currentMapStyle, setCurrentMapStyle] = useState(mapStyle);

  useEffect(() => {
    if (currentMapStyle !== mapStyle) {
      setCurrentMapStyle(mapStyle);
    }
  }, [mapStyle]);

  useEffect(() => {
    // Dynamically import react-native-maps
    const loadMaps = async () => {
      try {
        const Maps = await import('react-native-maps');
        setMapView(() => Maps.default);
        setMarker(() => Maps.Marker);
      } catch (error) {
        console.log('react-native-maps not available');
      }
    };
    loadMaps();
  }, []);

  if (!MapView || !Marker) {
    return (
      <View style={[styles.fallback, style]}>
        <Text style={styles.fallbackText}>Loading map...</Text>
      </View>
    );
  }

  const getMapType = () => {
    const styleConfig = MAP_STYLES[currentMapStyle];
    switch (styleConfig.mobile) {
      case 'satellite':
        return 'satellite';
      case 'hybrid':
        return 'hybrid';
      default:
        return 'standard';
    }
  };

  return (
    <MapView
      key={currentMapStyle}
      style={[styles.map, style]}
      initialRegion={initialRegion}
      mapType={getMapType()}
      onPress={onPress}
    >
      {markers.map((marker, index) => (
        <Marker
          key={index}
          coordinate={marker.coordinate}
          title={marker.title}
          description={marker.description}
          onPress={() => onMarkerPress && onMarkerPress(marker)}
        />
      ))}
    </MapView>
  );
};

// Map Style Selector Component
const MapStyleSelector = ({ currentStyle, onStyleChange, visible, onClose }) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.styleSelector}>
          <Text style={styles.styleSelectorTitle}>Choose Map Style</Text>
          {Object.entries(MAP_STYLES).map(([key, style]) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.styleOption,
                currentStyle === key && styles.styleOptionSelected
              ]}
              onPress={() => {
                onStyleChange(key);
                onClose();
              }}
            >
              <Text style={[
                styles.styleOptionText,
                currentStyle === key && styles.styleOptionTextSelected
              ]}>
                {style.name}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// Main Map Component
const MapView = ({ 
  initialRegion, 
  markers = [], 
  onPress, 
  style, 
  mapStyle = 'standard',
  onMarkerPress,
  showStyleSelector = true 
}) => {
  const [currentMapStyle, setCurrentMapStyle] = useState(mapStyle);
  const [styleSelectorVisible, setStyleSelectorVisible] = useState(false);

  const handleStyleChange = (newStyle) => {
    setCurrentMapStyle(newStyle);
  };

  return (
    <View style={[styles.container, style]}>
      {Platform.OS === 'web' ? (
        <WebMap
          initialRegion={initialRegion}
          markers={markers}
          onPress={onPress}
          mapStyle={currentMapStyle}
          onMarkerPress={onMarkerPress}
        />
      ) : (
        <MobileMap
          initialRegion={initialRegion}
          markers={markers}
          onPress={onPress}
          mapStyle={currentMapStyle}
          onMarkerPress={onMarkerPress}
        />
      )}
      
      {showStyleSelector && (
        <TouchableOpacity
          style={styles.styleButton}
          onPress={() => setStyleSelectorVisible(true)}
        >
          <Text style={styles.styleButtonText}>Style</Text>
        </TouchableOpacity>
      )}

      <MapStyleSelector
        currentStyle={currentMapStyle}
        onStyleChange={handleStyleChange}
        visible={styleSelectorVisible}
        onClose={() => setStyleSelectorVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  fallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  fallbackText: {
    fontSize: 16,
    color: '#666',
  },
  styleButton: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    backgroundColor: '#FF3B30',
    width: 60,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  styleButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  styleSelector: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 300,
  },
  styleSelectorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  styleOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#F2F2F7',
  },
  styleOptionSelected: {
    backgroundColor: '#007AFF',
  },
  styleOptionText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  styleOptionTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  cancelButton: {
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#FF3B30',
  },
  cancelButtonText: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
  },
});

export default MapView; 