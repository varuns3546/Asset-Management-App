import { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getHierarchyItemTypes, updateHierarchyItemTypes, deleteHierarchyItemType, reset } from '../features/projects/projectSlice';
import { loadUser } from '../features/auth/authSlice';
import { useNavigate } from 'react-router-dom';
import ItemTypeForm from '../components/structure/ItemTypeForm';
import ItemTypeTree from '../components/structure/ItemTypeTree';
import '../styles/structureScreen.css';
const ItemTypeScreen = () => {
    const { selectedProject, currentItemTypes, isLoading, isError, message} = useSelector((state) => state.projects);
    const { user, isLoading: authLoading } = useSelector((state) => state.auth);
    const [formData, setFormData] = useState({
        itemTypes: currentItemTypes || []
    });
    const hasLoadedData = useRef(false);
    const dispatch = useDispatch();
    const navigate = useNavigate()  

    useEffect(() => {
        dispatch(loadUser())
    }, [dispatch])

    useEffect(() => {
        if (selectedProject && user) {
            setFormData({ itemTypes: currentItemTypes || [] });
            hasLoadedData.current = false;
            dispatch(reset());
            dispatch(getHierarchyItemTypes(selectedProject.id));

        }
        return () => {
            dispatch(reset())
        }
    }, [selectedProject, user, dispatch]);

    useEffect(() => {
        if (currentItemTypes && Array.isArray(currentItemTypes) && currentItemTypes.length > 0 && !hasLoadedData.current) {
            setFormData({ itemTypes: currentItemTypes });
            hasLoadedData.current = true;
        }
    }, [currentItemTypes]);

       // Callback for saving hierarchy
    const handleSaveItemTypes = (itemTypes) => {
        console.log('itemTypes', itemTypes);
        if (!selectedProject) {
            alert('Please select a project first');
            return;
        }

        const itemTypesData = {
            itemTypes: formData.itemTypes.map(itemType => ({
                id: itemType.id,
                title: itemType.title,
                description: itemType.description,
                parent_ids: itemType.parent_ids || []
            }))
        };
        
        // Always update the hierarchy items
        dispatch(updateHierarchyItemTypes({ 
            projectId: selectedProject.id,
            itemTypesData
        }));
    };
    return (
        <div className="hierarchy-screen">
            {selectedProject ? (
                <div className="hierarchy-container">
                    <div className="hierarchy-header">
                        <h2 className="hierarchy-title">Asset Hierarchy - {selectedProject.title}</h2>
                        {isLoading && <p className="hierarchy-loading">Loading items...</p>}
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
                                    <ItemTypeForm 
                                        itemTypes={formData.itemTypes}
                                        onSaveItemTypes={handleSaveItemTypes}
                                        onUpdateItemTypes={(updatedItemTypes) => setFormData({ itemTypes: updatedItemTypes })}
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
                                    <h3>Loading Items...</h3>
                                    <p>Fetching hierarchy data from server</p>
                                </div>
                            ) : formData.itemTypes.length > 0 ? (
                                <div className="hierarchy-tree-container">
                                    <div className="hierarchy-tree-content">
                                        <ItemTypeTree itemTypes={formData.itemTypes}/>
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
}

export default ItemTypeScreen;