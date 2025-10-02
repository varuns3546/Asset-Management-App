import { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getHierarchy, updateHierarchy, deleteHierarchy, getHierarchyItemTypes, reset } from '../features/projects/projectSlice';
import { loadUser } from '../features/auth/authSlice';
import { useNavigate } from 'react-router-dom';
import HierarchyTree from '../components/structure/HierarchyTree';
import HierarchyForm from '../components/structure/HierarchyForm';
import '../styles/structureScreen.css';
const HierarchyScreen = () => {
    const { selectedProject, currentHierarchy, currentItemTypes, isLoading, isError, message} = useSelector((state) => state.projects);
    const { user, isLoading: authLoading } = useSelector((state) => state.auth);
    const [formData, setFormData] = useState({
        items: currentHierarchy || []
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
            setFormData({ items: currentHierarchy || [] });
            hasLoadedData.current = false;
            // Clear Redux state and fetch new hierarchy
            dispatch(reset());
            dispatch(getHierarchy(selectedProject.id));
            dispatch(getHierarchyItemTypes(selectedProject.id));
        }
        return () => {
            dispatch(reset())
        }
    }, [selectedProject, user, dispatch])


    // Update form only when hierarchy data is first loaded (not on every change)
    useEffect(() => {
        if (currentHierarchy && Array.isArray(currentHierarchy) && currentHierarchy.length > 0 && !hasLoadedData.current) {
            setFormData({ items: currentHierarchy });
            hasLoadedData.current = true;
        }
    }, [currentHierarchy]);




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
                item_type_id: item.item_type_id,
                parent_id: item.parent_id
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
                        {isError && <p className="hierarchy-error">Error: {message}</p>}
                    </div>
                    
                    <div className="hierarchy-layout">
                        {/* Left side - Edit Form */}
                        <div className="hierarchy-left-panel">
                            <div className="hierarchy-edit-container">
                                {console.log('formData', formData)}
                                {isLoading && !currentItemTypes ? (
                                    <div className="form-loading-state">
                                        <div className="loading-spinner"></div>
                                        <p>Loading form data...</p>
                                    </div>
                                ) : (
                                    <HierarchyForm 
                                        hierarchyItems={formData.items}
                                        itemTypes={currentItemTypes}
                                        onSaveHierarchy={handleSaveHierarchy}
                                        onUpdateItems={(updatedItems) => setFormData({ items: updatedItems })}
                                        isLoading={isLoading}
                                    />
                                )}
                            </div>
                        </div>
                        
                        {/* Right side - Tree (always visible) */}
                        <div className="hierarchy-right-panel">
                            {isLoading ? (
                                <div className="hierarchy-loading-state">
                                    <div className="loading-spinner"></div>
                                    <h3>Loading Hierarchy...</h3>
                                    <p>Fetching hierarchy data from server</p>
                                </div>
                            ) : formData.items.length > 0 ? (
                                <div className="hierarchy-tree-container">
                                    <div className="hierarchy-tree-content">
                                        <HierarchyTree hierarchyItems={formData.items}/>
                                    </div>
                                </div>
                            ) : (
                                <div className="no-hierarchy-selected">
                                    <h3>No Items</h3>
                                    <p>Add items to see the hierarchy tree</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="no-project-selected">
                    <h2>No Project Selected</h2>
                    <p>Please select a project to view its hierarchy</p>
                </div>
            )}
        </div>
    );
};

export default HierarchyScreen;