import { useState, useCallback } from 'react';

/**
 * Custom hook for handling async operations with loading and error states
 * @param {function} operation - The async function to execute
 * @param {object} options - Configuration options
 * @param {function} options.onSuccess - Callback on successful operation
 * @param {function} options.onError - Callback on error (receives error as parameter)
 * @param {boolean} options.resetErrorOnExecute - Whether to reset error before executing (default: true)
 * @returns {object} { execute, loading, error, resetError }
 */
const useAsyncOperation = (operation, options = {}) => {
  const { onSuccess, onError, resetErrorOnExecute = true } = options;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    if (resetErrorOnExecute) {
      setError(null);
    }
    setLoading(true);

    try {
      const result = await operation(...args);
      setLoading(false);
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (err) {
      const errorMessage = err?.message || err?.response?.data?.error || 'An error occurred';
      setError(errorMessage);
      setLoading(false);
      
      if (onError) {
        onError(err);
      }
      
      throw err;
    }
  }, [operation, onSuccess, onError, resetErrorOnExecute]);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return { execute, loading, error, resetError };
};

export default useAsyncOperation;

