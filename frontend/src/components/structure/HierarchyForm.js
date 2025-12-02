import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createFeature, updateFeature } from '../../features/projects/projectSlice';
import '../../styles/structureScreen.css';

const HierarchyForm = ({ 
    hierarchyItems, 
    itemTypes = [],
    selectedItem = null,
    onItemSelect = null
}) => {
    const dispatch = useDispatch();
    const { selectedProject, currentHierarchy } = useSelector((state) => state.projects);
    const [newItem, setNewItem] = useState({
        title: '',
        item_type_id: null,
        parent_id: null,
        beginning_latitude: '',
        end_latitude: '',
        beginning_longitude: '',
        end_longitude: ''
    });
    const [isEditing, setIsEditing] = useState(false);

    // Update form when selectedItem changes
    useEffect(() => {
        if (selectedItem) {
            setNewItem({
                title: selectedItem.title || '',
                item_type_id: selectedItem.item_type_id || null,
                parent_id: selectedItem.parent_id || null,
                beginning_latitude: selectedItem.beginning_latitude || '',
                end_latitude: selectedItem.end_latitude || '',
                beginning_longitude: selectedItem.beginning_longitude || '',
                end_longitude: selectedItem.end_longitude || ''
            });
            setIsEditing(true);
        } else {
            setNewItem({
                title: '',
                item_type_id: null,
                parent_id: null,
                beginning_latitude: '',
                end_latitude: '',
                beginning_longitude: '',
                end_longitude: ''
            });
            setIsEditing(false);
        }
    }, [selectedItem]);

    const handleNewItemChange = (e) => {
        const { name, value } = e.target;
        
        // If item_type_id changes, clear coordinates if new item type doesn't have coordinates
        if (name === 'item_type_id') {
            const selectedItemType = itemTypes.find(type => type.id === value);
            setNewItem(prev => ({
                ...prev,
                [name]: value,
                beginning_latitude: selectedItemType?.has_coordinates ? prev.beginning_latitude : '',
                end_latitude: selectedItemType?.has_coordinates ? prev.end_latitude : '',
                beginning_longitude: selectedItemType?.has_coordinates ? prev.beginning_longitude : '',
                end_longitude: selectedItemType?.has_coordinates ? prev.end_longitude : ''
            }));
        } else {
            // For all other fields, including coordinates
            setNewItem(prev => ({
                ...prev,
                [name]: value
            }));
        }
    }

    const handleAddItem = async () => {
        if (!newItem.title.trim()) {
            alert('Please enter an item title');
            return;
        }

        // Check if coordinates are valid (only validate fields that are filled)
        const selectedItemType = itemTypes.find(type => type.id === newItem.item_type_id);
        if (selectedItemType?.has_coordinates) {
            // Validate filled coordinate fields
            if (newItem.beginning_latitude) {
                const beginLat = parseFloat(newItem.beginning_latitude);
                if (isNaN(beginLat)) {
                    alert('Beginning latitude must be a valid number');
                    return;
                }
                if (beginLat < -90 || beginLat > 90) {
                    alert('Beginning latitude must be between -90 and 90 degrees');
                    return;
                }
            }
            
            if (newItem.end_latitude) {
                const endLat = parseFloat(newItem.end_latitude);
                if (isNaN(endLat)) {
                    alert('End latitude must be a valid number');
                    return;
                }
                if (endLat < -90 || endLat > 90) {
                    alert('End latitude must be between -90 and 90 degrees');
                    return;
                }
            }
            
            if (newItem.beginning_longitude) {
                const beginLng = parseFloat(newItem.beginning_longitude);
                if (isNaN(beginLng)) {
                    alert('Beginning longitude must be a valid number');
                    return;
                }
                if (beginLng < -180 || beginLng > 180) {
                    alert('Beginning longitude must be between -180 and 180 degrees');
                    return;
                }
            }
            
            if (newItem.end_longitude) {
                const endLng = parseFloat(newItem.end_longitude);
                if (isNaN(endLng)) {
                    alert('End longitude must be a valid number');
                    return;
                }
                if (endLng < -180 || endLng > 180) {
                    alert('End longitude must be between -180 and 180 degrees');
                    return;
                }
            }
        }

        // Store the current form data before clearing
        const itemData = {
            title: newItem.title,
            item_type_id: newItem.item_type_id || null,
            parent_id: newItem.parent_id || null,
            beginning_latitude: newItem.beginning_latitude ? parseFloat(newItem.beginning_latitude) : null,
            end_latitude: newItem.end_latitude ? parseFloat(newItem.end_latitude) : null,
            beginning_longitude: newItem.beginning_longitude ? parseFloat(newItem.beginning_longitude) : null,
            end_longitude: newItem.end_longitude ? parseFloat(newItem.end_longitude) : null
        };

        // Store the current parent_id for form reset (keep parent selection for efficiency)
        const currentParentId = newItem.parent_id;

        try {
            if (isEditing && selectedItem) {
                // Update existing feature
                await dispatch(updateFeature({
                    projectId: selectedProject.id,
                    featureId: selectedItem.id,
                    featureData: itemData
                })).unwrap();
            } else {
                // Create new feature
                await dispatch(createFeature({
                    projectId: selectedProject.id,
                    featureData: itemData
                })).unwrap();
            }

            // Clear form fields AFTER successful save
            setNewItem({
                title: '',
                item_type_id: null,
                parent_id: currentParentId, // Keep parent selection for efficiency
                beginning_latitude: '',
                end_latitude: '',
                beginning_longitude: '',
                end_longitude: ''
            });
            setIsEditing(false);

            // Clear selection after successful save
            if (onItemSelect) {
                onItemSelect(null);
            }
        } catch (error) {
            console.error('Error creating/updating hierarchy item:', error);
            alert('Failed to create/update item. Please try again.');
        }
    }

    const handleCancelEdit = () => {
        setNewItem({
            title: '',
            item_type_id: null,
            parent_id: null,
            beginning_latitude: '',
            end_latitude: '',
            beginning_longitude: '',
            end_longitude: ''
        });
        setIsEditing(false);
        if (onItemSelect) {
            onItemSelect(null);
        }
    }


    return (
        <div className="form-group">
            <label htmlFor="newItemTitle">
                {isEditing ? `Edit Item: ${selectedItem?.title}` : ''}
            </label>
            <div className="add-item-form">
                <input
                    type="text"
                    id="itemTitle"
                    name="title"
                    value={newItem.title}
                    onChange={handleNewItemChange}
                    placeholder="Enter item title"
                    className="form-input"
                />
                <select
                    id="item_type_id"
                    name="item_type_id"
                    value={newItem.item_type_id || ''}
                    onChange={handleNewItemChange}
                    className="form-select"
                >
                    <option value="">No item type (optional)</option>
                    {itemTypes.map(itemType => (
                        <option key={itemType.id} value={itemType.id}>
                            {itemType.title}
                        </option>
                    ))}
                </select>
                <select
                    id="parent_id"
                    name="parent_id"
                    value={newItem.parent_id || ''}
                    onChange={handleNewItemChange}
                    className="form-select"
                >
                    <option value="">No parent (root item)</option>
                    {currentHierarchy?.filter(item => item.id !== selectedItem?.id).map(item => (
                        <option key={item.id} value={item.id}>
                            {item.title}
                        </option>
                    ))}
                </select>
                
                {/* Coordinates fields - only show if item type has coordinates */}
                {newItem.item_type_id && (() => {
                    const selectedItemType = itemTypes.find(type => type.id === newItem.item_type_id);
                    return selectedItemType?.has_coordinates;
                })() && (
                    <div className="coordinates-section">
                        <label className="form-label">Coordinates:</label>
                        <div className="coordinates-inputs">
                            <div className="coordinate-field">
                                <label htmlFor="beginning_latitude" className="coordinate-label">
                                    Beginning Latitude
                                </label>
                                <input
                                    id="beginning_latitude"
                                    name="beginning_latitude"
                                    type="number"
                                    step="any"
                                    value={newItem.beginning_latitude || ''}
                                    onChange={handleNewItemChange}
                                    placeholder="-90 to 90"
                                    className="form-input"
                                />
                            </div>
                            <div className="coordinate-field">
                                <label htmlFor="end_latitude" className="coordinate-label">
                                    End Latitude
                                </label>
                                <input
                                    id="end_latitude"
                                    name="end_latitude"
                                    type="number"
                                    step="any"
                                    value={newItem.end_latitude || ''}
                                    onChange={handleNewItemChange}
                                    placeholder="-90 to 90"
                                    className="form-input"
                                />
                            </div>
                            <div className="coordinate-field">
                                <label htmlFor="beginning_longitude" className="coordinate-label">
                                    Beginning Longitude
                                </label>
                                <input
                                    id="beginning_longitude"
                                    name="beginning_longitude"
                                    type="number"
                                    step="any"
                                    value={newItem.beginning_longitude || ''}
                                    onChange={handleNewItemChange}
                                    placeholder="-180 to 180"
                                    className="form-input"
                                />
                            </div>
                            <div className="coordinate-field">
                                <label htmlFor="end_longitude" className="coordinate-label">
                                    End Longitude
                                </label>
                                <input
                                    id="end_longitude"
                                    name="end_longitude"
                                    type="number"
                                    step="any"
                                    value={newItem.end_longitude || ''}
                                    onChange={handleNewItemChange}
                                    placeholder="-180 to 180"
                                    className="form-input"
                                />
                            </div>
                        </div>
                    </div>
                )}
                
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={handleAddItem} className="add-button">
                        {isEditing ? 'Update Item' : 'Add Item'}
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

export default HierarchyForm;