import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createFeatureType, updateFeatureType, getFeatureTypes } from '../../features/projects/projectSlice';
import FormField from '../forms/FormField';
import '../../styles/structureScreen.css'
import { DEFAULT_ITEM_TYPE_ICON, ITEM_TYPE_COLOR_OPTIONS, getRandomUnusedStyle } from '../../constants/itemTypeIcons';

const AssetTypeForm = ({ 
    assetTypes,
    selectedAsset = null,
    onAssetSelect = null
}) => {
    const dispatch = useDispatch();
    const { selectedProject, currentFeatureTypes } = useSelector((state) => state.projects);
    const [newAssetType, setNewAssetType] = useState({
        title: '',
        description: '',
        parent_ids: [],
        attributes: []
    });

    const [parentDropdowns, setParentDropdowns] = useState([{ id: 1, value: '' }]);
    const [attributes, setAttributes] = useState([{ id: 1, value: '', type: 'text' }]);
    const [subTypes, setSubTypes] = useState([{ id: 1, value: '', existingId: null }]);
    const [selectedExistingSubTypes, setSelectedExistingSubTypes] = useState([]);
    const [existingSubTypeDropdown, setExistingSubTypeDropdown] = useState({ id: 1, value: '' });
    const [hasCoordinates, setHasCoordinates] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // Update form when selectedItem changes
    useEffect(() => {
        if (selectedAsset) {
            setNewAssetType({
                title: selectedAsset.title || '',
                description: selectedAsset.description || '',
                parent_ids: selectedAsset.parent_ids || [],
                attributes: []
            });
            
            // Set up parent dropdowns
            if (selectedAsset.parent_ids && selectedAsset.parent_ids.length > 0) {
                const parentDropdownsData = selectedAsset.parent_ids.map((parentId, index) => ({
                    id: index + 1,
                    value: parentId
                }));
                setParentDropdowns(parentDropdownsData);
            } else {
                setParentDropdowns([{ id: 1, value: '' }]);
            }
            
            
            // Load existing attributes for this item type
            if (selectedAsset.attributes && selectedAsset.attributes.length > 0) {
                const attributesData = selectedAsset.attributes.map((attr, index) => ({
                    id: index + 1,
                    value: typeof attr === 'string' ? attr : attr.title,
                    type: typeof attr === 'string' ? 'text' : (attr.type || 'text')
                }));
                setAttributes(attributesData);
            } else {
                setAttributes([{ id: 1, value: '', type: 'text' }]);
            }
            
            // Load existing sub-types for this asset type (using subtype_of_id)
            const existingSubTypes = assetTypes.filter(at => 
                at.subtype_of_id === selectedAsset.id
            );
            
            // Set selected existing sub-types
            setSelectedExistingSubTypes(existingSubTypes.map(st => st.id));
            setExistingSubTypeDropdown({ id: 1, value: '' }); // Reset dropdown
            
            if (existingSubTypes.length > 0) {
                const subTypesData = existingSubTypes.map((subType, index) => ({
                    id: index + 1,
                    value: subType.title || '',
                    existingId: subType.id
                }));
                setSubTypes(subTypesData);
            } else {
                setSubTypes([{ id: 1, value: '', existingId: null }]);
            }
            
            setHasCoordinates(selectedAsset.has_coordinates || false);
            setIsEditing(true);
        } else {
            setNewAssetType({
                title: '',
                description: '',
                parent_ids: [],
                attributes: []
            });
            setParentDropdowns([{ id: 1, value: '' }]);
            setAttributes([{ id: 1, value: '', type: 'text' }]);
            setSubTypes([{ id: 1, value: '', existingId: null }]);
            setSelectedExistingSubTypes([]);
            setExistingSubTypeDropdown({ id: 1, value: '' });
            setHasCoordinates(false);
            setIsEditing(false);
        }
    }, [selectedAsset, assetTypes]);

    const handleNewAssetTypeChange = (e) => {
        setNewAssetType(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }))
    }

    // Check if selecting a parent would create a circular reference
    const wouldCreateCircularReference = (parentId, currentItemId) => {
        if (!parentId || !currentItemId || parentId === currentItemId) {
            return true; // Self-reference
        }
        
        // Check if the parent has the current item as its ancestor
        const checkAncestors = (itemId, visited = new Set()) => {
            if (visited.has(itemId)) {
                return false; // Already checked this branch
            }
            visited.add(itemId);
            
            const item = assetTypes?.find(at => at.id === itemId);
            if (!item) {
                return false;
            }
            
            // If this item is the current item, we have a circular reference
            if (item.id === currentItemId) {
                return true;
            }
            
            // Check all parents of this item
            const parentIds = item.parent_ids || [];
            for (const pid of parentIds) {
                if (checkAncestors(pid, visited)) {
                    return true;
                }
            }
            
            return false;
        };
        
        return checkAncestors(parentId);
    }

    const handleParentDropdownChange = (dropdownId, selectedValue) => {
        // Validate that this selection won't create a circular reference
        if (selectedValue && selectedAsset) {
            if (wouldCreateCircularReference(selectedValue, selectedAsset.id)) {
                alert('Cannot select this parent as it would create a circular reference. An item cannot be its own ancestor.');
                return;
            }
        }
        
        setParentDropdowns(prev => 
            prev.map(dropdown => 
                dropdown.id === dropdownId 
                    ? { ...dropdown, value: selectedValue }
                    : dropdown
            )
        );
    }

    const addAnotherParent = () => {
        const newId = Math.max(...parentDropdowns.map(d => d.id)) + 1;
        setParentDropdowns(prev => [...prev, { id: newId, value: '' }]);
    }

    const removeParentDropdown = (dropdownId) => {
        if (parentDropdowns.length > 1) {
            setParentDropdowns(prev => prev.filter(dropdown => dropdown.id !== dropdownId));
        }
    }

    const handleAttributeChange = (attributeId, field, value) => {
        setAttributes(prev => 
            prev.map(attr => 
                attr.id === attributeId 
                    ? { ...attr, [field]: value }
                    : attr
            )
        );
    }

    const addAnotherAttribute = () => {
        const newId = Math.max(...attributes.map(a => a.id)) + 1;
        setAttributes(prev => [...prev, { id: newId, value: '', type: 'text' }]);
    }

    const removeAttribute = (attributeId) => {
        if (attributes.length > 1) {
            setAttributes(prev => prev.filter(attr => attr.id !== attributeId));
        }
    }

    const handleSubTypeChange = (subTypeId, value) => {
        setSubTypes(prev => 
            prev.map(st => 
                st.id === subTypeId 
                    ? { ...st, value: value }
                    : st
            )
        );
    }

    const addAnotherSubType = () => {
        const newId = Math.max(...subTypes.map(st => st.id), 0) + 1;
        setSubTypes(prev => [...prev, { id: newId, value: '', existingId: null }]);
    }

    const removeSubType = (subTypeId) => {
        const subType = subTypes.find(st => st.id === subTypeId);
        // If it's an existing sub-type, we might want to delete it, but for now just remove from list
        // The user can manually delete it from the tree if needed
        if (subTypes.length > 1) {
            setSubTypes(prev => prev.filter(st => st.id !== subTypeId));
        }
    }

    // Check if a type can be selected as a sub-type (not invalid)
    const canBeSubType = (typeId) => {
        if (!typeId || !assetTypes) return false;
        
        // Can't select self
        if (selectedAsset && typeId === selectedAsset.id) {
            return false;
        }
        
        // Can't select if it would create a circular reference
        if (selectedAsset && wouldCreateCircularReference(typeId, selectedAsset.id)) {
            return false;
        }
        
        // Can't select if it's already a sub-type of another type (unless editing that type)
        const type = assetTypes.find(at => at.id === typeId);
        if (type && type.subtype_of_id && (!selectedAsset || type.subtype_of_id !== selectedAsset.id)) {
            return false;
        }
        
        return true;
    }

    const handleExistingSubTypeDropdownChange = (dropdownId, selectedValue) => {
        setExistingSubTypeDropdown(prev => ({ ...prev, value: selectedValue }));
    }

    const addExistingSubType = () => {
        if (existingSubTypeDropdown.value && !selectedExistingSubTypes.includes(existingSubTypeDropdown.value)) {
            setSelectedExistingSubTypes(prev => [...prev, existingSubTypeDropdown.value]);
            setExistingSubTypeDropdown(prev => ({ ...prev, value: '' })); // Reset dropdown
        }
    }

    const removeExistingSubType = (typeId) => {
        setSelectedExistingSubTypes(prev => prev.filter(id => id !== typeId));
    }

    const handleAddAssetType = async () => {
        if (!newAssetType.title.trim()) {
            alert('Please enter an asset type title');
            return;
        }
        
        // Collect selected parent IDs from dropdowns
        const selectedParentIds = parentDropdowns
            .map(dropdown => dropdown.value)
            .filter(value => value !== '');

        // Collect attribute values with types
        const attributeValues = attributes
            .filter(attr => attr.value.trim() !== '')
            .map(attr => ({
                title: attr.value.trim(),
                type: attr.type || 'text'
            }));

        // Collect sub-type values (new ones to create)
        const newSubTypes = subTypes
            .filter(st => st.value.trim() !== '' && !st.existingId)
            .map(st => st.value.trim());

        // Get random unused style for new asset types, preserve existing for edits
        let icon, iconColor;
        if (isEditing && selectedAsset) {
            // Preserve existing icon and color when editing
            icon = selectedAsset.icon || DEFAULT_ITEM_TYPE_ICON;
            iconColor = selectedAsset.icon_color || ITEM_TYPE_COLOR_OPTIONS[0].value;
        } else {
            // Get random unused style for new asset types
            const randomStyle = getRandomUnusedStyle(assetTypes || []);
            icon = randomStyle.icon;
            iconColor = randomStyle.icon_color;
        }

        // Store the current form data before clearing
        const assetTypeData = {
            name: newAssetType.title,
            description: newAssetType.description,
            parent_ids: selectedParentIds,
            subtype_of_id: null, // Sub-types are created separately, not set here
            attributes: attributeValues,
            has_coordinates: hasCoordinates,
            icon: icon,
            icon_color: iconColor
        };

        // Clear form fields IMMEDIATELY for better UX
        setNewAssetType({
            title: '',
            description: '',
            parent_ids: [],
            attributes: []
        });

        // Reset parent dropdowns to single empty dropdown
        setParentDropdowns([{ id: 1, value: '' }]);
        
        // Reset attributes to single empty attribute
        setAttributes([{ id: 1, value: '', type: 'text' }]);
        setHasCoordinates(false);
        
        // Store the current asset type ID for creating sub-types
        let currentAssetTypeId = null;

        try {
            let result;
            if (isEditing && selectedAsset) {
                // Update existing feature type
                result = await dispatch(updateFeatureType({
                    projectId: selectedProject.id,
                    featureTypeId: selectedAsset.id,
                    featureTypeData: assetTypeData
                })).unwrap();
                
                currentAssetTypeId = selectedAsset.id;
                
                // Refresh the feature types list to get updated data (including icon and icon_color)
                await dispatch(getFeatureTypes(selectedProject.id));
                
                // Wait a moment for state to update before clearing selection
                await new Promise(resolve => setTimeout(resolve, 100));
            } else {
                // Create new feature type
                result = await dispatch(createFeatureType({
                    projectId: selectedProject.id,
                    featureTypeData: assetTypeData
                })).unwrap();
                
                currentAssetTypeId = result.data.id;
                
                // Refresh the feature types list to get the new feature type with attributes
                await dispatch(getFeatureTypes(selectedProject.id));
            }
            
            // Update selected existing types to be sub-types
            if (selectedExistingSubTypes.length > 0 && currentAssetTypeId) {
                for (const existingTypeId of selectedExistingSubTypes) {
                    try {
                        const existingType = assetTypes?.find(at => at.id === existingTypeId);
                        if (existingType) {
                            await dispatch(updateFeatureType({
                                projectId: selectedProject.id,
                                featureTypeId: existingTypeId,
                                featureTypeData: {
                                    name: existingType.title,
                                    description: existingType.description || '',
                                    parent_ids: existingType.parent_ids || [],
                                    subtype_of_id: currentAssetTypeId, // Set as sub-type
                                    attributes: existingType.attributes || [],
                                    has_coordinates: existingType.has_coordinates || false,
                                    icon: existingType.icon || DEFAULT_ITEM_TYPE_ICON,
                                    icon_color: existingType.icon_color || ITEM_TYPE_COLOR_OPTIONS[0].value
                                }
                            })).unwrap();
                        }
                    } catch (error) {
                        console.error(`Error updating existing type "${existingTypeId}" to sub-type:`, error);
                    }
                }
            }
            
            // Create new sub-types if any were specified
            if (newSubTypes.length > 0 && currentAssetTypeId) {
                for (const subTypeName of newSubTypes) {
                    try {
                        await dispatch(createFeatureType({
                            projectId: selectedProject.id,
                            featureTypeData: {
                                name: subTypeName,
                                description: '',
                                parent_ids: [],
                                subtype_of_id: currentAssetTypeId, // Set as sub-type of the newly created type
                                attributes: [],
                                has_coordinates: false,
                                icon: DEFAULT_ITEM_TYPE_ICON,
                                icon_color: ITEM_TYPE_COLOR_OPTIONS[0].value
                            }
                        })).unwrap();
                    } catch (error) {
                        console.error(`Error creating sub-type "${subTypeName}":`, error);
                    }
                }
            }
            
            // Refresh again to show the updated sub-types
            if ((selectedExistingSubTypes.length > 0 || newSubTypes.length > 0) && currentAssetTypeId) {
                await dispatch(getFeatureTypes(selectedProject.id));
            }
            
            setIsEditing(false);
            
            // Reset sub-types after successful save
            setSubTypes([{ id: 1, value: '', existingId: null }]);
            setSelectedExistingSubTypes([]);
            setExistingSubTypeDropdown({ id: 1, value: '' });
            
            // Clear selection if updating
            if (isEditing && selectedAsset && onAssetSelect) {
                onAssetSelect(null);
            }
        } catch (error) {
            console.error('Error creating/updating asset type:', error);
            alert('Failed to create/update asset type. Please try again.');
            
            // Restore form data if there was an error (optional - you might want to keep the form clear)
            // setNewItemType({
            //     title: assetTypeData.name,
            //     description: assetTypeData.description,
            //     parent_ids: assetTypeData.parent_ids,
            //     attributes: assetTypeData.attributes
            // });
            // setHasCoordinates(assetTypeData.has_coordinates);
        }
    }

    const handleCancelEdit = () => {
        setNewAssetType({
            title: '',
            description: '',
            parent_ids: [],
            attributes: []
        });
        setParentDropdowns([{ id: 1, value: '' }]);
        setAttributes([{ id: 1, value: '', type: 'text' }]);
        setSubTypes([{ id: 1, value: '', existingId: null }]);
        setHasCoordinates(false);
        setIsEditing(false);
        if (onAssetSelect) {
            onAssetSelect(null);
        }
    }

    const handleAddSubType = () => {
        if (!selectedAsset) {
            return;
        }
        
        // Add a new sub-type input to the list
        const newId = Math.max(...subTypes.map(st => st.id), 0) + 1;
        setSubTypes(prev => [...prev, { id: newId, value: '', existingId: null }]);
    }

    
    return (
        <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '10px' }}>
                <label htmlFor="newAssetTypeTitle" style={{ margin: 0 }}>
                    {isEditing ? `Edit Asset Type: ${selectedAsset?.title}` : 'Create New Asset Type'}
                </label>
            </div>
            <div className="add-item-form">
                <FormField
                    label=""
                    id="assetTypeTitle"
                    type="text"
                    value={newAssetType.title}
                    onChange={handleNewAssetTypeChange}
                    placeholder={parentDropdowns.some(d => d.value)
                        ? `Enter child type name`
                        : "Enter asset type name (e.g., Location, Position)"}
                    inputProps={{ name: 'title' }}
                />
                
                <div className="form-group">
                    <label className="form-label">
                        Select Parent(s): 
                        {parentDropdowns.some(d => d.value) && (
                            <span style={{ color: '#28a745', fontSize: '12px', marginLeft: '8px' }}>
                                (Creating child type)
                            </span>
                        )}
                    </label>
                    {parentDropdowns.map((dropdown, index) => {
                        const selectedParent = assetTypes?.find(at => at.id === dropdown.value);
                        return (
                            <div key={dropdown.id} className="parent-dropdown-row">
                                <select
                                    value={dropdown.value}
                                    onChange={(e) => handleParentDropdownChange(dropdown.id, e.target.value)}
                                    className="form-select parent-dropdown"
                                >
                                    <option value="">No parent (root item)</option>
                                    {(assetTypes || []).filter(assetType => {
                                        // Don't allow self-reference
                                        if (assetType.id === selectedAsset?.id) {
                                            return false;
                                        }
                                        // Don't allow circular references when editing
                                        if (selectedAsset && wouldCreateCircularReference(assetType.id, selectedAsset.id)) {
                                            return false;
                                        }
                                        return true;
                                    }).map(assetType => {
                                        // Show hierarchy depth if it has parents
                                        const hasParents = assetType.parent_ids && assetType.parent_ids.length > 0;
                                        const indent = hasParents ? '  └─ ' : '';
                                        return (
                                            <option key={assetType.id} value={assetType.id}>
                                                {indent}{assetType.title}
                                            </option>
                                        );
                                    })}
                                </select>
                                {selectedParent && (
                                    <span style={{ 
                                        fontSize: '12px', 
                                        color: '#6c757d', 
                                        marginLeft: '8px',
                                        fontStyle: 'italic'
                                    }}>
                                        Sub-type of: {selectedParent.title}
                                    </span>
                                )}
                                {parentDropdowns.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeParentDropdown(dropdown.id)}
                                        className="remove-parent-button"
                                        title="Remove this parent selection"
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                        );
                    })}
                    <button
                        type="button"
                        onClick={addAnotherParent}
                        className="add-parent-button"
                    >
                        + Add Parent
                    </button>
                </div>
                
                {/* Coordinates Checkbox */}
                <div className="checkbox-container">
                    <input
                        type="checkbox"
                        id="hasCoordinates"
                        checked={hasCoordinates}
                        onChange={(e) => setHasCoordinates(e.target.checked)}
                        className="checkbox"
                    />
                    <label className="checkbox-label">Has coordinates</label>
                </div>
                
                {/* Attributes Section */}
                <div className="form-group">
                    <label className="form-label">Attributes:</label>
                    {attributes.map((attribute, index) => (
                        <div key={attribute.id} className="attribute-row">
                            <input
                                type="text"
                                value={attribute.value}
                                onChange={(e) => handleAttributeChange(attribute.id, 'value', e.target.value)}
                                placeholder={`Attribute ${index + 1}`}
                                className="form-input attribute-name-input"
                            />
                            <select
                                value={attribute.type || 'text'}
                                onChange={(e) => handleAttributeChange(attribute.id, 'type', e.target.value)}
                                className="form-select attribute-type-select"
                            >
                                <option value="text">Text</option>
                                <option value="number">Number</option>
                                <option value="photos">Photos</option>
                            </select>
                            {attributes.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => removeAttribute(attribute.id)}
                                    className="remove-parent-button"
                                    title="Remove this attribute"
                                >
                                    ×
                                </button>
                            )}
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={addAnotherAttribute}
                        className="add-parent-button"
                    >
                        + Add Attribute
                    </button>
                </div>
                
                {/* Sub-Types Section - Show when creating or editing */}
                <div className="form-group">
                    <label className="form-label">Sub-Types:</label>
                    
                    {/* Select Existing Types as Sub-Types */}
                    <div style={{ marginBottom: '15px' }}>
                        <label className="form-label" style={{ fontSize: '13px', marginBottom: '5px', display: 'block' }}>
                            Select Existing Types as Sub-Types:
                        </label>
                        <div className="parent-dropdown-row">
                            <select
                                value={existingSubTypeDropdown.value}
                                onChange={(e) => handleExistingSubTypeDropdownChange(existingSubTypeDropdown.id, e.target.value)}
                                className="form-select parent-dropdown"
                            >
                                <option value="">-- Select an existing type --</option>
                                {(assetTypes || []).filter(assetType => {
                                    // Filter out invalid types and already selected types
                                    return canBeSubType(assetType.id) && !selectedExistingSubTypes.includes(assetType.id);
                                }).map(assetType => (
                                    <option key={assetType.id} value={assetType.id}>
                                        {assetType.title}
                                        {assetType.subtype_of_id && (
                                            ` (currently sub-type of ${assetTypes.find(at => at.id === assetType.subtype_of_id)?.title || 'Unknown'})`
                                        )}
                                    </option>
                                ))}
                            </select>
                            <button
                                type="button"
                                onClick={addExistingSubType}
                                className="add-parent-button"
                                disabled={!existingSubTypeDropdown.value}
                            >
                                Add
                            </button>
                        </div>
                        {selectedExistingSubTypes.length > 0 && (
                            <div style={{ marginTop: '10px' }}>
                                {selectedExistingSubTypes.map(typeId => {
                                    const type = assetTypes?.find(at => at.id === typeId);
                                    return type ? (
                                        <div key={typeId} className="parent-dropdown-row" style={{ marginBottom: '5px' }}>
                                            <span className="form-input parent-dropdown" style={{ backgroundColor: '#f0f0f0', cursor: 'default' }}>
                                                {type.title}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => removeExistingSubType(typeId)}
                                                className="remove-parent-button"
                                                title="Remove this sub-type"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ) : null;
                                })}
                            </div>
                        )}
                        <p style={{ fontSize: '11px', color: '#666', marginTop: '5px' }}>
                            Invalid types (self, circular references, already sub-types) are filtered out.
                        </p>
                    </div>
                    
                    {/* Create New Sub-Types */}
                    <div style={{ marginTop: '15px' }}>
                        <label className="form-label" style={{ fontSize: '13px', marginBottom: '5px', display: 'block' }}>
                            Or Create New Sub-Types:
                        </label>
                        {subTypes.map((subType, index) => (
                            <div key={subType.id} className="parent-dropdown-row">
                                <input
                                    type="text"
                                    value={subType.value}
                                    onChange={(e) => handleSubTypeChange(subType.id, e.target.value)}
                                    placeholder={subType.existingId ? `Sub-Type ${index + 1} (existing)` : `Sub-Type ${index + 1}`}
                                    className="form-input parent-dropdown"
                                    disabled={!!subType.existingId}
                                    style={subType.existingId ? { backgroundColor: '#f0f0f0', cursor: 'not-allowed' } : {}}
                                />
                                {subTypes.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeSubType(subType.id)}
                                        className="remove-parent-button"
                                        title={subType.existingId ? "Existing sub-types cannot be removed here. Delete from tree if needed." : "Remove this sub-type"}
                                        disabled={!!subType.existingId}
                                        style={subType.existingId ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={addAnotherSubType}
                            className="add-parent-button"
                        >
                            + Add Sub-Type
                        </button>
                        <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                            {subTypes.some(st => st.existingId) 
                                ? 'Existing sub-types are shown in gray. Add new sub-types below.' 
                                : isEditing && selectedAsset
                                ? 'Enter sub-type names. They will be created when you save.'
                                : 'Enter sub-type names for this new type. They will be created when you save.'}
                        </p>
                    </div>
                </div>
                
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={handleAddAssetType} className="add-button">
                        {isEditing ? 'Update Asset Type' : 'Add Asset Type'}
                    </button>
                    {isEditing && (
                        <button 
                            onClick={handleCancelEdit} 
                            style={{
                                backgroundColor: '#6c757d',
                                color: '#ffffff',
                                border: '1px solid #6c757d',
                                padding: '10px 20px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '500',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.backgroundColor = '#5a6268';
                                e.target.style.borderColor = '#5a6268';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.backgroundColor = '#6c757d';
                                e.target.style.borderColor = '#6c757d';
                            }}
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

export default AssetTypeForm;