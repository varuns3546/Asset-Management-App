import { useState } from 'react';
import Modal from './Modal';
import '../styles/modal.css';

const FileUploadModal = ({ isOpen, onClose, onFileSelect, projectId }) => {
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');

    const acceptedFileTypes = [
        '.xlsx',
        '.xls',
        '.xlsm',
        '.csv',
        '.tsv'
    ];

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

    const handleUpload = async () => {
        if (selectedFiles.length === 0) {
            setError('Please select at least one file to upload');
            return;
        }

        setUploading(true);
        setError('');

        try {
            // Process files one by one or all at once depending on implementation
            for (const file of selectedFiles) {
                await onFileSelect(file);
            }
            
            // Reset form after successful upload
            setSelectedFiles([]);
            setUploading(false);
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to parse file(s). Please try again.');
            setUploading(false);
        }
    };

    const handleClose = () => {
        if (!uploading) {
            setSelectedFiles([]);
            setError('');
            onClose();
        }
    };

    const handleBrowseClick = () => {
        if (!uploading) {
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

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="File Upload">
            <div className="file-upload-modal">
                <div className="upload-instructions">
                    <p>Upload a spreadsheet file to import hierarchy data.</p>
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
                        disabled={uploading}
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
                            disabled={uploading}
                        />
                        <button
                            className="browse-btn"
                            onClick={handleBrowseClick}
                            disabled={uploading}
                            type="button"
                        >
                            ...
                        </button>
                    </div>

                    {selectedFiles.length > 0 && (
                        <div className="selected-files-list">
                            {selectedFiles.map((file, index) => (
                                <div key={index} className="file-item">
                                    <span className="file-item-name">{file.name}</span>
                                    <span className="file-item-size">
                                        ({(file.size / 1024).toFixed(2)} KB)
                                    </span>
                                    {!uploading && (
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
                </div>

                {error && (
                    <div className="upload-error">
                        <span className="error-icon">⚠️</span>
                        {error}
                    </div>
                )}

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
                        onClick={handleUpload}
                        disabled={selectedFiles.length === 0 || uploading}
                    >
                        {uploading ? 'Processing...' : `Continue (${selectedFiles.length} file${selectedFiles.length !== 1 ? 's' : ''})`}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default FileUploadModal;

