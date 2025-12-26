import React, { useState, useRef, useEffect } from 'react';
import questionnaireService from '../services/questionnaireService';
import '../styles/importResponsesModal.css';

const ImportResponsesModal = ({ isOpen, onClose, projectId, token, onImportSuccess }) => {
  const [step, setStep] = useState(1); // 1: Upload, 2: Map columns, 3: Results
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewData, setPreviewData] = useState(null);
  const [assetColumn, setAssetColumn] = useState('');
  const [attributeMappings, setAttributeMappings] = useState({});
  const [importResults, setImportResults] = useState(null);
  const [selectedAssetType, setSelectedAssetType] = useState('all');
  const [assetTypes, setAssetTypes] = useState([]); // For template download
  const fileInputRef = useRef(null);

  const acceptedFormats = '.xlsx,.xls,.xlsm,.csv,.tsv';

  // Load asset types when modal opens
  useEffect(() => {
    const loadAssetTypes = async () => {
      if (!isOpen || !projectId || !token) return;
      
      try {
        const response = await questionnaireService.getAssetTypes(projectId, token);
        if (response.success) {
          setAssetTypes(response.data || []);
        }
      } catch (err) {
        console.error('Error loading asset types:', err);
      }
    };

    loadAssetTypes();
  }, [isOpen, projectId, token]);

  const resetModal = () => {
    setStep(1);
    setFile(null);
    setLoading(false);
    setError('');
    setPreviewData(null);
    setAssetColumn('');
    setAttributeMappings({});
    setImportResults(null);
    setSelectedAssetType('all');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await questionnaireService.previewImport(projectId, file, token);
      
      if (result.success) {
        setPreviewData(result.data);
        setStep(2);
      } else {
        setError(result.error || 'Failed to parse file');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.error || 'Failed to upload file');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    if (!projectId) {
      setError('No project selected. Please select a project first.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await questionnaireService.downloadTemplate(
        projectId, 
        selectedAssetType !== 'all' ? selectedAssetType : null,
        token
      );
    } catch (err) {
      console.error('Template download error:', err);
      setError(err.message || err.response?.data?.error || 'Failed to download template');
    } finally {
      setLoading(false);
    }
  };

  const handleAttributeMapping = (attributeId, columnIndex) => {
    setAttributeMappings(prev => {
      if (columnIndex === '') {
        const { [attributeId]: removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [attributeId]: columnIndex };
    });
  };

  const handleImport = async () => {
    if (assetColumn === '') {
      setError('Please select the column containing asset names');
      return;
    }

    if (Object.keys(attributeMappings).length === 0) {
      setError('Please map at least one attribute column');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await questionnaireService.importResponses(
        projectId,
        file,
        assetColumn,
        attributeMappings,
        token
      );

      if (result.success) {
        setImportResults(result.data);
        setStep(3);
        if (onImportSuccess) {
          onImportSuccess();
        }
      } else {
        setError(result.error || 'Import failed');
      }
    } catch (err) {
      console.error('Import error:', err);
      setError(err.response?.data?.error || 'Failed to import responses');
    } finally {
      setLoading(false);
    }
  };

  // Get attributes filtered by selected asset type
  const getFilteredAttributes = () => {
    if (!previewData?.attributes) return [];
    
    if (selectedAssetType === 'all') {
      return previewData.attributes;
    }
    
    return previewData.attributes.filter(
      attr => attr.item_type_id === selectedAssetType
    );
  };

  if (!isOpen) return null;

  return (
    <div className="import-modal-overlay" onClick={handleClose}>
      <div className="import-modal" onClick={e => e.stopPropagation()}>
        <div className="import-modal-header">
          <h2>
            {step === 1 && 'Import Attribute Values'}
            {step === 2 && 'Map Columns'}
            {step === 3 && 'Import Complete'}
          </h2>
          <button className="import-close-btn" onClick={handleClose}>×</button>
        </div>

        <div className="import-modal-body">
          {error && (
            <div className="import-error">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          {/* Step 1: File Upload */}
          {step === 1 && (
            <div className="import-step">
              <div className="import-instructions">
                <h3>Upload a spreadsheet file</h3>
                <p>Supported formats: Excel (.xlsx, .xls, .xlsm), CSV (.csv), TSV (.tsv)</p>
                <p>The file should contain:</p>
                <ul>
                  <li>A header row with column names</li>
                  <li>A column with asset names (must match existing assets)</li>
                  <li>Columns for each attribute response</li>
                </ul>
              </div>

              <div className="template-section">
                <h4>Download Template</h4>
                <p>Get a pre-filled template with your assets and attributes:</p>
                <div className="template-controls">
                  <select
                    value={selectedAssetType}
                    onChange={(e) => setSelectedAssetType(e.target.value)}
                    className="template-type-select"
                  >
                    <option value="all">All Asset Types</option>
                    {assetTypes.map(type => (
                      <option key={type.id} value={type.id}>{type.title}</option>
                    ))}
                  </select>
                  <button 
                    onClick={handleDownloadTemplate}
                    disabled={loading}
                    className="template-download-btn"
                  >
                    {loading ? 'Downloading...' : '📥 Download Template'}
                  </button>
                </div>
              </div>

              <div className="file-upload-section">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={acceptedFormats}
                  onChange={handleFileChange}
                  className="file-input"
                  id="import-file-input"
                />
                <label htmlFor="import-file-input" className="file-upload-label">
                  <span className="upload-icon">📄</span>
                  {file ? file.name : 'Click to select file or drag and drop'}
                </label>
                {file && (
                  <div className="file-info">
                    <span className="file-name">{file.name}</span>
                    <span className="file-size">
                      ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                )}
              </div>

              <div className="import-actions">
                <button onClick={handleClose} className="btn-cancel">Cancel</button>
                <button 
                  onClick={handleUpload} 
                  disabled={!file || loading}
                  className="btn-primary"
                >
                  {loading ? 'Processing...' : 'Upload & Preview'}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Column Mapping */}
          {step === 2 && previewData && (
            <div className="import-step">
              <div className="import-summary">
                <p>
                  <strong>File:</strong> {previewData.fileName} | 
                  <strong> Rows:</strong> {previewData.totalRows} | 
                  <strong> Columns:</strong> {previewData.headers.length}
                </p>
              </div>

              <div className="mapping-section">
                <h4>1. Select Asset Column</h4>
                <p className="mapping-help">
                  Choose the column that contains asset names (must match existing asset titles)
                </p>
                <select
                  value={assetColumn}
                  onChange={(e) => setAssetColumn(e.target.value)}
                  className="mapping-select asset-column-select"
                >
                  <option value="">-- Select Asset Column --</option>
                  {previewData.headers.map((header, idx) => (
                    <option key={idx} value={idx}>{header}</option>
                  ))}
                </select>
              </div>

              <div className="mapping-section">
                <h4>2. Map Attribute Columns</h4>
                <p className="mapping-help">
                  Match spreadsheet columns to questionnaire attributes
                </p>
                
                <div className="asset-type-filter">
                  <label>Filter attributes by type:</label>
                  <select
                    value={selectedAssetType}
                    onChange={(e) => setSelectedAssetType(e.target.value)}
                  >
                    <option value="all">All Types</option>
                    {previewData.assetTypes.map(type => (
                      <option key={type.id} value={type.id}>{type.title}</option>
                    ))}
                  </select>
                </div>

                <div className="attribute-mappings">
                  {getFilteredAttributes().map(attr => {
                    const typeName = previewData.assetTypes.find(
                      t => t.id === attr.item_type_id
                    )?.title || '';
                    return (
                      <div key={attr.id} className="attribute-mapping-row">
                        <div className="attribute-info">
                          <span className="attribute-name">{attr.title}</span>
                          <span className="attribute-meta">
                            {typeName && <span className="type-badge">{typeName}</span>}
                            <span className="type-indicator">{attr.type}</span>
                          </span>
                        </div>
                        <select
                          value={attributeMappings[attr.id] || ''}
                          onChange={(e) => handleAttributeMapping(attr.id, e.target.value)}
                          className="mapping-select"
                        >
                          <option value="">-- Not mapped --</option>
                          {previewData.headers.map((header, idx) => (
                            <option key={idx} value={idx}>{header}</option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="preview-section">
                <h4>Data Preview (First 5 rows)</h4>
                <div className="preview-table-container">
                  <table className="preview-table">
                    <thead>
                      <tr>
                        {previewData.headers.map((header, idx) => (
                          <th key={idx} className={
                            assetColumn === String(idx) ? 'mapped-asset' :
                            Object.values(attributeMappings).includes(String(idx)) ? 'mapped-attr' : ''
                          }>
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.previewRows.slice(0, 5).map((row, rowIdx) => (
                        <tr key={rowIdx}>
                          {row.map((cell, cellIdx) => (
                            <td key={cellIdx} className={
                              assetColumn === String(cellIdx) ? 'mapped-asset' :
                              Object.values(attributeMappings).includes(String(cellIdx)) ? 'mapped-attr' : ''
                            }>
                              {String(cell).substring(0, 50)}
                              {String(cell).length > 50 && '...'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="import-actions">
                <button onClick={() => setStep(1)} className="btn-back">← Back</button>
                <button onClick={handleClose} className="btn-cancel">Cancel</button>
                <button 
                  onClick={handleImport}
                  disabled={loading || assetColumn === '' || Object.keys(attributeMappings).length === 0}
                  className="btn-primary"
                >
                  {loading ? 'Importing...' : `Import ${previewData.totalRows} Rows`}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Results */}
          {step === 3 && importResults && (
            <div className="import-step">
              <div className="import-results">
                <div className="results-summary success">
                  <span className="results-icon">✅</span>
                  <h3>Import Complete!</h3>
                </div>

                <div className="results-stats">
                  <div className="stat-item">
                    <span className="stat-value">{importResults.totalRows}</span>
                    <span className="stat-label">Total Rows</span>
                  </div>
                  <div className="stat-item success">
                    <span className="stat-value">{importResults.imported}</span>
                    <span className="stat-label">Assets Updated</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">{importResults.responsesCreated}</span>
                    <span className="stat-label">Responses Saved</span>
                  </div>
                  {importResults.skipped > 0 && (
                    <div className="stat-item warning">
                      <span className="stat-value">{importResults.skipped}</span>
                      <span className="stat-label">Rows Skipped</span>
                    </div>
                  )}
                </div>

                {importResults.errors && importResults.errors.length > 0 && (
                  <div className="results-errors">
                    <h4>Issues ({importResults.errors.length})</h4>
                    <div className="error-list">
                      {importResults.errors.map((err, idx) => (
                        <div key={idx} className="error-item">
                          <span className="error-row">Row {err.row}:</span>
                          <span className="error-message">{err.error}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="import-actions">
                <button onClick={handleClose} className="btn-primary">Done</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportResponsesModal;

