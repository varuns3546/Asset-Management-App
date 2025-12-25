import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import ButtonGroup from '../forms/ButtonGroup';
import ErrorMessage from '../forms/ErrorMessage';
import '../../styles/pullRequest.css';

const ConflictResolutionModal = ({ conflicts, onResolve, onCancel }) => {
  const { selectedPR } = useSelector((state) => state.pullRequests);
  const [resolutions, setResolutions] = useState({});
  const [error, setError] = useState('');

  const handleResolutionChange = (conflictIndex, action, data = null) => {
    setResolutions({
      ...resolutions,
      [conflictIndex]: { action, data }
    });
  };

  const handleSubmit = () => {
    // Validate all conflicts have resolutions
    const unresolved = conflicts.filter((_, index) => !resolutions[index]);
    if (unresolved.length > 0) {
      setError(`Please resolve all ${unresolved.length} conflict(s)`);
      return;
    }

    const resolutionArray = conflicts.map((conflict, index) => ({
      entityType: conflict.entityType,
      entityId: conflict.entityId,
      ...resolutions[index]
    }));

    onResolve(resolutionArray);
  };

  return (
    <div style={{ padding: '24px', maxWidth: '800px', maxHeight: '80vh', overflowY: 'auto' }}>
      <h2 style={{ marginTop: 0, marginBottom: '20px' }}>
        Resolve Conflicts
      </h2>
      <p style={{ color: '#586069', marginBottom: '20px' }}>
        The following conflicts need to be resolved before merging:
      </p>

      <ErrorMessage message={error} />

      <div style={{ marginBottom: '24px' }}>
        {conflicts.map((conflict, index) => (
          <div key={index} style={{
            padding: '16px',
            marginBottom: '16px',
            border: '2px solid #ffc107',
            borderRadius: '6px',
            background: '#fffbf0'
          }}>
            <div style={{ marginBottom: '12px' }}>
              <strong style={{ fontSize: '16px' }}>
                {conflict.entityType} - {conflict.conflictType}
              </strong>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div style={{ padding: '12px', background: '#fff5f5', borderRadius: '4px', border: '1px solid #fcc' }}>
                <strong style={{ color: '#dc3545' }}>Source (Your Changes):</strong>
                <pre style={{ fontSize: '12px', marginTop: '8px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {JSON.stringify(conflict.sourceData, null, 2).substring(0, 300)}...
                </pre>
              </div>
              <div style={{ padding: '12px', background: '#f0f9ff', borderRadius: '4px', border: '1px solid #b3d9ff' }}>
                <strong style={{ color: '#0369a1' }}>Target (Master):</strong>
                <pre style={{ fontSize: '12px', marginTop: '8px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {JSON.stringify(conflict.targetData, null, 2).substring(0, 300)}...
                </pre>
              </div>
            </div>

            <div style={{ marginTop: '12px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                Resolution:
              </label>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => handleResolutionChange(index, 'keep_source')}
                  style={{
                    padding: '8px 16px',
                    border: resolutions[index]?.action === 'keep_source' ? '2px solid #28a745' : '1px solid #d1d5db',
                    borderRadius: '6px',
                    background: resolutions[index]?.action === 'keep_source' ? '#28a745' : 'white',
                    color: resolutions[index]?.action === 'keep_source' ? 'white' : '#24292e',
                    cursor: 'pointer',
                    fontWeight: resolutions[index]?.action === 'keep_source' ? '600' : '400'
                  }}
                >
                  Keep Source (Your Changes)
                </button>
                <button
                  type="button"
                  onClick={() => handleResolutionChange(index, 'keep_target')}
                  style={{
                    padding: '8px 16px',
                    border: resolutions[index]?.action === 'keep_target' ? '2px solid #0366d6' : '1px solid #d1d5db',
                    borderRadius: '6px',
                    background: resolutions[index]?.action === 'keep_target' ? '#0366d6' : 'white',
                    color: resolutions[index]?.action === 'keep_target' ? 'white' : '#24292e',
                    cursor: 'pointer',
                    fontWeight: resolutions[index]?.action === 'keep_target' ? '600' : '400'
                  }}
                >
                  Keep Target (Master)
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ButtonGroup
        buttons={[
          {
            label: 'Cancel',
            variant: 'secondary',
            onClick: onCancel
          },
          {
            label: 'Resolve and Merge',
            variant: 'primary',
            onClick: handleSubmit,
            disabled: Object.keys(resolutions).length !== conflicts.length
          }
        ]}
      />
    </div>
  );
};

export default ConflictResolutionModal;

