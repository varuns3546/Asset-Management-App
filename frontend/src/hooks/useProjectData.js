import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useSelector } from 'react-redux';
import { loadUser } from '../features/auth/authSlice';
import { reset } from '../features/projects/projectSlice';

/**
 * Custom hook for screens that depend on project data.
 * Handles common patterns:
 * - Loading user on mount
 * - Resetting project state on cleanup
 * - Providing selectedProject and user from Redux
 * 
 * @param {Function} onProjectChange - Optional callback when project/user changes
 * @returns {Object} { selectedProject, user, dispatch }
 */
const useProjectData = (onProjectChange = null) => {
  const dispatch = useDispatch();
  const { selectedProject } = useSelector((state) => state.projects);
  const { user } = useSelector((state) => state.auth);

  // Load user on mount
  useEffect(() => {
    dispatch(loadUser());
  }, [dispatch]);

  // Reset project state on cleanup
  useEffect(() => {
    return () => {
      dispatch(reset());
    };
  }, [dispatch]);

  // Call onProjectChange when project or user changes
  useEffect(() => {
    if (onProjectChange && selectedProject && user) {
      onProjectChange(selectedProject, user);
    }
  }, [selectedProject, user, onProjectChange]);

  return { selectedProject, user, dispatch };
};

export default useProjectData;

