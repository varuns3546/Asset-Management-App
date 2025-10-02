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
    const dispatch = useDispatch();
    const navigate = useNavigate()

    // Debug: Log when currentItemTypes change
    useEffect(() => {
        console.log('ItemTypeScreen currentItemTypes updated:', currentItemTypes);
    }, [currentItemTypes]);  

    useEffect(() => {
        dispatch(loadUser())
    }, [dispatch])

    useEffect(() => {
        if (selectedProject && user) {
            dispatch(reset());
            dispatch(getHierarchyItemTypes(selectedProject.id));
        }
        return () => {
            dispatch(reset())
        }
    }, [selectedProject, user, dispatch]);

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
                                <ItemTypeForm 
                                    itemTypes={currentItemTypes || []}
                                />
                            </div>
                        </div>
                        
                        {/* Right side - Tree (always visible) */}
                        <div className="hierarchy-right-panel">
                            {(currentItemTypes && currentItemTypes.length > 0) ? (
                                <div className="hierarchy-tree-container">
                                    <div className="hierarchy-tree-content">
                                        <ItemTypeTree itemTypes={currentItemTypes}/>
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