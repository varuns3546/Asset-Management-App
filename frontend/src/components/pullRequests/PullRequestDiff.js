import React from 'react';
import '../../styles/pullRequest.css';

const PullRequestDiff = ({ diff, conflicts = [] }) => {
  if (!diff) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#586069' }}>
        No changes to display
      </div>
    );
  }

  const renderChangeItem = (change, entityType) => {
    const changeTypeClass = change.changeType === 'added' ? 'added' :
                           change.changeType === 'modified' ? 'modified' :
                           'deleted';

    return (
      <div key={`${entityType}-${change.entityId}`} className={`pr-change-item ${changeTypeClass}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <strong style={{ textTransform: 'capitalize' }}>
            {change.changeType} {entityType}
          </strong>
          <span style={{ fontSize: '12px', color: '#586069' }}>
            ID: {change.entityId}
          </span>
        </div>
        {change.changeType === 'modified' && (
          <div style={{ marginTop: '8px', fontSize: '14px' }}>
            <div style={{ color: '#dc3545', marginBottom: '4px' }}>
              <strong>Old:</strong> {JSON.stringify(change.oldData, null, 2).substring(0, 200)}...
            </div>
            <div style={{ color: '#28a745' }}>
              <strong>New:</strong> {JSON.stringify(change.newData, null, 2).substring(0, 200)}...
            </div>
          </div>
        )}
        {change.changeType === 'added' && (
          <div style={{ marginTop: '8px', fontSize: '14px', color: '#28a745' }}>
            <strong>New:</strong> {JSON.stringify(change.newData, null, 2).substring(0, 200)}...
          </div>
        )}
        {change.changeType === 'deleted' && (
          <div style={{ marginTop: '8px', fontSize: '14px', color: '#dc3545' }}>
            <strong>Deleted:</strong> {JSON.stringify(change.oldData, null, 2).substring(0, 200)}...
          </div>
        )}
      </div>
    );
  };

  const hasChanges = 
    (diff.project && diff.project.length > 0) ||
    (diff.hierarchy && diff.hierarchy.length > 0) ||
    (diff.assetTypes && diff.assetTypes.length > 0) ||
    (diff.gisLayers && diff.gisLayers.length > 0);

  if (!hasChanges && conflicts.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#586069' }}>
        No changes detected
      </div>
    );
  }

  return (
    <div className="pr-diff-container">
      {conflicts.length > 0 && (
        <div className="pr-conflict-warning">
          <strong>⚠️ Conflicts Detected</strong>
          <p>This pull request has {conflicts.length} conflict(s) that need to be resolved before merging.</p>
          {conflicts.map((conflict, index) => (
            <div key={index} className="pr-conflict-item">
              <strong>{conflict.entityType}</strong> - {conflict.conflictType}
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#586069' }}>
                Both source and target have modified this entity differently.
              </div>
            </div>
          ))}
        </div>
      )}

      {diff.project && diff.project.length > 0 && (
        <div className="pr-diff-section">
          <div className="pr-diff-header">Project Metadata Changes</div>
          <div className="pr-diff-content">
            {diff.project.map((change, index) => renderChangeItem(change, 'project'))}
          </div>
        </div>
      )}

      {diff.hierarchy && diff.hierarchy.length > 0 && (
        <div className="pr-diff-section">
          <div className="pr-diff-header">Hierarchy Changes ({diff.hierarchy.length})</div>
          <div className="pr-diff-content">
            {diff.hierarchy.map((change, index) => renderChangeItem(change, 'hierarchy'))}
          </div>
        </div>
      )}

      {diff.assetTypes && diff.assetTypes.length > 0 && (
        <div className="pr-diff-section">
          <div className="pr-diff-header">Asset Type Changes ({diff.assetTypes.length})</div>
          <div className="pr-diff-content">
            {diff.assetTypes.map((change, index) => renderChangeItem(change, 'asset type'))}
          </div>
        </div>
      )}

      {diff.gisLayers && diff.gisLayers.length > 0 && (
        <div className="pr-diff-section">
          <div className="pr-diff-header">GIS Layer Changes ({diff.gisLayers.length})</div>
          <div className="pr-diff-content">
            {diff.gisLayers.map((change, index) => renderChangeItem(change, 'GIS layer'))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PullRequestDiff;

