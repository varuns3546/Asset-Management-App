import React, { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';

const MapNavbar = ({ onOpenUploadModal }) => {
  const { selectedProject } = useSelector((state) => state.projects);
  const [showLayerDropdown, setShowLayerDropdown] = useState(false);
  const [showCreateSubmenu, setShowCreateSubmenu] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowLayerDropdown(false);
        setShowCreateSubmenu(false);
      }
    };

    if (showLayerDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLayerDropdown]);

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
    // TODO: Implement input data functionality
    console.log('Input Data clicked');
  };

  return (
    <div className="map-navbar">
      <div className="map-navbar-content">
        <div className="map-navbar-center">
          <div className="navbar-layer-dropdown-container" ref={dropdownRef}>
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
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapNavbar;

