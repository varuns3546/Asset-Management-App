import { useState, useEffect, useRef } from 'react';
import '../../styles/structureScreen.css'
const ItemTypeForm = ({ 
    itemTypes,
    onSaveItemTypes,
    onUpdateItemTypes,
    isLoading = false,
    isSaving = false
}) => {
    const [formData, setFormData] = useState({
        itemTypes: itemTypes
    });
    const [newItemType, setNewItemType] = useState({
        title: '',
        description: '',
        parent_ids: []
    });

    const [parentDropdowns, setParentDropdowns] = useState([{ id: 1, value: '' }]);

    const [multipleChildrenChecked, setMultipleChildrenChecked] = useState(false);

    const hasLoadedInitialData = useRef(false);

    useEffect(() => {
        if  (itemTypes && Array.isArray(itemTypes) && itemTypes.length > 0 && !hasLoadedInitialData.current && formData.itemTypes.length === 0) {
            setFormData({ itemTypes: itemTypes });
            hasLoadedInitialData.current = true;
        }
    }, [itemTypes, formData.itemTypes.length]);

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

    const handleAddItemType = () => {
        if (!newItemType.title.trim()) {
            alert('Please enter an item type title');
            return;
        }

        // Collect selected parent IDs from dropdowns
        const selectedParentIds = parentDropdowns
            .map(dropdown => dropdown.value)
            .filter(value => value !== '');

        const itemTypeToAdd = {
            id: Date.now().toString(), // Temporary ID for frontend
            title: newItemType.title,
            description: newItemType.description,
            parent_ids: selectedParentIds
        };

        setFormData(prev => {
            const updatedItemTypes = [...prev.itemTypes, itemTypeToAdd];
            
            // Use setTimeout to avoid setState during render
            setTimeout(() => {
                if (onUpdateItemTypes) {
                    onUpdateItemTypes(updatedItemTypes);
                }
            }, 0);
            
            return {
                ...prev,
                itemTypes: updatedItemTypes
            };
        });

        setNewItemType({
            title: '',
            description: '',
            parent_ids: []
        });

        // Reset parent dropdowns to single empty dropdown
        setParentDropdowns([{ id: 1, value: '' }]);
    }

    const handleRemoveItemType = (itemTypeId) => {
        setFormData(prev => {
            const updatedItemTypes = prev.itemTypes.filter(itemType => itemType.id !== itemTypeId);
            
            // Use setTimeout to avoid setState during render
            setTimeout(() => {
                if (onUpdateItemTypes) {
                    onUpdateItemTypes(updatedItemTypes);
                }
            }, 0);
            
            return {
                ...prev,
                itemTypes: updatedItemTypes
            };
        });
    }

    const handleMultipleChildrenChecked = () => {
        setMultipleChildrenChecked(!multipleChildrenChecked);
    }

    return (
        <div className="hierarchy-edit-form">
            <div className="form-group">
                <label htmlFor="newItemTypeTitle">Add New Item Type</label>
                <div className="add-item-form">
                    <input
                        type="text"
                        id="itemTypeTitle"
                        name="title"
                        value={newItemType.title}
                        onChange={handleNewItemTypeChange}
                        placeholder="Enter item title"
                        className="form-input"
                        disabled={isLoading}
                    />
                    <div className="parent-dropdowns-container">
                        <label className="parent-dropdowns-label">Select Parent(s):</label>
                        {parentDropdowns.map((dropdown, index) => (
                            <div key={dropdown.id} className="parent-dropdown-row">
                                <select
                                    value={dropdown.value}
                                    onChange={(e) => handleParentDropdownChange(dropdown.id, e.target.value)}
                                    className="form-select parent-dropdown"
                                    disabled={isLoading}
                                >
                                    <option value="">No parent (root item)</option>
                                    {formData.itemTypes.map(itemType => (
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
                                        disabled={isLoading}
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
                            disabled={isLoading}
                        >
                            + Add Another Parent
                        </button>
                    </div>
                    <button onClick={handleAddItemType} className="add-button">
                        Add Item
                    </button>
                    <div className="checkbox-container">
                        <input
                            type="checkbox"
                            id="multipleChildrenCheckbox"
                            checked={multipleChildrenChecked}
                            onChange={handleMultipleChildrenChecked}
                            className="tree-checkbox"
                        />
                        <label htmlFor="multipleChildrenCheckbox">Items can have multiple types of children</label>

                    </div>
                </div>
            </div>

            <div className="form-group">
                <label>Current Item Types</label>
                <div className="items-list">
                    {formData.itemTypes.map(itemType => (
                        <div key={itemType.id} className="item-row">
                            <span className="item-title">{itemType.title}</span>
                            <button 
                                onClick={() => handleRemoveItemType(itemType.id)}
                                className="remove-button"
                                disabled={isLoading}
                            >
                                Remove
                            </button>
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="form-actions">
                <button onClick={() => onSaveItemTypes(formData.itemTypes)} className="save-button">
                    Save Item Types
                </button>
            </div>
        </div>
    )
}

export default ItemTypeForm;