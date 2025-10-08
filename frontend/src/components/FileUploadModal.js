import { useState } from 'react';
import Modal from './Modal';
import '../styles/modal.css';

const FileUploadModal = ({ isOpen, onClose, onFileSelect, projectId }) => {
    const [selectedFile, setSelectedFile] = useState(null);
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
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
            if (!acceptedFileTypes.includes(fileExtension)) {
                setError(`Invalid file type. Please upload one of: ${acceptedFileTypes.join(', ')}`);
                setSelectedFile(null);
                return;
            }
            
            setError('');
            setSelectedFile(file);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            setError('Please select a file to upload');
            return;
        }

        setUploading(true);
        setError('');

        try {
            await onFileSelect(selectedFile);
            
            // Reset form after successful upload
            setSelectedFile(null);
            setUploading(false);
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to parse file. Please try again.');
            setUploading(false);
        }
    };

    const handleClose = () => {
        if (!uploading) {
            setSelectedFile(null);
            setError('');
            onClose();
        }
    };

    const handleDropZoneClick = () => {
        if (!uploading && !selectedFile) {
            document.getElementById('file-input')?.click();
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const file = e.dataTransfer.files[0];
        if (file) {
            const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
            if (!acceptedFileTypes.includes(fileExtension)) {
                setError(`Invalid file type. Please upload one of: ${acceptedFileTypes.join(', ')}`);
                setSelectedFile(null);
                return;
            }
            
            setError('');
            setSelectedFile(file);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Import Hierarchy Data">
            <div className="file-upload-modal">
                <div className="upload-instructions">
                    <p>Upload a spreadsheet file to import hierarchy data.</p>
                    <p className="supported-formats">
                        Supported formats: {acceptedFileTypes.join(', ')}
                    </p>
                </div>

                <div 
                    className={`drop-zone ${selectedFile ? 'has-file' : ''}`}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={handleDropZoneClick}
                >
                    <input
                        type="file"
                        id="file-input"
                        accept={acceptedFileTypes.join(',')}
                        onChange={handleFileChange}
                        disabled={uploading}
                        style={{ display: 'none' }}
                    />
                    
                    {selectedFile ? (
                        <div className="selected-file" onClick={(e) => e.stopPropagation()}>
                            <div className="file-icon">📄</div>
                            <div className="file-info">
                                <p className="file-name">{selectedFile.name}</p>
                                <p className="file-size">
                                    {(selectedFile.size / 1024).toFixed(2)} KB
                                </p>
                            </div>
                            {!uploading && (
                                <button
                                    className="remove-file-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedFile(null);
                                    }}
                                >
                                    ×
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="drop-zone-label">
                            <div className="upload-icon">📁</div>
                            <p className="drop-zone-text">
                                Drag and drop your file here or click to browse
                            </p>
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
                        disabled={!selectedFile || uploading}
                    >
                        {uploading ? 'Processing...' : 'Continue'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default FileUploadModal;

