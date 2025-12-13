import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import CreateLayerModal from './CreateLayerModal';
import useClickOutside from '../../hooks/useClickOutside';

const MapNavbar = ({ onOpenUploadModal, onCreateLayer }) => {
  const { selectedProject } = useSelector((state) => state.projects);
  const [showViewDropdown, setShowViewDropdown] = useState(false);
  const [showLayerDropdown, setShowLayerDropdown] = useState(false);
  const [showCreateSubmenu, setShowCreateSubmenu] = useState(false);
  const [showCreateLayerModal, setShowCreateLayerModal] = useState(false);
  // Close dropdowns when clicking outside
  const viewDropdownRef = useClickOutside(() => {
    setShowViewDropdown(false);
  }, showViewDropdown);

  const layerDropdownRef = useClickOutside(() => {
    setShowLayerDropdown(false);
    setShowCreateSubmenu(false);
  }, showLayerDropdown);

  const closeLayerDropdown = () => {
    setShowLayerDropdown(false);
    setShowCreateSubmenu(false);
  };

  const handleCreateFromFile = () => {
    closeLayerDropdown();
    if (onOpenUploadModal) {
      onOpenUploadModal();
    }
  };

  const handleInputData = () => {
    closeLayerDropdown();
    setShowCreateLayerModal(true);
  };

  const handleImportFromOSM = () => {
    closeLayerDropdown();
    // TODO: Implement import from OpenStreetMap functionality
  };

  const handleLayersClick = () => {
    setShowViewDropdown(false);
    // TODO: Implement layers functionality
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

