import { createContext, useContext, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const RouteMountContext = createContext(null);

/**
 * Provider component that provides route mount checking functionality
 * Should be used in App.js to wrap all routes
 */
export const RouteMountProvider = ({ children }) => {
  return (
    <RouteMountContext.Provider value={{}}>
      {children}
    </RouteMountContext.Provider>
  );
};

/**
 * Hook to check if the current route is still mounted
 * Automatically tracks the route when the component mounts
 * 
 * @returns {Object} Object with isRouteMounted function
 * 
 * @example
 * const { isRouteMounted } = useRouteMount();
 * 
 * const loadData = async () => {
 *   const data = await fetchData();
 *   if (isRouteMounted()) {
 *     setData(data);
 *   }
 * };
 */
export const useRouteMount = () => {
  const context = useContext(RouteMountContext);
  if (!context) {
    throw new Error('useRouteMount must be used within RouteMountProvider');
  }
  
  const location = useLocation();
  const mountedRouteRef = useRef(null);
  const isMountedRef = useRef(true);

  // Set the mounted route only once when component mounts
  useEffect(() => {
    // Only set on initial mount
    if (mountedRouteRef.current === null) {
      mountedRouteRef.current = location.pathname;
      isMountedRef.current = true;
    }

    // Cleanup: mark as unmounted when route changes
    return () => {
      isMountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - intentionally capture location.pathname only on mount

  // Check if route changed (component unmounted or navigated away)
  useEffect(() => {
    // If route changed from the mounted route, component is effectively unmounted
    if (mountedRouteRef.current !== null && location.pathname !== mountedRouteRef.current) {
      isMountedRef.current = false;
    }
  }, [location.pathname]);

  /**
   * Check if the component is still on the same route it was mounted on
   * @returns {boolean} True if still on the same route
   */
  const isRouteMounted = () => {
    return isMountedRef.current && 
           mountedRouteRef.current !== null && 
           location.pathname === mountedRouteRef.current;
  };

  return { isRouteMounted };
};

