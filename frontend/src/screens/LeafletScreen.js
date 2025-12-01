import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import Leaflet from '../components/Leaflet';
import LeftMapPanel from '../components/LeftMapPanel';
import TopMapPanel from '../components/TopMapPanel';
import '../styles/map.css';

const LeafletScreen = () => {
  const { selectedProject } = useSelector((state) => state.projects);
  const [isExpanded, setIsExpanded] = useState(true);
  const [panelWidth, setPanelWidth] = useState(320);
  const [topPanelHeight, setTopPanelHeight] = useState(80);
  const [selectedBasemap, setSelectedBasemap] = useState('street');

  const mapWidth = isExpanded ? `calc(100% - ${panelWidth}px)` : '100%';

  // Extract coordinates from selected project
  // Expecting format: selectedProject = { latitude: number, longitude: number }
  const projectCoordinates = selectedProject && selectedProject.latitude && selectedProject.longitude
    ? [selectedProject.latitude, selectedProject.longitude]
    : null;

  return (
    <div className="leaflet-screen-container">
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
    </div>
  );
};

export default LeafletScreen;