import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import Leaflet from '../components/Leaflet';
import leafletShapesService from '../services/leafletShapesService';
import '../styles/map.css';

const LeafletScreen = () => {
    const { selectedProject } = useSelector((state) => state.projects);
    const [drawnShapes, setDrawnShapes] = useState([]);
    const [mapCenter, setMapCenter] = useState([51.505, -0.09]); // Default: London
    const [mapZoom, setMapZoom] = useState(13);
    const [mapStyle, setMapStyle] = useState('streets');
    const [clearTrigger, setClearTrigger] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState(null);
    const [unsavedCount, setUnsavedCount] = useState(0); // Track count of unsaved shapes for UI updates
    const unsavedShapesRef = useRef([]); // Track shapes drawn but not yet saved

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

            // Load from Supabase
            try {
                const response = await leafletShapesService.getShapesByProject(selectedProject.id);
                if (response.success && response.data.length > 0) {
                    const supabaseShapes = response.data.map(shape => ({
                        type: shape.shape_type,
                        geoJSON: shape.geojson,
                        id: shape.id
                    }));
                    console.log('Loaded shapes from Supabase:', supabaseShapes.length);
                    
                    const allShapes = [...supabaseShapes, ...localShapes];
                    setDrawnShapes(allShapes);
                    // Don't change key - let initial load handle it
                } else if (localShapes.length > 0) {
                    setDrawnShapes(localShapes);
                }
            } catch (error) {
                console.error('Error loading shapes from Supabase:', error);
                if (localShapes.length > 0) {
                    setDrawnShapes(localShapes);
                }
            }
        };

        loadShapes();
    }, [selectedProject]);

    // Note: localStorage saving is now handled inline in handleDrawCreated
    // and other handlers to avoid triggering unnecessary re-renders

    const handleDrawCreated = useCallback((data) => {
        console.log('[LeafletScreen] Shape created:', data);
        console.log('[LeafletScreen] Current unsaved count before:', unsavedShapesRef.current.length);
        
        // Leaflet already added the layer - don't update state to avoid re-renders
        // Just track in ref for saving later
        unsavedShapesRef.current = [...unsavedShapesRef.current, data];
        setUnsavedCount(unsavedShapesRef.current.length); // Update state to trigger re-render
        console.log('[LeafletScreen] Unsaved count after:', unsavedShapesRef.current.length);
        
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
        console.log('Shapes edited:', editedLayers);
    }, []); // No dependencies needed

    const handleDrawDeleted = useCallback((deletedLayers) => {
        console.log('Shapes deleted:', deletedLayers);
        // Leaflet already removed the layers - just update our tracking
        // Note: This is tricky because we need to match deleted layers with our shapes
        // For now, just log it - shapes are already removed from map by Leaflet
        console.log('Layers deleted from map');
    }, []); // No dependencies needed

    const handleClearAll = () => {
        setDrawnShapes([]);
        unsavedShapesRef.current = [];
        setUnsavedCount(0); // Reset unsaved count
        setClearTrigger(prev => prev + 1); // Trigger clear without page reload
        
        // Also clear from localStorage
        const storageKey = getStorageKey();
        if (storageKey) {
            localStorage.removeItem(storageKey);
        }
    };

    const handleRevertToDatabase = async () => {
        if (!selectedProject) return;

        try {
            // Clear localStorage
            const storageKey = getStorageKey();
            if (storageKey) {
                localStorage.removeItem(storageKey);
            }

            // Clear unsaved changes
            unsavedShapesRef.current = [];
            setUnsavedCount(0); // Reset unsaved count

            // Clear the map
            setClearTrigger(prev => prev + 1);

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
        return drawnShapes.map(shape => ({
            type: shape.type,
            geoJSON: shape.geoJSON
        }));
    }, [drawnShapes]);

    const handleSaveToSupabase = async () => {
        console.log('[LeafletScreen] Save to database clicked');
        console.log('[LeafletScreen] Current drawnShapes:', drawnShapes.length);
        console.log('[LeafletScreen] Current unsavedShapes:', unsavedShapesRef.current.length);
        
        if (!selectedProject) {
            setSaveMessage({ type: 'error', text: 'No project selected' });
            return;
        }

        // Get unsaved shapes from ref (newly drawn shapes)
        const newShapes = unsavedShapesRef.current;

        if (newShapes.length === 0) {
            setSaveMessage({ type: 'error', text: 'No new shapes to save' });
            setTimeout(() => setSaveMessage(null), 3000);
            return;
        }

        setIsSaving(true);
        setSaveMessage(null);

        try {
            // Only save shapes that don't have an ID yet
            const shapesData = newShapes.map(shape => ({
                shape_type: shape.type,
                geojson: shape.geoJSON
            }));

            console.log('[LeafletScreen] Saving shapes to database:', shapesData.length);

            // Call API to save to Supabase
            const response = await leafletShapesService.saveShapes(selectedProject.id, shapesData);
            
            console.log('[LeafletScreen] Save response:', response);
            
            // Don't update state - shapes are already on the map
            // Just clear the unsaved ref and update localStorage
            if (response.data && response.data.length > 0) {
                const savedShapes = response.data.map(shape => ({
                    type: shape.shape_type,
                    geoJSON: shape.geojson,
                    id: shape.id
                }));
                
                console.log('[LeafletScreen] Clearing unsaved ref');
                // Clear unsaved shapes ref - they're now saved
                unsavedShapesRef.current = [];
                setUnsavedCount(0); // Reset unsaved count
                
                // Update localStorage to include the database IDs
                const storageKey = getStorageKey();
                if (storageKey) {
                    try {
                        const allShapes = [...drawnShapes, ...savedShapes];
                        const shapesToSave = allShapes.map(shape => ({
                            type: shape.type,
                            geoJSON: shape.geoJSON,
                            id: shape.id
                        }));
                        localStorage.setItem(storageKey, JSON.stringify(shapesToSave));
                        console.log('[LeafletScreen] Updated localStorage, total shapes:', shapesToSave.length);
                    } catch (error) {
                        console.error('Error saving to localStorage:', error);
                    }
                }
            }
            
            console.log('[LeafletScreen] Save complete, shapes should still be visible');
            
            setSaveMessage({ 
                type: 'success', 
                text: `Successfully saved ${newShapes.length} new shape(s) to database` 
            });
        } catch (error) {
            console.error('Error saving to Supabase:', error);
            const errorMessage = error.response?.data?.error || error.message || 'Failed to save shapes to database';
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
                                {drawnShapes.length + unsavedCount} shape(s) total
                                {unsavedCount > 0 && 
                                    ` (${unsavedCount} unsaved)`
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
                        {(drawnShapes.length > 0 || unsavedCount > 0) && (
                            <>
                                <button 
                                    className="button" 
                                    onClick={handleSaveToSupabase}
                                    disabled={isSaving}
                                    style={{
                                        background: '#28a745',
                                        color: 'white',
                                        border: 'none',
                                        padding: '8px 16px',
                                        borderRadius: '4px',
                                        cursor: isSaving ? 'not-allowed' : 'pointer',
                                        fontSize: '14px',
                                        opacity: isSaving ? 0.6 : 1
                                    }}
                                >
                                    {isSaving ? 'Saving...' : 'Save to Database'}
                                </button>
                                <button 
                                    className="button" 
                                    onClick={handleRevertToDatabase}
                                    disabled={isSaving}
                                    style={{
                                        background: '#ff9800',
                                        color: 'white',
                                        border: 'none',
                                        padding: '8px 16px',
                                        borderRadius: '4px',
                                        cursor: isSaving ? 'not-allowed' : 'pointer',
                                        fontSize: '14px',
                                        opacity: isSaving ? 0.6 : 1
                                    }}
                                >
                                    Revert to Database
                                </button>
                                <button 
                                    className="button" 
                                    onClick={handleClearAll}
                                    disabled={isSaving}
                                    style={{
                                        background: '#dc3545',
                                        color: 'white',
                                        border: 'none',
                                        padding: '8px 16px',
                                        borderRadius: '4px',
                                        cursor: isSaving ? 'not-allowed' : 'pointer',
                                        fontSize: '14px',
                                        opacity: isSaving ? 0.6 : 1
                                    }}
                                >
                                    Clear All
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {saveMessage && (
                    <div style={{
                        padding: '12px 20px',
                        margin: '10px 0',
                        borderRadius: '4px',
                        background: saveMessage.type === 'success' ? '#d4edda' : '#f8d7da',
                        color: saveMessage.type === 'success' ? '#155724' : '#721c24',
                        border: `1px solid ${saveMessage.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`
                    }}>
                        {saveMessage.text}
                    </div>
                )}

                <div className="map-screen-layout">
                    <div className="map-screen-left-panel" style={{ width: '100%' }}>
                        <div className="map-panel">
                            <div className="map-view-wrapper">
                                <Leaflet 
                                    center={mapCenter}
                                    zoom={mapZoom}
                                    height="700px"
                                    mapStyle={mapStyle}
                                    clearTrigger={clearTrigger}
                                    initialShapes={shapesForMap}
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