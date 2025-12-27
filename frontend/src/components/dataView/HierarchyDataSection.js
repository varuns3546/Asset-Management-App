import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getHierarchy, getFeatureTypes } from '../../features/projects/projectSlice';
import HierarchyTree from '../structure/HierarchyTree';
import ErrorMessage from '../forms/ErrorMessage';
import '../../styles/dataViewScreen.css';

const HierarchyDataSection = ({ projectId, user }) => {
    const dispatch = useDispatch();
    const { currentHierarchy, currentFeatureTypes } = useSelector((state) => state.projects);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchHierarchy = async () => {
            if (!projectId || !user?.token) return;
            
            setLoading(true);
            setError('');
            try {
                await dispatch(getHierarchy(projectId));
                await dispatch(getFeatureTypes(projectId));
            } catch (err) {
                setError(err.message || 'Failed to load hierarchy');
            } finally {
                setLoading(false);
            }
        };

        fetchHierarchy();
    }, [projectId, user, dispatch]);

    if (loading) {
        return <div className="section-loading">Loading hierarchy...</div>;
    }

    if (error) {
        return <ErrorMessage message={error} />;
    }

    if (!currentHierarchy || currentHierarchy.length === 0) {
        return <div className="section-empty">No hierarchy data found.</div>;
    }

    return (
        <div className="hierarchy-data-section">
            <div className="hierarchy-view-container">
                <HierarchyTree 
                    hierarchyItems={currentHierarchy}
                    itemTypes={currentFeatureTypes || []}
                    onItemClick={() => {}} // Read-only, no action on click
                    onRemoveItem={() => {}} // Read-only, no delete
                />
            </div>
            <div className="data-summary">
                <p>Total Assets: {currentHierarchy.length}</p>
            </div>
        </div>
    );
};

export default HierarchyDataSection;

