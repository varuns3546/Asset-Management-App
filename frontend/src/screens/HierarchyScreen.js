import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getHierarchy, deleteHierarchyItem, getHierarchyItemTypes, reset } from '../features/projects/projectSlice';
import { loadUser } from '../features/auth/authSlice';
import HierarchyTree from '../components/structure/HierarchyTree';
import HierarchyForm from '../components/structure/HierarchyForm';
import FileUploadModal from '../components/FileUploadModal';
import '../styles/structureScreen.css';
const HierarchyScreen = () => {
    const { selectedProject, currentHierarchy, currentItemTypes} = useSelector((state) => state.projects);
    const { user } = useSelector((state) => state.auth);
    const [selectedItem, setSelectedItem] = useState(null);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

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
            
            // Clear selected item if the deleted item was selected
            if (selectedItem && selectedItem.id === itemId) {
                setSelectedItem(null);
            }
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

    const handleFileUpload = async (file, projectId) => {
        // TODO: Implement file upload logic
        // For now, just log the file
        console.log('Uploading file:', file.name, 'for project:', projectId);
        
        // Placeholder for actual upload implementation
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Simulate successful upload
                console.log('File uploaded successfully');
                resolve();
                
                // Refresh hierarchy after upload
                dispatch(getHierarchy(projectId));
            }, 1000);
        });
    };
    
    return (
        <div className="hierarchy-screen">
            {selectedProject ? (
                <div className="hierarchy-container">
                    <div className="hierarchy-header">
                        <h2 className="hierarchy-title">Asset Hierarchy - {selectedProject.title}</h2>
                        <button 
                            className="upload-button"
                            onClick={() => setIsUploadModalOpen(true)}
                        >
                            Import Data
                        </button>
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

                    {/* File Upload Modal */}
                    <FileUploadModal
                        isOpen={isUploadModalOpen}
                        onClose={() => setIsUploadModalOpen(false)}
                        onUpload={handleFileUpload}
                        projectId={selectedProject.id}
                    />
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