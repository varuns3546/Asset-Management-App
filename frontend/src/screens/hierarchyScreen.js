import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getHierarchy, deleteHierarchyItem, getHierarchyItemTypes, reset } from '../features/projects/projectSlice';
import { loadUser } from '../features/auth/authSlice';
import HierarchyTree from '../components/structure/HierarchyTree';
import HierarchyForm from '../components/structure/HierarchyForm';
import '../styles/structureScreen.css';
const HierarchyScreen = () => {
    const { selectedProject, currentHierarchy, currentItemTypes} = useSelector((state) => state.projects);
    const { user } = useSelector((state) => state.auth);
    const [selectedItem, setSelectedItem] = useState(null);

    const dispatch = useDispatch();
    
    useEffect(() => {dispatch(loadUser())}, [dispatch])

    useEffect(() => {
        if (selectedProject && user) {
            // Clear Redux state and fetch new hierarchy
            dispatch(reset());
            dispatch(getHierarchy(selectedProject.id));
            dispatch(getHierarchyItemTypes(selectedProject.id));
        }
        return () => {
            dispatch(reset())
        }
    }, [selectedProject, user, dispatch])

    const handleRemoveItem = async (itemId) => {
        try {
            await dispatch(deleteHierarchyItem({
                projectId: selectedProject.id,
                itemId
            })).unwrap();
        } catch (error) {
            console.error('Error deleting hierarchy item:', error);
            alert('Failed to delete hierarchy item. Please try again.');
        }
    };

    const handleItemClick = (item) => {
        console.log('Item selected in HierarchyScreen:', item);
        setSelectedItem(item);
    };

    const handleItemSelect = (item) => {
        setSelectedItem(item);
    };
    
    return (
        <div className="hierarchy-screen">
            {selectedProject ? (
                <div className="hierarchy-container">
                    <div className="hierarchy-header">
                        <h2 className="hierarchy-title">Asset Hierarchy - {selectedProject.title}</h2>
                    </div>
                    
                    <div className="hierarchy-layout">
                        {/* Left side - Edit Form */}
                        <div className="hierarchy-left-panel">
                            <div className="hierarchy-edit-container">
                                <HierarchyForm 
                                    hierarchyItems={currentHierarchy || []}
                                    itemTypes={currentItemTypes}
                                    selectedItem={selectedItem}
                                    onItemSelect={handleItemSelect}
                                />
                            </div>
                        </div>
                        
                        {/* Right side - Tree (always visible) */}
                        <div className="hierarchy-right-panel">
                            {currentHierarchy && currentHierarchy.length > 0 && (
                                <div className="hierarchy-tree-container">
                                    <div className="hierarchy-tree-content">
                                        <HierarchyTree 
                                            hierarchyItems={currentHierarchy}
                                            onRemoveItem={handleRemoveItem}
                                            onItemClick={handleItemClick}
                                        />
                                    </div>
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