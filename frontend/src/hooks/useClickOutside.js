import { useEffect, useRef } from 'react';

/**
 * Custom hook to detect clicks outside of a component
 * @param {function} handler - Callback function to execute when click outside is detected
 * @param {boolean} isEnabled - Whether the hook is enabled (default: true)
 */
const useClickOutside = (handler, isEnabled = true) => {
  const ref = useRef(null);

  useEffect(() => {
    if (!isEnabled) return;

    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        handler(event);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handler, isEnabled]);

  return ref;
};

export default useClickOutside;

