import React, { useState } from 'react';
import Modal from '../Modal';
import ButtonGroup from '../forms/ButtonGroup';
import ErrorMessage from '../forms/ErrorMessage';
import FormField from '../forms/FormField';
import useFormReset from '../../hooks/useFormReset';
import { findDuplicates } from '../../utils/validation';
import '../../styles/modal.css';
import '../../styles/createLayer.css';

const CreateLayerModal = ({ isOpen, onClose, projectId, onCreateLayer }) => {
  const [layerType, setLayerType] = useState('vector'); // 'vector' or 'raster'
  const [geometryType, setGeometryType] = useState('point'); // 'point', 'line', 'polygon'
  const [layerName, setLayerName] = useState('');
  const [description, setDescription] = useState('');
  const [attributes, setAttributes] = useState([
    { name: 'id', type: 'integer', isPrimary: true },
    { name: 'name', type: 'string', isPrimary: false }
  ]);
  const [coordinateSystem, setCoordinateSystem] = useState('EPSG:4326'); // WGS 84
  const [error, setError] = useState('');
  
  const initialState = {
    layerName: '',
    description: '',
    layerType: 'vector',
    geometryType: 'point',
    coordinateSystem: 'EPSG:4326',
    attributes: [
      { name: 'id', type: 'integer', isPrimary: true },
      { name: 'name', type: 'string', isPrimary: false }
    ]
  };
  
  const resetForm = useFormReset(initialState, () => {
    setLayerName(initialState.layerName);
    setDescription(initialState.description);
    setLayerType(initialState.layerType);
    setGeometryType(initialState.geometryType);
    setCoordinateSystem(initialState.coordinateSystem);
    setAttributes(initialState.attributes);
    setError('');
  });

  const attributeTypes = [
    { value: 'string', label: 'Text (String)' },
    { value: 'integer', label: 'Integer' },
    { value: 'float', label: 'Decimal (Float)' },
    { value: 'boolean', label: 'Boolean (Yes/No)' },
    { value: 'date', label: 'Date' },
    { value: 'datetime', label: 'Date & Time' }
  ];

  const coordinateSystems = [
    { value: 'EPSG:4326', label: 'WGS 84 (EPSG:4326) - Geographic' },
    { value: 'EPSG:3857', label: 'Web Mercator (EPSG:3857)' },
    { value: 'EPSG:4269', label: 'NAD 83 (EPSG:4269)' },
    { value: 'EPSG:2163', label: 'US National Atlas (EPSG:2163)' }
  ];

  const handleAddAttribute = () => {
    const newAttr = {
      name: `field_${attributes.length}`,
      type: 'string',
      isPrimary: false
    };
    setAttributes([...attributes, newAttr]);
  };

  const handleRemoveAttribute = (index) => {
    // Don't allow removing the primary key
    if (attributes[index].isPrimary) {
      setError('Cannot remove the primary key field');
      return;
    }
    const newAttributes = attributes.filter((_, i) => i !== index);
    setAttributes(newAttributes);
    setError('');
  };

  const handleAttributeChange = (index, field, value) => {
    const newAttributes = [...attributes];
    newAttributes[index][field] = value;
    setAttributes(newAttributes);
  };

  const handleCreateLayer = async () => {
    // Validate layer name
    if (!layerName.trim()) {
      setError('Layer name is required');
      return;
    }

    // Validate attributes
    const duplicates = findDuplicates(attributes, attr => attr.name);
    if (duplicates.length > 0) {
      setError(`Duplicate attribute names found: ${duplicates.join(', ')}`);
      return;
    }

    const layerData = {
      projectId,
      name: layerName,
      description,
      layerType,
      geometryType: layerType === 'vector' ? geometryType : null,
      coordinateSystem,
      attributes
    };

    try {
      // TODO: Implement API call to create layer
      // Call the onCreateLayer callback to add layer to state
      if (onCreateLayer) {
        onCreateLayer(layerData);
      }
      
      // Close modal on success
      onClose();
      resetForm();
    } catch (err) {
      setError(err.message || 'Failed to create layer');
    }
  };


  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New Layer">
      <div className="create-layer-modal">
        {/* Layer Type Selection */}
        <div className="form-section">
          <h3>Layer Type</h3>
          <div className="layer-type-options">
            <label className={`layer-type-card ${layerType === 'vector' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="layerType"
                value="vector"
                checked={layerType === 'vector'}
                onChange={(e) => setLayerType(e.target.value)}
              />
              <div className="layer-type-content">
                <span className="layer-type-icon">📍</span>
                <span className="layer-type-label">Vector Layer</span>
                <span className="layer-type-desc">Points, lines, polygons</span>
              </div>
            </label>
            <label className={`layer-type-card ${layerType === 'raster' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="layerType"
                value="raster"
                checked={layerType === 'raster'}
                onChange={(e) => setLayerType(e.target.value)}
              />
              <div className="layer-type-content">
                <span className="layer-type-icon">🗺️</span>
                <span className="layer-type-label">Raster Layer</span>
                <span className="layer-type-desc">Image, grid data</span>
              </div>
            </label>
          </div>
        </div>

        {/* Geometry Type (Vector only) */}
        {layerType === 'vector' && (
          <div className="form-section">
            <h3>Geometry Type</h3>
            <div className="geometry-type-options">
              <label className={`geometry-button ${geometryType === 'point' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="geometryType"
                  value="point"
                  checked={geometryType === 'point'}
                  onChange={(e) => setGeometryType(e.target.value)}
                />
                Point
              </label>
              <label className={`geometry-button ${geometryType === 'line' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="geometryType"
                  value="line"
                  checked={geometryType === 'line'}
                  onChange={(e) => setGeometryType(e.target.value)}
                />
                Line
              </label>
              <label className={`geometry-button ${geometryType === 'polygon' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="geometryType"
                  value="polygon"
                  checked={geometryType === 'polygon'}
                  onChange={(e) => setGeometryType(e.target.value)}
                />
                Polygon
              </label>
            </div>
          </div>
        )}

        {/* Basic Information */}
        <div className="form-section">
          <h3>Layer Information</h3>
          <FormField
            label="Layer Name *"
            id="layerName"
            type="text"
            value={layerName}
            onChange={(e) => setLayerName(e.target.value)}
            placeholder="Enter layer name"
            required
          />
          <FormField
            label="Description"
            id="description"
            type="textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter layer description (optional)"
            rows={3}
          />
        </div>

        {/* Coordinate System */}
        <div className="form-section">
          <h3>Coordinate Reference System</h3>
          <FormField
            label="CRS"
            id="coordinateSystem"
            type="select"
            value={coordinateSystem}
            onChange={(e) => setCoordinateSystem(e.target.value)}
            selectOptions={coordinateSystems.map(crs => ({
              value: crs.value,
              label: crs.label
            }))}
          />
        </div>

        {/* Attribute Fields */}
        <div className="form-section">
          <h3>Attribute Fields</h3>
          <div className="attributes-container">
            {attributes.map((attr, index) => (
              <div key={index} className="attribute-row">
                <input
                  type="text"
                  value={attr.name}
                  onChange={(e) => handleAttributeChange(index, 'name', e.target.value)}
                  placeholder="Field name"
                  className="attr-name-input"
                  disabled={attr.isPrimary}
                />
                <select
                  value={attr.type}
                  onChange={(e) => handleAttributeChange(index, 'type', e.target.value)}
                  className="attr-type-select"
                  disabled={attr.isPrimary}
                >
                  {attributeTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {attr.isPrimary && <span className="primary-key-badge">Primary Key</span>}
                {!attr.isPrimary && (
                  <button
                    onClick={() => handleRemoveAttribute(index)}
                    className="remove-attr-button"
                    title="Remove field"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            <button onClick={handleAddAttribute} className="add-attr-button">
              + Add Field
            </button>
          </div>
        </div>

        {/* Error Message */}
        <ErrorMessage message={error} />

        {/* Actions */}
        <div className="modal-actions">
          <ButtonGroup
            buttons={[
              {
                label: 'Cancel',
                variant: 'secondary',
                onClick: handleClose
              },
              {
                label: 'Create Layer',
                variant: 'primary',
                onClick: handleCreateLayer
              }
            ]}
          />
        </div>
      </div>
    </Modal>
  );
};

export default CreateLayerModal;

