import React from 'react';
import '../../styles/pullRequest.css';

const PullRequestComment = ({ comment }) => {
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getUserName = (user) => {
    if (!user) return 'Unknown';
    return user.user_metadata?.firstName || 
           user.email?.split('@')[0] || 
           'Unknown';
  };

  const getReviewBadge = (reviewAction) => {
    if (!reviewAction) return null;

    const badges = {
      approve: { text: 'Approved', class: 'approve' },
      request_changes: { text: 'Requested Changes', class: 'request-changes' },
      comment: { text: 'Commented', class: 'comment' }
    };

    const badge = badges[reviewAction];
    if (!badge) return null;

    return (
      <span className={`pr-review-badge ${badge.class}`}>
        {badge.text}
      </span>
    );
  };

  return (
    <div className="pr-comment">
      <div className="pr-comment-header">
        <div>
          <span className="pr-comment-author">
            {getUserName(comment.user)}
          </span>
          {comment.is_review_comment && getReviewBadge(comment.review_action)}
        </div>
        <span className="pr-comment-date">
          {formatDate(comment.created_at)}
        </span>
      </div>
      <div className="pr-comment-body">
        {comment.comment}
      </div>
    </div>
  );
};

export default PullRequestComment;

