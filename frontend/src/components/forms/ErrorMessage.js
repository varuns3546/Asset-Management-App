import React from 'react';

/**
 * Reusable error message component
 * @param {string} message - Error message to display
 * @param {string} className - Additional CSS classes
 * @param {object} style - Inline styles
 */
const ErrorMessage = ({ message, className = '', style = {} }) => {
  if (!message) return null;

  return (
    <div className={`error-message ${className}`} style={style}>
      {message}
    </div>
  );
};

export default ErrorMessage;

