import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getPullRequests } from '../../features/pullRequests/pullRequestSlice';
import PullRequestCard from './PullRequestCard';
import '../../styles/pullRequest.css';

const PullRequestList = ({ projectId = null, statusFilter = null }) => {
  const dispatch = useDispatch();
  const { pullRequests, isLoading, isError, message } = useSelector((state) => state.pullRequests);
  const [localStatusFilter, setLocalStatusFilter] = useState(statusFilter || 'all');

  useEffect(() => {
    const filters = {};
    if (projectId) filters.projectId = projectId;
    if (localStatusFilter !== 'all') filters.status = localStatusFilter;
    
    dispatch(getPullRequests(filters));
  }, [dispatch, projectId, localStatusFilter]);

  const filteredPRs = pullRequests.filter(pr => {
    if (localStatusFilter === 'all') return true;
    return pr.status === localStatusFilter;
  });

  if (isLoading) {
    return <div className="pr-list-loading">Loading pull requests...</div>;
  }

  if (isError) {
    return (
      <div className="pr-list-error" style={{ padding: '20px', color: 'red' }}>
        Error: {message}
      </div>
    );
  }

  return (
    <div className="pr-list-container">
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>Pull Requests</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className={`pr-filter-btn ${localStatusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setLocalStatusFilter('all')}
            style={{
              padding: '6px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              background: localStatusFilter === 'all' ? '#0366d6' : 'white',
              color: localStatusFilter === 'all' ? 'white' : '#586069',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            All
          </button>
          <button
            className={`pr-filter-btn ${localStatusFilter === 'open' ? 'active' : ''}`}
            onClick={() => setLocalStatusFilter('open')}
            style={{
              padding: '6px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              background: localStatusFilter === 'open' ? '#28a745' : 'white',
              color: localStatusFilter === 'open' ? 'white' : '#586069',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Open
          </button>
          <button
            className={`pr-filter-btn ${localStatusFilter === 'merged' ? 'active' : ''}`}
            onClick={() => setLocalStatusFilter('merged')}
            style={{
              padding: '6px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              background: localStatusFilter === 'merged' ? '#6f42c1' : 'white',
              color: localStatusFilter === 'merged' ? 'white' : '#586069',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Merged
          </button>
          <button
            className={`pr-filter-btn ${localStatusFilter === 'closed' ? 'active' : ''}`}
            onClick={() => setLocalStatusFilter('closed')}
            style={{
              padding: '6px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              background: localStatusFilter === 'closed' ? '#6c757d' : 'white',
              color: localStatusFilter === 'closed' ? 'white' : '#586069',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Closed
          </button>
        </div>
      </div>

      {filteredPRs.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#586069' }}>
          <p>No pull requests found</p>
          {localStatusFilter !== 'all' && (
            <button
              onClick={() => setLocalStatusFilter('all')}
              style={{
                marginTop: '12px',
                padding: '8px 16px',
                background: '#0366d6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Show All
            </button>
          )}
        </div>
      ) : (
        <div>
          {filteredPRs.map((pr) => (
            <PullRequestCard key={pr.id} pullRequest={pr} />
          ))}
        </div>
      )}
    </div>
  );
};

export default PullRequestList;

