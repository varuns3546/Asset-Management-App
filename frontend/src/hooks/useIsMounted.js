import { useEffect, useRef } from 'react';

/**
 * Custom hook to track if a component is mounted
 * Prevents state updates after component unmounts
 * 
 * @returns {Object} Object with isMounted function to check mount status
 * 
 * @example
 * const { isMounted } = useIsMounted();
 * 
 * const loadData = async () => {
 *   const data = await fetchData();
 *   if (isMounted()) {
 *     setData(data);
 *   }
 * };
 */
export const useIsMounted = () => {
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const isMounted = () => isMountedRef.current;

  return { isMounted };
};

