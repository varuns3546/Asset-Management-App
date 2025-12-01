import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import Leaflet from '../components/map/Leaflet';
import LeftMapPanel from '../components/map/LeftMapPanel';
import TopMapPanel from '../components/map/TopMapPanel';
import MapNavbar from '../components/map/MapNavbar';
import FileUploadModal from '../components/FileUploadModal';
import '../styles/map.css';

const LeafletScreen = () => {
  const { selectedProject } = useSelector((state) => state.projects);
  const [isExpanded, setIsExpanded] = useState(true);
  const [panelWidth, setPanelWidth] = useState(320);
  const [topPanelHeight, setTopPanelHeight] = useState(80);
  const [selectedBasemap, setSelectedBasemap] = useState('street');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const handleFileSelect = (file) => {
    // TODO: Handle file upload for layer creation
    console.log('File selected:', file);
    setIsUploadModalOpen(false);
  };

  const mapWidth = isExpanded ? `calc(100% - ${panelWidth}px)` : '100%';

  // Extract coordinates from selected project
  // Expecting format: selectedProject = { latitude: number, longitude: number }
  const projectCoordinates = selectedProject && selectedProject.latitude && selectedProject.longitude
    ? [selectedProject.latitude, selectedProject.longitude]
    : null;

  return (
    <div className="leaflet-screen-container">
      <MapNavbar onOpenUploadModal={() => setIsUploadModalOpen(true)} />
      <TopMapPanel 
        panelHeight={topPanelHeight}
        setPanelHeight={setTopPanelHeight}
        selectedBasemap={selectedBasemap}
        setSelectedBasemap={setSelectedBasemap}
      />
      <div className="map-content-container">
        <LeftMapPanel 
          isExpanded={isExpanded}
          setIsExpanded={setIsExpanded}
          panelWidth={panelWidth}
          setPanelWidth={setPanelWidth}
        />
        <div style={{ width: mapWidth, height: '100%', position: 'relative' }}>
          <Leaflet 
            panelWidth={panelWidth} 
            selectedBasemap={selectedBasemap}
            projectCoordinates={projectCoordinates}
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

export default LeafletScreen;