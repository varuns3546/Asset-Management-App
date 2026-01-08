import React from 'react';
import '../styles/storageWarning.css';

const StorageWarningBanner = ({ metrics, onExport, onManageStorage, onDismiss }) => {
  if (!metrics?.overallWarning) return null;

  const criticalWarning = metrics.criticalWarning || metrics.database.percentage > 90 || metrics.storage.percentage > 90;

  return (
    <div className={`storage-warning-banner ${criticalWarning ? 'critical' : 'warning'}`}>
      <div className="warning-icon">⚠️</div>
      <div className="warning-content">
        <h3 className="warning-title">
          {criticalWarning ? 'Critical: Storage Limit Nearly Reached!' : 'Storage Warning'}
        </h3>
        <div className="warning-details">
          <div className="warning-metric">
            <strong>Database:</strong> {metrics.database.sizeFormatted} / {metrics.database.limitFormatted}
            ({metrics.database.percentage.toFixed(1)}%)
            {metrics.database.percentage > 80 && <span className="warning-badge">!</span>}
          </div>
          <div className="warning-metric">
            <strong>Storage:</strong> {metrics.storage.sizeFormatted} / {metrics.storage.limitFormatted}
            ({metrics.storage.percentage.toFixed(1)}%)
            {metrics.storage.percentage > 80 && <span className="warning-badge">!</span>}
          </div>
        </div>
        <p className="warning-message">
          {criticalWarning 
            ? 'You are approaching the free tier limit. Please export and clean up data to avoid service interruption.'
            : 'You are using a significant portion of your free tier storage.'}
        </p>
        <div className="warning-actions">
          <button onClick={onExport} className="export-button">
            📥 Export Project Data
          </button>
          {onManageStorage && (
            <button onClick={onManageStorage} className="manage-button">
              🗑️ Manage Storage
            </button>
          )}
        </div>
      </div>
      {onDismiss && (
        <button 
          className="close-warning"
          onClick={onDismiss}
          title="Dismiss warning"
        >
          ×
        </button>
      )}
    </div>
  );
};

export default StorageWarningBanner;

