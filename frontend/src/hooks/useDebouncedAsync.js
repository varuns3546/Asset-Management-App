import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for debouncing async operations to prevent excessive re-renders and API calls
 * 
 * @param {Function} asyncFn - The async function to execute
 * @param {Array} dependencies - Dependencies that trigger the async operation
 * @param {Object} options - Configuration options
 * @param {number} options.delay - Debounce delay in milliseconds (default: 500)
 * @param {Function} options.shouldRun - Function to determine if the operation should run (receives dependencies)
 * @param {Function} options.onComplete - Callback when operation completes
 * @param {Function} options.onError - Callback when operation errors
 * @param {boolean} options.skipInitialRun - Skip running on initial mount (default: false)
 * 
 * @returns {Object} - { isRunning, cancel, execute }
 */
const useDebouncedAsync = (asyncFn, dependencies = [], options = {}) => {
  const {
    delay = 500,
    shouldRun = () => true,
    onComplete,
    onError,
    skipInitialRun = false
  } = options;

  const timeoutRef = useRef(null);
  const isRunningRef = useRef(false);
  const lastDepsRef = useRef(null);
  const isMountedRef = useRef(true);
  const hasRunRef = useRef(false);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Cancel pending operation
  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Execute immediately (bypass debounce)
  const execute = useCallback(async () => {
    cancel();
    if (isRunningRef.current) return;
    
    isRunningRef.current = true;
    try {
      const result = await asyncFn();
      if (isMountedRef.current && onComplete) {
        onComplete(result);
      }
      return result;
    } catch (error) {
      if (isMountedRef.current && onError) {
        onError(error);
      }
      throw error;
    } finally {
      isRunningRef.current = false;
    }
  }, [asyncFn, onComplete, onError, cancel]);

  useEffect(() => {
    // Skip initial run if requested
    if (skipInitialRun && !hasRunRef.current) {
      hasRunRef.current = true;
      lastDepsRef.current = dependencies;
      return;
    }

    // Check if dependencies actually changed
    const depsChanged = JSON.stringify(dependencies) !== JSON.stringify(lastDepsRef.current);
    if (!depsChanged) {
      return; // No change, skip
    }

    // Check if we should run
    if (!shouldRun(dependencies)) {
      lastDepsRef.current = dependencies;
      return;
    }

    // Clear any pending operation
    cancel();

    // Capture current dependencies for the timeout
    const currentDeps = JSON.stringify(dependencies);
    
    // Set up debounced execution
    timeoutRef.current = setTimeout(async () => {
      // Prevent multiple simultaneous executions
      if (isRunningRef.current) {
        return;
      }

      // Double-check dependencies haven't changed during delay
      const depsAtExecution = JSON.stringify(dependencies);
      if (depsAtExecution === currentDeps && isMountedRef.current) {
        isRunningRef.current = true;
        
        try {
          const result = await asyncFn();
          if (isMountedRef.current) {
            lastDepsRef.current = dependencies;
            if (onComplete) {
              onComplete(result);
            }
          }
        } catch (error) {
          if (isMountedRef.current && onError) {
            onError(error);
          }
        } finally {
          isRunningRef.current = false;
        }
      }
    }, delay);

    // Update last deps reference
    lastDepsRef.current = dependencies;

    // Cleanup
    return () => {
      cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  return {
    isRunning: isRunningRef.current,
    cancel,
    execute
  };
};

export default useDebouncedAsync;
