import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getHierarchy, getHierarchyItemTypes } from '../features/projects/projectSlice';
import { loadUser } from '../features/auth/authSlice';
import MapComponent from '../components/MapComponent';
import HierarchyForm from '../components/structure/HierarchyForm';
import '../styles/map.css';
import '../styles/structureScreen.css';

const MapScreen = () => {
    const { selectedProject, currentHierarchy, currentItemTypes } = useSelector((state) => state.projects);
    const { user } = useSelector((state) => state.auth);
    const [selectedItem, setSelectedItem] = useState(null);
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(loadUser());
    }, [dispatch]);

    useEffect(() => {
        if (selectedProject && user) {
            dispatch(getHierarchy(selectedProject.id));
            dispatch(getHierarchyItemTypes(selectedProject.id));
        }
    }, [selectedProject, user, dispatch]);

    const handleItemClick = (item) => {
        console.log('Item selected in MapScreen:', item);
        setSelectedItem(item);
    };

    const handleItemSelect = (item) => {
        setSelectedItem(item);
    };

    // Filter items that have coordinates
    const itemsWithCoordinates = currentHierarchy?.filter(item => 
        item.coordinates && 
        item.coordinates.latitude && 
        item.coordinates.longitude
    ) || [];


    return (
        <div className="map-screen">
            {selectedProject ? (
                <div className="map-screen-container">
                    <div className="map-screen-header">
                        <h2 className="map-screen-title">Asset Map - {selectedProject.title}</h2>
                        <div className="map-screen-info">
                            <span>{itemsWithCoordinates.length} assets with coordinates</span>
                        </div>
                    </div>
                    
                    <div className="map-screen-layout">
                        {/* Left side - Map */}
                        <div className="map-screen-left-panel">
                            <MapComponent 
                                hierarchyItems={currentHierarchy || []}
                                selectedItem={selectedItem}
                                onItemSelect={handleItemSelect}
                                height="600px"
                            />
                        </div>
                        
                        {/* Right side - Form */}
                        <div className="map-screen-right-panel">
                            <div className="map-screen-form-container">
                                <HierarchyForm 
                                    hierarchyItems={currentHierarchy || []}
                                    itemTypes={currentItemTypes || []}
                                    selectedItem={selectedItem}
                                    onItemSelect={handleItemSelect}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="no-project-selected">
                    <h2>No Project Selected</h2>
                    <p>Please select a project to view its asset map</p>
                </div>
            )}
        </div>
    );
};

export default MapScreen;
