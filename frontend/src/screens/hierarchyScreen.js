import { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getHierarchy, updateHierarchy, deleteHierarchy, reset } from '../features/projects/projectSlice';
import { loadUser } from '../features/auth/authSlice';
import { useNavigate } from 'react-router-dom';
import HierarchyTree from '../components/HierarchyTree';
import '../styles/hierarchyScreen.css';

const HierarchyScreen = () => {
    const { selectedProject, hierarchies, isLoading, isError, message } = useSelector((state) => state.projects);
    const { user } = useSelector((state) => state.auth);
    const [editingForm, setEditingForm] = useState({
        items: []
    });
    const [newItemTitle, setNewItemTitle] = useState('');
    const [newItemParentId, setNewItemParentId] = useState('');
    const hasLoadedData = useRef(false);
    const dispatch = useDispatch();
    const navigate = useNavigate()  
    
    useEffect(() => {
        dispatch(loadUser())
    }, [dispatch])

    useEffect(() => {
        if (!user) {
            navigate('/')
            return
        }
    }, [user, navigate])

    useEffect(() => {
        if (selectedProject && user) {
            // Clear form and reset loading flag when switching projects
            setEditingForm({ items: [] });
            hasLoadedData.current = false;
            // Clear Redux state and fetch new hierarchy
            dispatch(reset());
            dispatch(getHierarchy(selectedProject.id));
        }
        return () => {
            dispatch(reset())
        }
    }, [selectedProject, user, dispatch])

    useEffect(() => {
        if (isError) {
            console.log('Hierarchy Error:', message)
        }
    }, [isError, message])

    // Debug: Log hierarchies data
    useEffect(() => {
        console.log('Hierarchies data:', hierarchies);
    }, [hierarchies])

    // Debug: Log editing form changes
    useEffect(() => {
        console.log('Editing form updated:', editingForm);
    }, [editingForm])

    // Get the hierarchy items for this project
    const hierarchyItems = hierarchies || [];

    // Update form when hierarchy data changes
    useEffect(() => {
        if (hierarchyItems && Array.isArray(hierarchyItems)) {
            setEditingForm({
                items: hierarchyItems
            });
            hasLoadedData.current = true;
        } else if (hierarchyItems && hierarchyItems.length === 0) {
            // Handle empty array case
            setEditingForm({
                items: []
            });
            hasLoadedData.current = true;
        }
    }, [hierarchyItems]);

    const handleSaveHierarchy = () => {
        if (!selectedProject) {
            alert('Please select a project first');
            return;
        }

        const hierarchyData = {
            items: editingForm.items.map(item => ({
                id: item.id,
                title: item.title,
                parentId: item.parent_item_id
            }))
        };
        
        // Always update the hierarchy items
        dispatch(updateHierarchy({ 
            projectId: selectedProject.id,
            hierarchyData
        }));
    }

    const handleAddItem = () => {
        console.log('Adding item:', newItemTitle, 'Parent:', newItemParentId);
        
        if (!newItemTitle.trim()) {
            alert('Please enter an item title');
            return;
        }

        const newItem = {
            id: Date.now().toString(), // Temporary ID for frontend
            title: newItemTitle,
            parent_item_id: newItemParentId || null
        };

        console.log('New item created:', newItem);

        setEditingForm(prev => {
            const updatedItems = [...prev.items, newItem];
            console.log('Updated items:', updatedItems);
            return {
                ...prev,
                items: updatedItems
            };
        });

        setNewItemTitle('');
        setNewItemParentId('');
    }

    const handleRemoveItem = (itemId) => {
        setEditingForm(prev => ({
            ...prev,
            items: prev.items.filter(item => item.id !== itemId)
        }));
    }

   

    return (
        <div className="hierarchy-screen">
            {selectedProject ? (
                <div className="hierarchy-container">
                    <div className="hierarchy-header">
                        <h2 className="hierarchy-title">Asset Hierarchy - {selectedProject.title}</h2>
                        {isLoading && <p className="hierarchy-loading">Loading hierarchy...</p>}
                    </div>
                    
                    <div className="hierarchy-layout">
                        {/* Left side - Edit Form */}
                        <div className="hierarchy-left-panel">
                            <div className="hierarchy-edit-container">
                                <div className="hierarchy-edit-form">
                                    <div className="form-group">
                                        <label htmlFor="newItemTitle">Add New Item</label>
                                        <div className="add-item-form">
                                            <input
                                                type="text"
                                                id="newItemTitle"
                                                value={newItemTitle}
                                                onChange={(e) => setNewItemTitle(e.target.value)}
                                                placeholder="Enter item title"
                                                className="form-input"
                                            />
                                            <select
                                                value={newItemParentId}
                                                onChange={(e) => setNewItemParentId(e.target.value)}
                                                className="form-select"
                                            >
                                                <option value="">No parent (root item)</option>
                                                {editingForm.items.map(item => (
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
                                            {editingForm.items.map(item => (
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
                            </div>
                        </div>
                        
                        {/* Right side - Tree (always visible) */}
                        <div className="hierarchy-right-panel">
                            {editingForm.items.length > 0 ? (
                                <div className="hierarchy-tree-container">
                                    <div className="hierarchy-tree-header">
                                        <h3 className="hierarchy-tree-title">{editingForm.title}</h3>
                                        {editingForm.description && (
                                            <p className="hierarchy-tree-description">
                                                {editingForm.description}
                                            </p>
                                        )}
                                    </div>
                                    <div className="hierarchy-tree-content">
                                        <HierarchyTree hierarchy={{ 
                                            title: editingForm.title,
                                            description: editingForm.description,
                                            hierarchy_item_types: editingForm.items
                                        }} />
                                    </div>
                                </div>
                            ) : (
                                <div className="no-hierarchy-selected">
                                    <h3>No Items</h3>
                                    <p>Add items to see the hierarchy tree structure.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="no-project">
                    <h2>Asset Hierarchy</h2>
                    <p>Please select a project first using the "Open Project" option.</p>
                </div>
            )}
        </div>
    )
}

export default HierarchyScreen;