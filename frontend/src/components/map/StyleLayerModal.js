import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import FormField from '../forms/FormField';
import ErrorMessage from '../forms/ErrorMessage';
import ButtonGroup from '../forms/ButtonGroup';
import { ITEM_TYPE_ICON_MAP } from '../../constants/itemTypeIcons';
import '../../styles/modal.css';

const StyleLayerModal = ({ isOpen, onClose, layer, onSave }) => {
  const [color, setColor] = useState('#3388ff');
  const [opacity, setOpacity] = useState(1);
  const [weight, setWeight] = useState(3);
  const [symbol, setSymbol] = useState('marker');
  const [error, setError] = useState('');

  useEffect(() => {
    if (layer?.style) {
      setColor(layer.style.color || '#3388ff');
      setOpacity(layer.style.opacity ?? 1);
      setWeight(layer.style.weight ?? 3);
      setSymbol(layer.style.symbol || 'marker');
    }
  }, [layer]);

  const handleSave = () => {
    if (!layer) return;

    const styleData = {
      color,
      opacity: parseFloat(opacity),
      weight: parseFloat(weight),
      symbol
    };

    onSave(styleData);
  };

  const handleClose = () => {
    setError('');
    onClose();
  };

  if (!layer) return null;

  const symbolOptions = Object.entries(ITEM_TYPE_ICON_MAP).map(([key, value]) => ({
    value: key,
    label: value.label,
    preview: value.preview
  }));

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`Style Layer: ${layer.name}`}>
      <div className="style-layer-modal">
        {error && <ErrorMessage message={error} />}
        
        <div className="form-section">
          <h3>Layer Style</h3>
          
          {/* Color */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
              Color
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                style={{ width: '100px', height: '40px', cursor: 'pointer' }}
              />
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                style={{ padding: '8px', width: '100px', border: '1px solid #ccc', borderRadius: '4px' }}
                placeholder="#3388ff"
              />
            </div>
          </div>

          {/* Stroke Width */}
          <FormField
            id="stroke-width"
            label="Stroke Width"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            type="number"
            inputProps={{ min: "1", max: "10", step: "0.5" }}
          />

          {/* Opacity */}
          <FormField
            id="opacity"
            label="Opacity"
            value={opacity}
            onChange={(e) => setOpacity(e.target.value)}
            type="number"
            inputProps={{ min: "0", max: "1", step: "0.1" }}
          />

          {/* Symbol */}
          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="symbol" style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
              Symbol
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
              {symbolOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSymbol(option.value)}
                  className={symbol === option.value ? 'symbol-btn selected' : 'symbol-btn'}
                  style={{
                    padding: '12px',
                    border: symbol === option.value ? '2px solid #007bff' : '2px solid #ccc',
                    borderRadius: '4px',
                    backgroundColor: symbol === option.value ? '#e7f3ff' : 'white',
                    cursor: 'pointer',
                    fontSize: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}
                  title={option.label}
                >
                  {option.preview}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-actions" style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #dee2e6' }}>
          <ButtonGroup
            buttons={[
              {
                label: 'Cancel',
                onClick: handleClose,
                variant: 'secondary'
              },
              {
                label: 'Save Style',
                onClick: handleSave,
                variant: 'primary'
              }
            ]}
          />
        </div>
      </div>
    </Modal>
  );
};

export default StyleLayerModal;
