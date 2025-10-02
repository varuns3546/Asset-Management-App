import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createHierarchyItem, deleteHierarchyItem } from '../../features/projects/projectSlice';

const HierarchyForm = ({ 
    hierarchyItems, 
    itemTypes = []
}) => {
    const dispatch = useDispatch();
    const { selectedProject, currentHierarchy } = useSelector((state) => state.projects);
    const [newItem, setNewItem] = useState({
        title: '',
        item_type_id: null,
        parent_id: null
    });

    const handleNewItemChange = (e) => {
        setNewItem(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }))
    }

    const handleAddItem = async () => {
        if (!newItem.title.trim()) {
            alert('Please enter an item title');
            return;
        }

        const itemData = {
            title: newItem.title,
            item_type_id: newItem.item_type_id || null,
            parent_id: newItem.parent_id || null
        };

        try {
            await dispatch(createHierarchyItem({
                projectId: selectedProject.id,
                itemData
            })).unwrap();

            // Reset form after successful creation
            setNewItem({
                title: '',
                item_type_id: null,
                parent_id: newItem.parent_id || null
            });
        } catch (error) {
            console.error('Error creating hierarchy item:', error);
            alert('Failed to create item. Please try again.');
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
                        id="item_type_id"
                        name="item_type_id"
                        value={newItem.item_type_id}
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
                        value={newItem.parent_id}
                        onChange={handleNewItemChange}
                        className="form-select"
                    >
                        <option value="">No parent (root item)</option>
                        {currentHierarchy?.map(item => (
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
                    {currentHierarchy?.map(item => (
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
            
        </div>
    )
}

export default HierarchyForm;