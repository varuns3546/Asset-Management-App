import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createHierarchyItemType, updateHierarchyItemType, deleteHierarchyItemType, getHierarchy } from '../../features/projects/projectSlice';
import '../../styles/structureScreen.css'

const ItemTypeForm = ({ 
    itemTypes,
    selectedItem = null,
    onItemSelect = null
}) => {
    const dispatch = useDispatch();
    const { selectedProject, currentItemTypes } = useSelector((state) => state.projects);
    const [newItemType, setNewItemType] = useState({
        title: '',
        description: '',
        parent_ids: [],
        attributes: []
    });

    const [parentDropdowns, setParentDropdowns] = useState([{ id: 1, value: '' }]);
    const [attributes, setAttributes] = useState([{ id: 1, value: '' }]);
    const [hasCoordinates, setHasCoordinates] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // Update form when selectedItem changes
    useEffect(() => {
        console.log('ItemTypeForm selectedItem changed:', selectedItem);
        if (selectedItem) {
            setNewItemType({
                title: selectedItem.title || '',
                description: selectedItem.description || '',
                parent_ids: selectedItem.parent_ids || [],
                attributes: []
            });
            
            // Set up parent dropdowns
            if (selectedItem.parent_ids && selectedItem.parent_ids.length > 0) {
                const parentDropdownsData = selectedItem.parent_ids.map((parentId, index) => ({
                    id: index + 1,
                    value: parentId
                }));
                setParentDropdowns(parentDropdownsData);
            } else {
                setParentDropdowns([{ id: 1, value: '' }]);
            }
            
            // TODO: Load existing attributes for this item type
            setAttributes([{ id: 1, value: '' }]);
            setHasCoordinates(selectedItem.has_coordinates || false);
            setIsEditing(true);
        } else {
            setNewItemType({
                title: '',
                description: '',
                parent_ids: [],
                attributes: []
            });
            setParentDropdowns([{ id: 1, value: '' }]);
            setAttributes([{ id: 1, value: '' }]);
            setHasCoordinates(false);
            setIsEditing(false);
        }
    }, [selectedItem]);

    const handleNewItemTypeChange = (e) => {
        setNewItemType(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }))
    }

    const handleParentDropdownChange = (dropdownId, selectedValue) => {
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

    const handleAttributeChange = (attributeId, value) => {
        setAttributes(prev => 
            prev.map(attr => 
                attr.id === attributeId 
                    ? { ...attr, value: value }
                    : attr
            )
        );
    }

    const addAnotherAttribute = () => {
        const newId = Math.max(...attributes.map(a => a.id)) + 1;
        setAttributes(prev => [...prev, { id: newId, value: '' }]);
    }

    const removeAttribute = (attributeId) => {
        if (attributes.length > 1) {
            setAttributes(prev => prev.filter(attr => attr.id !== attributeId));
        }
    }

    const handleAddItemType = async () => {
        if (!newItemType.title.trim()) {
            alert('Please enter an item type title');
            return;
        }
        // Collect selected parent IDs from dropdowns
        const selectedParentIds = parentDropdowns
            .map(dropdown => dropdown.value)
            .filter(value => value !== '');

        // Collect attribute values
        const attributeValues = attributes
            .map(attr => attr.value)
            .filter(value => value.trim() !== '');

        const itemTypeData = {
            name: newItemType.title,
            description: newItemType.description,
            parent_ids: selectedParentIds,
            attributes: attributeValues,
            has_coordinates: hasCoordinates
        };

        try {
            let result;
            if (isEditing && selectedItem) {
                // Update existing item type
                console.log('Updating item type with data:', itemTypeData);
                console.log('Attributes being sent:', attributeValues);
                result = await dispatch(updateHierarchyItemType({
                    projectId: selectedProject.id,
                    itemTypeId: selectedItem.id,
                    itemTypeData
                })).unwrap();
                
                // Clear selection after successful update
                if (onItemSelect) {
                    onItemSelect(null);
                }
                console.log('Item type updated successfully:', result);
            } else {
                // Create new item type
                console.log('Creating item type with data:', itemTypeData);
                console.log('Attributes being sent:', attributeValues);
                result = await dispatch(createHierarchyItemType({
                    projectId: selectedProject.id,
                    itemTypeData
                })).unwrap();
                console.log('Item type created successfully:', result);
            }

            // Reset form after successful creation/update
            setNewItemType({
                title: '',
                description: '',
                parent_ids: [],
                attributes: []
            });

            // Reset parent dropdowns to single empty dropdown
            setParentDropdowns([{ id: 1, value: '' }]);
            
            // Reset attributes to single empty attribute
            setAttributes([{ id: 1, value: '' }]);
            setHasCoordinates(false);
            setIsEditing(false);
        } catch (error) {
            console.error('Error creating/updating item type:', error);
            alert('Failed to create/update item type. Please try again.');
        }
    }

    const handleCancelEdit = () => {
        setNewItemType({
            title: '',
            description: '',
            parent_ids: [],
            attributes: []
        });
        setParentDropdowns([{ id: 1, value: '' }]);
        setAttributes([{ id: 1, value: '' }]);
        setHasCoordinates(false);
        setIsEditing(false);
        if (onItemSelect) {
            onItemSelect(null);
        }
    }

    const handleRemoveItemType = async (itemTypeId) => {

        
        try {
            const result = await dispatch(deleteHierarchyItemType({
                projectId: selectedProject.id,
                itemTypeId
            })).unwrap();
            
        } catch (error) {
            alert('Failed to delete item type. Please try again.');
        }
    }
    
    return (
        <div className="form-group">
            <label htmlFor="newItemTypeTitle">
                {isEditing ? `Edit Item Type: ${selectedItem?.title}` : ''}
            </label>
            <div className="add-item-form">
                <input
                    type="text"
                    id="itemTypeTitle"
                    name="title"
                    value={newItemType.title}
                    onChange={handleNewItemTypeChange}
                    placeholder="Enter item title"
                    className="form-input"
                />
                <div className="form-group">
                    <label className="form-label">Select Parent(s):</label>
                    {parentDropdowns.map((dropdown, index) => (
                        <div key={dropdown.id} className="parent-dropdown-row">
                            <select
                                value={dropdown.value}
                                onChange={(e) => handleParentDropdownChange(dropdown.id, e.target.value)}
                                className="form-select parent-dropdown"
                            >
                                <option value="">No parent (root item)</option>
                                {currentItemTypes?.filter(itemType => itemType.id !== selectedItem?.id).map(itemType => (
                                    <option key={itemType.id} value={itemType.id}>
                                        {itemType.title}
                                    </option>
                                ))}
                            </select>
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
                    ))}
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
                        <div key={attribute.id} className="parent-dropdown-row">
                            <input
                                type="text"
                                value={attribute.value}
                                onChange={(e) => handleAttributeChange(attribute.id, e.target.value)}
                                placeholder={`Attribute ${index + 1}`}
                                className="form-input parent-dropdown"
                            />
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
                
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={handleAddItemType} className="add-button">
                        {isEditing ? 'Update Item Type' : 'Add Item Type'}
                    </button>
                    {isEditing && (
                        <button onClick={handleCancelEdit} className="btn btn-secondary">
                            Cancel
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

export default ItemTypeForm;