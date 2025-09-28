import { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getHierarchy, updateHierarchy, deleteHierarchy, reset } from '../features/projects/projectSlice';
import { loadUser } from '../features/auth/authSlice';
import { useNavigate } from 'react-router-dom';
import HierarchyTree from '../components/HierarchyTree';
import HierarchyForm from '../components/HierarchyForm';
import '../styles/hierarchyScreen.css';

const HierarchyScreen = () => {
    const { selectedProject, hierarchies, isLoading} = useSelector((state) => state.projects);
    const { user, isLoading: authLoading } = useSelector((state) => state.auth);
    const [formData, setFormData] = useState({
        items: []
    });

    const hasLoadedData = useRef(false);
    const dispatch = useDispatch();
    const navigate = useNavigate()  
    
    useEffect(() => {
        dispatch(loadUser())
    }, [dispatch])

    useEffect(() => {
        if (selectedProject && user) {
            // Clear form and reset loading flag when switching projects
            setFormData({ items: [] });
            hasLoadedData.current = false;
            // Clear Redux state and fetch new hierarchy
            dispatch(reset());
            dispatch(getHierarchy(selectedProject.id));
        }
        return () => {
            dispatch(reset())
        }
    }, [selectedProject, user, dispatch])

    // Get the hierarchy items for this project
    const hierarchyItems = hierarchies || [];

    // Update form when hierarchy data changes
    useEffect(() => {
        if (hierarchyItems && Array.isArray(hierarchyItems)) {
            setFormData({
                items: hierarchyItems
            });
            hasLoadedData.current = true;
        } else if (hierarchyItems && hierarchyItems.length === 0) {
            // Handle empty array case
            setFormData({
                items: []
            });
            hasLoadedData.current = true;
        }
    }, [hierarchyItems]);

    // Callback for when form data changes
    const handleFormDataChange = (updatedItems) => {
        setFormData(prev => ({
            ...prev,
            items: updatedItems
        }));
    };

    // Callback for saving hierarchy
    const handleSaveHierarchy = (items) => {
        if (!selectedProject) {
            alert('Please select a project first');
            return;
        }

        const hierarchyData = {
            items: items.map(item => ({
                id: item.id,
                title: item.title,
                itemType: item.itemType,
                parentId: item.parentId
            }))
        };
        
        // Always update the hierarchy items
        dispatch(updateHierarchy({ 
            projectId: selectedProject.id,
            hierarchyData
        }));
    };
    

   

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
                                <HierarchyForm 
                                    hierarchyItems={formData.items}
                                    onSaveHierarchy={handleSaveHierarchy}
                                    onUpdateItems={handleFormDataChange}
                                />
                            </div>
                        </div>
                        
                        {/* Right side - Tree (always visible) */}
                        <div className="hierarchy-right-panel">
                            {formData.items.length > 0 ? (
                                <div className="hierarchy-tree-container">
                                    <div className="hierarchy-tree-header">
                                        <h3 className="hierarchy-tree-title">{formData.title}</h3>
                                        {formData.description && (
                                            <p className="hierarchy-tree-description">
                                                {formData.description}
                                            </p>
                                        )}
                                    </div>
                                    <div className="hierarchy-tree-content">
                                        <HierarchyTree hierarchy={{ 
                                            title: formData.title,
                                            description: formData.description,
                                            hierarchy_item_types: formData.items
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