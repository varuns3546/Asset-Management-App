import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getFeatureTypes, deleteFeatureType, reset } from '../features/projects/projectSlice';
import { loadUser } from '../features/auth/authSlice';
import AssetTypeForm from '../components/structure/AssetTypeForm';
import AssetTypeTree from '../components/structure/AssetTypeTree';
import '../styles/structureScreen.css';
const AssetTypeScreen = () => {
    const { selectedProject, currentFeatureTypes } = useSelector((state) => state.projects);
    const { user } = useSelector((state) => state.auth);
    const [selectedItem, setSelectedItem] = useState(null);
    const dispatch = useDispatch();

    // Debug: Log when currentFeatureTypes change
    useEffect(() => {
        console.log('AssetTypeScreen currentFeatureTypes updated:', currentFeatureTypes);
    }, [currentFeatureTypes]);  

    useEffect(() => {
        dispatch(loadUser())
    }, [dispatch])

    useEffect(() => {
        if (selectedProject && user) {
            dispatch(reset());
            dispatch(getFeatureTypes(selectedProject.id));
        }
        return () => {
            dispatch(reset())
        }
    }, [selectedProject, user, dispatch]);

    const handleRemoveAssetType = async (assetTypeId) => {
        try {
            await dispatch(deleteFeatureType({
                projectId: selectedProject.id,
                featureTypeId: assetTypeId
            })).unwrap();
            
            // Clear selected item if the deleted item type was selected
            if (selectedItem && selectedItem.id === assetTypeId) {
                setSelectedItem(null);
            }
        } catch (error) {
            console.error('Error deleting item type:', error);
            alert('Failed to delete item type. Please try again.');
        }
    };

    const handleItemClick = (item) => {
        console.log('AssetType selected in AssetTypeScreen:', item);
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
                        <h2 className="hierarchy-title">
                            {selectedItem ? `Edit Asset Type: ${selectedItem.title}` : 'Asset Types'} - {selectedProject.title}
                        </h2>
                    </div>
                    <div className="hierarchy-layout">
                        {/* Left side - Edit Form */}
                        <div className="hierarchy-left-panel">
                            <div className="hierarchy-edit-container">
                                <AssetTypeForm 
                                    assetTypes={currentFeatureTypes || []}
                                    selectedAsset={selectedItem}
                                    onAssetSelect={handleItemSelect}
                                />
                            </div>
                        </div>
                        
                        {/* Right side - Tree (always visible) */}
                        <div className="hierarchy-right-panel">
                            {(currentFeatureTypes && currentFeatureTypes.length > 0) ? (
                                <div className="hierarchy-tree-container">
                                    <div className="hierarchy-tree-content">
                                        <AssetTypeTree 
                                            key={currentFeatureTypes.length} 
                                            assetTypes={currentFeatureTypes || []}
                                            onRemoveAssetType={handleRemoveAssetType}
                                            onAssetClick={handleItemClick}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="no-hierarchy-selected">
                                    <h3>No Asset Types</h3>
                                    <p>Add items to see the hierarchy tree</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="no-project-selected">
                    <h2>No Project Selected</h2>
                    <p>Please select a project to view its asset types</p>
                </div>
            )}
        </div>
    );
}

export default AssetTypeScreen;