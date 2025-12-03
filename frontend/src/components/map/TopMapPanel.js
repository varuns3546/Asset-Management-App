import React, { useState, useEffect, useRef } from 'react';
import { basemaps } from './Leaflet';

const TopMapPanel = ({ 
  panelHeight, 
  setPanelHeight, 
  selectedBasemap, 
  setSelectedBasemap,
  showLabels,
  setShowLabels,
  labelFontSize,
  setLabelFontSize,
  labelColor,
  setLabelColor
}) => {
  const [isResizing, setIsResizing] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startHeight, setStartHeight] = useState(0);
  const [showBasemapDropdown, setShowBasemapDropdown] = useState(false);
  const [showLabelModal, setShowLabelModal] = useState(false);
  const panelRef = useRef(null);
  const dropdownRef = useRef(null);

  const minHeight = 60;
  const maxHeight = 300;

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsResizing(true);
    setStartY(e.clientY);
    setStartHeight(panelHeight);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;

      const deltaY = e.clientY - startY;
      const newHeight = startHeight + deltaY;
      
      if (newHeight >= minHeight && newHeight <= maxHeight) {
        setPanelHeight(newHeight);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'row-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, startY, startHeight, minHeight, maxHeight, setPanelHeight]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowBasemapDropdown(false);
      }
    };

    if (showBasemapDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showBasemapDropdown]);

  const handleBasemapSelect = (basemapKey) => {
    setSelectedBasemap(basemapKey);
    setShowBasemapDropdown(false);
  };

  const handleLabelClick = () => {
    if (showLabels) {
      // If labels are on, turn them off and close modal
      setShowLabels(false);
      setShowLabelModal(false);
    } else {
      // If labels are off, turn them on and open modal
      setShowLabels(true);
      setShowLabelModal(true);
    }
  };

  const handleFontSizeChange = (e) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 6 && value <= 48) {
      setLabelFontSize(value);
    }
  };

  return (
    <div ref={panelRef} className="top-panel" style={{ height: `${panelHeight}px` }}>
      <div className="top-panel-content">
        <div className="toolbar-actions">    
          <button className="toolbar-btn">Search</button>
          <button className="toolbar-btn">Layers</button>
          <button className="toolbar-btn">Tools</button>
          <div className="basemap-dropdown-container" ref={dropdownRef}>
            <button 
              className="toolbar-btn"
              onClick={() => setShowBasemapDropdown(!showBasemapDropdown)}
            >
              Basemap
            </button>
            {showBasemapDropdown && (
              <div className="basemap-dropdown">
                {Object.entries(basemaps).map(([key, basemap]) => (
                  <div
                    key={key}
                    className={`basemap-option ${selectedBasemap === key ? 'selected' : ''}`}
                    onClick={() => handleBasemapSelect(key)}
                  >
                    {basemap.name}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="label-control-container">
            <button 
              className={`toolbar-btn ${showLabels ? 'active' : ''}`}
              onClick={handleLabelClick}
            >
              Labels
            </button>
            {showLabelModal && showLabels && (
              <div className="label-modal">
                <div className="label-modal-header">
                  <span>Label Settings</span>
                  <button className="label-modal-close" onClick={() => setShowLabelModal(false)}>×</button>
                </div>
                <div className="label-modal-content">
                  <div className="label-setting-group">
                    <label>Font Size</label>
                    <div className="font-size-control">
                      <input
                        type="range"
                        min="6"
                        max="48"
                        value={labelFontSize}
                        onChange={handleFontSizeChange}
                        className="font-size-slider"
                      />
                      <span className="font-size-value">{labelFontSize}px</span>
                    </div>
                  </div>
                  <div className="label-setting-group">
                    <label>Color</label>
                    <div className="color-picker-row">
                      <input
                        type="color"
                        value={labelColor}
                        onChange={(e) => setLabelColor(e.target.value)}
                        className="color-picker-input"
                      />
                      <input
                        type="text"
                        value={labelColor}
                        onChange={(e) => setLabelColor(e.target.value)}
                        className="color-hex-input"
                        placeholder="#000000"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div 
        className="resize-handle-vertical"
        onMouseDown={handleMouseDown}
        role="separator"
        aria-orientation="horizontal"
        aria-label="Resize panel"
      >
        <div className="resize-handle-line-vertical"></div>
      </div>
    </div>
  );
};

export default TopMapPanel;

