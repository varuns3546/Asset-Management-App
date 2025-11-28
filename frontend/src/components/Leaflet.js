import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';

// Fix default marker icon issue with webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Map style configurations
const MAP_STYLES = {
    streets: {
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    },
    satellite: {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
        maxZoom: 19
    },
    terrain: {
        url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
        attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
        maxZoom: 17
    },
    dark: {
        url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 19
    },
    light: {
        url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 19
    },
    topo: {
        url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/" target="_blank">Humanitarian OpenStreetMap Team</a>',
        maxZoom: 19
    }
};

const Leaflet = ({ 
    center = [51.505, -0.09], 
    zoom = 13,
    height = '600px',
    mapStyle = 'streets',
    onDrawCreated,
    onDrawEdited,
    onDrawDeleted,
    clearTrigger = 0,
    initialShapes = []
}) => {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const drawnItemsRef = useRef(null);
    const drawControlRef = useRef(null);
    const tileLayerRef = useRef(null);
    const [isMapReady, setIsMapReady] = useState(false);
    const hasLoadedShapes = useRef(false);
    const loadedShapesCount = useRef(0);
    const isLoadingShapes = useRef(false);
    const previousShapesRef = useRef(null);

    useEffect(() => {
        console.log('[Leaflet] Component mounted/updated');
        
        // Initialize map only once
        if (mapRef.current && !mapInstanceRef.current) {
            console.log('[Leaflet] Initializing map for the first time');
            // Create map instance
            const map = L.map(mapRef.current).setView(center, zoom);

            // Add initial tile layer
            const styleConfig = MAP_STYLES[mapStyle] || MAP_STYLES.streets;
            const tileLayer = L.tileLayer(styleConfig.url, {
                attribution: styleConfig.attribution,
                maxZoom: styleConfig.maxZoom,
            }).addTo(map);
            tileLayerRef.current = tileLayer;

            // Initialize FeatureGroup to store drawn items
            const drawnItems = new L.FeatureGroup();
            map.addLayer(drawnItems);
            drawnItemsRef.current = drawnItems;

            // Initialize draw control
            const drawControl = new L.Control.Draw({
                edit: {
                    featureGroup: drawnItems,
                    edit: true,
                    remove: true
                },
                draw: {
                    polygon: {
                        allowIntersection: false,
                        showArea: true,
                        drawError: {
                            color: '#e74c3c',
                            message: '<strong>Error:</strong> Shape edges cannot cross!'
                        },
                        shapeOptions: {
                            color: '#3388ff'
                        }
                    },
                    polyline: {
                        shapeOptions: {
                            color: '#3388ff',
                            weight: 4
                        }
                    },
                    rectangle: {
                        shapeOptions: {
                            color: '#3388ff'
                        }
                    },
                    circle: {
                        shapeOptions: {
                            color: '#3388ff'
                        }
                    },
                    marker: true,
                    circlemarker: {
                        color: '#3388ff'
                    }
                }
            });
            map.addControl(drawControl);
            drawControlRef.current = drawControl;

            // Event listeners for draw actions
            map.on(L.Draw.Event.CREATED, (event) => {
                const layer = event.layer;
                drawnItems.addLayer(layer);
                
                if (onDrawCreated) {
                    const geoJSON = layer.toGeoJSON();
                    onDrawCreated({
                        type: event.layerType,
                        layer: layer,
                        geoJSON: geoJSON
                    });
                }
            });

            map.on(L.Draw.Event.EDITED, (event) => {
                const layers = event.layers;
                const editedLayers = [];
                
                layers.eachLayer((layer) => {
                    editedLayers.push({
                        layer: layer,
                        geoJSON: layer.toGeoJSON()
                    });
                });

                if (onDrawEdited) {
                    onDrawEdited(editedLayers);
                }
            });

            map.on(L.Draw.Event.DELETED, (event) => {
                const layers = event.layers;
                const deletedLayers = [];
                
                layers.eachLayer((layer) => {
                    deletedLayers.push({
                        layer: layer,
                        geoJSON: layer.toGeoJSON()
                    });
                });

                if (onDrawDeleted) {
                    onDrawDeleted(deletedLayers);
                }
            });

            mapInstanceRef.current = map;
            setIsMapReady(true);

            // Cleanup on unmount
            return () => {
                console.log('[Leaflet] Component ACTUALLY unmounting - destroying map');
                if (mapInstanceRef.current) {
                    mapInstanceRef.current.remove();
                    mapInstanceRef.current = null;
                }
            };
        }
    }, []); // Empty dependencies - only run once on mount/unmount

    // Update map view when center or zoom changes
    useEffect(() => {
        if (mapInstanceRef.current && isMapReady) {
            mapInstanceRef.current.setView(center, zoom);
        }
    }, [center, zoom, isMapReady]);

    // Update tile layer when map style changes
    useEffect(() => {
        if (mapInstanceRef.current && tileLayerRef.current && isMapReady) {
            const styleConfig = MAP_STYLES[mapStyle] || MAP_STYLES.streets;
            
            // Remove old tile layer
            mapInstanceRef.current.removeLayer(tileLayerRef.current);
            
            // Add new tile layer
            const newTileLayer = L.tileLayer(styleConfig.url, {
                attribution: styleConfig.attribution,
                maxZoom: styleConfig.maxZoom,
            }).addTo(mapInstanceRef.current);
            
            tileLayerRef.current = newTileLayer;
        }
    }, [mapStyle, isMapReady]);

    // Clear all drawn items when clearTrigger changes
    useEffect(() => {
        if (clearTrigger > 0 && drawnItemsRef.current && mapInstanceRef.current && isMapReady) {
            console.log('Clearing all shapes - clearTrigger:', clearTrigger);
            
            // Stop any ongoing animations first
            mapInstanceRef.current.stop();
            
            requestAnimationFrame(() => {
                if (drawnItemsRef.current) {
                    // Safely remove each layer
                    const layers = [];
                    drawnItemsRef.current.eachLayer(layer => layers.push(layer));
                    layers.forEach(layer => {
                        try {
                            drawnItemsRef.current.removeLayer(layer);
                        } catch (e) {
                            console.warn('Error removing layer:', e);
                        }
                    });
                    
                    hasLoadedShapes.current = false;
                    loadedShapesCount.current = 0;
                    previousShapesRef.current = null;
                    console.log('All shapes cleared');
                }
            });
        }
    }, [clearTrigger, isMapReady]);

    // Load initial shapes only once on mount - simple approach
    useEffect(() => {
        // Skip if not ready or already loaded
        if (!isMapReady || !drawnItemsRef.current || hasLoadedShapes.current) {
            return;
        }
        
        // Skip if no shapes to load
        if (!initialShapes || initialShapes.length === 0) {
            return;
        }

        console.log('Loading initial shapes:', initialShapes.length);
        
        // Mark as loaded BEFORE actually loading to prevent race conditions
        hasLoadedShapes.current = true;
        loadedShapesCount.current = initialShapes.length;

        // Simple loading without all the complex logic
        initialShapes.forEach(shape => {
            try {
                if (!shape.geoJSON) return;
                
                const layer = L.geoJSON(shape.geoJSON, {
                    pointToLayer: (feature, latlng) => L.marker(latlng),
                    style: {
                        color: '#3388ff',
                        weight: 4,
                        opacity: 0.7,
                        fillOpacity: 0.2
                    }
                });
                
                layer.eachLayer((l) => {
                    if (drawnItemsRef.current) {
                        drawnItemsRef.current.addLayer(l);
                    }
                });
            } catch (error) {
                console.error('Error loading shape:', error);
            }
        });
        
        console.log('Initial shapes loaded successfully');
    }, [isMapReady, initialShapes]);

    return (
        <div style={{ width: '100%', height: height, position: 'relative' }}>
            <div 
                ref={mapRef} 
                style={{ 
                    width: '100%', 
                    height: '100%',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                }} 
            />
        </div>
    );
};

export default Leaflet;

