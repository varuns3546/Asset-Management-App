import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import Map from '../components/map/Map';
import LeftMapPanel from '../components/map/LeftMapPanel';
import TopMapPanel from '../components/map/TopMapPanel';
import MapNavbar from '../components/map/MapNavbar';
import FileUploadModal from '../components/FileUploadModal';
import AddFeatureModal from '../components/map/AddFeatureModal';
import StyleLayerModal from '../components/map/StyleLayerModal';
import ExportLayersModal from '../components/map/ExportLayersModal';
import ErrorMessage from '../components/forms/ErrorMessage';
import { getHierarchy, getFeatureTypes, updateFeatureType, getProject } from '../features/projects/projectSlice';
import * as gisLayerService from '../services/gisLayerService';
import { getRandomUnusedStyle } from '../constants/itemTypeIcons';
import '../styles/map.css';
import '../styles/survey.css';
import { useRouteMount } from '../contexts/RouteMountContext';
import useProjectData from '../hooks/useProjectData';
import useDebouncedAsync from '../hooks/useDebouncedAsync';
import projectService from '../features/projects/projectService';
import useClickOutside from '../hooks/useClickOutside';
import ContextMenu from '../components/common/ContextMenu';

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
  // Track deleted asset type layer names to prevent auto-regeneration (persisted in localStorage)
  const [deletedAssetTypeLayers, setDeletedAssetTypeLayers] = useState(new Set());
  const [showAddFeatureModal, setShowAddFeatureModal] = useState(false);
  const [selectedLayerForFeature, setSelectedLayerForFeature] = useState(null);
  const [showStyleLayerModal, setShowStyleLayerModal] = useState(false);
  const [selectedLayerForStyle, setSelectedLayerForStyle] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [zoomToFeature, setZoomToFeature] = useState(null);
  const [zoomToLayer, setZoomToLayer] = useState(null);
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [isLoadingLayers, setIsLoadingLayers] = useState(false);
  const containerRef = useRef(null);
  const { isRouteMounted } = useRouteMount();
  const [featureContextMenu, setFeatureContextMenu] = useState(null);
  const featureContextMenuRef = useRef(null);
  
  // Load label settings from project
  useEffect(() => {
    if (selectedProject) {
      if (selectedProject.label_font_size !== undefined) {
        setLabelFontSize(selectedProject.label_font_size);
      }
      if (selectedProject.label_color) {
        setLabelColor(selectedProject.label_color);
      }
      if (selectedProject.label_background_color) {
        setLabelBackgroundColor(selectedProject.label_background_color);
      }
    }
  }, [selectedProject?.id]); // Only re-run when project changes
  
  // Save label settings to database with debouncing
  const saveLabelSettings = useCallback(async (settings) => {
    if (!selectedProject?.id) return;
    
    try {
      await projectService.updateProject(selectedProject.id, settings);
    } catch (error) {
      console.error('Error saving label settings:', error);
      if (isRouteMounted()) {
        setError('Failed to save label settings');
      }
    }
  }, [selectedProject?.id, isRouteMounted]);
  
  // Wrapper functions to save label settings when they change
  const handleLabelFontSizeChange = useCallback((size) => {
    setLabelFontSize(size);
    saveLabelSettings({ label_font_size: size });
  }, [saveLabelSettings]);
  
  const handleLabelColorChange = useCallback((color) => {
    setLabelColor(color);
    saveLabelSettings({ label_color: color });
  }, [saveLabelSettings]);
  
  const handleLabelBackgroundColorChange = useCallback((color) => {
    setLabelBackgroundColor(color);
    saveLabelSettings({ label_background_color: color });
  }, [saveLabelSettings]);
  
  // Memoize the callback to prevent unnecessary re-renders
  const handleMapLoadingChange = useCallback((loading) => {
    setIsMapLoading(loading);
  }, []);

  // Use layers from database (which now includes asset type layers)
  const allLayers = useMemo(() => {
    return layers;
  }, [layers]);

  // Close context menu when clicking outside
  useClickOutside(featureContextMenuRef, () => {
    setFeatureContextMenu(null);
  });

  // Handle feature context menu
  const handleFeatureContextMenu = useCallback((e, feature, layer) => {
    if (!e || !feature) return;
    
    // Only show context menu for features that belong to a layer (custom layers, not asset types)
    if (!layer) return;
    
    // Get mouse coordinates from Leaflet event
    // Leaflet events have originalEvent which contains the DOM event
    const domEvent = e.originalEvent || e;
    const x = domEvent.clientX || domEvent.pageX || 0;
    const y = domEvent.clientY || domEvent.pageY || 0;
    
    // Prevent default browser context menu
    if (domEvent.preventDefault) {
      domEvent.preventDefault();
    }
    if (domEvent.stopPropagation) {
      domEvent.stopPropagation();
    }
    
    setFeatureContextMenu({
      x: x,
      y: y,
      feature: feature,
      layer: layer
    });
  }, []);

  // Load deleted asset type layers from localStorage when project changes
  useEffect(() => {
    if (selectedProject?.id) {
      const key = `deletedAssetTypeLayers_${selectedProject.id}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        const savedSet = new Set(JSON.parse(saved));
        setDeletedAssetTypeLayers(savedSet);
        console.log(`[MapScreen] Loaded ${savedSet.size} deleted asset type layers from localStorage for project ${selectedProject.id}:`, [...savedSet]);
      } else {
        setDeletedAssetTypeLayers(new Set());
      }
    }
  }, [selectedProject?.id]);

  // Load layers from database (needs to be accessible in sync function)
  const loadLayersFromDatabase = async (showLoading = true) => {
    if (!selectedProject?.id) return;
    
    // Prevent multiple simultaneous loads when showing spinner
    if (showLoading && isLoadingLayersRef.current) {
      return;
    }
    
    if (showLoading) {
      isLoadingLayersRef.current = true;
      setIsLoadingLayers(true);
    }
    
    try {
      const response = await gisLayerService.getGisLayers(selectedProject.id);
      if (response.success && response.data && isRouteMounted()) {
        // Fetch all features in parallel first (more efficient than sequential)
        const featuresPromises = response.data.map(dbLayer =>
          gisLayerService.getLayerFeatures(selectedProject.id, dbLayer.id)
        );
        const featuresResponses = await Promise.all(featuresPromises);
        
        // Convert database layers to local state format
        const loadedLayers = response.data.map((dbLayer, index) => {
          if (!isRouteMounted()) return null;
          
          const featuresResponse = featuresResponses[index];
          
          if (!isRouteMounted()) return null;
          
          const features = featuresResponse.success 
            ? featuresResponse.data.map(f => {
                let coordinates = [];
                
                // Priority 1: Use beginning_latitude/beginning_longitude if available (backend now provides these)
                if (f.beginning_latitude != null && f.beginning_longitude != null) {
                  coordinates = [[parseFloat(f.beginning_latitude), parseFloat(f.beginning_longitude)]];
                }
                // Priority 2: Parse geometry_geojson if coordinates not set
                else if (f.geometry_geojson) {
                  try {
                    const geom = typeof f.geometry_geojson === 'string' 
                      ? JSON.parse(f.geometry_geojson)
                      : f.geometry_geojson;
                    
                    // Convert GeoJSON coordinates to our format [lat, lng]
                    if (geom && geom.coordinates) {
                      if (geom.type === 'Point') {
                        coordinates = [[geom.coordinates[1], geom.coordinates[0]]]; // [lat, lng]
                      } else if (geom.type === 'LineString') {
                        coordinates = geom.coordinates.map(coord => [coord[1], coord[0]]);
                      } else if (geom.type === 'Polygon') {
                        coordinates = geom.coordinates[0].map(coord => [coord[1], coord[0]]);
                      }
                    }
                  } catch (error) {
                    console.error('Error parsing geometry for feature', f.id, ':', error);
                  }
                }
                
                return {
                  id: f.id,
                  name: f.name,
                  coordinates: coordinates,
                  properties: f.properties,
                  // Keep original coordinate fields for compatibility
                  beginning_latitude: f.beginning_latitude,
                  beginning_longitude: f.beginning_longitude
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

          // Parse style if it's a string (Supabase JSON fields are usually already parsed, but handle both cases)
          let parsedStyle = dbLayer.style;
          if (typeof dbLayer.style === 'string') {
            try {
              parsedStyle = JSON.parse(dbLayer.style);
            } catch (e) {
              console.warn('Failed to parse layer style:', e);
              parsedStyle = {};
            }
          }

          // Asset type layers use the style from the layer itself (no mapping from asset type)

          return {
            id: dbLayer.id,
            name: dbLayer.name,
            description: dbLayer.description,
            layerType: dbLayer.layer_type, // Match LayersPanel's property name
            geometryType: dbLayer.geometry_type,
            coordinateSystem: dbLayer.srid ? `EPSG:${dbLayer.srid}` : 'EPSG:4326',
            visible: assetTypeLayerVisibility[dbLayer.id] !== undefined 
              ? assetTypeLayerVisibility[dbLayer.id] 
              : dbLayer.visible,
            style: parsedStyle || {},
            attributes: dbLayer.attributes,
            features: features,
            featureCount: features.length,
            isAssetTypeLayer: isAssetTypeLayer,
            assetTypeId: assetTypeId
          };
        });
        
        if (isRouteMounted()) {
          const filteredLayers = loadedLayers.filter(l => l !== null);
          console.log('MapScreen: Setting layers state with', filteredLayers.length, 'layers');
          const totalFeatures = filteredLayers.reduce((sum, l) => sum + (l.features?.length || 0), 0);
          console.log('MapScreen: Total features across all layers:', totalFeatures);
          if (filteredLayers.length > 0) {
            console.log('MapScreen: First layer:', filteredLayers[0].name, 'has', filteredLayers[0].features?.length, 'features');
            if (filteredLayers[0].features && filteredLayers[0].features.length > 0) {
              console.log('MapScreen: First feature of first layer:', filteredLayers[0].features[0]);
            }
          }
          setLayers(filteredLayers);
        }
      }
    } catch (error) {
      if (isRouteMounted()) {
        console.error('Error loading layers:', error);
      }
    } finally {
      if (showLoading) {
        isLoadingLayersRef.current = false;
        setIsLoadingLayers(false);
      }
    }
  };

  // Track if sync is in progress to avoid race conditions
  const syncInProgressRef = useRef(false);
  // Track if layers are currently loading to prevent flickering
  const isLoadingLayersRef = useRef(false);

  // Load hierarchy and feature types when project is selected (debounced to prevent excessive calls)
  useDebouncedAsync(
    async () => {
      if (!selectedProject?.id || !user) return;
      
      // Load hierarchy and feature types first
      await Promise.all([
        dispatch(getHierarchy(selectedProject.id)),
        dispatch(getFeatureTypes(selectedProject.id))
      ]);
      
      // Wait a bit for Redux state to update, then wait for sync to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Wait for sync to complete if it's running
      let waitCount = 0;
      while (syncInProgressRef.current && waitCount < 20) {
        await new Promise(resolve => setTimeout(resolve, 200));
        waitCount++;
      }
      
      // Now load layers
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

  // Track previous feature types count to detect new asset types
  const prevFeatureTypesCountRef = useRef(0);
  const prevFeatureTypesIdsRef = useRef(new Set());
  const prevHierarchyCountRef = useRef(0);
  const prevHierarchyIdsRef = useRef(new Set());

  // Reload layers when feature types change (new asset type created)
  useEffect(() => {
    if (!selectedProject?.id || !currentFeatureTypes) return;
    
    const currentCount = currentFeatureTypes.length;
    const currentIds = new Set(currentFeatureTypes.map(t => t.id));
    const prevIds = prevFeatureTypesIdsRef.current;
    
    // Check if a new asset type was added
    const hasNewAssetType = currentCount > prevFeatureTypesCountRef.current || 
      Array.from(currentIds).some(id => !prevIds.has(id));
    
    if (hasNewAssetType && isRouteMounted()) {
      console.log('New asset type detected, reloading layers...');
      // Longer delay to ensure database is fully updated and sync hook can process
      const timer = setTimeout(() => {
        if (isRouteMounted()) {
          loadLayersFromDatabase(false); // Don't show spinner on reload
        }
      }, 1500); // Increased delay to allow database operations to complete
      
      // Update refs
      prevFeatureTypesCountRef.current = currentCount;
      prevFeatureTypesIdsRef.current = currentIds;
      
      return () => clearTimeout(timer);
    }
    
    // Update refs
    prevFeatureTypesCountRef.current = currentCount;
    prevFeatureTypesIdsRef.current = currentIds;
  }, [currentFeatureTypes, selectedProject?.id]);

  // Track hierarchy changes (sync hook will handle reloading)
  useEffect(() => {
    if (!selectedProject?.id || !currentHierarchy) return;
    
    const currentCount = currentHierarchy.length;
    const currentIds = new Set(currentHierarchy.map(a => a.id));
    const prevIds = prevHierarchyIdsRef.current;
    
    // Check if new assets were added
    const newAssetIds = Array.from(currentIds).filter(id => !prevIds.has(id));
    const hasNewAssets = currentCount > prevHierarchyCountRef.current || newAssetIds.length > 0;
    
    if (hasNewAssets && isRouteMounted()) {
      // Check if any of the new assets have valid coordinates
      const newAssets = currentHierarchy.filter(a => newAssetIds.includes(a.id));
      const hasAssetsWithCoords = newAssets.some(asset => {
        const lat = asset.beginning_latitude;
        const lng = asset.beginning_longitude;
        
        if (lat == null || lng == null) return false;
        
        const latNum = parseFloat(lat);
        const lngNum = parseFloat(lng);
        
        // Validate coordinates are valid numbers and within valid ranges
        return !isNaN(latNum) && !isNaN(lngNum) && 
               latNum >= -90 && latNum <= 90 && 
               lngNum >= -180 && lngNum <= 180;
      });
      
      if (hasAssetsWithCoords) {
        console.log('New assets with coordinates detected, sync hook will handle layer reload');
      } else {
        console.log('New assets detected but none have coordinates, skipping');
      }
    }
    
    // Update refs
    prevHierarchyCountRef.current = currentCount;
    prevHierarchyIdsRef.current = currentIds;
  }, [currentHierarchy, selectedProject?.id]);

  // Sync asset type layers to database (with debouncing and duplicate prevention)
  useDebouncedAsync(
    async () => {
      if (!selectedProject?.id || !currentHierarchy || !currentFeatureTypes || !user) {
        return;
      }

      // Mark sync as in progress
      syncInProgressRef.current = true;

      // Group assets by asset_type_id
      const assetsByType = {};
      let assetsWithCoords = 0;
      let assetsWithoutCoords = 0;
      
      currentHierarchy.forEach(asset => {
        // Only include assets with coordinates
        const lat = asset.beginning_latitude;
        const lng = asset.beginning_longitude;
        
        // Check if coordinates exist and are valid numbers
        if (lat != null && lng != null) {
          const latNum = parseFloat(lat);
          const lngNum = parseFloat(lng);
          
          // Validate coordinates are valid numbers and within valid ranges
          if (!isNaN(latNum) && !isNaN(lngNum) && 
              latNum >= -90 && latNum <= 90 && 
              lngNum >= -180 && lngNum <= 180) {
            
            assetsWithCoords++;
            const typeId = asset.asset_type_id || 'uncategorized';
            if (!assetsByType[typeId]) {
              assetsByType[typeId] = [];
            }
            assetsByType[typeId].push(asset);
          } else {
            assetsWithoutCoords++;
            console.warn(`Asset ${asset.id} (${asset.title}) has invalid coordinates: lat=${lat}, lng=${lng}`);
          }
        } else {
          assetsWithoutCoords++;
        }
      });
      
      console.log(`Syncing asset layers: ${assetsWithCoords} assets with valid coordinates, ${assetsWithoutCoords} without`);
      console.log(`Asset types to sync:`, Object.keys(assetsByType));

      // Get existing layers to check what already exists
      const existingLayersResponse = await gisLayerService.getGisLayers(selectedProject.id);
      const existingLayers = existingLayersResponse.success ? existingLayersResponse.data : [];

      // Reload deleted layers from localStorage to ensure we have the latest state
      const key = `deletedAssetTypeLayers_${selectedProject.id}`;
      const savedDeleted = localStorage.getItem(key);
      const currentDeletedLayers = savedDeleted ? new Set(JSON.parse(savedDeleted)) : deletedAssetTypeLayers;

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
        }

        // Check if this layer was deleted by the user (prevent auto-regeneration)
        // Check both state and localStorage to be safe
        if (currentDeletedLayers.has(layerName) || deletedAssetTypeLayers.has(layerName)) {
          console.log(`[Sync] Skipping layer "${layerName}" (typeId: ${typeId}) - it was deleted by the user`);
          continue;
        }

        // Check if layer already exists (by name)
        let existingLayer = existingLayers.find(l => l.name === layerName);
        
        // Double-check: if layer exists but was marked as deleted, skip it
        if (existingLayer && (currentDeletedLayers.has(existingLayer.name) || deletedAssetTypeLayers.has(existingLayer.name))) {
          console.log(`[Sync] Skipping existing layer "${existingLayer.name}" - it was deleted by the user`);
          continue;
        }
        
        if (!existingLayer) {
          // Get random unused style for the new layer
          const randomStyle = getRandomUnusedStyle(existingLayers, { type: 'layer' });
          
          // Create new layer
          const layerData = {
            name: layerName,
            description: layerDescription,
            layerType: 'vector',
            geometryType: 'point',
            attributes: [],
            style: randomStyle
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

        // Final check: make sure this layer wasn't marked as deleted
        if (currentDeletedLayers.has(existingLayer.name) || deletedAssetTypeLayers.has(existingLayer.name)) {
          console.log(`[Sync] Skipping feature creation for layer "${existingLayer.name}" - it was deleted by the user`);
          continue;
        }

        // Now add/update features for this layer
        // First, get existing features
        const featuresResponse = await gisLayerService.getLayerFeatures(
          selectedProject.id,
          existingLayer.id
        );
        const existingFeatures = featuresResponse.success ? featuresResponse.data : [];
        
        // Check asset_id column only
        const existingAssetIds = new Set(
          existingFeatures
            .filter(f => f.asset_id != null)
            .map(f => f.asset_id)
        );
        
        console.log(`[Sync] Layer "${layerName}": Found ${existingFeatures.length} existing features, ${existingAssetIds.size} unique asset_ids:`, Array.from(existingAssetIds));

        // Add features for assets that don't exist yet (batch processing for better performance)
        const assetsToAdd = assets.filter(asset => {
          if (existingAssetIds.has(asset.id)) {
            return false; // Skip if already exists
          }

          const coordinates = [
            parseFloat(asset.beginning_longitude), // [lng, lat] for backend
            parseFloat(asset.beginning_latitude)
          ];

          // Validate coordinates before adding
          if (isNaN(coordinates[0]) || isNaN(coordinates[1])) {
            console.error(`Asset ${asset.id} (${asset.title}) has invalid coordinates:`, coordinates);
            return false;
          }
          return true;
        });

        // Batch add features in parallel (limit to 10 at a time to avoid overwhelming the server)
        const batchSize = 10;
        let addedCount = 0;
        for (let i = 0; i < assetsToAdd.length; i += batchSize) {
          const batch = assetsToAdd.slice(i, i + batchSize);
          const results = await Promise.allSettled(
            batch.map(asset => {
              const coordinates = [
                parseFloat(asset.beginning_longitude),
                parseFloat(asset.beginning_latitude)
              ];
              return gisLayerService.addFeature(
                selectedProject.id,
                existingLayer.id,
                {
                  name: asset.title,
                  coordinates: [coordinates], // Point geometry
                  properties: {
                    title: asset.title,
                    asset_id: asset.id,
                    asset_type_id: asset.asset_type_id || null
                  }
                }
              );
            })
          );
          
          addedCount += results.filter(r => r.status === 'fulfilled').length;
        }
        
        const skippedCount = assets.length - assetsToAdd.length;
        
        if (addedCount > 0) {
          console.log(`Added ${addedCount} features to layer "${layerName}" (${skippedCount} already existed)`);
        }
      }

      // Reload layers after syncing with retry logic to ensure database consistency
      if (isRouteMounted()) {
        const reloadWithRetry = async (retries = 5, delay = 600) => {
          let lastError = null;
          
          for (let i = 0; i < retries; i++) {
            if (i > 0) {
              // Wait before retry (except first attempt)
              await new Promise(resolve => setTimeout(resolve, delay));
            }
            
            if (!isRouteMounted()) {
              syncInProgressRef.current = false;
              return;
            }
            
            try {
              // Force reload layers (don't show spinner on reload)
              await loadLayersFromDatabase(false);
              
              // Small additional delay to let state update
              await new Promise(resolve => setTimeout(resolve, 200));
              
              // Verify that the layers and features we just created are actually loaded
              const response = await gisLayerService.getGisLayers(selectedProject.id);
              if (response.success && response.data) {
                // Check if we have layers for all asset types that should have layers
                const layerNames = response.data.map(l => l.name);
                const expectedLayers = Object.keys(assetsByType).map(typeId => {
                  if (typeId === 'uncategorized') return 'Uncategorized Assets';
                  const assetType = currentFeatureTypes.find(type => type.id === typeId);
                  return assetType ? assetType.title : null;
                }).filter(Boolean);
                
                const allLayersPresent = expectedLayers.every(name => layerNames.includes(name));
                
                if (allLayersPresent) {
                  // Verify features are loaded by checking at least one layer has features
                  let hasFeatures = false;
                  for (const layerName of expectedLayers) {
                    const layer = response.data.find(l => l.name === layerName);
                    if (layer) {
                      const featuresResp = await gisLayerService.getLayerFeatures(selectedProject.id, layer.id);
                      if (featuresResp.success && featuresResp.data && featuresResp.data.length > 0) {
                        hasFeatures = true;
                        break;
                      }
                    }
                  }
                  
                  if (hasFeatures || i === retries - 1) {
                    // Features are loaded or this is the last retry
                    console.log(`Layers reloaded successfully (attempt ${i + 1})`);
                    syncInProgressRef.current = false;
                    return;
                  } else {
                    console.log(`Retry ${i + 1}/${retries}: Layers present but waiting for features...`);
                  }
                } else {
                  console.log(`Retry ${i + 1}/${retries}: Waiting for layers to be available...`);
                }
              }
            } catch (error) {
              lastError = error;
              console.error(`Error reloading layers (attempt ${i + 1}):`, error);
            }
          }
          
          // Final attempt even if all retries failed
          if (lastError && isRouteMounted()) {
            console.log('Final reload attempt after all retries...');
            await loadLayersFromDatabase(false); // Don't show spinner on reload
          }
          
          // Mark sync as complete
          syncInProgressRef.current = false;
        };
        
        reloadWithRetry();
      } else {
        syncInProgressRef.current = false;
      }
    },
    [currentHierarchy, currentFeatureTypes, selectedProject?.id, user, deletedAssetTypeLayers],
    {
      delay: 800, // Increased delay to ensure database operations complete
      shouldRun: (deps) => {
        const [hierarchy, types, projectId, user] = deps;
        return !!(projectId && hierarchy && types && user);
      },
      onError: (error) => {
        console.error('Error syncing asset type layers:', error);
      }
    }
  );


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
      // Get random unused style for the new layer
      const randomStyle = getRandomUnusedStyle(layers, { type: 'layer' });
      
      // Save to Supabase
      const response = await gisLayerService.createGisLayer(
        selectedProject.id,
        {
          name: layerData.name,
          description: layerData.description,
          layerType: layerData.layerType, // Fixed: was layerData.type
          geometryType: layerData.geometryType,
          attributes: layerData.attributes,
          style: layerData.style || randomStyle
        }
      );

      if (response.success && isRouteMounted()) {
        const newLayer = {
          id: response.data.id, // Use database ID
          name: layerData.name,
          description: layerData.description,
          layerType: layerData.layerType, // Match LayersPanel's property name
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
    if (!selectedProject?.id) return;
    setError('');

    try {
      // Check if this is an asset type layer (by checking if it matches an asset type name)
      const layer = layers.find(l => l.id === layerId);
      if (layer) {
        // Check if this layer corresponds to an asset type
        const isAssetTypeLayer = currentFeatureTypes.some(type => type.title === layer.name) || 
                                 layer.name === 'Uncategorized Assets';
        
        if (isAssetTypeLayer) {
          // Mark this layer name as deleted to prevent auto-regeneration
          setDeletedAssetTypeLayers(prev => {
            const newSet = new Set([...prev, layer.name]);
            // Persist to localStorage
            const key = `deletedAssetTypeLayers_${selectedProject.id}`;
            localStorage.setItem(key, JSON.stringify([...newSet]));
            console.log(`[handleRemoveLayer] Marking asset type layer "${layer.name}" as deleted to prevent auto-regeneration. Deleted layers:`, [...newSet]);
            return newSet;
          });
        }
      }

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
    if (layer) {
      setSelectedLayerForStyle(layer);
      setShowStyleLayerModal(true);
    }
  };

  const handleSaveLayerStyle = async (styleData) => {
    if (!selectedProject?.id || !selectedLayerForStyle) return;
    setError('');

    try {
      // If it's an asset type layer, update the asset type's icon and icon_color
      if (selectedLayerForStyle.isAssetTypeLayer && selectedLayerForStyle.assetTypeId) {
        // Map style properties to asset type properties
        // symbol -> icon, color -> icon_color
        const existingAssetType = currentFeatureTypes.find(ft => ft.id === selectedLayerForStyle.assetTypeId);
        
        if (!existingAssetType) {
          if (isRouteMounted()) {
            setError('Asset type not found');
          }
          return;
        }

        const assetTypeUpdate = {
          name: existingAssetType.title || '',
          description: existingAssetType.description || '',
          parent_ids: existingAssetType.parent_ids || [],
          subtype_of_id: existingAssetType.subtype_of_id || null,
          attributes: existingAssetType.attributes || [],
          has_coordinates: existingAssetType.has_coordinates || false,
          // Note: icon and icon_color are no longer stored on asset types
        };

        console.log('Updating asset type style:', {
          assetTypeId: selectedLayerForStyle.assetTypeId,
          styleData,
          assetTypeUpdate
        });

        const updateResult = await dispatch(updateFeatureType({
          projectId: selectedProject.id,
          featureTypeId: selectedLayerForStyle.assetTypeId,
          featureTypeData: assetTypeUpdate
        })).unwrap();

        console.log('Update result:', updateResult);

        if (updateResult.success) {
          // Update the layer style in state immediately for instant feedback
          setLayers(prev => prev.map(l => {
            if (l.id === selectedLayerForStyle.id && l.isAssetTypeLayer) {
              return {
                ...l,
                style: {
                  ...l.style,
                  symbol: styleData.symbol !== undefined ? styleData.symbol : l.style.symbol,
                  color: styleData.color !== undefined ? styleData.color : l.style.color,
                  opacity: styleData.opacity !== undefined ? styleData.opacity : l.style.opacity,
                  weight: styleData.weight !== undefined ? styleData.weight : l.style.weight
                }
              };
            }
            return l;
          }));
          
          // Refresh feature types to get updated icon/color from database
          await dispatch(getFeatureTypes(selectedProject.id));
          // Wait a moment for state to update
          await new Promise(resolve => setTimeout(resolve, 100));
          // Reload layers to reflect the changes from database (don't show spinner on reload)
          await loadLayersFromDatabase(false);
          setShowStyleLayerModal(false);
          setSelectedLayerForStyle(null);
        } else {
          if (isRouteMounted()) {
            setError('Failed to update asset type style');
          }
        }
      } else {
        // Regular layer - update GIS layer style
        const response = await gisLayerService.updateGisLayer(
          selectedProject.id,
          selectedLayerForStyle.id,
          { style: styleData }
        );

        if (response.success) {
          // Update the layer in state
          setLayers(prev => prev.map(l => 
            l.id === selectedLayerForStyle.id 
              ? { ...l, style: { ...l.style, ...styleData } }
              : l
          ));
          // Reload layers to ensure database changes are reflected (don't show spinner on reload)
          await loadLayersFromDatabase(false);
          setShowStyleLayerModal(false);
          setSelectedLayerForStyle(null);
        } else {
          if (isRouteMounted()) {
            setError('Failed to update layer style');
          }
        }
      }
    } catch (error) {
      if (isRouteMounted()) {
        setError('Failed to update layer style');
      }
      console.error('Error updating layer style:', error);
    }
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

  // Handle delete from context menu
  const handleDeleteFeatureFromMenu = useCallback(() => {
    if (!featureContextMenu?.feature || !featureContextMenu?.layer) return;
    
    handleRemoveFeature(featureContextMenu.layer.id, featureContextMenu.feature.id);
    setFeatureContextMenu(null);
  }, [featureContextMenu, handleRemoveFeature]);

  const handleRestoreLayer = async (layerData) => {
    if (!selectedProject?.id) return;
    setError('');

    try {
      // Restore layer using createGisLayer
      const restoredLayer = await gisLayerService.createGisLayer(selectedProject.id, {
        name: layerData.name,
        layerType: layerData.layerType,
        geometryType: layerData.geometryType,
        url: layerData.url,
        style: layerData.style
      });
      
      // Reload layers to get the restored layer with its features
      if (isRouteMounted()) {
        loadLayersFromDatabase(false); // Don't show spinner on reload
      }
    } catch (error) {
      if (isRouteMounted()) {
        setError('Failed to restore layer');
      }
    }
  };

  const handleRestoreFeature = async (featureData) => {
    if (!selectedProject?.id || !featureData.layerId) return;
    setError('');

    try {
      // Restore feature using addFeature
      await gisLayerService.addFeature(
        selectedProject.id,
        featureData.layerId,
        {
          name: featureData.name,
          coordinates: featureData.coordinates,
          properties: featureData.properties
        }
      );
      
      // Reload layers to show the restored feature
      if (isRouteMounted()) {
        loadLayersFromDatabase(false); // Don't show spinner on reload
      }
    } catch (error) {
      if (isRouteMounted()) {
        setError('Failed to restore feature');
      }
    }
  };

  const handleZoomToFeature = (feature) => {
    // Don't allow zooming while map is loading
    if (isMapLoading) {
      return;
    }
    if (feature && feature.coordinates && feature.coordinates.length > 0) {
      // Reset both zoom states first
      setZoomToLayer(null);
      setZoomToFeature(null);
      // Use a small delay to ensure state updates properly, then set the new zoom target
      setTimeout(() => {
        setZoomToFeature({ ...feature, _zoomKey: Date.now() });
        // Reset after zoom completes (Leaflet animation is ~500ms)
        setTimeout(() => setZoomToFeature(null), 600);
      }, 10);
    }
  };

  const handleZoomToLayer = (layer) => {
    // Don't allow zooming while map is loading
    if (isMapLoading) {
      return;
    }
    if (layer && layer.features && layer.features.length > 0) {
      // Reset both zoom states first
      setZoomToFeature(null);
      setZoomToLayer(null);
      // Use a small delay to ensure state updates properly, then set the new zoom target
      setTimeout(() => {
        setZoomToLayer({ ...layer, _zoomKey: Date.now() });
        // Reset after zoom completes (Leaflet animation is ~500ms)
        setTimeout(() => setZoomToLayer(null), 600);
      }, 10);
    }
  };

  // Extract coordinates from selected project
  // Leaflet expects [latitude, longitude] format
  const projectCoordinates = selectedProject && selectedProject.latitude != null && selectedProject.longitude != null
    ? [parseFloat(selectedProject.latitude), parseFloat(selectedProject.longitude)]
    : null;

                                                    return (
    
    <div ref={containerRef} className="leaflet-screen-container">
      {error && (
        <ErrorMessage message={error} style={{ position: 'fixed', top: '80px', left: '50%', transform: 'translateX(-50%)', zIndex: 10000, maxWidth: '500px' }} />
      )}
      {successMessage && (
        <div className="save-success-bar">
          <span className="success-icon">✓</span>
          {successMessage}
        </div>
      )}
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
        setLabelFontSize={handleLabelFontSizeChange}
        labelColor={labelColor}
        setLabelColor={handleLabelColorChange}
        labelBackgroundColor={labelBackgroundColor}
        setLabelBackgroundColor={handleLabelBackgroundColorChange}
        onExportClick={() => setShowExportModal(true)}
        onRegenerateGisFeatures={async () => {
          if (!selectedProject?.id) return;
          
          try {
            setIsLoadingLayers(true);
            setError('');
            const response = await projectService.regenerateMissingGisFeatures(selectedProject.id);
            
            if (response.success) {
              // Reload layers after regeneration
              await loadLayersFromDatabase(false);
              const createdCount = response.created || 0;
              setSuccessMessage(
                createdCount === 0 
                  ? 'No features regenerated' 
                  : `Successfully regenerated ${createdCount} GIS feature${createdCount !== 1 ? 's' : ''}`
              );
              setTimeout(() => setSuccessMessage(''), 5000);
            } else {
              setError(response.error || 'Failed to regenerate GIS features');
            }
          } catch (err) {
            console.error('Error regenerating GIS features:', err);
            setError(err.response?.data?.error || 'Failed to regenerate GIS features');
          } finally {
            setIsLoadingLayers(false);
          }
        }}
      />
      <div className="map-content-container">
        <LeftMapPanel 
          isExpanded={isExpanded}
          setIsExpanded={setIsExpanded}
          panelWidth={panelWidth}
          setPanelWidth={setPanelWidth}
          layers={allLayers}
          isLoadingLayers={isLoadingLayers}
          onToggleLayer={handleToggleLayer}
          onRemoveLayer={handleRemoveLayer}
          onEditLayer={handleEditLayer}
          onStyleLayer={handleStyleLayer}
          onAddFeature={handleAddFeatureToLayer}
          onRemoveFeature={handleRemoveFeature}
          onRestoreLayer={handleRestoreLayer}
          onRestoreFeature={handleRestoreFeature}
          onZoomToFeature={handleZoomToFeature}
          onZoomToLayer={handleZoomToLayer}
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
            zoomToFeature={zoomToFeature}
            zoomToLayer={zoomToLayer}
            onMapLoadingChange={handleMapLoadingChange}
            onFeatureContextMenu={handleFeatureContextMenu}
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
      
      {/* Style Layer Modal */}
      <StyleLayerModal
        isOpen={showStyleLayerModal}
        onClose={() => {
          setShowStyleLayerModal(false);
          setSelectedLayerForStyle(null);
        }}
        layer={selectedLayerForStyle}
        onSave={handleSaveLayerStyle}
      />

      {/* Export Layers Modal */}
      {selectedProject && (
        <ExportLayersModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          layers={allLayers}
          projectId={selectedProject.id}
        />
      )}

      {/* Feature Context Menu */}
      {featureContextMenu && (
        <ContextMenu
          contextMenu={{
            x: featureContextMenu.x,
            y: featureContextMenu.y,
            itemsToDelete: new Set([featureContextMenu.feature.id])
          }}
          contextMenuRef={featureContextMenuRef}
          onDeleteClick={handleDeleteFeatureFromMenu}
          itemType="feature"
        />
      )}
        </div>
    );
};

export default MapScreen;