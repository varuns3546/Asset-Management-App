import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createHierarchyItemType, deleteHierarchyItemType, getHierarchy } from '../../features/projects/projectSlice';
import '../../styles/structureScreen.css'

const ItemTypeForm = ({ 
    itemTypes
}) => {
    const dispatch = useDispatch();
    const { selectedProject, currentItemTypes } = useSelector((state) => state.projects);
    const [newItemType, setNewItemType] = useState({
        title: '',
        description: '',
        parent_ids: []
    });

    const [parentDropdowns, setParentDropdowns] = useState([{ id: 1, value: '' }]);

    const [multipleChildrenChecked, setMultipleChildrenChecked] = useState(false);


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

    const handleAddItemType = async () => {
        if (!newItemType.title.trim()) {
            alert('Please enter an item type title');
            return;
        }
        // Collect selected parent IDs from dropdowns
        const selectedParentIds = parentDropdowns
            .map(dropdown => dropdown.value)
            .filter(value => value !== '');

        const itemTypeData = {
            name: newItemType.title,
            description: newItemType.description,
            parent_ids: selectedParentIds
        };

        try {
            console.log('Creating item type with data:', itemTypeData);
            const result = await dispatch(createHierarchyItemType({
                projectId: selectedProject.id,
                itemTypeData
            })).unwrap();
            console.log('Item type created successfully:', result);

            // Reset form after successful creation
            setNewItemType({
                title: '',
                description: '',
                parent_ids: []
            });

            // Reset parent dropdowns to single empty dropdown
            setParentDropdowns([{ id: 1, value: '' }]);
        } catch (error) {
            console.error('Error creating item type:', error);
            alert('Failed to create item type. Please try again.');
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
                    />
                    <div className="parent-dropdowns-container">
                        <label className="parent-dropdowns-label">Select Parent(s):</label>
                        {parentDropdowns.map((dropdown, index) => (
                            <div key={dropdown.id} className="parent-dropdown-row">
                                <select
                                    value={dropdown.value}
                                    onChange={(e) => handleParentDropdownChange(dropdown.id, e.target.value)}
                                    className="form-select parent-dropdown"
                                >
                                    <option value="">No parent (root item)</option>
                                    {currentItemTypes?.map(itemType => (
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
                    {currentItemTypes?.map(itemType => (
                        <div key={itemType.id} className="item-row">
                            <span className="item-title">{itemType.title}</span>
                            <button 
                                onClick={() => handleRemoveItemType(itemType.id)}
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

export default ItemTypeForm;