import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import L from 'leaflet';
import Leaflet from '../components/Leaflet';
import leafletShapesService from '../services/leafletShapesService';
import '../styles/map.css';

const LeafletScreen = () => {
    const { selectedProject } = useSelector((state) => state.projects);
    const [drawnShapes, setDrawnShapes] = useState([]);
    const [mapCenter, setMapCenter] = useState([51.505, -0.09]); // Default: London
    const [mapZoom, setMapZoom] = useState(13);
    const [mapStyle, setMapStyle] = useState('streets');
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState(null);
    const [unsavedCount, setUnsavedCount] = useState(0); // Track count of unsaved changes for UI updates
    const [canUndo, setCanUndo] = useState(false); // Track if undo is available
    const drawnShapesRef = useRef([]); // Ref to always have current drawnShapes value
    const unsavedShapesRef = useRef([]); // Track shapes drawn but not yet saved (additions)
    const editedShapesRef = useRef([]); // Track shapes that have been edited
    const deletedShapeIdsRef = useRef([]); // Track shape IDs that need to be deleted from database
    const hasLoadedShapesRef = useRef(false); // Track if shapes have been loaded for current project
    const currentProjectIdRef = useRef(null); // Track current project ID
    const historyRef = useRef([]); // Track change history for undo
    const leafletMapRef = useRef(null); // Store reference to Leaflet component methods
    const isUndoingRef = useRef(false); // Flag to prevent full reload during undo
    
    // Sync drawnShapes state with ref whenever it changes
    useEffect(() => {
        drawnShapesRef.current = drawnShapes;
    }, [drawnShapes]);

    // Get localStorage key for this project
    const getStorageKey = () => {
        return selectedProject ? `leaflet_shapes_${selectedProject.id}` : null;
    };

    const mapTypeOptions = [
        { value: 'streets', label: 'Streets' },
        { value: 'satellite', label: 'Satellite' },
        { value: 'terrain', label: 'Terrain' },
        { value: 'topo', label: 'Topographic' },
        { value: 'dark', label: 'Dark Mode' },
        { value: 'light', label: 'Light Mode' }
    ];

    // Auto-center map based on selected project's coordinates
    useEffect(() => {
        if (selectedProject) {
            // Check if project has latitude and longitude
            if (selectedProject.latitude && selectedProject.longitude) {
                setMapCenter([selectedProject.latitude, selectedProject.longitude]);
                setMapZoom(13); // Set a reasonable zoom level
            } 
            // Alternative: Check if project has coordinates object
            else if (selectedProject.coordinates?.latitude && selectedProject.coordinates?.longitude) {
                setMapCenter([selectedProject.coordinates.latitude, selectedProject.coordinates.longitude]);
                setMapZoom(13);
            }
            // If no project coordinates, keep default (London)
        }
    }, [selectedProject]);

    // Load shapes from both localStorage and database
    useEffect(() => {
        const loadShapes = async () => {
            if (!selectedProject) return;

            // Check if we've already loaded shapes for this project
            if (hasLoadedShapesRef.current && currentProjectIdRef.current === selectedProject.id) {
                console.log('Shapes already loaded for this project, skipping duplicate load');
                return;
            }

            // If project changed, reset the flag
            if (currentProjectIdRef.current !== selectedProject.id) {
                hasLoadedShapesRef.current = false;
                currentProjectIdRef.current = selectedProject.id;
            }

            // Mark as loading to prevent duplicate calls
            if (hasLoadedShapesRef.current) return;
            hasLoadedShapesRef.current = true;

            const storageKey = getStorageKey();
            let localShapes = [];
            
            // Load from localStorage
            if (storageKey) {
                try {
                    const savedShapes = localStorage.getItem(storageKey);
                    if (savedShapes) {
                        localShapes = JSON.parse(savedShapes);
                        console.log('Loaded shapes from localStorage:', localShapes.length);
                    }
                } catch (error) {
                    console.error('Error loading shapes from localStorage:', error);
                }
            }

            // Load from Supabase (source of truth)
            try {
                const response = await leafletShapesService.getShapesByProject(selectedProject.id);
                if (response.success && response.data.length > 0) {
                    const supabaseShapes = response.data.map(shape => ({
                        type: shape.shape_type,
                        geoJSON: shape.geojson,
                        id: shape.id
                    }));
                    console.log('Loaded shapes from Supabase:', supabaseShapes.length);
                    
                    // Use Supabase as source of truth, not localStorage
                    // localStorage is only used as fallback when Supabase fails
                    setDrawnShapes(supabaseShapes);
                    
                    // Update localStorage with fresh data from database
                    if (storageKey) {
                        localStorage.setItem(storageKey, JSON.stringify(supabaseShapes));
                    }
                } else if (localShapes.length > 0) {
                    // Only use localStorage if no shapes in database
                    console.log('No shapes in database, using localStorage as fallback');
                    setDrawnShapes(localShapes);
                } else {
                    setDrawnShapes([]);
                }
            } catch (error) {
                console.error('Error loading shapes from Supabase:', error);
                // Only use localStorage as fallback when database fails
                if (localShapes.length > 0) {
                    console.log('Database error, using localStorage as fallback');
                    setDrawnShapes(localShapes);
                } else {
                    setDrawnShapes([]);
                }
            }
        };

        loadShapes();
    }, [selectedProject]);

    // Note: localStorage saving is now handled inline in handleDrawCreated
    // and other handlers to avoid triggering unnecessary re-renders

    const handleShapesLoaded = useCallback((shapesWithLayerIds) => {
        // Update drawnShapes with the layer IDs
        setDrawnShapes(shapesWithLayerIds);
    }, []);

    const handleMapReady = useCallback((mapMethods) => {
        leafletMapRef.current = mapMethods;
    }, []);

    // Update undo availability whenever history changes
    const updateUndoAvailability = useCallback(() => {
        setCanUndo(historyRef.current.length > 0);
    }, []);

    // Undo the last unsaved change
    const handleUndo = useCallback(() => {
        if (historyRef.current.length === 0) return;

        // Set flag to prevent full reload in Leaflet component
        isUndoingRef.current = true;

        const lastChange = historyRef.current.pop();
        console.log('[Undo] Undoing change:', lastChange);

        switch (lastChange.type) {
            case 'create':
                // Remove the created shape
                unsavedShapesRef.current = unsavedShapesRef.current.filter(
                    shape => shape._leaflet_id !== lastChange.shape._leaflet_id
                );
                // Remove from map
                if (leafletMapRef.current?.removeLayerById) {
                    leafletMapRef.current.removeLayerById(lastChange.shape._leaflet_id);
                }
                break;

            case 'edit':
                // Revert the edit
                if (lastChange.shape.id) {
                    // Remove from edited shapes list
                    editedShapesRef.current = editedShapesRef.current.filter(
                        shape => shape._leaflet_id !== lastChange.shape._leaflet_id
                    );
                    // If there was a previous state, restore it
                    if (lastChange.previousGeoJSON) {
                        // This would require more complex implementation to actually update the layer on the map
                        console.log('[Undo] Edit undo - would need to restore previous state on map');
                    }
                } else {
                    // Unsaved shape edit - restore previous state
                    const unsavedIndex = unsavedShapesRef.current.findIndex(
                        shape => shape._leaflet_id === lastChange.shape._leaflet_id
                    );
                    if (unsavedIndex !== -1 && lastChange.previousGeoJSON) {
                        unsavedShapesRef.current[unsavedIndex].geoJSON = lastChange.previousGeoJSON;
                    }
                }
                break;

            case 'delete':
                console.log('[Undo] Restoring deleted shape:', {
                    shapeId: lastChange.shape.id,
                    originalIndex: lastChange.originalIndex,
                    currentArrayLength: drawnShapesRef.current.length
                });
                
                // Restore the deleted shape
                deletedShapeIdsRef.current = deletedShapeIdsRef.current.filter(
                    id => id !== lastChange.shape.id
                );
                
                // Add back to map FIRST (before updating state to prevent full reload)
                let newLayerId = null;
                if (leafletMapRef.current?.addLayer && lastChange.shape.geoJSON) {
                    const newLayer = leafletMapRef.current.addLayer(lastChange.shape.geoJSON);
                    // Store the new layer ID
                    if (newLayer) {
                        newLayerId = newLayer._leaflet_id || (newLayer.getLayers && newLayer.getLayers()[0]?._leaflet_id);
                    }
                }
                
                // Add back to drawnShapes - find correct position based on original order
                setDrawnShapes(prev => {
                    // Create shape with new layer ID
                    const restoredShape = {
                        ...lastChange.shape,
                        _leaflet_id: newLayerId || lastChange.shape._leaflet_id
                    };
                    
                    if (prev.length === 0) {
                        console.log('[Undo] Adding to empty array');
                        return [restoredShape];
                    }
                    
                    // Use the original order to find where to insert
                    const originalOrder = lastChange.allShapeIdsAtDeletion;
                    const restoredShapeId = restoredShape.id;
                    
                    console.log('[Undo] Original order of all shapes:', originalOrder.map(id => id?.substring(0, 8)));
                    console.log('[Undo] Current shapes before insert:', prev.map(s => s.id?.substring(0, 8)));
                    console.log('[Undo] Restoring shape:', restoredShapeId?.substring(0, 8));
                    
                    // Find where this shape should go relative to existing shapes
                    let insertIndex = 0;
                    for (let i = 0; i < prev.length; i++) {
                        const currentShapeId = prev[i].id;
                        const currentShapeOriginalIndex = originalOrder.indexOf(currentShapeId);
                        const restoredShapeOriginalIndex = originalOrder.indexOf(restoredShapeId);
                        
                        console.log(`[Undo] Comparing: restored(${restoredShapeOriginalIndex}) vs current[${i}](${currentShapeOriginalIndex})`);
                        
                        // If current shape was originally after the restored shape, insert before it
                        if (currentShapeOriginalIndex > restoredShapeOriginalIndex) {
                            insertIndex = i;
                            console.log('[Undo] Found position - inserting before current shape at', i);
                            break;
                        }
                        insertIndex = i + 1; // Otherwise, try next position
                    }
                    
                    console.log('[Undo] Final insert index:', insertIndex);
                    
                    const newShapes = [...prev];
                    newShapes.splice(insertIndex, 0, restoredShape);
                    
                    console.log('[Undo] New array length:', newShapes.length);
                    console.log('[Undo] Shape IDs order:', newShapes.map(s => s.id?.substring(0, 8)));
                    
                    return newShapes;
                });
                break;

            default:
                break;
        }

        // Update unsaved count
        const totalChanges = unsavedShapesRef.current.length + 
                           editedShapesRef.current.length + 
                           deletedShapeIdsRef.current.length;
        setUnsavedCount(totalChanges);
        updateUndoAvailability();

        // Update localStorage with a small delay to ensure state has updated
        setTimeout(() => {
            const storageKey = getStorageKey();
            if (storageKey) {
                try {
                    const allShapes = [...drawnShapesRef.current, ...unsavedShapesRef.current];
                    console.log('[Undo] Updating localStorage with shapes:', allShapes.length);
                    localStorage.setItem(storageKey, JSON.stringify(allShapes.map(shape => ({
                        type: shape.type,
                        geoJSON: shape.geoJSON,
                        id: shape.id
                    }))));
                } catch (error) {
                    console.error('Error updating localStorage after undo:', error);
                }
            }
            
            // Clear undo flag after a short delay
            setTimeout(() => {
                isUndoingRef.current = false;
            }, 100);
        }, 50);
    }, [updateUndoAvailability, getStorageKey]);

    const handleDrawCreated = useCallback((data) => {
        // Store the layer ID with the shape for matching later
        const shapeWithLayerId = {
            ...data,
            _leaflet_id: data.layer._leaflet_id
        };
        
        // Leaflet already added the layer - don't update state to avoid re-renders
        // Just track in ref for saving later
        unsavedShapesRef.current = [...unsavedShapesRef.current, shapeWithLayerId];
        
        // Add to history for undo
        historyRef.current.push({
            type: 'create',
            shape: shapeWithLayerId,
            timestamp: Date.now()
        });
        updateUndoAvailability();
        
        // Update unsaved count to include all changes
        const totalChanges = unsavedShapesRef.current.length + 
                           editedShapesRef.current.length + 
                           deletedShapeIdsRef.current.length;
        setUnsavedCount(totalChanges);
        
        // Save to localStorage
        const storageKey = selectedProject ? `leaflet_shapes_${selectedProject.id}` : null;
        if (storageKey) {
            try {
                const allShapes = [...drawnShapes, ...unsavedShapesRef.current];
                const shapesToSave = allShapes.map(shape => ({
                    type: shape.type,
                    geoJSON: shape.geoJSON,
                    id: shape.id
                }));
                localStorage.setItem(storageKey, JSON.stringify(shapesToSave));
                console.log('[LeafletScreen] Saved to localStorage, total shapes:', shapesToSave.length);
            } catch (error) {
                console.error('Error saving to localStorage:', error);
            }
        }
    }, [drawnShapes, selectedProject]);

    const handleDrawEdited = useCallback((editedLayers) => {
        
        // Match edited layers with our tracked shapes by comparing GeoJSON
        editedLayers.forEach(editedLayer => {
            const editedGeoJSON = JSON.stringify(editedLayer.geoJSON);
            
            // First, check if this shape is in editedShapesRef (already been edited before)
            const existingEditIndex = editedShapesRef.current.findIndex(shape => 
                shape.id && editedLayer.layer._leaflet_id === shape._leaflet_id
            );
            
            if (existingEditIndex !== -1) {
                // Update the existing edit
                editedShapesRef.current[existingEditIndex] = {
                    ...editedShapesRef.current[existingEditIndex],
                    geoJSON: editedLayer.geoJSON,
                    type: editedLayer.layer instanceof L.Marker ? 'marker' : 
                          editedLayer.layer instanceof L.Circle ? 'circle' :
                          editedLayer.layer instanceof L.Rectangle ? 'rectangle' :
                          editedLayer.layer instanceof L.Polygon ? 'polygon' :
                          editedLayer.layer instanceof L.Polyline ? 'polyline' : 'unknown'
                };
            } else {
                // Check if this is a saved shape from drawnShapes (use ref for current value)
                const matchingShape = drawnShapesRef.current.find(shape => {
                    // Store layer ID when we first load shapes to match later
                    return shape.id && shape._leaflet_id === editedLayer.layer._leaflet_id;
                });
                
                if (matchingShape && matchingShape.id) {
                    // This is an edit to a saved shape
                    editedShapesRef.current.push({
                        id: matchingShape.id,
                        type: editedLayer.layer instanceof L.Marker ? 'marker' : 
                              editedLayer.layer instanceof L.Circle ? 'circle' :
                              editedLayer.layer instanceof L.Rectangle ? 'rectangle' :
                              editedLayer.layer instanceof L.Polygon ? 'polygon' :
                              editedLayer.layer instanceof L.Polyline ? 'polyline' : matchingShape.type,
                        geoJSON: editedLayer.geoJSON,
                        _leaflet_id: editedLayer.layer._leaflet_id
                    });
                } else {
                    // This might be an unsaved shape that was edited
                    const unsavedIndex = unsavedShapesRef.current.findIndex(shape =>
                        shape._leaflet_id === editedLayer.layer._leaflet_id
                    );
                    if (unsavedIndex !== -1) {
                        unsavedShapesRef.current[unsavedIndex].geoJSON = editedLayer.geoJSON;
                    }
                }
            }
        });
        
        // Update unsaved count to include edits
        const totalChanges = unsavedShapesRef.current.length + 
                           editedShapesRef.current.length + 
                           deletedShapeIdsRef.current.length;
        setUnsavedCount(totalChanges);
        
        // Update localStorage
        const storageKey = getStorageKey();
        if (storageKey) {
            try {
                // Merge edited shapes back into drawnShapes for localStorage (use ref)
                const updatedDrawnShapes = drawnShapesRef.current.map(shape => {
                    const edit = editedShapesRef.current.find(e => e.id === shape.id);
                    return edit ? { ...shape, geoJSON: edit.geoJSON, type: edit.type } : shape;
                });
                
                const allShapes = [...updatedDrawnShapes, ...unsavedShapesRef.current];
                localStorage.setItem(storageKey, JSON.stringify(allShapes.map(shape => ({
                    type: shape.type,
                    geoJSON: shape.geoJSON,
                    id: shape.id
                }))));
            } catch (error) {
                console.error('Error updating localStorage:', error);
            }
        }
    }, [getStorageKey]);

    const handleDrawDeleted = useCallback((deletedLayers) => {
        
        // Match deleted layers with our tracked shapes using _leaflet_id
        const deletedShapeIds = [];
        const deletedLayerIds = deletedLayers.map(layer => layer.layer._leaflet_id);
        
        console.log('[LeafletScreen] Deleted layer IDs:', deletedLayerIds);
        
        // Use ref to get current drawnShapes (not stale closure value)
        const currentDrawnShapes = drawnShapesRef.current;
        console.log('[LeafletScreen] Current drawn shapes:', currentDrawnShapes);
        console.log('[LeafletScreen] Looking for shapes with layer IDs:', deletedLayerIds);
        
        // Store deleted shapes for history with their original indices and IDs of all shapes
        const deletedShapesWithIndices = [];
        const allShapeIds = currentDrawnShapes.map(s => s.id); // Store original order of all shape IDs
        
        // Check drawnShapes for matches
        const remainingDrawnShapes = currentDrawnShapes.filter((shape, index) => {
            // Try to match by _leaflet_id if available
            const isDeleted = shape._leaflet_id && deletedLayerIds.includes(shape._leaflet_id);
            
            if (isDeleted && shape.id) {
                // This shape has a database ID, track it for deletion later
                deletedShapeIds.push(shape.id);
                deletedShapesWithIndices.push({ 
                    shape, 
                    originalIndex: index,
                    allShapeIdsAtDeletion: allShapeIds // Store full original order
                }); 
            }
            
            return !isDeleted; // Keep shapes that weren't deleted
        });
        
        // Check unsaved shapes for matches
        const remainingUnsavedShapes = unsavedShapesRef.current.filter(shape => {
            const isDeleted = shape._leaflet_id && deletedLayerIds.includes(shape._leaflet_id);
            return !isDeleted;
        });
        
        // Track deleted shape IDs for later database deletion
        if (deletedShapeIds.length > 0) {
            deletedShapeIdsRef.current = [...deletedShapeIdsRef.current, ...deletedShapeIds];
            
            // Add each deletion to history individually (for LIFO undo)
            const timestamp = Date.now();
            deletedShapesWithIndices.forEach(({ shape, originalIndex, allShapeIdsAtDeletion }) => {
                historyRef.current.push({
                    type: 'delete',
                    shape: shape,
                    originalIndex: originalIndex,
                    allShapeIdsAtDeletion: allShapeIdsAtDeletion, // Store original order
                    timestamp: timestamp
                });
            });
            updateUndoAvailability();
            
            // Remove from edited shapes if they were edited
            editedShapesRef.current = editedShapesRef.current.filter(
                shape => !deletedShapeIds.includes(shape.id)
            );
        }
        
        // Update state and refs
        setDrawnShapes(remainingDrawnShapes);
        unsavedShapesRef.current = remainingUnsavedShapes;
        
        // Update unsaved count to include all changes (additions, edits, deletions)
        const totalChanges = remainingUnsavedShapes.length + 
                           editedShapesRef.current.length + 
                           deletedShapeIdsRef.current.length;
        setUnsavedCount(totalChanges); // Include pending deletions
        
        // Update localStorage
        const storageKey = getStorageKey();
        if (storageKey) {
            try {
                const allShapes = [...remainingDrawnShapes, ...remainingUnsavedShapes];
                const shapesToSave = allShapes.map(shape => ({
                    type: shape.type,
                    geoJSON: shape.geoJSON,
                    id: shape.id
                }));
                localStorage.setItem(storageKey, JSON.stringify(shapesToSave));
            } catch (error) {
                console.error('Error updating localStorage:', error);
            }
        }
    }, [getStorageKey]); // Remove drawnShapes dependency since we use ref

    const handleRevertToDatabase = async () => {
        if (!selectedProject) return;

        try {
            // Clear localStorage
            const storageKey = getStorageKey();
            if (storageKey) {
                localStorage.removeItem(storageKey);
            }

            // Clear all pending changes
            unsavedShapesRef.current = [];
            editedShapesRef.current = []; // Clear pending edits
            deletedShapeIdsRef.current = []; // Clear pending deletions
            historyRef.current = []; // Clear undo history
            setUnsavedCount(0); // Reset unsaved count
            updateUndoAvailability();

            // Reset load flag so shapes load properly
            hasLoadedShapesRef.current = false;

            // Load only from database
            const response = await leafletShapesService.getShapesByProject(selectedProject.id);
            if (response.success && response.data.length > 0) {
                const supabaseShapes = response.data.map(shape => ({
                    type: shape.shape_type,
                    geoJSON: shape.geojson,
                    id: shape.id
                }));
                
                setDrawnShapes(supabaseShapes);
                
                // Update localStorage with database shapes only
                if (storageKey) {
                    localStorage.setItem(storageKey, JSON.stringify(supabaseShapes));
                }
                
                setSaveMessage({ 
                    type: 'success', 
                    text: `Reverted to ${supabaseShapes.length} shape(s) from database` 
                });
            } else {
                setDrawnShapes([]);
                setSaveMessage({ 
                    type: 'success', 
                    text: 'Reverted - no shapes in database' 
                });
            }
        } catch (error) {
            console.error('Error reverting to database:', error);
            setSaveMessage({ 
                type: 'error', 
                text: 'Failed to revert to database' 
            });
        } finally {
            setTimeout(() => setSaveMessage(null), 3000);
        }
    };

    // Memoize shapes to prevent unnecessary re-renders
    const shapesForMap = useMemo(() => {
        if (isUndoingRef.current) {
            console.log('[LeafletScreen] Skipping shapesForMap update during undo');
            return []; // Return empty to prevent Leaflet reload
        }
        return drawnShapes.map(shape => ({
            type: shape.type,
            geoJSON: shape.geoJSON,
            id: shape.id // Include database ID so it can be preserved
        }));
    }, [drawnShapes]);

    const handleSaveToSupabase = async () => {
        
        if (!selectedProject) {
            setSaveMessage({ type: 'error', text: 'No project selected' });
            return;
        }

        // Get all pending changes
        const newShapes = unsavedShapesRef.current;
        const editedShapes = editedShapesRef.current;
        const deletedIds = deletedShapeIdsRef.current;

        if (newShapes.length === 0 && editedShapes.length === 0 && deletedIds.length === 0) {
            setSaveMessage({ type: 'error', text: 'No changes to save' });
            setTimeout(() => setSaveMessage(null), 3000);
            return;
        }

        setIsSaving(true);
        setSaveMessage(null);

        try {
            let addedCount = 0;
            let updatedCount = 0;
            let deletedCount = 0;

            // 1. Delete shapes from database
            if (deletedIds.length > 0) {
                await Promise.all(
                    deletedIds.map(id => leafletShapesService.deleteShape(id))
                );
                deletedCount = deletedIds.length;
                deletedShapeIdsRef.current = []; // Clear after successful deletion
            }

            // 2. Update edited shapes in database
            if (editedShapes.length > 0) {
                await Promise.all(
                    editedShapes.map(shape => 
                        leafletShapesService.updateShape(shape.id, {
                            shape_type: shape.type,
                            geojson: shape.geoJSON
                        })
                    )
                );
                updatedCount = editedShapes.length;
                
                // Update drawnShapes with the edited data
                setDrawnShapes(prev => prev.map(shape => {
                    const edit = editedShapes.find(e => e.id === shape.id);
                    return edit ? { ...shape, geoJSON: edit.geoJSON, type: edit.type } : shape;
                }));
                
                editedShapesRef.current = []; // Clear after successful update
            }

            // 3. Insert new shapes to database
            if (newShapes.length > 0) {
                const shapesData = newShapes.map(shape => ({
                    shape_type: shape.type,
                    geojson: shape.geoJSON
                }));

                // Call API to save to Supabase
                const response = await leafletShapesService.saveShapes(selectedProject.id, shapesData);
                
                if (response.data && response.data.length > 0) {
                    const savedShapes = response.data.map(shape => ({
                        type: shape.shape_type,
                        geoJSON: shape.geojson,
                        id: shape.id
                    }));
                    
                    addedCount = savedShapes.length;
                    
                    // Update drawnShapes to include the newly saved shapes with IDs
                    setDrawnShapes(prev => [...prev, ...savedShapes]);
                    
                    // Clear unsaved shapes ref - they're now saved
                    unsavedShapesRef.current = [];
                }
            }
            
            // Update localStorage with final state
            const storageKey = getStorageKey();
            if (storageKey) {
                // Get the updated drawnShapes (will include edits and new shapes)
                setTimeout(() => {
                    try {
                        const currentShapes = drawnShapes.map(shape => {
                            const edit = editedShapes.find(e => e.id === shape.id);
                            return edit ? { ...shape, geoJSON: edit.geoJSON, type: edit.type } : shape;
                        });
                        
                        localStorage.setItem(storageKey, JSON.stringify(currentShapes.map(shape => ({
                            type: shape.type,
                            geoJSON: shape.geoJSON,
                            id: shape.id
                        }))));
                    } catch (error) {
                        console.error('Error saving to localStorage:', error);
                    }
                }, 100); // Small delay to ensure state is updated
            }
            
            // Reset unsaved count and history
            setUnsavedCount(0);
            historyRef.current = []; // Clear undo history after successful save
            updateUndoAvailability();
            
            // Build success message
            const messages = [];
            if (addedCount > 0) messages.push(`added ${addedCount} shape(s)`);
            if (updatedCount > 0) messages.push(`updated ${updatedCount} shape(s)`);
            if (deletedCount > 0) messages.push(`deleted ${deletedCount} shape(s)`);
            
            setSaveMessage({ 
                type: 'success', 
                text: `Successfully ${messages.join(', ')}` 
            });
        } catch (error) {
            console.error('Error saving to Supabase:', error);
            const errorMessage = error.response?.data?.error || error.message || 'Failed to save changes to database';
            setSaveMessage({ type: 'error', text: errorMessage });
        } finally {
            setIsSaving(false);
            // Clear message after 5 seconds
            setTimeout(() => setSaveMessage(null), 5000);
        }
    };

    return (
        <div className="map-screen">
            {selectedProject ? (
            <div className="map-screen-container">
                <div className="map-screen-header">
                    <h2 className="map-screen-title">Leaflet Drawing Map - {selectedProject.title}</h2>
                    <div className="map-screen-header-right">
                        <div className="map-screen-info">
                            <span>
                                {drawnShapes.length + unsavedShapesRef.current.length} shape(s) on map
                                {unsavedCount > 0 && 
                                    ` (${unsavedCount} unsaved change${unsavedCount > 1 ? 's' : ''})`
                                }
                            </span>
                        </div>
                        <div className="map-screen-controls">
                            <label htmlFor="map-style-select">Map Type</label>
                            <select
                                id="map-style-select"
                                className="map-style-select"
                                value={mapStyle}
                                onChange={(e) => setMapStyle(e.target.value)}
                            >
                                {mapTypeOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {/* Show Save button if there are changes to save */}
                        {unsavedCount > 0 && (
                            <button 
                                className="map-action-button save" 
                                onClick={handleSaveToSupabase}
                                disabled={isSaving}
                            >
                                {isSaving ? 'Saving...' : 'Save to Database'}
                            </button>
                        )}
                        {/* Show Revert button if there are any shapes or pending changes */}
                        {(drawnShapes.length > 0 || unsavedCount > 0) && (
                            <button 
                                className="map-action-button revert" 
                                onClick={handleRevertToDatabase}
                                disabled={isSaving}
                            >
                                Revert to Database
                            </button>
                        )}
                        {/* Show Undo button if there are changes to undo */}
                        {canUndo && (
                            <button 
                                className="map-action-button undo" 
                                onClick={handleUndo}
                                disabled={isSaving}
                                title="Undo last unsaved change"
                            >
                                Undo
                            </button>
                        )}
                    </div>
                </div>

                <div className="map-screen-layout" style={{ position: 'relative' }}>
                    {saveMessage && (
                        <div className={`map-toast-message ${saveMessage.type}`}>
                            {saveMessage.text}
                        </div>
                    )}
                    <div className="map-screen-left-panel" style={{ width: '100%' }}>
                        <div className="map-panel">
                            <div className="map-view-wrapper">
                                <Leaflet 
                                    center={mapCenter}
                                    zoom={mapZoom}
                                    height="700px"
                                    mapStyle={mapStyle}
                                    initialShapes={shapesForMap}
                                    onShapesLoaded={handleShapesLoaded}
                                    onMapReady={handleMapReady}
                                    onDrawCreated={handleDrawCreated}
                                    onDrawEdited={handleDrawEdited}
                                    onDrawDeleted={handleDrawDeleted}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ padding: '20px', background: '#f8f9fa', marginTop: '20px', borderRadius: '8px' }}>
                    <h3 style={{ marginTop: 0 }}>Drawing Tools Instructions:</h3>
                    <ul style={{ lineHeight: '1.8' }}>
                        <li><strong>Draw Marker:</strong> Click the marker icon and click on the map to place a marker</li>
                        <li><strong>Draw Polyline:</strong> Click the polyline icon and click multiple points on the map</li>
                        <li><strong>Draw Polygon:</strong> Click the polygon icon and draw a closed shape</li>
                        <li><strong>Draw Rectangle:</strong> Click the rectangle icon and drag to create a rectangle</li>
                        <li><strong>Draw Circle:</strong> Click the circle icon and drag to create a circle</li>
                        <li><strong>Edit Shapes:</strong> Click the edit icon (pencil) to modify existing shapes</li>
                        <li><strong>Delete Shapes:</strong> Click the delete icon (trash) to remove shapes</li>
                    </ul>
                </div>
            </div>
            ) : (
                <div className="no-project-selected">
                    <h2>No Project Selected</h2>
                    <p>Please select a project to use the drawing map</p>
                </div>
            )}
        </div>
    );
};

export default LeafletScreen;