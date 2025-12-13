import { useState, useCallback } from 'react';

/**
 * Custom hook for managing form reset functionality
 * @param {object} initialState - The initial state object for the form
 * @param {function} setState - The state setter function (e.g., setFormData)
 * @param {function} onReset - Optional callback to execute after reset
 * @returns {function} resetForm - Function to reset the form to initial state
 */
const useFormReset = (initialState, setState, onReset = null) => {
  const resetForm = useCallback(() => {
    setState(initialState);
    if (onReset) {
      onReset();
    }
  }, [initialState, setState, onReset]);

  return resetForm;
};

/**
 * Hook for managing form state with reset functionality
 * Combines useState with reset functionality
 * @param {object} initialState - The initial state object
 * @param {function} onReset - Optional callback to execute after reset
 * @returns {array} [formData, setFormData, resetForm]
 */
export const useFormState = (initialState, onReset = null) => {
  const [formData, setFormData] = useState(initialState);
  
  const resetForm = useCallback(() => {
    setFormData(initialState);
    if (onReset) {
      onReset();
    }
  }, [initialState, onReset]);

  return [formData, setFormData, resetForm];
};

export default useFormReset;

