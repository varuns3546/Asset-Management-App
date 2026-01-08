import React, { useState, useEffect, useRef } from 'react';
import { basemaps } from './Map';
// Import basemaps from Map component

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
  setLabelColor,
  labelBackgroundColor,
  setLabelBackgroundColor,
  onExportClick,
  onRegenerateGisFeatures
}) => {
  const [isResizing, setIsResizing] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startHeight, setStartHeight] = useState(0);
  const [showBasemapDropdown, setShowBasemapDropdown] = useState(false);
  const [showLabelModal, setShowLabelModal] = useState(false);
  const panelRef = useRef(null);
  const dropdownRef = useRef(null);
  const labelModalRef = useRef(null);

  const minHeight = 10;
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
      if (labelModalRef.current && !labelModalRef.current.contains(event.target)) {
        setShowLabelModal(false);
      }
    };

    if (showBasemapDropdown || showLabelModal) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showBasemapDropdown, showLabelModal]);

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

  // Helper functions for RGBA to Hex conversion
  const rgbaToHex = (rgba) => {
    const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (match) {
      const r = parseInt(match[1], 10);
      const g = parseInt(match[2], 10);
      const b = parseInt(match[3], 10);
      return '#' + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      }).join('');
    }
    // Default to white
    return '#ffffff';
  };

  const hexToRgba = (hex) => {
    // Ensure hex starts with #
    const cleanHex = hex.startsWith('#') ? hex : '#' + hex;
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(cleanHex);
    if (result) {
      const r = parseInt(result[1], 16);
      const g = parseInt(result[2], 16);
      const b = parseInt(result[3], 16);
      // Set alpha to 60% (0.6)
      return `rgba(${r}, ${g}, ${b}, 0.6)`;
    }
    return labelBackgroundColor;
  };

  const backgroundHex = rgbaToHex(labelBackgroundColor);

  const handleBackgroundColorChange = (hex) => {
    if (!hex) return;
    
    // Ensure hex starts with #
    const cleanHex = hex.startsWith('#') ? hex : '#' + hex;
    
    // Validate hex format (6 hex digits) and update
    if (cleanHex.match(/^#[0-9a-f]{6}$/i)) {
      setLabelBackgroundColor(hexToRgba(cleanHex));
    }
  };

  // Determine if panel is small for responsive button sizing
  const isSmallPanel = panelHeight < 60;
  const panelClass = `top-panel ${isSmallPanel ? 'panel-small' : ''}`;

  return (
    <div ref={panelRef} className={panelClass} style={{ height: `${panelHeight}px` }}>
      <div className="top-panel-content">
        <div className="toolbar-actions">    
          <button className="toolbar-button">Search</button>
          <button className="toolbar-button">Layers</button>
          <button className="toolbar-button">Tools</button>

          <div className="basemap-dropdown-container" ref={dropdownRef}>
            <button 
              className="toolbar-button"
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
          <div className="label-control-container" ref={labelModalRef}>
            <button 
              className={`toolbar-button ${showLabels ? 'active' : ''}`}
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
                  <div className="label-setting-group">
                    <label>Background Color</label>
                    <div className="color-picker-row">
                      <input
                        type="color"
                        value={backgroundHex}
                        onChange={(e) => handleBackgroundColorChange(e.target.value)}
                        className="color-picker-input"
                      />
                      <input
                        type="text"
                        value={backgroundHex}
                        onChange={(e) => {
                          const value = e.target.value;
                          handleBackgroundColorChange(value);
                        }}
                        onBlur={(e) => {
                          // On blur, ensure we have a valid hex value
                          const value = e.target.value;
                          if (!value.match(/^#[0-9a-f]{6}$/i)) {
                            // Reset to current valid hex if invalid
                            e.target.value = backgroundHex;
                          }
                        }}
                        className="color-hex-input"
                        placeholder="#ffffff"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          {onRegenerateGisFeatures && (
            <button 
              className="toolbar-button"
              onClick={onRegenerateGisFeatures}
              title="Regenerate GIS features for assets missing them"
            >
              🔄 Regenerate Features
            </button>
          )}
          {onExportClick && (
            <button 
              className="toolbar-button"
              onClick={onExportClick}
              title="Export layers to GeoPackage"
            >
              Export
            </button>
          )}
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

