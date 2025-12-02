import { useEffect, useMemo, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getHierarchy, getFeatureTypes, updateFeatureType } from '../features/projects/projectSlice';
import { loadUser } from '../features/auth/authSlice';
import Map from '../components/map/Map';
import HierarchyForm from '../components/structure/HierarchyForm';
import { ITEM_TYPE_ICON_MAP, ITEM_TYPE_ICON_OPTIONS, ITEM_TYPE_COLOR_OPTIONS, DEFAULT_ITEM_TYPE_ICON } from '../constants/itemTypeIcons';
import ARCGIS_CONFIG from '../config/arcgisConfig';
import '../styles/map.css';
import '../styles/structureScreen.css';

const MapScreen = () => {
    const { selectedProject, currentHierarchy, currentFeatureTypes } = useSelector((state) => state.projects);
    const { user } = useSelector((state) => state.auth);
    const [selectedItem, setSelectedItem] = useState(null);
    const dispatch = useDispatch();
    const [activeTypeId, setActiveTypeId] = useState(null);
    const [editingTypeId, setEditingTypeId] = useState(null);
    const [typeIconDraft, setTypeIconDraft] = useState(DEFAULT_ITEM_TYPE_ICON);
    const [typeColorDraft, setTypeColorDraft] = useState(ITEM_TYPE_COLOR_OPTIONS[0].value);
    const [updatingType, setUpdatingType] = useState(false);
    const [typeEditError, setTypeEditError] = useState(null);
    const [mapStyle, setMapStyle] = useState('streets');
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
            dispatch(getFeatureTypes(selectedProject.id));
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
        return (currentFeatureTypes || []).filter(type => itemTypeCounts[type.id]);
    }, [currentFeatureTypes, itemTypeCounts]);

    const filteredItemsByType = useMemo(() => {
        if (!activeTypeId) return [];
        return (currentHierarchy || []).filter(item => item.item_type_id === activeTypeId);
    }, [currentHierarchy, activeTypeId]);

    const selectedType = activeTypeId 
        ? (currentFeatureTypes || []).find(type => type.id === activeTypeId) 
        : null;

    const handleTypeToggle = (typeId) => {
        setActiveTypeId(prev => {
            if (prev === typeId) {
                handleCancelTypeEdit();
                return null;
            }
            const nextType = (currentFeatureTypes || []).find(type => type.id === typeId);
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
        const typeToUpdate = (currentFeatureTypes || []).find(type => type.id === editingTypeId);
        if (!typeToUpdate) return;

        const featureTypeData = {
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
            await dispatch(updateFeatureType({
                projectId: selectedProject.id,
                featureTypeId: editingTypeId,
                featureTypeData
            })).unwrap();
            await dispatch(getFeatureTypes(selectedProject.id));
            setEditingTypeId(null);
        } catch (error) {
            setTypeEditError(error?.message || 'Failed to update item type');
        } finally {
            setUpdatingType(false);
        }
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
                                        hierarchyItems={currentHierarchy || []}
                                        itemTypes={currentFeatureTypes || []}
                                        selectedItem={selectedItem}
                                        onItemSelect={handleItemSelect}
                                        selectedProject={selectedProject}
                                        height="600px"
                                        mapStyle={mapStyle}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="map-screen-right-panel">
                            <div className="map-screen-form-container">
                                <HierarchyForm 
                                    hierarchyItems={currentHierarchy || []}
                                    itemTypes={currentFeatureTypes || []}
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
        </div>
    );
};

export default MapScreen;
