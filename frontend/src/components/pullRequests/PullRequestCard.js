import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/pullRequest.css';

const PullRequestCard = ({ pullRequest }) => {
  const navigate = useNavigate();

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return '#28a745';
      case 'merged':
        return '#6f42c1';
      case 'closed':
        return '#6c757d';
      case 'rejected':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };

  const getStatusBadge = (status) => {
    const color = getStatusColor(status);
    return (
      <span
        className="pr-status-badge"
        style={{
          backgroundColor: color,
          color: 'white',
          padding: '4px 8px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: '600',
          textTransform: 'uppercase'
        }}
      >
        {status}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const creatorName = pullRequest.creator?.user_metadata?.firstName || 
                     pullRequest.creator?.email?.split('@')[0] || 
                     'Unknown';

  return (
    <div
      className="pr-card"
      onClick={() => navigate(`/pull-requests/${pullRequest.id}`)}
      style={{
        padding: '16px',
        border: '1px solid #e1e4e8',
        borderRadius: '8px',
        marginBottom: '12px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        background: 'white'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#0366d6';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#e1e4e8';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#0366d6' }}>
            {pullRequest.title}
          </h3>
          <div style={{ fontSize: '14px', color: '#586069', marginBottom: '8px' }}>
            <span style={{ fontWeight: '600' }}>{creatorName}</span>
            {' wants to merge changes from '}
            <span style={{ fontWeight: '600' }}>{pullRequest.source_project?.title || 'Source Project'}</span>
            {' into '}
            <span style={{ fontWeight: '600' }}>{pullRequest.target_project?.title || 'Master Project'}</span>
          </div>
          {pullRequest.description && (
            <p style={{ fontSize: '14px', color: '#586069', margin: '8px 0', maxHeight: '60px', overflow: 'hidden' }}>
              {pullRequest.description}
            </p>
          )}
        </div>
        <div style={{ marginLeft: '16px' }}>
          {getStatusBadge(pullRequest.status)}
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#586069' }}>
        <span>Created {formatDate(pullRequest.created_at)}</span>
        {pullRequest.merged_at && (
          <span>Merged {formatDate(pullRequest.merged_at)}</span>
        )}
      </div>
    </div>
  );
};

export default PullRequestCard;

