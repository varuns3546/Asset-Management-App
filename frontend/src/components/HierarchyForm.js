import { useState, useEffect } from 'react';

const HierarchyForm = ({ 
    hierarchyItems = [], 
    onSaveHierarchy, 
    onUpdateItems 
}) => {
    const [formData, setFormData] = useState({
        items: []
    });
    const [newItem, setNewItem] = useState({
        title: '',
        itemType: '',
        parentId: null
    });

    // Update form when hierarchy data changes from parent
    useEffect(() => {
        if (hierarchyItems && Array.isArray(hierarchyItems)) {
            setFormData({
                items: hierarchyItems
            });
        } else if (hierarchyItems && hierarchyItems.length === 0) {
            // Handle empty array case
            setFormData({
                items: []
            });
        }
    }, [hierarchyItems]);

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
            item_type: newItem.itemType,
            parent_item_id: newItem.parentId || null
        };

        console.log('New item created:', itemToAdd);

        setFormData(prev => {
            const updatedItems = [...prev.items, itemToAdd];
            console.log('Updated items:', updatedItems);
            return {
                ...prev,
                items: updatedItems
            };
        });

        // Notify parent component of the change
        if (onUpdateItems) {
            const updatedItems = [...formData.items, itemToAdd];
            onUpdateItems(updatedItems);
        }

        setNewItem({
            title: '',
            itemType: '',
            parentId: newItem.parentId
        });
    }

    const handleRemoveItem = (itemId) => {
        setFormData(prev => {
            const updatedItems = prev.items.filter(item => item.id !== itemId);
            return {
                ...prev,
                items: updatedItems
            };
        });

        // Notify parent component of the change
        if (onUpdateItems) {
            const updatedItems = formData.items.filter(item => item.id !== itemId);
            onUpdateItems(updatedItems);
        }
    }

    const handleSaveHierarchy = () => {
        if (onSaveHierarchy) {
            onSaveHierarchy(formData.items);
        }
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
                    />
                    <select
                        id="itemType"
                        name="itemType"
                        value={newItem.itemType}
                        onChange={handleNewItemChange}
                        className="form-select"
                    >
                        <option value="">Select item type</option>
                        <option value="asset">Asset</option>
                        <option value="location">Location</option>
                        <option value="department">Department</option>
                        <option value="category">Category</option>
                        <option value="subcategory">Subcategory</option>
                        <option value="item">Item</option>
                    </select>
                    <select
                        id="parentId"
                        name="parentId"
                        value={newItem.parentId}
                        onChange={handleNewItemChange}
                        className="form-select"
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
                            >
                                Remove
                            </button>
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="form-actions">
                <button onClick={handleSaveHierarchy} className="save-button">
                    Save Hierarchy
                </button>
            </div>
        </div>
    )
}

export default HierarchyForm;