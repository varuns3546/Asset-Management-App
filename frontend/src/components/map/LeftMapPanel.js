import React, { useState, useRef, useEffect } from 'react';
import LayersPanel from './LayersPanel.js';
import '../../styles/layersPanel.css';

const MapPanel = ({ isExpanded, setIsExpanded, panelWidth, setPanelWidth, layers, onToggleLayer, onRemoveLayer, onEditLayer, onStyleLayer, onAddFeature, onRemoveFeature, onZoomToFeature, onZoomToLayer }) => {
  const [isResizing, setIsResizing] = useState(false);

  const minWidth = 250;
  const maxWidth = 600;

  const togglePanel = () => {
    setIsExpanded(!isExpanded);
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;

      const newWidth = e.clientX;
      
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setPanelWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, minWidth, maxWidth, setPanelWidth]);

  return (
    <>
      <div 
        className={`left-panel ${isExpanded ? 'expanded' : 'collapsed'}`}
        style={{ width: isExpanded ? `${panelWidth}px` : '320px' }}
      >
        <LayersPanel
          layers={layers}
          onToggleLayer={onToggleLayer}
          onRemoveLayer={onRemoveLayer}
          onEditLayer={onEditLayer}
          onStyleLayer={onStyleLayer}
          onAddFeature={onAddFeature}
          onRemoveFeature={onRemoveFeature}
          onZoomToFeature={onZoomToFeature}
          onZoomToLayer={onZoomToLayer}
        />

        {isExpanded && (
          <div 
            className="resize-handle"
            onMouseDown={handleMouseDown}
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize panel"
          >
            <div className="resize-handle-line"></div>
          </div>
        )}
      </div>
      
      <button 
        className={`panel-toggle-btn ${isExpanded ? 'expanded' : 'collapsed'}`}
        onClick={togglePanel}
        style={{ left: isExpanded ? `${panelWidth}px` : '0' }}
        aria-label={isExpanded ? 'Collapse panel' : 'Expand panel'}
      >
        <span className="toggle-icon">{isExpanded ? '◀' : '▶'}</span>
      </button>
    </>
  );
};

export default MapPanel;

