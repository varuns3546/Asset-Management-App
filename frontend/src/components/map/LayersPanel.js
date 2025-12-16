import React, { useState, useEffect, useRef } from 'react';
import '../../styles/layersPanel.css';

const LayersPanel = ({ layers = [], onToggleLayer, onRemoveLayer, onEditLayer, onStyleLayer, onAddFeature, onRemoveFeature, onZoomToFeature, onZoomToLayer }) => {
  const [expandedLayers, setExpandedLayers] = useState({});
  const [contextMenu, setContextMenu] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [selectedLayers, setSelectedLayers] = useState(new Set());
  const [selectedFeatures, setSelectedFeatures] = useState({}); // { layerId: Set of featureIds }
  const [lastClickedLayer, setLastClickedLayer] = useState(null);
  const [lastClickedFeature, setLastClickedFeature] = useState(null); // { layerId, featureId }
  const contextMenuRef = useRef(null);

  const toggleExpand = (layerId) => {
    setExpandedLayers(prev => ({
      ...prev,
      [layerId]: !prev[layerId]
    }));
  };

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target)) {
        setContextMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Prevent text selection on mousedown
  const handleLayerMouseDown = (e) => {
    if (e.shiftKey || e.ctrlKey || e.metaKey) {
      e.preventDefault();
    }
  };

  // Handle layer double-click to zoom
  const handleLayerDoubleClick = (e, layer) => {
    e.stopPropagation();
    if (onZoomToLayer && layer) {
      onZoomToLayer(layer);
    }
  };

  // Handle layer click with Ctrl/Shift
  const handleLayerClick = (e, layer, index) => {
    e.stopPropagation();
    
    if (e.ctrlKey || e.metaKey) {
      // Ctrl+click: toggle individual selection
      setSelectedLayers(prev => {
        const newSet = new Set(prev);
        if (newSet.has(layer.id)) {
          newSet.delete(layer.id);
        } else {
          newSet.add(layer.id);
        }
        return newSet;
      });
      setLastClickedLayer(index);
    } else if (e.shiftKey && lastClickedLayer !== null) {
      // Shift+click: select range
      const start = Math.min(lastClickedLayer, index);
      const end = Math.max(lastClickedLayer, index);
      const newSet = new Set(selectedLayers);
      for (let i = start; i <= end; i++) {
        newSet.add(layers[i].id);
      }
      setSelectedLayers(newSet);
    } else {
      // Regular click: select only this item
      setSelectedLayers(new Set([layer.id]));
      setLastClickedLayer(index);
    }
    // Clear feature selection when selecting layers
    setSelectedFeatures({});
  };

  // Prevent text selection on mousedown for features
  const handleFeatureMouseDown = (e) => {
    if (e.shiftKey || e.ctrlKey || e.metaKey) {
      e.preventDefault();
    }
  };

  // Handle feature double-click to zoom
  const handleFeatureDoubleClick = (e, feature) => {
    e.stopPropagation();
    if (onZoomToFeature && feature) {
      onZoomToFeature(feature);
    }
  };

  // Handle feature click with Ctrl/Shift
  const handleFeatureClick = (e, feature, layer, featureIndex) => {
    e.stopPropagation();
    
    const layerId = layer.id;
    const featureId = feature.id;
    
    if (e.ctrlKey || e.metaKey) {
      // Ctrl+click: toggle individual selection
      setSelectedFeatures(prev => {
        const layerFeatures = new Set(prev[layerId] || []);
        if (layerFeatures.has(featureId)) {
          layerFeatures.delete(featureId);
        } else {
          layerFeatures.add(featureId);
        }
        return { ...prev, [layerId]: layerFeatures };
      });
      setLastClickedFeature({ layerId, featureIndex });
    } else if (e.shiftKey && lastClickedFeature && lastClickedFeature.layerId === layerId) {
      // Shift+click: select range (only within same layer)
      const start = Math.min(lastClickedFeature.featureIndex, featureIndex);
      const end = Math.max(lastClickedFeature.featureIndex, featureIndex);
      const newSet = new Set(selectedFeatures[layerId] || []);
      for (let i = start; i <= end; i++) {
        newSet.add(layer.features[i].id);
      }
      setSelectedFeatures(prev => ({ ...prev, [layerId]: newSet }));
    } else {
      // Regular click: select only this item
      setSelectedFeatures({ [layerId]: new Set([featureId]) });
      setLastClickedFeature({ layerId, featureIndex });
    }
    // Clear layer selection when selecting features
    setSelectedLayers(new Set());
  };

  const isLayerSelected = (layerId) => selectedLayers.has(layerId);
  const isFeatureSelected = (layerId, featureId) => selectedFeatures[layerId]?.has(featureId);

  const clearSelection = () => {
    setSelectedLayers(new Set());
    setSelectedFeatures({});
  };

  const getSelectedCount = () => {
    const layerCount = selectedLayers.size;
    const featureCount = Object.values(selectedFeatures).reduce((sum, set) => sum + set.size, 0);
    return { layerCount, featureCount, total: layerCount + featureCount };
  };

  const handleContextMenu = (e, type, item, layer = null) => {
    e.preventDefault();
    
    // Check if right-clicking on an already selected item
    const isItemSelected = type === 'layer' 
      ? isLayerSelected(item.id) 
      : isFeatureSelected(layer.id, item.id);
    
    // Store what to delete: either current selection (if clicking selected item) or just this item
    let layersToDelete = new Set();
    let featuresToDelete = {};
    
    if (isItemSelected) {
      // Use current selection
      layersToDelete = new Set(selectedLayers);
      featuresToDelete = { ...selectedFeatures };
    } else {
      // Select just this item
      if (type === 'layer') {
        layersToDelete = new Set([item.id]);
        setSelectedLayers(layersToDelete);
        setSelectedFeatures({});
      } else {
        featuresToDelete = { [layer.id]: new Set([item.id]) };
        setSelectedFeatures(featuresToDelete);
        setSelectedLayers(new Set());
      }
    }
    
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      type,
      item,
      layer,
      layersToDelete,
      featuresToDelete
    });
  };

  const handleDeleteClick = () => {
    setDeleteConfirm(contextMenu);
    setContextMenu(null);
  };

  const confirmDelete = () => {
    const { layersToDelete, featuresToDelete } = deleteConfirm;
    
    // Delete layers
    if (layersToDelete && layersToDelete.size > 0) {
      layersToDelete.forEach(layerId => {
        onRemoveLayer(layerId);
      });
    }
    
    // Delete features
    if (onRemoveFeature && featuresToDelete) {
      Object.entries(featuresToDelete).forEach(([layerId, featureIds]) => {
        featureIds.forEach(featureId => {
          onRemoveFeature(layerId, featureId);
        });
      });
    }
    
    // Clear selections
    setSelectedLayers(new Set());
    setSelectedFeatures({});
    setDeleteConfirm(null);
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
    <div className="layer-panel" onClick={clearSelection}>
      <div className="layer-panel-header" onClick={(e) => e.stopPropagation()}>
        <h3>Layers</h3>
        <span className="layer-count">{layers.length}</span>
      </div>

      <div className="layer-list">
        {layers.map((layer, layerIndex) => (
          <div 
            key={layer.id} 
            className={`layer-item ${!layer.visible ? 'layer-hidden' : ''} ${isLayerSelected(layer.id) ? 'selected' : ''}`}
            onClick={(e) => handleLayerClick(e, layer, layerIndex)}
            onDoubleClick={(e) => handleLayerDoubleClick(e, layer)}
            onMouseDown={handleLayerMouseDown}
            onContextMenu={(e) => handleContextMenu(e, 'layer', layer)}
          >
            <div className="layer-header">
              <div className="layer-left">
                <button
                  className="layer-expand-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpand(layer.id);
                  }}
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
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleLayer(layer.id);
                  }}
                  title={layer.visible ? 'Hide layer' : 'Show layer'}
                >
                  {layer.visible ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            {expandedLayers[layer.id] && (
              <div className="layer-details">
                {/* Features List */}
                <div className="features-list" onClick={(e) => e.stopPropagation()}>
                  {layer.features && layer.features.length > 0 ? (
                    layer.features.map((feature, featureIndex) => (
                      <div 
                        key={feature.id} 
                        className={`feature-item ${isFeatureSelected(layer.id, feature.id) ? 'selected' : ''}`}
                        onClick={(e) => handleFeatureClick(e, feature, layer, featureIndex)}
                        onDoubleClick={(e) => handleFeatureDoubleClick(e, feature)}
                        onMouseDown={handleFeatureMouseDown}
                        onContextMenu={(e) => {
                          e.stopPropagation();
                          handleContextMenu(e, 'feature', feature, layer);
                        }}
                      >
                        <span className="feature-icon">
                          {layer.geometryType === 'point' ? '📍' : 
                           layer.geometryType === 'line' ? '📏' : '⬜'}
                        </span>
                        <span className="feature-name">{feature.name || `Feature ${feature.id}`}</span>
                      </div>
                    ))
                  ) : (
                    <div className="no-features">No features</div>
                  )}
                </div>
                
                <div className="layer-action-buttons" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="layer-action-btn primary"
                    onClick={() => onAddFeature(layer)}
                    title="Add features"
                  >
                    ➕ Add
                  </button>
                  <button
                    className="layer-action-btn secondary"
                    onClick={() => onStyleLayer(layer.id)}
                    title="Style layer"
                  >
                    🎨 Style
                  </button>
                  <button
                    className="layer-action-btn danger"
                    onClick={() => onRemoveLayer(layer.id)}
                    title="Remove layer"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div 
          ref={contextMenuRef}
          className="context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button className="context-menu-item delete" onClick={handleDeleteClick}>
            🗑️ Delete {(() => {
              const layerCount = contextMenu.layersToDelete?.size || 0;
              const featureCount = Object.values(contextMenu.featuresToDelete || {}).reduce((sum, set) => sum + set.size, 0);
              const total = layerCount + featureCount;
              if (total > 1) return `${total} items`;
              return contextMenu.type === 'layer' ? 'Layer' : 'Feature';
            })()}
          </button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className="confirm-overlay">
          <div className="confirm-dialog">
            <h4>Confirm Delete</h4>
            <p>
              {(() => {
                const layerCount = deleteConfirm.layersToDelete?.size || 0;
                const featureCount = Object.values(deleteConfirm.featuresToDelete || {}).reduce((sum, set) => sum + set.size, 0);
                const total = layerCount + featureCount;
                
                if (total > 1) {
                  const parts = [];
                  if (layerCount > 0) parts.push(`${layerCount} layer${layerCount > 1 ? 's' : ''}`);
                  if (featureCount > 0) parts.push(`${featureCount} feature${featureCount > 1 ? 's' : ''}`);
                  return `Are you sure you want to delete ${parts.join(' and ')}?`;
                }
                return <>Are you sure you want to delete {deleteConfirm.type === 'layer' ? 'layer' : 'feature'} <strong>"{deleteConfirm.item.name}"</strong>?</>;
              })()}
            </p>
            <div className="confirm-actions">
              <button className="confirm-btn cancel" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </button>
              <button className="confirm-btn delete" onClick={confirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LayersPanel;

