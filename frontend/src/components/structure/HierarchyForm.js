import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createHierarchyItem, updateHierarchyItem, deleteHierarchyItem } from '../../features/projects/projectSlice';

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
        coordinates: {
            latitude: '',
            longitude: ''
        }
    });
    const [isEditing, setIsEditing] = useState(false);

    // Update form when selectedItem changes
    useEffect(() => {
        console.log('HierarchyForm selectedItem changed:', selectedItem);
        if (selectedItem) {
            setNewItem({
                title: selectedItem.title || '',
                item_type_id: selectedItem.item_type_id || null,
                parent_id: selectedItem.parent_id || null,
                coordinates: selectedItem.coordinates || {
                    latitude: '',
                    longitude: ''
                }
            });
            setIsEditing(true);
        } else {
            setNewItem({
                title: '',
                item_type_id: null,
                parent_id: null,
                coordinates: {
                    latitude: '',
                    longitude: ''
                }
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
                coordinates: selectedItemType?.has_coordinates ? prev.coordinates : {
                    latitude: '',
                    longitude: ''
                }
            }));
        } else {
            setNewItem(prev => ({
                ...prev,
                [name]: value
            }));
        }
    }

    const handleCoordinateChange = (coordinateType, value) => {
        setNewItem(prev => ({
            ...prev,
            coordinates: {
                ...prev.coordinates,
                [coordinateType]: value
            }
        }))
    }

    const handleAddItem = async () => {
        if (!newItem.title.trim()) {
            alert('Please enter an item title');
            return;
        }

        // Check if coordinates are required and valid
        const selectedItemType = itemTypes.find(type => type.id === newItem.item_type_id);
        if (selectedItemType?.has_coordinates) {
            const lat = parseFloat(newItem.coordinates.latitude);
            const lng = parseFloat(newItem.coordinates.longitude);
            
            if (isNaN(lat) || isNaN(lng)) {
                alert('Please enter valid coordinates (latitude and longitude must be numbers)');
                return;
            }
            
            if (lat < -90 || lat > 90) {
                alert('Latitude must be between -90 and 90 degrees');
                return;
            }
            
            if (lng < -180 || lng > 180) {
                alert('Longitude must be between -180 and 180 degrees');
                return;
            }
        }

        const itemData = {
            title: newItem.title,
            item_type_id: newItem.item_type_id || null,
            parent_id: newItem.parent_id || null,
            coordinates: selectedItemType?.has_coordinates ? 
                (newItem.coordinates.latitude && newItem.coordinates.longitude ? 
                    {
                        latitude: parseFloat(newItem.coordinates.latitude),
                        longitude: parseFloat(newItem.coordinates.longitude)
                    } : null) : null
        };

        try {
            if (isEditing && selectedItem) {
                // Update existing item
                await dispatch(updateHierarchyItem({
                    projectId: selectedProject.id,
                    itemId: selectedItem.id,
                    itemData
                })).unwrap();
                
                // Clear selection after successful update
                if (onItemSelect) {
                    onItemSelect(null);
                }
            } else {
                // Create new item
                await dispatch(createHierarchyItem({
                    projectId: selectedProject.id,
                    itemData
                })).unwrap();
            }

            // Reset form after successful creation/update
            setNewItem({
                title: '',
                item_type_id: null,
                parent_id: newItem.parent_id || null,
                coordinates: {
                    latitude: '',
                    longitude: ''
                }
            });
            setIsEditing(false);
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
            coordinates: {
                latitude: '',
                longitude: ''
            }
        });
        setIsEditing(false);
        if (onItemSelect) {
            onItemSelect(null);
        }
    }

    const handleRemoveItem = async (itemId) => {
        try {
            await dispatch(deleteHierarchyItem({
                projectId: selectedProject.id,
                itemId
            })).unwrap();
        } catch (error) {
            alert('Failed to delete item. Please try again.');
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
                            <input
                                type="number"
                                step="any"
                                value={newItem.coordinates.latitude}
                                onChange={(e) => handleCoordinateChange('latitude', e.target.value)}
                                placeholder="Latitude"
                                className="form-input"
                            />
                            <input
                                type="number"
                                step="any"
                                value={newItem.coordinates.longitude}
                                onChange={(e) => handleCoordinateChange('longitude', e.target.value)}
                                placeholder="Longitude"
                                className="form-input"
                            />
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