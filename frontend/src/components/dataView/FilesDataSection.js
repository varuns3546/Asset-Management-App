import { useState, useEffect } from 'react';
import fileService from '../../services/fileService';
import ErrorMessage from '../forms/ErrorMessage';
import '../../styles/dataViewScreen.css';

const FilesDataSection = ({ projectId, user }) => {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [downloading, setDownloading] = useState({});

    useEffect(() => {
        const fetchFiles = async () => {
            if (!projectId) return;
            
            setLoading(true);
            setError('');
            try {
                const result = await fileService.listFiles(projectId);
                if (result.success) {
                    setFiles(result.data || []);
                } else {
                    setError(result.error || 'Failed to load files');
                }
            } catch (err) {
                setError(err.response?.data?.error || err.message || 'Failed to load files');
            } finally {
                setLoading(false);
            }
        };

        fetchFiles();
    }, [projectId]);

    const handleDownload = async (file) => {
        if (downloading[file.id]) return;
        
        setDownloading(prev => ({ ...prev, [file.id]: true }));
        try {
            const result = await fileService.getFileUrl(projectId, file.id);
            if (result.success && result.data) {
                // Open download URL
                window.open(result.data.url, '_blank');
            } else {
                alert('Failed to get download URL');
            }
        } catch (err) {
            alert('Failed to download file: ' + (err.message || 'Unknown error'));
        } finally {
            setDownloading(prev => ({ ...prev, [file.id]: false }));
        }
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
        return <div className="section-loading">Loading files...</div>;
    }

    if (error) {
        return <ErrorMessage message={error} />;
    }

    if (files.length === 0) {
        return <div className="section-empty">No files found.</div>;
    }

    return (
        <div className="files-data-section">
            <div className="data-table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>File Name</th>
                            <th>Size</th>
                            <th>Type</th>
                            <th>Upload Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {files.map((file) => (
                            <tr key={file.id}>
                                <td>
                                    <span className="file-icon">{fileService.getFileIcon(file.mime_type)}</span>
                                    {file.file_name}
                                </td>
                                <td>{fileService.formatFileSize(file.file_size || 0)}</td>
                                <td>{file.mime_type || 'Unknown'}</td>
                                <td>{formatDate(file.created_at)}</td>
                                <td>
                                    <button 
                                        className="btn btn-primary btn-small"
                                        onClick={() => handleDownload(file)}
                                        disabled={downloading[file.id]}
                                    >
                                        {downloading[file.id] ? 'Downloading...' : 'Download'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="data-summary">
                <p>Total Files: {files.length}</p>
                <p>Total Size: {fileService.formatFileSize(files.reduce((sum, f) => sum + (f.file_size || 0), 0))}</p>
            </div>
        </div>
    );
};

export default FilesDataSection;

