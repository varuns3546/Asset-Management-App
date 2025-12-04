import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Map from '../components/map/Map';
import LeftMapPanel from '../components/map/LeftMapPanel';
import TopMapPanel from '../components/map/TopMapPanel';
import MapNavbar from '../components/map/MapNavbar';
import FileUploadModal from '../components/FileUploadModal';
import { getHierarchy, getFeatureTypes } from '../features/projects/projectSlice';
import { loadUser } from '../features/auth/authSlice';
import '../styles/map.css';

const MapScreen = () => {
  const dispatch = useDispatch();
  const { selectedProject, currentHierarchy, currentFeatureTypes } = useSelector((state) => state.projects);
  const { user } = useSelector((state) => state.auth);
  const [isExpanded, setIsExpanded] = useState(true);
  const [panelWidth, setPanelWidth] = useState(320);
  const [topPanelHeight, setTopPanelHeight] = useState(80);
  const [selectedBasemap, setSelectedBasemap] = useState('street');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [labelFontSize, setLabelFontSize] = useState(12);
  const [labelColor, setLabelColor] = useState('#000000');
  const [labelBackgroundColor, setLabelBackgroundColor] = useState('rgba(255, 255, 255, 0.6)');
  const containerRef = useRef(null);

  // Load user on mount
  useEffect(() => {
    dispatch(loadUser());
  }, [dispatch]);

  // Load hierarchy and feature types when project is selected and user is authenticated
  useEffect(() => {
    if (selectedProject?.id && user) {
      dispatch(getHierarchy(selectedProject.id));
      dispatch(getFeatureTypes(selectedProject.id));
    }
  }, [selectedProject?.id, user, dispatch]);

  // Update CSS variables based on actual component heights
  useEffect(() => {
    if (containerRef.current) {
      // Measure main Navbar height (the one at the top of the app)
      const mainNavbar = document.querySelector('.container');
      if (mainNavbar) {
        const mainNavbarHeight = mainNavbar.offsetHeight;
        containerRef.current.style.setProperty('--main-navbar-height', `${mainNavbarHeight}px`);
      }
      
      // Measure MapNavbar height using querySelector
      const navbarElement = containerRef.current.querySelector('.map-navbar');
      if (navbarElement) {
        const navbarHeight = navbarElement.offsetHeight;
        containerRef.current.style.setProperty('--map-navbar-height', `${navbarHeight}px`);
      }
    }
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.style.setProperty('--top-panel-height', `${topPanelHeight}px`);
    }
  }, [topPanelHeight]);

  // Prevent body scrolling when map screen is mounted
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalOverflowY = document.body.style.overflowY;
    const originalHeight = document.body.style.height;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalHtmlOverflowY = document.documentElement.style.overflowY;
    const originalHtmlHeight = document.documentElement.style.height;

    // Prevent scrolling on body and html
    document.body.style.overflow = 'hidden';
    document.body.style.overflowY = 'hidden';
    document.body.style.height = '100vh';
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.overflowY = 'hidden';
    document.documentElement.style.height = '100vh';

    // Cleanup: restore original styles when component unmounts
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.overflowY = originalOverflowY;
      document.body.style.height = originalHeight;
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.documentElement.style.overflowY = originalHtmlOverflowY;
      document.documentElement.style.height = originalHtmlHeight;
    };
  }, []);

  const handleFileSelect = (file) => {
    // TODO: Handle file upload for layer creation
    console.log('File selected:', file);
    setIsUploadModalOpen(false);
  };

  const mapWidth = isExpanded ? `calc(100% - ${panelWidth}px)` : '100%';

  // Extract coordinates from selected project
  // Leaflet expects [latitude, longitude] format
  const projectCoordinates = selectedProject && selectedProject.latitude != null && selectedProject.longitude != null
    ? [parseFloat(selectedProject.latitude), parseFloat(selectedProject.longitude)]
    : null;

  return (
    
    <div ref={containerRef} className="leaflet-screen-container">
      <MapNavbar onOpenUploadModal={() => setIsUploadModalOpen(true)} />
      <TopMapPanel 
        panelHeight={topPanelHeight}
        setPanelHeight={setTopPanelHeight}
        selectedBasemap={selectedBasemap}
        setSelectedBasemap={setSelectedBasemap}
        showLabels={showLabels}
        setShowLabels={setShowLabels}
        labelFontSize={labelFontSize}
        setLabelFontSize={setLabelFontSize}
        labelColor={labelColor}
        setLabelColor={setLabelColor}
        labelBackgroundColor={labelBackgroundColor}
        setLabelBackgroundColor={setLabelBackgroundColor}
      />
      <div className="map-content-container">
        <LeftMapPanel 
          isExpanded={isExpanded}
          setIsExpanded={setIsExpanded}
          panelWidth={panelWidth}
          setPanelWidth={setPanelWidth}
        />
        <div style={{ 
          width: '100%', 
          height: '100%', 
          position: 'relative',
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
          marginLeft: isExpanded ? `${panelWidth}px` : '0',
          transition: 'margin-left 0.3s ease-in-out'
        }}>
          <Map 
            panelWidth={panelWidth} 
            selectedBasemap={selectedBasemap}
            projectCoordinates={projectCoordinates}
            features={currentHierarchy || []}
            featureTypes={currentFeatureTypes || []}
            showLabels={showLabels}
            labelFontSize={labelFontSize}
            labelColor={labelColor}
            labelBackgroundColor={labelBackgroundColor}
          />
        </div>
      </div>
      
      {/* File Upload Modal */}
      {selectedProject && (
        <FileUploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onFileSelect={handleFileSelect}
          projectId={selectedProject.id}
        />
      )}
    </div>
  );
};

export default MapScreen;