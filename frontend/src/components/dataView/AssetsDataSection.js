import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getHierarchy, getFeatureTypes } from '../../features/projects/projectSlice';
import ErrorMessage from '../forms/ErrorMessage';
import '../../styles/dataViewScreen.css';

const AssetsDataSection = ({ projectId, user }) => {
    const dispatch = useDispatch();
    const { currentHierarchy, currentFeatureTypes } = useSelector((state) => state.projects);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filterType, setFilterType] = useState('');

    useEffect(() => {
        const fetchAssets = async () => {
            if (!projectId || !user?.token) return;
            
            setLoading(true);
            setError('');
            try {
                await dispatch(getHierarchy(projectId));
                await dispatch(getFeatureTypes(projectId));
            } catch (err) {
                setError(err.message || 'Failed to load assets');
            } finally {
                setLoading(false);
            }
        };

        fetchAssets();
    }, [projectId, user, dispatch]);

    const getAssetTypeName = (itemTypeId) => {
        if (!itemTypeId || !currentFeatureTypes) return 'Untyped';
        const type = currentFeatureTypes.find(t => t.id === itemTypeId);
        return type?.title || 'Unknown Type';
    };

    const getParentName = (parentId) => {
        if (!parentId || !currentHierarchy) return 'None';
        const parent = currentHierarchy.find(a => a.id === parentId);
        return parent?.title || 'Unknown';
    };

    const formatCoordinates = (asset) => {
        const lat = asset.beginning_latitude;
        const lng = asset.beginning_longitude;
        if (lat != null && lng != null) {
            return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        }
        return 'N/A';
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleString();
        } catch {
            return dateString;
        }
    };

    const filteredAssets = currentHierarchy 
        ? (filterType 
            ? currentHierarchy.filter(asset => asset.item_type_id === filterType)
            : currentHierarchy)
        : [];

    if (loading) {
        return <div className="section-loading">Loading assets...</div>;
    }

    if (error) {
        return <ErrorMessage message={error} />;
    }

    if (!currentHierarchy || currentHierarchy.length === 0) {
        return <div className="section-empty">No assets found.</div>;
    }

    return (
        <div className="assets-data-section">
            <div className="section-filters">
                <label>
                    Filter by Type:
                    <select 
                        value={filterType} 
                        onChange={(e) => setFilterType(e.target.value)}
                        className="filter-select"
                    >
                        <option value="">All Types</option>
                        {currentFeatureTypes?.map(type => (
                            <option key={type.id} value={type.id}>
                                {type.title}
                            </option>
                        ))}
                    </select>
                </label>
            </div>

            <div className="data-table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Asset Name</th>
                            <th>Type</th>
                            <th>Parent</th>
                            <th>Coordinates</th>
                            <th>Created Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAssets.map((asset) => (
                            <tr key={asset.id}>
                                <td>{asset.title || 'Untitled'}</td>
                                <td>{getAssetTypeName(asset.item_type_id)}</td>
                                <td>{getParentName(asset.parent_id)}</td>
                                <td>{formatCoordinates(asset)}</td>
                                <td>{formatDate(asset.created_at)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="data-summary">
                <p>Total Assets: {filteredAssets.length} {filterType ? `(filtered)` : ''}</p>
            </div>
        </div>
    );
};

export default AssetsDataSection;

