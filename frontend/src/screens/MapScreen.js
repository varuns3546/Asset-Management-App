import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSelector } from 'react-redux';
import Map from '../components/map/Map';
import LeftMapPanel from '../components/map/LeftMapPanel';
import TopMapPanel from '../components/map/TopMapPanel';
import MapNavbar from '../components/map/MapNavbar';
import FileUploadModal from '../components/FileUploadModal';
import AddFeatureModal from '../components/map/AddFeatureModal';
import ErrorMessage from '../components/forms/ErrorMessage';
import { getHierarchy, getFeatureTypes } from '../features/projects/projectSlice';
import * as gisLayerService from '../services/gisLayerService';
import '../styles/map.css';
import { useRouteMount } from '../contexts/RouteMountContext';
import useProjectData from '../hooks/useProjectData';
import useDebouncedAsync from '../hooks/useDebouncedAsync';

const MapScreen = () => {
  const { currentHierarchy, currentFeatureTypes } = useSelector((state) => state.projects);
  const { selectedProject, user, dispatch } = useProjectData();
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
  const [assetTypeLayerVisibility, setAssetTypeLayerVisibility] = useState({}); // Track visibility of asset type layers
  const [showAddFeatureModal, setShowAddFeatureModal] = useState(false);
  const [selectedLayerForFeature, setSelectedLayerForFeature] = useState(null);
  const [error, setError] = useState('');
  const containerRef = useRef(null);
  const { isRouteMounted } = useRouteMount();


  // Load layers from database (needs to be accessible in sync function)
  const loadLayersFromDatabase = async () => {
    if (!selectedProject?.id) return;
    
    try {
      const response = await gisLayerService.getGisLayers(selectedProject.id);
      if (response.success && response.data && isRouteMounted()) {
        // Convert database layers to local state format
        const loadedLayers = await Promise.all(
          response.data.map(async (dbLayer) => {
            if (!isRouteMounted()) return null;
            
            // Get features for this layer
            const featuresResponse = await gisLayerService.getLayerFeatures(
              selectedProject.id,
              dbLayer.id
            );
            
            if (!isRouteMounted()) return null;
            
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

            // Check if this is an asset type layer by comparing name with asset types
            let isAssetTypeLayer = false;
            let assetTypeId = null;
            
            if (currentFeatureTypes) {
              // Check if layer name matches an asset type name
              const matchingType = currentFeatureTypes.find(
                type => type.title === dbLayer.name
              );
              if (matchingType) {
                isAssetTypeLayer = true;
                assetTypeId = matchingType.id;
              } else if (dbLayer.name === 'Uncategorized Assets') {
                isAssetTypeLayer = true;
                assetTypeId = null;
              }
            }

            return {
              id: dbLayer.id,
              name: dbLayer.name,
              description: dbLayer.description,
              layerType: dbLayer.layer_type, // Match LayerPanel's property name
              geometryType: dbLayer.geometry_type,
              coordinateSystem: dbLayer.srid ? `EPSG:${dbLayer.srid}` : 'EPSG:4326',
              visible: assetTypeLayerVisibility[dbLayer.id] !== undefined 
                ? assetTypeLayerVisibility[dbLayer.id] 
                : dbLayer.visible,
              style: dbLayer.style,
              attributes: dbLayer.attributes,
              features: features,
              featureCount: features.length,
              isAssetTypeLayer: isAssetTypeLayer,
              assetTypeId: assetTypeId
            };
          })
        );
        
        if (isRouteMounted()) {
          setLayers(loadedLayers.filter(l => l !== null));
        }
      }
    } catch (error) {
      if (isRouteMounted()) {
        console.error('Error loading layers:', error);
      }
    }
  };

  // Load hierarchy and feature types when project is selected (debounced to prevent excessive calls)
  useDebouncedAsync(
    async () => {
      if (!selectedProject?.id || !user) return;
      
      dispatch(getHierarchy(selectedProject.id));
      dispatch(getFeatureTypes(selectedProject.id));
      await loadLayersFromDatabase();
    },
    [selectedProject?.id, user?.id],
    {
      delay: 300,
      shouldRun: (deps) => {
        const [projectId, userId] = deps;
        return !!(projectId && userId);
      },
      skipInitialRun: false
    }
  );

  // Sync asset type layers to database (with debouncing and duplicate prevention)
  useDebouncedAsync(
    async () => {
      if (!selectedProject?.id || !currentHierarchy || !currentFeatureTypes || !user) {
        return;
      }

      // Group assets by item_type_id
      const assetsByType = {};
      currentHierarchy.forEach(asset => {
        // Only include assets with coordinates
        if (asset.beginning_latitude != null && 
            asset.beginning_longitude != null &&
            !isNaN(parseFloat(asset.beginning_latitude)) &&
            !isNaN(parseFloat(asset.beginning_longitude))) {
          
          const typeId = asset.item_type_id || 'uncategorized';
          if (!assetsByType[typeId]) {
            assetsByType[typeId] = [];
          }
          assetsByType[typeId].push(asset);
        }
      });

      // Get existing layers to check what already exists
      const existingLayersResponse = await gisLayerService.getGisLayers(selectedProject.id);
      const existingLayers = existingLayersResponse.success ? existingLayersResponse.data : [];

      // Process each asset type
      for (const [typeId, assets] of Object.entries(assetsByType)) {
        if (assets.length === 0) continue;

        let layerName, layerDescription, layerColor;
        
        if (typeId === 'uncategorized') {
          layerName = 'Uncategorized Assets';
          layerDescription = 'Assets without a type';
          layerColor = '#999999';
        } else {
          const assetType = currentFeatureTypes.find(type => type.id === typeId);
          if (!assetType) continue;
          layerName = assetType.title;
          layerDescription = assetType.description || `Layer for ${assetType.title} assets`;
          layerColor = assetType.icon_color || '#3388ff';
        }

        // Check if layer already exists (by name)
        let existingLayer = existingLayers.find(l => l.name === layerName);
        
        if (!existingLayer) {
          // Create new layer
          const layerData = {
            name: layerName,
            description: layerDescription,
            layerType: 'vector',
            geometryType: 'point',
            attributes: [],
            style: {
              color: layerColor,
              weight: 3,
              opacity: 1,
              fillColor: layerColor,
              fillOpacity: 0.2
            }
          };

          const createResponse = await gisLayerService.createGisLayer(
            selectedProject.id,
            layerData
          );

          if (createResponse.success) {
            existingLayer = createResponse.data;
          } else {
            console.error('Failed to create layer:', createResponse.error);
            continue;
          }
        }

        // Now add/update features for this layer
        // First, get existing features
        const featuresResponse = await gisLayerService.getLayerFeatures(
          selectedProject.id,
          existingLayer.id
        );
        const existingFeatures = featuresResponse.success ? featuresResponse.data : [];
        const existingAssetIds = new Set(
          existingFeatures
            .map(f => f.properties?.asset_id)
            .filter(id => id != null)
        );

        // Add features for assets that don't exist yet
        for (const asset of assets) {
          if (existingAssetIds.has(asset.id)) continue; // Skip if already exists

          const coordinates = [
            parseFloat(asset.beginning_longitude), // [lng, lat] for backend
            parseFloat(asset.beginning_latitude)
          ];

          try {
            await gisLayerService.addFeature(
              selectedProject.id,
              existingLayer.id,
              {
                name: asset.title,
                coordinates: [coordinates], // Point geometry
                properties: {
                  title: asset.title,
                  asset_id: asset.id,
                  item_type_id: asset.item_type_id || null
                }
              }
            );
          } catch (error) {
            console.error(`Failed to add feature for asset ${asset.id}:`, error);
          }
        }
      }

      // Reload layers after syncing
      if (isRouteMounted()) {
        loadLayersFromDatabase();
      }
    },
    [currentHierarchy, currentFeatureTypes, selectedProject?.id, user],
    {
      delay: 1000, // 1 second debounce
      shouldRun: (deps) => {
        const [hierarchy, types, projectId, user] = deps;
        return !!(projectId && hierarchy && types && user);
      },
      onError: (error) => {
        console.error('Error syncing asset type layers:', error);
      }
    }
  );


  // Use layers from database (which now includes asset type layers)
  const allLayers = useMemo(() => {
    return layers;
  }, [layers]);

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
    setIsUploadModalOpen(false);
  };

  const handleCreateLayer = async (layerData) => {
    if (!isRouteMounted()) return;
    setError('');
    
    if (!selectedProject?.id) {
      if (isRouteMounted()) {
        setError('No project selected');
      }
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

      if (response.success && isRouteMounted()) {
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
      }
    } catch (error) {
      if (isRouteMounted()) {
        const errorMessage = error.response?.data?.error || 'Failed to create layer. Please try again.';
        setError(errorMessage);
      }
    }
  };

  const handleToggleLayer = async (layerId) => {
    const layer = allLayers.find(l => l.id === layerId);
    if (!layer) return;
    
    // If it's an asset type layer, update both local visibility state and layers state
    if (layer.isAssetTypeLayer) {
      const newVisibility = !layer.visible;
      if (isRouteMounted()) {
        // Update the visibility state for persistence across reloads
        setAssetTypeLayerVisibility(prev => ({
          ...prev,
          [layerId]: newVisibility
        }));
        // Immediately update the layers state so the UI reflects the change
        setLayers(prevLayers => 
          prevLayers.map(l => 
            l.id === layerId ? { ...l, visible: newVisibility } : l
          )
        );
      }
      return;
    }
    
    if (!selectedProject?.id) return;
    setError('');

    try {
      // Update in database for custom layers
      await gisLayerService.updateGisLayer(
        selectedProject.id,
        layerId,
        { visible: !layer.visible }
      );

      // Update local state
      if (isRouteMounted()) {
        setLayers(prev => prev.map(l => 
          l.id === layerId ? { ...l, visible: !l.visible } : l
        ));
      }
    } catch (error) {
      if (isRouteMounted()) {
        setError('Failed to update layer visibility');
      }
    }
  };

  const handleRemoveLayer = async (layerId) => {
    // Don't allow deleting asset type layers (they're auto-generated)
    const layer = allLayers.find(l => l.id === layerId);
    if (layer?.isAssetTypeLayer) {
      if (isRouteMounted()) {
        setError('Cannot delete asset type layers. They are automatically generated from your asset types.');
      }
      return;
    }
    
    if (!selectedProject?.id) return;
    setError('');

    try {
      await gisLayerService.deleteGisLayer(selectedProject.id, layerId);
      if (isRouteMounted()) {
        setLayers(prev => prev.filter(layer => layer.id !== layerId));
      }
    } catch (error) {
      if (isRouteMounted()) {
        setError('Failed to delete layer');
      }
    }
  };

  const handleEditLayer = (layerId) => {
    const layer = allLayers.find(l => l.id === layerId);
    if (layer?.isAssetTypeLayer) {
      if (isRouteMounted()) {
        setError('Cannot edit asset type layers. They are automatically generated from your asset types.');
      }
      return;
    }
    // TODO: Implement layer editing for custom layers
  };

  const handleStyleLayer = (layerId) => {
    const layer = allLayers.find(l => l.id === layerId);
    if (layer?.isAssetTypeLayer) {
      if (isRouteMounted()) {
        setError('Cannot style asset type layers. Their style is determined by the asset type settings.');
      }
      return;
    }
    // TODO: Implement layer styling for custom layers
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

        if (isRouteMounted()) {
          setLayers(updatedLayers);
          setShowAddFeatureModal(false);
          setSelectedLayerForFeature(null);
        }
      }
    } catch (error) {
      if (isRouteMounted()) {
        setError('Failed to add feature');
      }
    }
  };

  const handleRemoveFeature = async (layerId, featureId) => {
    if (!selectedProject?.id) return;
    setError('');

    try {
      await gisLayerService.deleteFeature(selectedProject.id, layerId, featureId);
      
      // Update local state (use == for loose comparison since layerId might be string from Object.entries)
      if (isRouteMounted()) {
        setLayers(prev => prev.map(layer => 
          String(layer.id) === String(layerId)
            ? {
                ...layer,
                features: layer.features.filter(f => String(f.id) !== String(featureId)),
                featureCount: (layer.featureCount || 1) - 1
              }
            : layer
        ));
      }
    } catch (error) {
      if (isRouteMounted()) {
        setError('Failed to delete feature');
      }
    }
  };

  // Extract coordinates from selected project
  // Leaflet expects [latitude, longitude] format
  const projectCoordinates = selectedProject && selectedProject.latitude != null && selectedProject.longitude != null
    ? [parseFloat(selectedProject.latitude), parseFloat(selectedProject.longitude)]
    : null;

                                                    return (
    
    <div ref={containerRef} className="leaflet-screen-container">
      <ErrorMessage message={error} style={{ position: 'fixed', top: '80px', left: '50%', transform: 'translateX(-50%)', zIndex: 10000, maxWidth: '500px' }} />
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
          layers={allLayers}
          onToggleLayer={handleToggleLayer}
          onRemoveLayer={handleRemoveLayer}
          onEditLayer={handleEditLayer}
          onStyleLayer={handleStyleLayer}
          onAddFeature={handleAddFeatureToLayer}
          onRemoveFeature={handleRemoveFeature}
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
            features={[]}
            featureTypes={currentFeatureTypes || []}
            showLabels={showLabels}
            labelFontSize={labelFontSize}
            labelColor={labelColor}
            labelBackgroundColor={labelBackgroundColor}
            layers={allLayers}
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