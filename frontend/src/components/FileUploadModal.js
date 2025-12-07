import { useState, useEffect } from 'react';
import Modal from './Modal';
import * as fileService from '../services/fileService';
import '../styles/modal.css';

const FileUploadModal = ({ isOpen, onClose, onFileSelect, projectId }) => {
    const [activeTab, setActiveTab] = useState('computer'); // 'computer' or 'cloud'
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [cloudFiles, setCloudFiles] = useState([]);
    const [selectedCloudFile, setSelectedCloudFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadingToCloud, setUploadingToCloud] = useState(false);
    const [loadingCloudFiles, setLoadingCloudFiles] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState('');

    const acceptedFileTypes = [
        '.xlsx',
        '.xls',
        '.xlsm',
        '.csv',
        '.tsv'
    ];

    // Load cloud files when switching to cloud tab
    useEffect(() => {
        if (isOpen && activeTab === 'cloud' && projectId) {
            loadCloudFiles();
        }
    }, [isOpen, activeTab, projectId]);

    const loadCloudFiles = async () => {
        if (!projectId) return;
        
        setLoadingCloudFiles(true);
        setError('');
        
        try {
            const response = await fileService.listFiles(projectId);
            if (response.success) {
                setCloudFiles(response.data || []);
            }
        } catch (err) {
            console.error('Error loading cloud files:', err);
            setError('Failed to load cloud files');
        } finally {
            setLoadingCloudFiles(false);
        }
    };

    const handleFileChange = (e) => {
        const newFiles = Array.from(e.target.files);
        if (newFiles.length > 0) {
            // Validate all file types
            const invalidFiles = newFiles.filter(file => {
                const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
                return !acceptedFileTypes.includes(fileExtension);
            });

            if (invalidFiles.length > 0) {
                setError(`Invalid file type(s). Please upload only: ${acceptedFileTypes.join(', ')}`);
                return;
            }
            
            // Filter out duplicates based on file name and size
            const uniqueNewFiles = newFiles.filter(newFile => {
                return !selectedFiles.some(existingFile => 
                    existingFile.name === newFile.name && 
                    existingFile.size === newFile.size
                );
            });
            
            // Add new files on top of existing files (silently skip duplicates)
            if (uniqueNewFiles.length > 0) {
                setSelectedFiles([...uniqueNewFiles, ...selectedFiles]);
                setError('');
            }
        }

        // Reset the input so the same files can be selected again if removed
        e.target.value = '';
    };

    // Upload file to cloud storage
    const handleUploadToCloud = async () => {
        if (selectedFiles.length === 0 || !projectId) return;

        setUploadingToCloud(true);
        setError('');

        try {
            for (const file of selectedFiles) {
                await fileService.uploadFile(projectId, file, (progress) => {
                    setUploadProgress(progress);
                });
            }
            
            // Refresh cloud files list
            await loadCloudFiles();
            setSelectedFiles([]);
            setUploadProgress(0);
            
        } catch (err) {
            console.error('Error uploading to cloud:', err);
            setError(err.response?.data?.error || 'Failed to upload file to cloud');
        } finally {
            setUploadingToCloud(false);
        }
    };

    // Continue with selected files (from computer)
    const handleContinueWithLocal = async () => {
        if (selectedFiles.length === 0) {
            setError('Please select at least one file');
            return;
        }

        setUploading(true);
        setError('');

        try {
            for (const file of selectedFiles) {
                await onFileSelect(file);
            }
            
            setSelectedFiles([]);
            setUploading(false);
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to process file(s). Please try again.');
            setUploading(false);
        }
    };

    // Continue with selected cloud file
    const handleContinueWithCloud = async () => {
        if (!selectedCloudFile || !projectId) {
            setError('Please select a file');
            return;
        }

        setUploading(true);
        setError('');

        try {
            // Download the file content from cloud
            const response = await fileService.downloadFile(projectId, selectedCloudFile.id);
            
            if (response.success) {
                // Convert base64 to File object
                const file = fileService.base64ToFile(
                    response.data.buffer,
                    response.data.file.file_name,
                    response.data.mimeType
                );
                
                await onFileSelect(file);
                setSelectedCloudFile(null);
                setUploading(false);
                onClose();
            }
        } catch (err) {
            console.error('Error processing cloud file:', err);
            setError('Failed to process cloud file. Please try again.');
            setUploading(false);
        }
    };

    // Delete cloud file
    const handleDeleteCloudFile = async (fileId, e) => {
        e.stopPropagation();
        
        if (!window.confirm('Are you sure you want to delete this file?')) return;

        try {
            await fileService.deleteFile(projectId, fileId);
            setCloudFiles(prev => prev.filter(f => f.id !== fileId));
            if (selectedCloudFile?.id === fileId) {
                setSelectedCloudFile(null);
            }
        } catch (err) {
            console.error('Error deleting file:', err);
            setError('Failed to delete file');
        }
    };

    const handleClose = () => {
        if (!uploading && !uploadingToCloud) {
            setSelectedFiles([]);
            setSelectedCloudFile(null);
            setError('');
            setActiveTab('computer');
            onClose();
        }
    };

    const handleBrowseClick = () => {
        if (!uploading && !uploadingToCloud) {
            document.getElementById('file-input')?.click();
        }
    };

    const removeFile = (index) => {
        setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
    };

    const getFilePathsText = () => {
        if (selectedFiles.length === 0) return '';
        return selectedFiles.map(file => file.name).join('; ');
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Select File">
            <div className="file-upload-modal">
                {/* Tab Navigation */}
                <div className="file-tabs">
                    <button 
                        className={`file-tab ${activeTab === 'computer' ? 'active' : ''}`}
                        onClick={() => setActiveTab('computer')}
                        disabled={uploading || uploadingToCloud}
                    >
                        💻 My Computer
                    </button>
                    <button 
                        className={`file-tab ${activeTab === 'cloud' ? 'active' : ''}`}
                        onClick={() => setActiveTab('cloud')}
                        disabled={uploading || uploadingToCloud}
                    >
                        ☁️ Cloud Files
                    </button>
                </div>

                {/* Computer Tab Content */}
                {activeTab === 'computer' && (
                    <>
                        <div className="upload-instructions">
                            <p>Select files from your computer to import or upload to cloud storage.</p>
                            <p className="supported-formats">
                                Supported formats: {acceptedFileTypes.join(', ')}
                            </p>
                        </div>

                        <div className="file-input-container">
                            <input
                                type="file"
                                id="file-input"
                                accept={acceptedFileTypes.join(',')}
                                onChange={handleFileChange}
                                disabled={uploading || uploadingToCloud}
                                multiple
                                style={{ display: 'none' }}
                            />
                            
                            <div className="file-path-input-group">
                                <input
                                    type="text"
                                    className="file-path-input"
                                    value={getFilePathsText()}
                                    placeholder="No files selected"
                                    readOnly
                                    disabled={uploading || uploadingToCloud}
                                />
                                <button
                                    className="browse-btn"
                                    onClick={handleBrowseClick}
                                    disabled={uploading || uploadingToCloud}
                                    type="button"
                                >
                                    ...
                                </button>
                            </div>

                            {selectedFiles.length > 0 && (
                                <div className="selected-files-list">
                                    {selectedFiles.map((file, index) => (
                                        <div key={index} className="file-item">
                                            <span className="file-item-icon">{fileService.getFileIcon(file.type)}</span>
                                            <span className="file-item-name">{file.name}</span>
                                            <span className="file-item-size">
                                                ({fileService.formatFileSize(file.size)})
                                            </span>
                                            {!uploading && !uploadingToCloud && (
                                                <button
                                                    className="remove-file-btn-small"
                                                    onClick={() => removeFile(index)}
                                                    type="button"
                                                >
                                                    ×
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {uploadingToCloud && (
                                <div className="upload-progress">
                                    <div className="progress-bar">
                                        <div 
                                            className="progress-fill" 
                                            style={{ width: `${uploadProgress}%` }}
                                        ></div>
                                    </div>
                                    <span className="progress-text">Uploading... {uploadProgress}%</span>
                                </div>
                            )}
                        </div>

                        <div className="upload-actions">
                            <button
                                className="btn btn-secondary"
                                onClick={handleClose}
                                disabled={uploading || uploadingToCloud}
                            >
                                Cancel
                            </button>
                            {projectId && selectedFiles.length > 0 && (
                                <button
                                    className="btn btn-outline"
                                    onClick={handleUploadToCloud}
                                    disabled={selectedFiles.length === 0 || uploadingToCloud || uploading}
                                >
                                    {uploadingToCloud ? 'Uploading...' : '☁️ Save to Cloud'}
                                </button>
                            )}
                            <button
                                className="btn btn-primary"
                                onClick={handleContinueWithLocal}
                                disabled={selectedFiles.length === 0 || uploading || uploadingToCloud}
                            >
                                {uploading ? 'Processing...' : `Continue (${selectedFiles.length} file${selectedFiles.length !== 1 ? 's' : ''})`}
                            </button>
                        </div>
                    </>
                )}

                {/* Cloud Tab Content */}
                {activeTab === 'cloud' && (
                    <>
                        <div className="upload-instructions">
                            <p>Select a file from your project's cloud storage.</p>
                        </div>

                        <div className="cloud-files-container">
                            {loadingCloudFiles ? (
                                <div className="cloud-files-loading">
                                    <span className="loading-spinner">⏳</span>
                                    <span>Loading files...</span>
                                </div>
                            ) : cloudFiles.length === 0 ? (
                                <div className="cloud-files-empty">
                                    <span className="empty-icon">📂</span>
                                    <p>No files uploaded yet</p>
                                    <span className="empty-hint">Upload files from the "My Computer" tab to save them to cloud storage</span>
                                </div>
                            ) : (
                                <div className="cloud-files-list">
                                    {cloudFiles.map((file) => (
                                        <div 
                                            key={file.id} 
                                            className={`cloud-file-item ${selectedCloudFile?.id === file.id ? 'selected' : ''}`}
                                            onClick={() => setSelectedCloudFile(file)}
                                        >
                                            <span className="cloud-file-icon">
                                                {fileService.getFileIcon(file.mime_type)}
                                            </span>
                                            <div className="cloud-file-info">
                                                <span className="cloud-file-name">{file.file_name}</span>
                                                <span className="cloud-file-meta">
                                                    {fileService.formatFileSize(file.file_size)} • {formatDate(file.created_at)}
                                                </span>
                                            </div>
                                            <button
                                                className="cloud-file-delete"
                                                onClick={(e) => handleDeleteCloudFile(file.id, e)}
                                                title="Delete file"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="upload-actions">
                            <button
                                className="btn btn-secondary"
                                onClick={handleClose}
                                disabled={uploading}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleContinueWithCloud}
                                disabled={!selectedCloudFile || uploading}
                            >
                                {uploading ? 'Processing...' : 'Continue'}
                            </button>
                        </div>
                    </>
                )}

                {error && (
                    <div className="upload-error">
                        <span className="error-icon">⚠️</span>
                        {error}
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default FileUploadModal;
