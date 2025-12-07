import React, { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import CreateLayerModal from './CreateLayerModal';

const MapNavbar = ({ onOpenUploadModal, onCreateLayer }) => {
  const { selectedProject } = useSelector((state) => state.projects);
  const [showViewDropdown, setShowViewDropdown] = useState(false);
  const [showLayerDropdown, setShowLayerDropdown] = useState(false);
  const [showCreateSubmenu, setShowCreateSubmenu] = useState(false);
  const [showCreateLayerModal, setShowCreateLayerModal] = useState(false);
  const viewDropdownRef = useRef(null);
  const layerDropdownRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (viewDropdownRef.current && !viewDropdownRef.current.contains(event.target)) {
        setShowViewDropdown(false);
      }
      if (layerDropdownRef.current && !layerDropdownRef.current.contains(event.target)) {
        setShowLayerDropdown(false);
        setShowCreateSubmenu(false);
      }
    };

    if (showViewDropdown || showLayerDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showViewDropdown, showLayerDropdown]);

  const handleCreateFromFile = () => {
    setShowLayerDropdown(false);
    setShowCreateSubmenu(false);
    if (onOpenUploadModal) {
      onOpenUploadModal();
    }
  };

  const handleInputData = () => {
    setShowLayerDropdown(false);
    setShowCreateSubmenu(false);
    setShowCreateLayerModal(true);
  };

  const handleImportFromOSM = () => {
    setShowLayerDropdown(false);
    setShowCreateSubmenu(false);
    // TODO: Implement import from OpenStreetMap functionality
    console.log('Import from OpenStreetMap clicked');
  };

  const handleLayersClick = () => {
    setShowViewDropdown(false);
    // TODO: Implement layers functionality
    console.log('Layers clicked');
  };

  return (
    <>
      <div className="map-navbar">
        <div className="map-navbar-content">
          <div className="map-navbar-center">
          <div className="navbar-layer-dropdown-container" ref={viewDropdownRef}>
            <button 
              className="navbar-btn"
              onClick={() => setShowViewDropdown(!showViewDropdown)}
            >
              View
            </button>
            {showViewDropdown && (
              <div className="navbar-layer-dropdown">
                <div
                  className="navbar-layer-option"
                  onClick={handleLayersClick}
                >
                  Layers
                </div>
              </div>
            )}
          </div>
          <div className="navbar-layer-dropdown-container" ref={layerDropdownRef}>
            <button 
              className="navbar-btn"
              onClick={() => setShowLayerDropdown(!showLayerDropdown)}
            >
              Layer
            </button>
            {showLayerDropdown && (
              <div className="navbar-layer-dropdown">
                <div
                  className="navbar-layer-option has-submenu"
                  onMouseEnter={() => setShowCreateSubmenu(true)}
                  onMouseLeave={() => setShowCreateSubmenu(false)}
                >
                  Create Layer
                  <span className="submenu-arrow">▶</span>
                  {showCreateSubmenu && (
                    <div className="navbar-layer-submenu">
                      <div
                        className="navbar-layer-option"
                        onClick={handleCreateFromFile}
                      >
                        Create From File
                      </div>
                      <div
                        className="navbar-layer-option"
                        onClick={handleInputData}
                      >
                        Input Data
                      </div>
                      <div
                        className="navbar-layer-option"
                        onClick={handleImportFromOSM}
                      >
                        Import from OpenStreetMap
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>

    {selectedProject && (
      <CreateLayerModal
        isOpen={showCreateLayerModal}
        onClose={() => setShowCreateLayerModal(false)}
        projectId={selectedProject.id}
        onCreateLayer={onCreateLayer}
      />
    )}
  </>
  );
};

export default MapNavbar;

