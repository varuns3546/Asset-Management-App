import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import Modal from '../Modal';
import ErrorMessage from '../forms/ErrorMessage';
import * as gisLayerService from '../../services/gisLayerService';
import '../../styles/modal.css';

const ExportLayersModal = ({ isOpen, onClose, layers, projectId }) => {
  const { selectedProject } = useSelector((state) => state.projects);
  const [selectedLayerIds, setSelectedLayerIds] = useState([]);
  const [exportFormat, setExportFormat] = useState('geojson'); // 'geojson' or 'geopackage'
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Initialize with all layers selected
  useEffect(() => {
    if (isOpen && layers) {
      setSelectedLayerIds(layers.map(layer => layer.id));
      setError('');
      setSuccessMessage('');
    }
  }, [isOpen, layers]);

  const handleToggleLayer = (layerId) => {
    setSelectedLayerIds(prev => {
      if (prev.includes(layerId)) {
        return prev.filter(id => id !== layerId);
      } else {
        return [...prev, layerId];
      }
    });
  };

  const handleSelectAll = () => {
    if (layers) {
      setSelectedLayerIds(layers.map(layer => layer.id));
    }
  };

  const handleDeselectAll = () => {
    setSelectedLayerIds([]);
  };

  const handleExport = async () => {
    if (selectedLayerIds.length === 0) {
      setError('Please select at least one layer to export');
      return;
    }

    if (!projectId) {
      setError('Project ID is missing');
      return;
    }

    setIsExporting(true);
    setError('');
    setSuccessMessage('');

    try {
      const projectName = selectedProject?.name || selectedProject?.title || null;
      
      if (exportFormat === 'geojson') {
        await gisLayerService.exportLayersToGeoJSON(projectId, selectedLayerIds, projectName);
      } else {
        await gisLayerService.exportLayersToGeoPackage(projectId, selectedLayerIds, projectName);
      }
      
      setSuccessMessage('Export completed successfully! The file should download automatically.');
      
      // Close modal after a short delay
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Export error:', error);
      setError(error.response?.data?.error || error.message || 'Failed to export layers. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  if (!layers || layers.length === 0) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Export Layers">
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <p>No layers available to export.</p>
          <button 
            onClick={onClose}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      </Modal>
    );
  }

  const allSelected = selectedLayerIds.length === layers.length;
  const noneSelected = selectedLayerIds.length === 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Export Layers">
      <div style={{ padding: '20px' }}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '10px', fontWeight: '500' }}>
            Export Format:
          </label>
          <div style={{ display: 'flex', gap: '20px', marginBottom: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="radio"
                value="geojson"
                checked={exportFormat === 'geojson'}
                onChange={(e) => setExportFormat(e.target.value)}
                style={{ marginRight: '8px' }}
              />
              <div>
                <div style={{ fontWeight: '500' }}>GeoJSON (.geojson)</div>
                <div style={{ fontSize: '12px', color: '#666' }}>Recommended - Includes auto-labels for QGIS</div>
              </div>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="radio"
                value="geopackage"
                checked={exportFormat === 'geopackage'}
                onChange={(e) => setExportFormat(e.target.value)}
                style={{ marginRight: '8px' }}
              />
              <div>
                <div style={{ fontWeight: '500' }}>GeoPackage (.gpkg)</div>
                <div style={{ fontSize: '12px', color: '#666' }}>Binary format</div>
              </div>
            </label>
          </div>
        </div>

        <p style={{ marginBottom: '20px', color: '#666' }}>
          Select the layers you want to export for use in QGIS or other GIS software.
        </p>

        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <button
              onClick={handleSelectAll}
              disabled={allSelected}
              style={{
                padding: '6px 12px',
                backgroundColor: allSelected ? '#ccc' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: allSelected ? 'not-allowed' : 'pointer',
                fontSize: '14px'
              }}
            >
              Select All
            </button>
            <button
              onClick={handleDeselectAll}
              disabled={noneSelected}
              style={{
                padding: '6px 12px',
                backgroundColor: noneSelected ? '#ccc' : '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: noneSelected ? 'not-allowed' : 'pointer',
                fontSize: '14px'
              }}
            >
              Deselect All
            </button>
            <span style={{ marginLeft: '10px', color: '#666', fontSize: '14px' }}>
              {selectedLayerIds.length} of {layers.length} selected
            </span>
          </div>

          <div
            style={{
              maxHeight: '300px',
              overflowY: 'auto',
              border: '1px solid #ddd',
              borderRadius: '4px',
              padding: '10px'
            }}
          >
            {layers.map(layer => {
              const isSelected = selectedLayerIds.includes(layer.id);
              const featureCount = layer.features ? layer.features.length : 0;

              return (
                <div
                  key={layer.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '10px',
                    borderBottom: '1px solid #eee',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? '#f0f8ff' : 'transparent'
                  }}
                  onClick={() => handleToggleLayer(layer.id)}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleToggleLayer(layer.id)}
                    onClick={(e) => e.stopPropagation()}
                    style={{ marginRight: '10px', cursor: 'pointer' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                      {layer.name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {layer.geometryType || 'Unknown'} • {featureCount} feature{featureCount !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {error && <ErrorMessage message={error} />}
        {successMessage && (
          <div
            style={{
              padding: '10px',
              backgroundColor: '#d4edda',
              color: '#155724',
              borderRadius: '4px',
              marginBottom: '15px'
            }}
          >
            {successMessage}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button
            onClick={onClose}
            disabled={isExporting}
            style={{
              padding: '10px 20px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isExporting ? 'not-allowed' : 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || selectedLayerIds.length === 0}
            style={{
              padding: '10px 20px',
              backgroundColor: isExporting || selectedLayerIds.length === 0 ? '#ccc' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isExporting || selectedLayerIds.length === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            {isExporting ? 'Exporting...' : `Export to ${exportFormat === 'geojson' ? 'GeoJSON' : 'GeoPackage'}`}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ExportLayersModal;

