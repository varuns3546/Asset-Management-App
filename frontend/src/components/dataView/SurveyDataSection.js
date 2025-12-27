import { useState, useEffect } from 'react';
import surveyService from '../../services/surveyService';
import ErrorMessage from '../forms/ErrorMessage';
import '../../styles/dataViewScreen.css';

const SurveyDataSection = ({ projectId, user }) => {
    const [responses, setResponses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchResponses = async () => {
            if (!projectId || !user?.token) return;
            
            setLoading(true);
            setError('');
            try {
                const result = await surveyService.getProjectResponses(projectId, user.token);
                if (result.success) {
                    setResponses(result.data || []);
                } else {
                    setError(result.error || 'Failed to load survey responses');
                }
            } catch (err) {
                setError(err.response?.data?.error || err.message || 'Failed to load survey responses');
            } finally {
                setLoading(false);
            }
        };

        fetchResponses();
    }, [projectId, user]);

    const getPhotoCount = (response) => {
        if (response.response_metadata && response.response_metadata.photos) {
            return Array.isArray(response.response_metadata.photos) 
                ? response.response_metadata.photos.length 
                : 0;
        }
        return 0;
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleString();
        } catch {
            return dateString;
        }
    };

    if (loading) {
        return <div className="section-loading">Loading survey data...</div>;
    }

    if (error) {
        return <ErrorMessage message={error} />;
    }

    if (responses.length === 0) {
        return <div className="section-empty">No survey responses found.</div>;
    }

    return (
        <div className="survey-data-section">
            <div className="data-table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Asset Name</th>
                            <th>Asset Type</th>
                            <th>Attribute/Question</th>
                            <th>Response Value</th>
                            <th>Date</th>
                            <th>Photos</th>
                        </tr>
                    </thead>
                    <tbody>
                        {responses.map((response) => (
                            <tr key={response.id}>
                                <td>{response.assets?.title || 'Unknown Asset'}</td>
                                <td>{response.asset_types?.title || 'N/A'}</td>
                                <td>{response.attribute_title || 'N/A'}</td>
                                <td>{response.response_value || 'N/A'}</td>
                                <td>{formatDate(response.created_at)}</td>
                                <td>
                                    {getPhotoCount(response) > 0 ? (
                                        <span className="photo-count">{getPhotoCount(response)} photo(s)</span>
                                    ) : (
                                        'None'
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="data-summary">
                <p>Total Responses: {responses.length}</p>
            </div>
        </div>
    );
};

export default SurveyDataSection;

