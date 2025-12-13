import React, { useState } from 'react';
import Modal from '../Modal';
import ButtonGroup from '../forms/ButtonGroup';
import ErrorMessage from '../forms/ErrorMessage';
import FormField from '../forms/FormField';
import '../../styles/modal.css';
import '../../styles/addFeature.css';

const AddFeatureModal = ({ isOpen, onClose, layer, onAddFeature }) => {
  const [featureName, setFeatureName] = useState('');
  const [coordinates, setCoordinates] = useState([{ lat: '', lng: '' }]);
  const [attributes, setAttributes] = useState({});
  const [error, setError] = useState('');

  // Initialize attributes based on layer fields
  React.useEffect(() => {
    if (layer && layer.attributes) {
      const initialAttrs = {};
      layer.attributes.forEach(attr => {
        if (!attr.isPrimary) {
          initialAttrs[attr.name] = '';
        }
      });
      setAttributes(initialAttrs);
    }
  }, [layer]);

  const handleAddCoordinate = () => {
    setCoordinates([...coordinates, { lat: '', lng: '' }]);
  };

  const handleRemoveCoordinate = (index) => {
    if (coordinates.length > 1) {
      setCoordinates(coordinates.filter((_, i) => i !== index));
    }
  };

  const handleCoordinateChange = (index, field, value) => {
    const newCoords = [...coordinates];
    newCoords[index][field] = value;
    setCoordinates(newCoords);
  };

  const handleAttributeChange = (attrName, value) => {
    setAttributes(prev => ({
      ...prev,
      [attrName]: value
    }));
  };

  const validateCoordinates = () => {
    for (let i = 0; i < coordinates.length; i++) {
      const { lat, lng } = coordinates[i];
      
      if (!lat || !lng) {
        setError(`Coordinate ${i + 1} is incomplete`);
        return false;
      }

      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);

      if (isNaN(latitude) || isNaN(longitude)) {
        setError(`Coordinate ${i + 1} contains invalid numbers`);
        return false;
      }

      if (latitude < -90 || latitude > 90) {
        setError(`Latitude ${i + 1} must be between -90 and 90`);
        return false;
      }

      if (longitude < -180 || longitude > 180) {
        setError(`Longitude ${i + 1} must be between -180 and 180`);
        return false;
      }
    }

    // Validate based on geometry type
    if (layer.geometryType === 'line' && coordinates.length < 2) {
      setError('Line geometry requires at least 2 points');
      return false;
    }

    if (layer.geometryType === 'polygon' && coordinates.length < 3) {
      setError('Polygon geometry requires at least 3 points');
      return false;
    }

    return true;
  };

  const handleAddFeature = () => {
    if (!featureName.trim()) {
      setError('Feature name is required');
      return;
    }

    if (!validateCoordinates()) {
      return;
    }

    const feature = {
      id: Date.now(),
      layerId: layer.id,
      name: featureName,
      coordinates: coordinates.map(coord => ({
        lat: parseFloat(coord.lat),
        lng: parseFloat(coord.lng)
      })),
      attributes,
      createdAt: new Date().toISOString()
    };

    if (onAddFeature) {
      onAddFeature(feature);
    }

    resetForm();
    onClose();
  };

  const resetForm = () => {
    setFeatureName('');
    setCoordinates([{ lat: '', lng: '' }]);
    setAttributes({});
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!layer) return null;

  const getGeometryHelp = () => {
    switch (layer.geometryType) {
      case 'point':
        return 'Enter a single coordinate point';
      case 'line':
        return 'Enter at least 2 coordinate points to form a line';
      case 'polygon':
        return 'Enter at least 3 coordinate points to form a polygon (will auto-close)';
      default:
        return 'Enter coordinates';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`Add Feature to ${layer.name}`}>
      <div className="add-feature-modal">
        {/* Feature Name */}
        <div className="form-section">
          <h3>Feature Information</h3>
          <FormField
            label="Feature Name *"
            id="featureName"
            type="text"
            value={featureName}
            onChange={(e) => setFeatureName(e.target.value)}
            placeholder="Enter feature name"
            required
          />
        </div>

        {/* Coordinates */}
        <div className="form-section">
          <div className="section-header">
            <h3>Coordinates</h3>
            <span className="geometry-help">{getGeometryHelp()}</span>
          </div>

          <div className="coordinates-container">
            {coordinates.map((coord, index) => (
              <div key={index} className="coordinate-row">
                <span className="coord-number">{index + 1}</span>
                <input
                  type="number"
                  step="any"
                  value={coord.lat}
                  onChange={(e) => handleCoordinateChange(index, 'lat', e.target.value)}
                  placeholder="Latitude"
                  className="coord-input"
                />
                <input
                  type="number"
                  step="any"
                  value={coord.lng}
                  onChange={(e) => handleCoordinateChange(index, 'lng', e.target.value)}
                  placeholder="Longitude"
                  className="coord-input"
                />
                {(layer.geometryType !== 'point' || coordinates.length > 1) && (
                  <button
                    onClick={() => handleRemoveCoordinate(index)}
                    className="remove-coord-btn"
                    title="Remove coordinate"
                    disabled={coordinates.length === 1}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            
            {layer.geometryType !== 'point' && (
              <button onClick={handleAddCoordinate} className="add-coord-btn">
                + Add Coordinate Point
              </button>
            )}
          </div>

          <div className="coordinate-examples">
            <strong>Examples:</strong>
            <div className="example-row">
              <span>New York:</span> 40.7128, -74.0060
            </div>
            <div className="example-row">
              <span>London:</span> 51.5074, -0.1278
            </div>
          </div>
        </div>

        {/* Attributes */}
        {layer.attributes && layer.attributes.filter(attr => !attr.isPrimary).length > 0 && (
          <div className="form-section">
            <h3>Attributes</h3>
            <div className="attributes-grid">
              {layer.attributes.filter(attr => !attr.isPrimary).map(attr => (
                <div key={attr.name} className="form-group">
                  <label htmlFor={`attr-${attr.name}`}>
                    {attr.name}
                    <span className="attr-type-badge">{attr.type}</span>
                  </label>
                  {attr.type === 'boolean' ? (
                    <select
                      id={`attr-${attr.name}`}
                      value={attributes[attr.name] || 'false'}
                      onChange={(e) => handleAttributeChange(attr.name, e.target.value)}
                      className="form-select"
                    >
                      <option value="false">No</option>
                      <option value="true">Yes</option>
                    </select>
                  ) : attr.type === 'date' ? (
                    <input
                      id={`attr-${attr.name}`}
                      type="date"
                      value={attributes[attr.name] || ''}
                      onChange={(e) => handleAttributeChange(attr.name, e.target.value)}
                      className="form-input"
                    />
                  ) : attr.type === 'datetime' ? (
                    <input
                      id={`attr-${attr.name}`}
                      type="datetime-local"
                      value={attributes[attr.name] || ''}
                      onChange={(e) => handleAttributeChange(attr.name, e.target.value)}
                      className="form-input"
                    />
                  ) : (
                    <input
                      id={`attr-${attr.name}`}
                      type={attr.type === 'integer' || attr.type === 'float' ? 'number' : 'text'}
                      step={attr.type === 'float' ? 'any' : undefined}
                      value={attributes[attr.name] || ''}
                      onChange={(e) => handleAttributeChange(attr.name, e.target.value)}
                      placeholder={`Enter ${attr.name}`}
                      className="form-input"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

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
                label: 'Add Feature',
                variant: 'primary',
                onClick: handleAddFeature
              }
            ]}
          />
        </div>
      </div>
    </Modal>
  );
};

export default AddFeatureModal;

