import { useState, useEffect, useRef } from 'react';
const HierarchyForm = ({ 
    hierarchyItems, 
    itemTypes = [],
    onSaveHierarchy,
    onUpdateItems,
    isLoading = false,
    isSaving = false
}) => {
    const [formData, setFormData] = useState({
        items: hierarchyItems
    });
    const [newItem, setNewItem] = useState({
        title: '',
        item_type_id: null,
        parent_id: null
    });
    const hasLoadedInitialData = useRef(false);

    // Update formData when hierarchyItems loads (only when there's actual data and form is empty)
    useEffect(() => {
        if (hierarchyItems && Array.isArray(hierarchyItems) && hierarchyItems.length > 0 && !hasLoadedInitialData.current && formData.items.length === 0) {
            setFormData({ items: hierarchyItems });
            hasLoadedInitialData.current = true;
        }
    }, [hierarchyItems, formData.items.length]);

    const handleNewItemChange = (e) => {
        setNewItem(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }))
    }

    const handleAddItem = () => {
        if (!newItem.title.trim()) {
            alert('Please enter an item title');
            return;
        }

        const itemToAdd = {
            id: Date.now().toString(), // Temporary ID for frontend
            title: newItem.title,
            item_type_id: newItem.item_type_id || null,
            parent_id: newItem.parent_id || null
        };

        setFormData(prev => {
            const updatedItems = [...prev.items, itemToAdd];
            
            // Notify parent component of the change for real-time tree updates
            if (onUpdateItems) {
                onUpdateItems(updatedItems);
            }
            
            return {
                ...prev,
                items: updatedItems
            };
        });

        setNewItem({
            title: '',
            item_type_id: null,
            parent_id: newItem.parent_id || null
        });
    }

    const handleRemoveItem = (itemId) => {
        setFormData(prev => {
            const updatedItems = prev.items.filter(item => item.id !== itemId);
            
            // Notify parent component of the change for real-time tree updates
            if (onUpdateItems) {
                onUpdateItems(updatedItems);
            }
            
            return {
                ...prev,
                items: updatedItems
            };
        });
    }

    return (
        <div className="hierarchy-edit-form">
            <div className="form-group">
                <label htmlFor="newItemTitle">Add New Item</label>
                <div className="add-item-form">
                    <input
                        type="text"
                        id="itemTitle"
                        name="title"
                        value={newItem.title}
                        onChange={handleNewItemChange}
                        placeholder="Enter item title"
                        className="form-input"
                        disabled={isLoading}
                    />
                    <select
                        id="item_type_id"
                        name="item_type_id"
                        value={newItem.item_type_id}
                        onChange={handleNewItemChange}
                        className="form-select"
                        disabled={isLoading}
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
                        value={newItem.parent_id}
                        onChange={handleNewItemChange}
                        className="form-select"
                        disabled={isLoading}
                    >
                        <option value="">No parent (root item)</option>
                        {formData.items.map(item => (
                            <option key={item.id} value={item.id}>
                                {item.title}
                            </option>
                        ))}
                    </select>
                    <button onClick={handleAddItem} className="add-button">
                        Add Item
                    </button>
                </div>
            </div>

            <div className="form-group">
                <label>Current Items</label>
                <div className="items-list">
                    {formData.items.map(item => (
                        <div key={item.id} className="item-row">
                            <span className="item-title">{item.title}</span>
                            <button 
                                onClick={() => handleRemoveItem(item.id)}
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
                <button onClick={() => onSaveHierarchy(formData.items)} className="save-button">
                    Save Hierarchy
                </button>
            </div>
        </div>
    )
}

export default HierarchyForm;