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
  setLabelFontSize
}) => {
  const [isResizing, setIsResizing] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startHeight, setStartHeight] = useState(0);
  const [showBasemapDropdown, setShowBasemapDropdown] = useState(false);
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

  const handleLabelToggle = () => {
    setShowLabels(!showLabels);
  };

  const handleIncreaseFontSize = () => {
    if (labelFontSize < 48) {
      setLabelFontSize(labelFontSize + 1);
    }
  };

  const handleDecreaseFontSize = () => {
    if (labelFontSize > 6) {
      setLabelFontSize(labelFontSize - 1);
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
              className={`toolbar-btn label-btn ${showLabels ? 'active' : ''}`}
              onClick={handleLabelToggle}
            >
              {showLabels && (
                <span 
                  className="label-size-btn-inline"
                  onClick={(e) => { e.stopPropagation(); handleDecreaseFontSize(); }}
                >
                  −
                </span>
              )}
              <span>Labels</span>
              {showLabels && (
                <span 
                  className="label-size-btn-inline"
                  onClick={(e) => { e.stopPropagation(); handleIncreaseFontSize(); }}
                >
                  +
                </span>
              )}
            </button>
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

