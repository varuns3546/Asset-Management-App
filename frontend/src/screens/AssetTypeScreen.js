import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { getFeatureTypes, deleteFeatureType, reset } from '../features/projects/projectSlice';
import { useRouteMount } from '../contexts/RouteMountContext';
import useProjectData from '../hooks/useProjectData';
import useDebouncedAsync from '../hooks/useDebouncedAsync';
import AssetTypeForm from '../components/structure/AssetTypeForm';
import AssetTypeTree from '../components/structure/AssetTypeTree';
import ErrorMessage from '../components/forms/ErrorMessage';
import '../styles/structureScreen.css';

const AssetTypeScreen = () => {
    const { currentFeatureTypes } = useSelector((state) => state.projects);
    const { selectedProject, user, dispatch } = useProjectData();
    const [selectedItem, setSelectedItem] = useState(null);
    const [error, setError] = useState('');
    const { isRouteMounted } = useRouteMount();


    // Load feature types (debounced to prevent excessive calls)
    useDebouncedAsync(
        async () => {
            if (!selectedProject || !user) return;
            
            dispatch(reset());
            dispatch(getFeatureTypes(selectedProject.id));
        },
        [selectedProject?.id, user?.id],
        {
            delay: 300,
            shouldRun: (deps) => {
                const [projectId, userId] = deps;
                return !!(projectId && userId);
            },
            skipInitialRun: false
        }
    );

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            dispatch(reset());
        };
    }, [dispatch]);

    const handleRemoveAssetType = async (assetTypeId) => {
        setError('');
        try {
            await dispatch(deleteFeatureType({
                projectId: selectedProject.id,
                featureTypeId: assetTypeId
            })).unwrap();
            
            // Refetch feature types to ensure all updates (like subtype_of_id cleanup) are reflected
            await dispatch(getFeatureTypes(selectedProject.id));
            
            // Clear selected item if the deleted item type was selected
            if (isRouteMounted() && selectedItem && selectedItem.id === assetTypeId) {
                setSelectedItem(null);
            }
        } catch (error) {
            if (isRouteMounted()) {
                setError('Failed to delete item type. Please try again.');
            }
        }
    };

    const handleItemClick = (item) => {
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
                        <ErrorMessage message={error} />
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