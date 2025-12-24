import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  getPullRequest,
  getPullRequestComments,
  getPullRequestDiff,
  addPullRequestComment,
  addReview,
  mergePullRequest,
  rejectPullRequest,
  updatePullRequestStatus,
  clearSelectedPR
} from '../../features/pullRequests/pullRequestSlice';
import PullRequestDiff from './PullRequestDiff';
import PullRequestComment from './PullRequestComment';
import ConflictResolutionModal from './ConflictResolutionModal';
import FormField from '../forms/FormField';
import ButtonGroup from '../forms/ButtonGroup';
import ErrorMessage from '../forms/ErrorMessage';
import '../../styles/pullRequest.css';

const PullRequestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { selectedPR, comments, diff, conflicts, isLoading, isError, message } = useSelector((state) => state.pullRequests);
  const { user } = useSelector((state) => state.auth);

  const [commentText, setCommentText] = useState('');
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(getPullRequest(id));
      dispatch(getPullRequestComments(id));
      dispatch(getPullRequestDiff(id));
    }

    return () => {
      dispatch(clearSelectedPR());
    };
  }, [id, dispatch]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getUserName = (userData) => {
    if (!userData) return 'Unknown';
    return userData.user_metadata?.firstName || 
           userData.email?.split('@')[0] || 
           'Unknown';
  };

  const isOwner = selectedPR?.target_project?.owner_id === user?.id;
  const isCreator = selectedPR?.created_by === user?.id;
  const canMerge = isOwner && selectedPR?.status === 'open';
  const canReview = isOwner && selectedPR?.status === 'open';

  const handleAddComment = async () => {
    if (!commentText.trim()) return;

    setIsSubmitting(true);
    try {
      await dispatch(addPullRequestComment({
        prId: id,
        commentData: {
          comment: commentText.trim(),
          isReviewComment: false
        }
      })).unwrap();
      setCommentText('');
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReview = async (reviewAction) => {
    setIsSubmitting(true);
    try {
      await dispatch(addReview({
        prId: id,
        reviewData: {
          reviewAction,
          comment: commentText.trim() || `${reviewAction} this pull request`
        }
      })).unwrap();
      setCommentText('');
    } catch (error) {
      console.error('Error adding review:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMerge = async () => {
    if (conflicts && conflicts.length > 0) {
      setShowConflictModal(true);
      return;
    }

    setIsSubmitting(true);
    try {
      await dispatch(mergePullRequest({ prId: id, resolutions: [] })).unwrap();
      navigate('/pull-requests');
    } catch (error) {
      if (error.includes('Conflicts detected')) {
        setShowConflictModal(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolveConflicts = async (resolutions) => {
    setIsSubmitting(true);
    try {
      await dispatch(mergePullRequest({ prId: id, resolutions })).unwrap();
      setShowConflictModal(false);
      navigate('/pull-requests');
    } catch (error) {
      console.error('Error merging with resolutions:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!window.confirm('Are you sure you want to reject this pull request?')) {
      return;
    }

    setIsSubmitting(true);
    try {
      await dispatch(rejectPullRequest(id)).unwrap();
      navigate('/pull-requests');
    } catch (error) {
      console.error('Error rejecting PR:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = async () => {
    if (selectedPR?.status === 'open') {
      await dispatch(updatePullRequestStatus({ prId: id, status: 'closed' })).unwrap();
    }
  };

  if (isLoading && !selectedPR) {
    return <div className="pr-detail-container">Loading pull request...</div>;
  }

  if (isError || !selectedPR) {
    return (
      <div className="pr-detail-container">
        <ErrorMessage message={message || 'Pull request not found'} />
        <button onClick={() => navigate('/pull-requests')} className="btn btn-secondary">
          Back to Pull Requests
        </button>
      </div>
    );
  }

  return (
    <div className="pr-detail-container">
      <div className="pr-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <h1 className="pr-title">{selectedPR.title}</h1>
          <span
            className="pr-status-badge"
            style={{
              backgroundColor: selectedPR.status === 'open' ? '#28a745' :
                              selectedPR.status === 'merged' ? '#6f42c1' :
                              selectedPR.status === 'rejected' ? '#dc3545' : '#6c757d',
              color: 'white',
              padding: '6px 12px',
              borderRadius: '16px',
              fontSize: '14px',
              fontWeight: '600',
              textTransform: 'uppercase'
            }}
          >
            {selectedPR.status}
          </span>
        </div>

        <div className="pr-meta">
          <span>
            <strong>{getUserName(selectedPR.creator)}</strong> wants to merge changes from{' '}
            <strong>{selectedPR.source_project?.title || 'Source'}</strong> into{' '}
            <strong>{selectedPR.target_project?.title || 'Master'}</strong>
          </span>
        </div>

        <div className="pr-meta">
          <span>Created {formatDate(selectedPR.created_at)}</span>
          {selectedPR.merged_at && (
            <span>Merged {formatDate(selectedPR.merged_at)} by {getUserName(selectedPR.merger)}</span>
          )}
        </div>

        {selectedPR.description && (
          <div style={{ marginTop: '16px', padding: '16px', background: '#f6f8fa', borderRadius: '6px' }}>
            <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{selectedPR.description}</p>
          </div>
        )}

        {canMerge && (
          <div className="pr-actions">
            <button
              className="btn btn-primary"
              onClick={handleMerge}
              disabled={isSubmitting}
              style={{ backgroundColor: '#28a745', borderColor: '#28a745' }}
            >
              {isSubmitting ? 'Merging...' : 'Merge Pull Request'}
            </button>
            {canReview && (
              <>
                <button
                  className="btn btn-secondary"
                  onClick={() => handleReview('approve')}
                  disabled={isSubmitting}
                >
                  Approve
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => handleReview('request_changes')}
                  disabled={isSubmitting}
                >
                  Request Changes
                </button>
              </>
            )}
            <button
              className="btn"
              onClick={handleReject}
              disabled={isSubmitting}
              style={{ backgroundColor: '#dc3545', color: 'white', borderColor: '#dc3545' }}
            >
              Reject
            </button>
          </div>
        )}

        {isCreator && selectedPR.status === 'open' && (
          <div className="pr-actions">
            <button
              className="btn btn-secondary"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Close Pull Request
            </button>
          </div>
        )}
      </div>

      <div style={{ marginTop: '24px' }}>
        <h2 style={{ marginBottom: '16px' }}>Changes</h2>
        <PullRequestDiff diff={diff} conflicts={conflicts} />
      </div>

      <div style={{ marginTop: '32px' }}>
        <h2 style={{ marginBottom: '16px' }}>Comments</h2>

        {comments && comments.length > 0 ? (
          <div>
            {comments.map((comment) => (
              <PullRequestComment key={comment.id} comment={comment} />
            ))}
          </div>
        ) : (
          <p style={{ color: '#586069', fontStyle: 'italic' }}>No comments yet</p>
        )}

        <div style={{ marginTop: '24px', padding: '16px', border: '1px solid #e1e4e8', borderRadius: '6px', background: 'white' }}>
          <FormField
            label="Add a comment:"
            id="pr-comment-input"
            type="textarea"
            placeholder="Leave a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            rows={4}
            disabled={isSubmitting}
          />
          <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
            <button
              className="btn btn-primary"
              onClick={handleAddComment}
              disabled={isSubmitting || !commentText.trim()}
            >
              {isSubmitting ? 'Posting...' : 'Comment'}
            </button>
            {canReview && (
              <>
                <button
                  className="btn btn-secondary"
                  onClick={() => handleReview('approve')}
                  disabled={isSubmitting || !commentText.trim()}
                >
                  Approve
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => handleReview('request_changes')}
                  disabled={isSubmitting || !commentText.trim()}
                >
                  Request Changes
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {showConflictModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '8px',
            maxWidth: '90%',
            maxHeight: '90%',
            overflow: 'auto'
          }}>
            <ConflictResolutionModal
              conflicts={conflicts}
              onResolve={handleResolveConflicts}
              onCancel={() => setShowConflictModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PullRequestDetail;

