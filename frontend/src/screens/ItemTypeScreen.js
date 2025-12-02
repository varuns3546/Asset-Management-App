import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getFeatureTypes, deleteFeatureType, reset } from '../features/projects/projectSlice';
import { loadUser } from '../features/auth/authSlice';
import ItemTypeForm from '../components/structure/ItemTypeForm';
import ItemTypeTree from '../components/structure/ItemTypeTree';
import '../styles/structureScreen.css';
const ItemTypeScreen = () => {
    const { selectedProject, currentFeatureTypes } = useSelector((state) => state.projects);
    const { user } = useSelector((state) => state.auth);
    const [selectedItem, setSelectedItem] = useState(null);
    const dispatch = useDispatch();

    // Debug: Log when currentFeatureTypes change
    useEffect(() => {
        console.log('ItemTypeScreen currentFeatureTypes updated:', currentFeatureTypes);
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

    const handleRemoveItemType = async (itemTypeId) => {
        try {
            await dispatch(deleteFeatureType({
                projectId: selectedProject.id,
                featureTypeId: itemTypeId
            })).unwrap();
            
            // Clear selected item if the deleted item type was selected
            if (selectedItem && selectedItem.id === itemTypeId) {
                setSelectedItem(null);
            }
        } catch (error) {
            console.error('Error deleting item type:', error);
            alert('Failed to delete item type. Please try again.');
        }
    };

    const handleItemClick = (item) => {
        console.log('ItemType selected in ItemTypeScreen:', item);
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
                            {selectedItem ? `Edit Item Type: ${selectedItem.title}` : 'Item Types'} - {selectedProject.title}
                        </h2>
                    </div>
                    <div className="hierarchy-layout">
                        {/* Left side - Edit Form */}
                        <div className="hierarchy-left-panel">
                            <div className="hierarchy-edit-container">
                                <ItemTypeForm 
                                    itemTypes={currentFeatureTypes || []}
                                    selectedItem={selectedItem}
                                    onItemSelect={handleItemSelect}
                                />
                            </div>
                        </div>
                        
                        {/* Right side - Tree (always visible) */}
                        <div className="hierarchy-right-panel">
                            {(currentFeatureTypes && currentFeatureTypes.length > 0) ? (
                                <div className="hierarchy-tree-container">
                                    <div className="hierarchy-tree-content">
                                        <ItemTypeTree 
                                            key={currentFeatureTypes.length} 
                                            itemTypes={currentFeatureTypes}
                                            onRemoveItemType={handleRemoveItemType}
                                            onItemClick={handleItemClick}
                                        />
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