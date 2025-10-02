import { useState, useEffect, useRef } from 'react';
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
        parent_id: ''
    });
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

    const handleAddItemType = () => {
        if (!newItemType.title.trim()) {
            alert('Please enter an item type title');
            return;
        }

        const itemTypeToAdd = {
            id: Date.now().toString(), // Temporary ID for frontend
            title: newItemType.title,
            description: newItemType.description,
            parent_id: newItemType.parent_id || null
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
            parent_id: ''
        });
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
                    <select
                        id="parentId"
                        name="parent_id"
                        value={newItemType.parent_id || ''}
                        onChange={handleNewItemTypeChange}
                        className="form-select"
                        disabled={isLoading}
                    >
                        <option value="">No parent (root item)</option>
                        {formData.itemTypes.map(itemType=> (
                            <option key={itemType.id} value={itemType.id}>
                                {itemType.title}
                            </option>
                        ))}
                    </select>
                    <button onClick={handleAddItemType} className="add-button">
                        Add Item
                    </button>
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