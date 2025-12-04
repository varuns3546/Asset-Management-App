import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Map from '../components/map/Map';
import LeftMapPanel from '../components/map/LeftMapPanel';
import TopMapPanel from '../components/map/TopMapPanel';
import MapNavbar from '../components/map/MapNavbar';
import FileUploadModal from '../components/FileUploadModal';
import AddFeatureModal from '../components/AddFeatureModal';
import { getHierarchy, getFeatureTypes } from '../features/projects/projectSlice';
import { loadUser } from '../features/auth/authSlice';
import * as gisLayerService from '../services/gisLayerService';
import '../styles/map.css';

const MapScreen = () => {
  const dispatch = useDispatch();
  const { selectedProject, currentHierarchy, currentFeatureTypes } = useSelector((state) => state.projects);
  const { user } = useSelector((state) => state.auth);
  const [isExpanded, setIsExpanded] = useState(true);
  const [panelWidth, setPanelWidth] = useState(320);
  const [topPanelHeight, setTopPanelHeight] = useState(80);
  const [selectedBasemap, setSelectedBasemap] = useState('street');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [labelFontSize, setLabelFontSize] = useState(12);
  const [labelColor, setLabelColor] = useState('#000000');
  const [labelBackgroundColor, setLabelBackgroundColor] = useState('rgba(255, 255, 255, 0.6)');
  const [layers, setLayers] = useState([]);
  const [showAddFeatureModal, setShowAddFeatureModal] = useState(false);
  const [selectedLayerForFeature, setSelectedLayerForFeature] = useState(null);
  const containerRef = useRef(null);

  // Load user on mount
  useEffect(() => {
    dispatch(loadUser());
  }, [dispatch]);

  // Load hierarchy and feature types when project is selected and user is authenticated
  useEffect(() => {
    if (selectedProject?.id && user) {
      dispatch(getHierarchy(selectedProject.id));
      dispatch(getFeatureTypes(selectedProject.id));
      loadLayersFromDatabase();
    }
  }, [selectedProject?.id, user, dispatch]);

  // Load layers from database
  const loadLayersFromDatabase = async () => {
    if (!selectedProject?.id) return;
    
    try {
      const response = await gisLayerService.getGisLayers(selectedProject.id);
      if (response.success && response.data) {
        // Convert database layers to local state format
        const loadedLayers = await Promise.all(
          response.data.map(async (dbLayer) => {
            // Get features for this layer
            const featuresResponse = await gisLayerService.getLayerFeatures(
              selectedProject.id,
              dbLayer.id
            );
            
            const features = featuresResponse.success 
              ? featuresResponse.data.map(f => {
                  let coordinates = [];
                  
                  try {
                    if (f.geometry_geojson) {
                      const geom = JSON.parse(f.geometry_geojson);
                      
                      // Convert GeoJSON coordinates to our format [lat, lng]
                      if (geom.type === 'Point') {
                        coordinates = [[geom.coordinates[1], geom.coordinates[0]]]; // [lat, lng]
                      } else if (geom.type === 'LineString') {
                        coordinates = geom.coordinates.map(coord => [coord[1], coord[0]]);
                      } else if (geom.type === 'Polygon') {
                        coordinates = geom.coordinates[0].map(coord => [coord[1], coord[0]]);
                      }
                    }
                  } catch (error) {
                    console.error('Error parsing geometry:', error);
                  }
                  
                  return {
                    id: f.id,
                    name: f.name,
                    coordinates: coordinates,
                    properties: f.properties
                  };
                })
                .filter(f => f.coordinates && f.coordinates.length > 0) // Filter out features with no coordinates
              : [];

            return {
              id: dbLayer.id,
              name: dbLayer.name,
              description: dbLayer.description,
              layerType: dbLayer.layer_type, // Match LayerPanel's property name
              geometryType: dbLayer.geometry_type,
              coordinateSystem: dbLayer.srid ? `EPSG:${dbLayer.srid}` : 'EPSG:4326',
              visible: dbLayer.visible,
              style: dbLayer.style,
              attributes: dbLayer.attributes,
              features: features,
              featureCount: features.length
            };
          })
        );
        
        setLayers(loadedLayers);
        console.log('Loaded layers from database:', loadedLayers);
      }
    } catch (error) {
      console.error('Error loading layers:', error);
    }
  };

  // Update CSS variables based on actual component heights
  useEffect(() => {
    if (containerRef.current) {
      // Measure main Navbar height (the one at the top of the app)
      const mainNavbar = document.querySelector('.container');
      if (mainNavbar) {
        const mainNavbarHeight = mainNavbar.offsetHeight;
        containerRef.current.style.setProperty('--main-navbar-height', `${mainNavbarHeight}px`);
      }
      
      // Measure MapNavbar height using querySelector
      const navbarElement = containerRef.current.querySelector('.map-navbar');
      if (navbarElement) {
        const navbarHeight = navbarElement.offsetHeight;
        containerRef.current.style.setProperty('--map-navbar-height', `${navbarHeight}px`);
      }
    }
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.style.setProperty('--top-panel-height', `${topPanelHeight}px`);
    }
  }, [topPanelHeight]);

  // Prevent body scrolling when map screen is mounted
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalOverflowY = document.body.style.overflowY;
    const originalHeight = document.body.style.height;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalHtmlOverflowY = document.documentElement.style.overflowY;
    const originalHtmlHeight = document.documentElement.style.height;

    // Prevent scrolling on body and html
    document.body.style.overflow = 'hidden';
    document.body.style.overflowY = 'hidden';
    document.body.style.height = '100vh';
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.overflowY = 'hidden';
    document.documentElement.style.height = '100vh';

    // Cleanup: restore original styles when component unmounts
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.overflowY = originalOverflowY;
      document.body.style.height = originalHeight;
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.documentElement.style.overflowY = originalHtmlOverflowY;
      document.documentElement.style.height = originalHtmlHeight;
    };
  }, []);

  const handleFileSelect = (file) => {
    // TODO: Handle file upload for layer creation
    console.log('File selected:', file);
    setIsUploadModalOpen(false);
  };

  const handleCreateLayer = async (layerData) => {
    if (!selectedProject?.id) {
      alert('No project selected');
      return;
    }

    try {
      // Save to Supabase
      const response = await gisLayerService.createGisLayer(
        selectedProject.id,
        {
          name: layerData.name,
          description: layerData.description,
          layerType: layerData.layerType, // Fixed: was layerData.type
          geometryType: layerData.geometryType,
          attributes: layerData.attributes,
          style: layerData.style || {
            color: '#3388ff',
            weight: 3,
            opacity: 1,
            fillColor: '#3388ff',
            fillOpacity: 0.2
          }
        }
      );

      if (response.success) {
        const newLayer = {
          id: response.data.id, // Use database ID
          name: layerData.name,
          description: layerData.description,
          layerType: layerData.layerType, // Match LayerPanel's property name
          geometryType: layerData.geometryType,
          coordinateSystem: layerData.coordinateSystem,
          visible: true,
          style: response.data.style,
          attributes: layerData.attributes,
          features: [],
          featureCount: 0
        };

        setLayers(prev => [...prev, newLayer]);
        console.log('Layer saved to database:', response.data);
      }
    } catch (error) {
      console.error('Error creating layer:', error);
      const errorMessage = error.response?.data?.error || 'Failed to create layer. Please try again.';
      alert(errorMessage);
    }
  };

  const handleToggleLayer = async (layerId) => {
    const layer = layers.find(l => l.id === layerId);
    if (!layer || !selectedProject?.id) return;

    try {
      // Update in database
      await gisLayerService.updateGisLayer(
        selectedProject.id,
        layerId,
        { visible: !layer.visible }
      );

      // Update local state
      setLayers(prev => prev.map(l => 
        l.id === layerId ? { ...l, visible: !l.visible } : l
      ));
    } catch (error) {
      console.error('Error updating layer visibility:', error);
      alert('Failed to update layer visibility');
    }
  };

  const handleRemoveLayer = async (layerId) => {
    if (!window.confirm('Are you sure you want to remove this layer?')) return;
    if (!selectedProject?.id) return;

    try {
      await gisLayerService.deleteGisLayer(selectedProject.id, layerId);
      setLayers(prev => prev.filter(layer => layer.id !== layerId));
      console.log('Layer deleted from database');
    } catch (error) {
      console.error('Error deleting layer:', error);
      alert('Failed to delete layer');
    }
  };

  const handleEditLayer = (layerId) => {
    // TODO: Implement layer editing
    console.log('Edit layer:', layerId);
  };

  const handleStyleLayer = (layerId) => {
    // TODO: Implement layer styling
    console.log('Style layer:', layerId);
  };

  const handleAddFeatureToLayer = (layer) => {
    setSelectedLayerForFeature(layer);
    setShowAddFeatureModal(true);
  };

  const handleAddFeature = async (featureData) => {
    if (!selectedLayerForFeature || !selectedProject?.id) return;

    try {
      // Prepare coordinates in the format expected by backend [lng, lat]
      const coordinates = featureData.coordinates.map(coord => [
        parseFloat(coord.lng || coord[1]),
        parseFloat(coord.lat || coord[0])
      ]);

      // Save to Supabase
      const response = await gisLayerService.addFeature(
        selectedProject.id,
        selectedLayerForFeature.id,
        {
          name: featureData.name,
          coordinates: coordinates,
          properties: featureData.properties || {}
        }
      );

      if (response.success) {
        const newFeature = {
          id: response.data.id, // Use database ID
          name: featureData.name,
          coordinates: coordinates.map(coord => [coord[1], coord[0]]), // Convert back to [lat, lng] for display
          properties: featureData.properties || {}
        };

        const updatedLayers = layers.map(l => 
          l.id === selectedLayerForFeature.id
            ? {
                ...l,
                features: [...(l.features || []), newFeature],
                featureCount: (l.features?.length || 0) + 1
              }
            : l
        );

        setLayers(updatedLayers);
        setShowAddFeatureModal(false);
        setSelectedLayerForFeature(null);
        
        console.log('Feature saved to database:', response.data);
      }
    } catch (error) {
      console.error('Error adding feature:', error);
      alert('Failed to add feature');
    }
  };

  const mapWidth = isExpanded ? `calc(100% - ${panelWidth}px)` : '100%';

  // Extract coordinates from selected project
  // Leaflet expects [latitude, longitude] format
  const projectCoordinates = selectedProject && selectedProject.latitude != null && selectedProject.longitude != null
    ? [parseFloat(selectedProject.latitude), parseFloat(selectedProject.longitude)]
    : null;

  return (
    
    <div ref={containerRef} className="leaflet-screen-container">
      <MapNavbar 
        onOpenUploadModal={() => setIsUploadModalOpen(true)}
        onCreateLayer={handleCreateLayer}
      />
      <TopMapPanel 
        panelHeight={topPanelHeight}
        setPanelHeight={setTopPanelHeight}
        selectedBasemap={selectedBasemap}
        setSelectedBasemap={setSelectedBasemap}
        showLabels={showLabels}
        setShowLabels={setShowLabels}
        labelFontSize={labelFontSize}
        setLabelFontSize={setLabelFontSize}
        labelColor={labelColor}
        setLabelColor={setLabelColor}
        labelBackgroundColor={labelBackgroundColor}
        setLabelBackgroundColor={setLabelBackgroundColor}
      />
      <div className="map-content-container">
        <LeftMapPanel 
          isExpanded={isExpanded}
          setIsExpanded={setIsExpanded}
          panelWidth={panelWidth}
          setPanelWidth={setPanelWidth}
          layers={layers}
          onToggleLayer={handleToggleLayer}
          onRemoveLayer={handleRemoveLayer}
          onEditLayer={handleEditLayer}
          onStyleLayer={handleStyleLayer}
          onAddFeature={handleAddFeatureToLayer}
        />
        <div style={{ 
          width: '100%', 
          height: '100%', 
          position: 'relative',
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
          marginLeft: isExpanded ? `${panelWidth}px` : '0',
          transition: 'margin-left 0.3s ease-in-out'
        }}>
          <Map 
            panelWidth={panelWidth} 
            selectedBasemap={selectedBasemap}
            projectCoordinates={projectCoordinates}
            features={currentHierarchy || []}
            featureTypes={currentFeatureTypes || []}
            showLabels={showLabels}
            labelFontSize={labelFontSize}
            labelColor={labelColor}
            labelBackgroundColor={labelBackgroundColor}
            layers={layers}
          />
        </div>
      </div>
      
      {/* File Upload Modal */}
      {selectedProject && (
        <FileUploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onFileSelect={handleFileSelect}
          projectId={selectedProject.id}
        />
      )}

      {/* Add Feature Modal */}
      <AddFeatureModal
        isOpen={showAddFeatureModal}
        onClose={() => {
          setShowAddFeatureModal(false);
          setSelectedLayerForFeature(null);
        }}
        layer={selectedLayerForFeature}
        onAddFeature={handleAddFeature}
      />
    </div>
  );
};

export default MapScreen;