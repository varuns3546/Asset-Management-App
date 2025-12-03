import { useEffect, useMemo, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getHierarchy, getHierarchyItemTypes, updateHierarchyItemType } from '../features/projects/projectSlice';
import { loadUser } from '../features/auth/authSlice';
import Map from '../components/Map';
import HierarchyForm from '../components/structure/HierarchyForm';
import AddLayerModal from '../components/AddLayerModal';
import { ITEM_TYPE_ICON_MAP, ITEM_TYPE_ICON_OPTIONS, ITEM_TYPE_COLOR_OPTIONS, DEFAULT_ITEM_TYPE_ICON } from '../constants/itemTypeIcons';
import ARCGIS_CONFIG from '../config/arcgisConfig';
import '../styles/map.css';
import '../styles/structureScreen.css';

const MapScreen = () => {
    const { selectedProject, currentHierarchy, currentItemTypes } = useSelector((state) => state.projects);
    const { user } = useSelector((state) => state.auth);
    const [selectedItem, setSelectedItem] = useState(null);
    const dispatch = useDispatch();
    const mapRef = useRef(null);
    const [activeTypeId, setActiveTypeId] = useState(null);
    const [editingTypeId, setEditingTypeId] = useState(null);
    const [typeIconDraft, setTypeIconDraft] = useState(DEFAULT_ITEM_TYPE_ICON);
    const [typeColorDraft, setTypeColorDraft] = useState(ITEM_TYPE_COLOR_OPTIONS[0].value);
    const [updatingType, setUpdatingType] = useState(false);
    const [typeEditError, setTypeEditError] = useState(null);
    const [mapStyle, setMapStyle] = useState('streets');
    const [isAddLayerModalOpen, setIsAddLayerModalOpen] = useState(false);
    const [loadedLayers, setLoadedLayers] = useState([]);
    const [layerError, setLayerError] = useState(null);
    const mapTypeOptions = [
        { value: 'streets', label: 'Streets' },
        { value: 'satellite', label: 'Satellite' },
        { value: 'hybrid', label: 'Hybrid' },
        { value: 'terrain', label: 'Terrain' },
        { value: 'topo', label: 'Topographic' }
    ].filter(option => ARCGIS_CONFIG.mapStyles?.[option.value]);

    useEffect(() => {
        dispatch(loadUser());
    }, [dispatch]);

    useEffect(() => {
        if (selectedProject && user) {
            dispatch(getHierarchy(selectedProject.id));
            dispatch(getHierarchyItemTypes(selectedProject.id));
        }
    }, [selectedProject, user, dispatch]);

    const handleItemSelect = (item) => {
        setSelectedItem(item);
    };

    // Filter items that have coordinates
    const itemsWithCoordinates = currentHierarchy?.filter(item => 
        item.coordinates && 
        item.coordinates.latitude && 
        item.coordinates.longitude
    ) || [];

    const itemTypeCounts = useMemo(() => {
        const counts = {};
        (currentHierarchy || []).forEach(item => {
            if (item.item_type_id) {
                counts[item.item_type_id] = (counts[item.item_type_id] || 0) + 1;
            }
        });
        return counts;
    }, [currentHierarchy]);

    const typesWithEntries = useMemo(() => {
        return (currentItemTypes || []).filter(type => itemTypeCounts[type.id]);
    }, [currentItemTypes, itemTypeCounts]);

    const filteredItemsByType = useMemo(() => {
        if (!activeTypeId) return [];
        return (currentHierarchy || []).filter(item => item.item_type_id === activeTypeId);
    }, [currentHierarchy, activeTypeId]);

    const selectedType = activeTypeId 
        ? (currentItemTypes || []).find(type => type.id === activeTypeId) 
        : null;

    const handleTypeToggle = (typeId) => {
        setActiveTypeId(prev => {
            if (prev === typeId) {
                handleCancelTypeEdit();
                return null;
            }
            const nextType = (currentItemTypes || []).find(type => type.id === typeId);
            if (nextType) {
                handleStartTypeEdit(nextType);
            }
            return typeId;
        });
    };

    const handleTypeEntrySelect = (item) => {
        setSelectedItem(item);
    };

    const handleStartTypeEdit = (type) => {
        if (!type) return;
        setEditingTypeId(type.id);
        setTypeIconDraft(type.icon || DEFAULT_ITEM_TYPE_ICON);
        setTypeColorDraft(type.icon_color || ITEM_TYPE_COLOR_OPTIONS[0].value);
        setTypeEditError(null);
    };

    const handleCancelTypeEdit = () => {
        setEditingTypeId(null);
        setTypeEditError(null);
    };

    const handleSaveTypeEdit = async () => {
        if (!editingTypeId || !selectedProject) return;
        const typeToUpdate = (currentItemTypes || []).find(type => type.id === editingTypeId);
        if (!typeToUpdate) return;

        const itemTypeData = {
            name: typeToUpdate.title,
            description: typeToUpdate.description || '',
            parent_ids: typeToUpdate.parent_ids || [],
            attributes: typeToUpdate.attributes || [],
            has_coordinates: typeToUpdate.has_coordinates || false,
            icon: typeIconDraft,
            icon_color: typeColorDraft
        };

        try {
            setUpdatingType(true);
            setTypeEditError(null);
            await dispatch(updateHierarchyItemType({
                projectId: selectedProject.id,
                itemTypeId: editingTypeId,
                itemTypeData
            })).unwrap();
            await dispatch(getHierarchyItemTypes(selectedProject.id));
            setEditingTypeId(null);
        } catch (error) {
            setTypeEditError(error?.message || 'Failed to update item type');
        } finally {
            setUpdatingType(false);
        }
    };

    const handleAddLayer = async (layerInfo) => {
        console.log('handleAddLayer called with:', layerInfo);
        
        if (!mapRef.current) {
            console.error('Map ref is not available');
            throw new Error('Map is not initialized');
        }

        try {
            setLayerError(null);
            console.log('Calling map.addLayer...');
            const layerId = await mapRef.current.addLayer(layerInfo);
            console.log('Layer added successfully with ID:', layerId);
            setLoadedLayers(prevLayers => [...prevLayers, { id: layerId, ...layerInfo }]);
        } catch (error) {
            console.error('Error in handleAddLayer:', error);
            setLayerError(error.message);
            throw error;
        }
    };

    const handleRemoveLayer = (layerId) => {
        console.log('Removing layer with ID:', layerId);
        if (mapRef.current) {
            mapRef.current.removeLayer(layerId);
            setLoadedLayers(prevLayers => prevLayers.filter(layer => layer.id !== layerId));
        }
    };

    const handleOpenAddLayerModal = () => {
        setIsAddLayerModalOpen(true);
        setLayerError(null);
    };

    const handleCloseAddLayerModal = () => {
        setIsAddLayerModalOpen(false);
        setLayerError(null);
    };


    return (
        <div className="map-screen">
            {selectedProject ? (
                <div className="map-screen-container">
                    <div className="map-screen-header">
                        <h2 className="map-screen-title">Asset Map - {selectedProject.title}</h2>
                        <div className="map-screen-header-right">
                            <div className="map-screen-info">
                                <span>{itemsWithCoordinates.length} assets with coordinates</span>
                            </div>
                            <button 
                                className="btn btn-primary btn-sm"
                                onClick={handleOpenAddLayerModal}
                                style={{ marginRight: '10px' }}
                            >
                                + Add Layer
                            </button>
                            {mapTypeOptions.length > 0 && (
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
                            )}
                        </div>
                    </div>

                    <div className="map-screen-layout">
                        <div className="map-screen-left-panel">
                            <div className="map-panel">
                                <div className="map-legend-wrapper">
                                    {typesWithEntries.length > 0 && (
                                        <div className="map-legend map-legend-top-left">
                                            <h4 className="map-legend-title">Item Types</h4>
                                            <ul className="map-legend-list">
                                                {typesWithEntries.map(type => {
                                                    const iconMeta = ITEM_TYPE_ICON_MAP[type.icon] || ITEM_TYPE_ICON_MAP[DEFAULT_ITEM_TYPE_ICON];
                                                    const isActive = activeTypeId === type.id;
                                                    return (
                                                        <li key={type.id} className={`map-legend-item ${isActive ? 'active' : ''}`}>
                                                            <button
                                                                type="button"
                                                                className="map-legend-item-btn"
                                                                onClick={() => handleTypeToggle(type.id)}
                                                            >
                                                                <span
                                                                    className="map-legend-icon"
                                                                    style={{ color: type.icon_color || '#000' }}
                                                                >
                                                                    {iconMeta.preview}
                                                                </span>
                                                                <span className="map-legend-label">{type.title}</span>
                                                                <span className="map-legend-count">{itemTypeCounts[type.id]}</span>
                                                            </button>

                                                            {editingTypeId === type.id && (
                                                                <div className="map-legend-edit">
                                                                    <div className="map-type-edit-row">
                                                                        <label>Icon</label>
                                                                        <select
                                                                            value={typeIconDraft}
                                                                            onChange={(e) => setTypeIconDraft(e.target.value)}
                                                                            className="form-select"
                                                                        >
                                                                            {ITEM_TYPE_ICON_OPTIONS.map(option => (
                                                                                <option key={option.key} value={option.key}>
                                                                                    {option.preview}
                                                                                </option>
                                                                            ))}
                                                                        </select>
                                                                    </div>
                                                                    <div className="map-type-edit-row">
                                                                        <label>Color</label>
                                                                        <div className="icon-color-select-wrapper">
                                                                            <select
                                                                                value={typeColorDraft}
                                                                                onChange={(e) => setTypeColorDraft(e.target.value)}
                                                                                className="form-select icon-color-select"
                                                                                style={{ color: typeColorDraft }}
                                                                            >
                                                                                {ITEM_TYPE_COLOR_OPTIONS.map(option => (
                                                                                    <option
                                                                                        key={option.value}
                                                                                        value={option.value}
                                                                                        style={{ color: option.value }}
                                                                                    >
                                                                                        ■
                                                                                    </option>
                                                                                ))}
                                                                            </select>
                                                                            <div
                                                                                className="icon-color-preview"
                                                                                style={{ backgroundColor: typeColorDraft }}
                                                                                aria-hidden="true"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                    {typeEditError && (
                                                                        <p className="map-type-edit-error">{typeEditError}</p>
                                                                    )}
                                                                    <div className="map-type-edit-actions">
                                                                        <button
                                                                            type="button"
                                                                            className="map-type-edit-save"
                                                                            onClick={handleSaveTypeEdit}
                                                                            disabled={updatingType}
                                                                        >
                                                                            {updatingType ? 'Saving...' : 'Save'}
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            className="map-type-edit-cancel"
                                                                            onClick={handleCancelTypeEdit}
                                                                            disabled={updatingType}
                                                                        >
                                                                            Cancel
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                                <div className="map-view-wrapper">
                                    <Map 
                                        ref={mapRef}
                                        hierarchyItems={currentHierarchy || []}
                                        itemTypes={currentItemTypes || []}
                                        selectedItem={selectedItem}
                                        onItemSelect={handleItemSelect}
                                        selectedProject={selectedProject}
                                        height="600px"
                                        mapStyle={mapStyle}
                                    />
                                </div>
                                
                                {/* Layer Error Display */}
                                {layerError && (
                                    <div className="external-layers-panel" style={{ marginTop: '15px' }}>
                                        <div className="error-message" style={{ fontSize: '12px', color: '#dc3545' }}>
                                            <strong>Error:</strong> {layerError}
                                        </div>
                                    </div>
                                )}
                                
                                {/* External Layers List */}
                                {loadedLayers.length > 0 && (
                                    <div className="external-layers-panel" style={{ marginTop: layerError ? '10px' : '15px' }}>
                                        <h4>External Layers ({loadedLayers.length})</h4>
                                        <ul className="external-layers-list">
                                            {loadedLayers.map(layer => (
                                                <li key={layer.id} className="external-layer-item">
                                                    <span className="external-layer-name" title={layer.url}>
                                                        {layer.name}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        className="external-layer-remove"
                                                        onClick={() => handleRemoveLayer(layer.id)}
                                                        title="Remove layer"
                                                    >
                                                        ×
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="map-screen-right-panel">
                            <div className="map-screen-form-container">
                                <HierarchyForm 
                                    hierarchyItems={currentHierarchy || []}
                                    itemTypes={currentItemTypes || []}
                                    selectedItem={selectedItem}
                                    onItemSelect={handleItemSelect}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="no-project-selected">
                    <h2>No Project Selected</h2>
                    <p>Please select a project to view its asset map</p>
                </div>
            )}
            
            {/* Add Layer Modal */}
            <AddLayerModal
                isOpen={isAddLayerModalOpen}
                onClose={handleCloseAddLayerModal}
                onAddLayer={handleAddLayer}
            />
        </div>
    );
};

export default MapScreen;
