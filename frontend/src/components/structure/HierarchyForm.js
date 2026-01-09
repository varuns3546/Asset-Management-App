import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createFeature, updateFeature, getHierarchy } from '../../features/projects/projectSlice';
import FormField from '../forms/FormField';
import ButtonGroup from '../forms/ButtonGroup';
import ErrorMessage from '../forms/ErrorMessage';
import { validateHierarchyCoordinates } from '../../utils/coordinateValidator';
import { useFormState } from '../../hooks/useFormReset';
import '../../styles/structureScreen.css';

const HierarchyForm = ({ 
    hierarchyItems, 
    itemTypes = [],
    selectedItem = null,
    onItemSelect = null
}) => {
    const dispatch = useDispatch();
    const { selectedProject, currentHierarchy } = useSelector((state) => state.projects);
    const initialState = {
        title: '',
        asset_type_id: null,
        parent_id: null,
        beginning_latitude: '',
        end_latitude: '',
        beginning_longitude: '',
        end_longitude: ''
    };
    const [newItem, setNewItem, resetForm] = useFormState(initialState);
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState('');

    // Update form when selectedItem changes
    useEffect(() => {
        if (selectedItem) {
            setNewItem({
                title: selectedItem.title || '',
                asset_type_id: selectedItem.asset_type_id || null,
                parent_id: selectedItem.parent_id || null,
                beginning_latitude: selectedItem.beginning_latitude || '',
                end_latitude: selectedItem.end_latitude || '',
                beginning_longitude: selectedItem.beginning_longitude || '',
                end_longitude: selectedItem.end_longitude || ''
            });
            setIsEditing(true);
        } else {
            resetForm();
            setIsEditing(false);
        }
    }, [selectedItem]);

    const handleNewItemChange = (e) => {
        const { name, value } = e.target;
        
        // If asset_type_id changes, clear coordinates if new item type doesn't have geometry
        if (name === 'asset_type_id') {
            const selectedItemType = itemTypes.find(type => type.id === value);
            const hasGeometry = selectedItemType?.geometry_type && selectedItemType.geometry_type !== 'no_geometry';
            setNewItem(prev => ({
                ...prev,
                [name]: value,
                beginning_latitude: hasGeometry ? prev.beginning_latitude : '',
                end_latitude: hasGeometry ? prev.end_latitude : '',
                beginning_longitude: hasGeometry ? prev.beginning_longitude : '',
                end_longitude: hasGeometry ? prev.end_longitude : ''
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
        setError('');
        
        if (!newItem.title.trim()) {
            setError('Please enter an item title');
            return;
        }

        // Check if coordinates are valid (only validate fields that are filled)
        const selectedItemType = itemTypes.find(type => type.id === newItem.asset_type_id);
        const hasGeometry = selectedItemType?.geometry_type && selectedItemType.geometry_type !== 'no_geometry';
        if (hasGeometry) {
            const coordError = validateHierarchyCoordinates(newItem);
            if (coordError) {
                setError(coordError);
                return;
            }
        }

        // Store the current form data before clearing
        const itemData = {
            title: newItem.title,
            asset_type_id: newItem.asset_type_id || null,
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

            // Refresh hierarchy from server to ensure MapScreen sync picks up the new/updated asset
            await dispatch(getHierarchy(selectedProject.id));

            // Clear form fields AFTER successful save (keep parent selection for efficiency)
            setNewItem(prev => ({
                ...initialState,
                parent_id: currentParentId
            }));
            setIsEditing(false);

            // Clear selection after successful save
            if (onItemSelect) {
                onItemSelect(null);
            }
            setError('');
        } catch (error) {
            setError('Failed to create/update item. Please try again.');
        }
    }

    const handleCancelEdit = () => {
        resetForm();
        setIsEditing(false);
        setError('');
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
                <FormField
                    label=""
                    id="itemTitle"
                    type="text"
                    value={newItem.title}
                    onChange={handleNewItemChange}
                    placeholder="Enter item title"
                    inputProps={{ name: 'title' }}
                />
                <FormField
                    label=""
                    id="asset_type_id"
                    type="select"
                    value={newItem.asset_type_id || ''}
                    onChange={handleNewItemChange}
                    selectOptions={[
                        { value: '', label: 'No item type (optional)' },
                        ...itemTypes.map(itemType => ({
                            value: itemType.id,
                            label: itemType.title
                        }))
                    ]}
                    inputProps={{ name: 'asset_type_id' }}
                />
                <FormField
                    label=""
                    id="parent_id"
                    type="select"
                    value={newItem.parent_id || ''}
                    onChange={handleNewItemChange}
                    selectOptions={[
                        { value: '', label: 'No parent (root item)' },
                        ...(currentHierarchy?.filter(item => item.id !== selectedItem?.id).map(item => ({
                            value: item.id,
                            label: item.title
                        })) || [])
                    ]}
                    inputProps={{ name: 'parent_id' }}
                />
                
                {/* Coordinates fields - only show if item type has geometry */}
                {newItem.asset_type_id && (() => {
                    const selectedItemType = itemTypes.find(type => type.id === newItem.asset_type_id);
                    return selectedItemType?.geometry_type && selectedItemType.geometry_type !== 'no_geometry';
                })() && (
                    <div className="coordinates-section">
                        <label className="form-label">Coordinates:</label>
                        <div className="coordinates-inputs">
                            <FormField
                                label="Beginning Latitude"
                                id="beginning_latitude"
                                type="number"
                                value={newItem.beginning_latitude || ''}
                                onChange={handleNewItemChange}
                                placeholder="-90 to 90"
                                inputProps={{ name: 'beginning_latitude', step: 'any' }}
                                className="coordinate-field"
                            />
                            <FormField
                                label="End Latitude"
                                id="end_latitude"
                                type="number"
                                value={newItem.end_latitude || ''}
                                onChange={handleNewItemChange}
                                placeholder="-90 to 90"
                                inputProps={{ name: 'end_latitude', step: 'any' }}
                                className="coordinate-field"
                            />
                            <FormField
                                label="Beginning Longitude"
                                id="beginning_longitude"
                                type="number"
                                value={newItem.beginning_longitude || ''}
                                onChange={handleNewItemChange}
                                placeholder="-180 to 180"
                                inputProps={{ name: 'beginning_longitude', step: 'any' }}
                                className="coordinate-field"
                            />
                            <FormField
                                label="End Longitude"
                                id="end_longitude"
                                type="number"
                                value={newItem.end_longitude || ''}
                                onChange={handleNewItemChange}
                                placeholder="-180 to 180"
                                inputProps={{ name: 'end_longitude', step: 'any' }}
                                className="coordinate-field"
                            />
                        </div>
                    </div>
                )}
                
                <ErrorMessage message={error} />
                
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={handleAddItem} className="add-button">
                        {isEditing ? 'Update Item' : 'Add Item'}
                    </button>
                    {isEditing && (
                        <ButtonGroup
                            buttons={[
                                {
                                    label: 'Cancel',
                                    variant: 'secondary',
                                    onClick: handleCancelEdit
                                }
                            ]}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}

export default HierarchyForm;