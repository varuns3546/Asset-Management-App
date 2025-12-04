import React, { useState } from 'react';
import '../../styles/layerPanel.css';

const LayerPanel = ({ layers = [], onToggleLayer, onRemoveLayer, onEditLayer, onStyleLayer, onAddFeature }) => {
  const [expandedLayers, setExpandedLayers] = useState({});

  const toggleExpand = (layerId) => {
    setExpandedLayers(prev => ({
      ...prev,
      [layerId]: !prev[layerId]
    }));
  };

  const getLayerIcon = (layer) => {
    if (layer.layerType === 'raster') return '🗺️';
    
    switch (layer.geometryType) {
      case 'point': return '📍';
      case 'line': return '📏';
      case 'polygon': return '⬜';
      default: return '📊';
    }
  };

  const getGeometryLabel = (type) => {
    const labels = {
      point: 'Point',
      line: 'Line',
      polygon: 'Polygon'
    };
    return labels[type] || type;
  };

  if (layers.length === 0) {
    return (
      <div className="layer-panel-empty">
        <div className="empty-state">
          <span className="empty-icon">📁</span>
          <p>No layers yet</p>
          <span className="empty-hint">Create a layer to get started</span>
        </div>
      </div>
    );
  }

  return (
    <div className="layer-panel">
      <div className="layer-panel-header">
        <h3>Layers</h3>
        <span className="layer-count">{layers.length}</span>
      </div>

      <div className="layer-list">
        {layers.map((layer) => (
          <div key={layer.id} className={`layer-item ${!layer.visible ? 'layer-hidden' : ''}`}>
            <div className="layer-header">
              <div className="layer-left">
                <button
                  className="layer-expand-btn"
                  onClick={() => toggleExpand(layer.id)}
                  title={expandedLayers[layer.id] ? 'Collapse' : 'Expand'}
                >
                  {expandedLayers[layer.id] ? '▼' : '▶'}
                </button>
                <span className="layer-icon">{getLayerIcon(layer)}</span>
                <div className="layer-info">
                  <span className="layer-name">{layer.name}</span>
                  <span className="layer-type">
                    {layer.layerType === 'vector' 
                      ? `${getGeometryLabel(layer.geometryType)} Layer`
                      : 'Raster Layer'
                    }
                  </span>
                </div>
              </div>
              <div className="layer-actions">
                <button
                  className={`layer-visibility-btn ${layer.visible ? 'visible' : 'hidden'}`}
                  onClick={() => onToggleLayer(layer.id)}
                  title={layer.visible ? 'Hide layer' : 'Show layer'}
                >
                  {layer.visible ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            {expandedLayers[layer.id] && (
              <div className="layer-details">
                {layer.description && (
                  <div className="layer-detail-row">
                    <span className="detail-label">Description:</span>
                    <span className="detail-value">{layer.description}</span>
                  </div>
                )}
                <div className="layer-detail-row">
                  <span className="detail-label">CRS:</span>
                  <span className="detail-value">{layer.coordinateSystem}</span>
                </div>
                <div className="layer-detail-row">
                  <span className="detail-label">Features:</span>
                  <span className="detail-value">{layer.featureCount || 0}</span>
                </div>
                {layer.attributes && layer.attributes.length > 0 && (
                  <div className="layer-detail-row">
                    <span className="detail-label">Fields:</span>
                    <span className="detail-value">
                      {layer.attributes.map(attr => attr.name).join(', ')}
                    </span>
                  </div>
                )}
                
                <div className="layer-action-buttons">
                  <button
                    className="layer-action-btn primary"
                    onClick={() => onAddFeature(layer)}
                    title="Add features"
                  >
                    ➕ Add Features
                  </button>
                  <button
                    className="layer-action-btn"
                    onClick={() => onStyleLayer(layer.id)}
                    title="Style layer"
                  >
                    🎨 Style
                  </button>
                  <button
                    className="layer-action-btn"
                    onClick={() => onEditLayer(layer.id)}
                    title="Edit layer"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    className="layer-action-btn danger"
                    onClick={() => onRemoveLayer(layer.id)}
                    title="Remove layer"
                  >
                    🗑️ Remove
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LayerPanel;

