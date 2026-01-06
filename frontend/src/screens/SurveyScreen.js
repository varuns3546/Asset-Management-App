import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import surveyService from '../services/surveyService';
import { getHierarchy } from '../features/projects/projectSlice';
import { useRouteMount } from '../contexts/RouteMountContext';
import useClickOutside from '../hooks/useClickOutside';
import useDebouncedAsync from '../hooks/useDebouncedAsync';
import ImportResponsesModal from '../components/ImportResponsesModal';
import '../styles/survey.css';

const SurveyScreen = () => {
  const dispatch = useDispatch();
  const { selectedProject, currentHierarchy } = useSelector((state) => state.projects);
  const { user } = useSelector((state) => state.auth);
  
  const [assets, setAssets] = useState([]);
  const [assetTypes, setAssetTypes] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [surveyData, setSurveyData] = useState(null);
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  const [collapsedSections, setCollapsedSections] = useState({});
  const [assetSearchText, setAssetSearchText] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [completionStatus, setCompletionStatus] = useState({});
  const [sortColumn, setSortColumn] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const { isRouteMounted } = useRouteMount();

  // Load assets for the project (debounced to prevent excessive calls)
  useDebouncedAsync(
    async () => {
      if (!selectedProject || !user) return;
      dispatch(getHierarchy(selectedProject.id));
    },
    [selectedProject?.id, user?.id],
    {
      delay: 300,
      shouldRun: (deps) => {
        const [projectId, userId] = deps;
        return !!(projectId && userId);
      },
      skipInitialRun: false
    }
  );

  // Load asset types from backend (debounced to prevent excessive calls)
  useDebouncedAsync(
    async () => {
      if (!selectedProject || !user) return;

      try {
        const response = await surveyService.getAssetTypes(
          selectedProject.id,
          user.token
        );

        if (response.success && isRouteMounted()) {
          setAssetTypes(response.data || []);
        }
      } catch (error) {
        if (isRouteMounted()) {
          console.error('Error loading asset types:', error);
        }
      }
    },
    [selectedProject?.id, user?.token],
    {
      delay: 300,
      shouldRun: (deps) => {
        const [projectId, token] = deps;
        return !!(projectId && token);
      },
      onError: (error) => {
        if (isRouteMounted()) {
          console.error('Error loading asset types:', error);
        }
      }
    }
  );

  // Update assets when hierarchy changes
  useEffect(() => {
    if (currentHierarchy && Array.isArray(currentHierarchy)) {
      setAssets(currentHierarchy);
    }
  }, [currentHierarchy]);

  // Fetch completion status for all assets
  useEffect(() => {
    const fetchCompletionStatus = async () => {
      if (!selectedProject || !user || assets.length === 0) return;

      try {
        const statusMap = {};
        for (const asset of assets) {
          if (!asset.asset_type_id) continue;
          
          const assetType = assetTypes.find(type => type.id === asset.asset_type_id);
          if (!assetType || !assetType.attributes || assetType.attributes.length === 0) continue;

          // Fetch responses for this asset
          const data = await surveyService.getAssetSurvey(
            selectedProject.id,
            asset.id,
            user.token
          );

          if (data.success && data.data) {
            const totalAttributes = data.data.attributes?.length || 0;
            const filledAttributes = data.data.responses ? Object.keys(data.data.responses).filter(attrId => {
              const response = data.data.responses[attrId];
              return response.response_value || (response.response_metadata && response.response_metadata.photos && response.response_metadata.photos.length > 0);
            }).length : 0;

            statusMap[asset.id] = {
              total: totalAttributes,
              filled: filledAttributes,
              percentage: totalAttributes > 0 ? (filledAttributes / totalAttributes) * 100 : 0
            };
          }
        }

        if (isRouteMounted()) {
          setCompletionStatus(statusMap);
        }
      } catch (error) {
        console.error('Error fetching completion status:', error);
      }
    };

    fetchCompletionStatus();
  }, [assets, assetTypes, selectedProject, user, isRouteMounted]);

  // Load survey when asset is selected
  const handleAssetSelect = async (assetId) => {
    if (!assetId || !selectedProject) {
      if (isRouteMounted()) {
        setSelectedAsset(null);
        setSurveyData(null);
        setResponses({});
      }
      return;
    }
    
    if (isRouteMounted()) {
      setLoading(true);
    }
    
    try {
      const data = await surveyService.getAssetSurvey(
        selectedProject.id,
        assetId,
        user.token
      );

      if (data.success && isRouteMounted()) {
        setSurveyData(data.data);
        setSelectedAsset(data.data.asset);
        
        // Initialize responses from existing data
        const initialResponses = {};
        if (data.data.responses) {
          Object.entries(data.data.responses).forEach(([attrId, response]) => {
            // Find the attribute to check its type
            const attribute = data.data.attributes?.find(attr => attr.id === attrId);
            
            if (attribute?.type === 'photos' && response.response_metadata?.photos) {
              // For photo attributes, we can't reload actual File objects
              // But we can store the photo info for display
              initialResponses[attrId] = response.response_metadata.photos;
            } else {
              // For text/number attributes, use the response value
              initialResponses[attrId] = response.response_value || '';
            }
          });
        }
        setResponses(initialResponses);
      }
    } catch (error) {
      if (isRouteMounted()) {
        console.error('Error loading survey:', error);
      }
    } finally {
      if (isRouteMounted()) {
        setLoading(false);
      }
    }
  };

  // Handle response change
  const handleResponseChange = (attributeId, value) => {
    setResponses(prev => ({
      ...prev,
      [attributeId]: value
    }));
  };

  // Extract base filename without (1), (2), etc.
  const getBaseFilename = (filename) => {
    // Remove (1), (2), etc. from filename after extension
    // Matches: photo.jpg(1) -> photo.jpg
    const match = filename.match(/^(.+?)(\(\d+\))?$/);
    if (match) {
      return match[1]; // base name with extension, without number
    }
    return filename;
  };

  // Toggle collapse state for saved photos section
  const toggleCollapse = (attributeId) => {
    setCollapsedSections(prev => ({
      ...prev,
      [attributeId]: !prev[attributeId]
    }));
  };

  // Handle photo upload
  const handlePhotoUpload = async (attributeId, files) => {
    if (files && files.length > 0) {
      const newFiles = Array.from(files);
      
      setResponses(prev => {
        // Get existing photos for this attribute (could be saved photos or new files)
        const existing = prev[attributeId] || [];
        
        // Check for duplicate filenames (comparing base names without numbers)
        const duplicates = [];
        const uniqueNewFiles = [];
        
        newFiles.forEach(newFile => {
          const newBaseName = getBaseFilename(newFile.name);
          
          const existingFile = existing.find(e => {
            const existingName = e.name || e.fileName;
            const existingBaseName = getBaseFilename(existingName);
            return existingBaseName === newBaseName;
          });
          
          if (existingFile) {
            duplicates.push({ newFile, existingFile, baseName: newBaseName });
          } else {
            // Create preview URL for new files
            newFile.previewUrl = URL.createObjectURL(newFile);
            uniqueNewFiles.push(newFile);
          }
        });
        
        // If there are duplicates, handle them
        if (duplicates.length > 0) {
          handleDuplicates(attributeId, duplicates, uniqueNewFiles, existing);
          return prev; // Don't update yet, let handleDuplicates do it
        }
        
        // No duplicates, just append
        return {
          ...prev,
          [attributeId]: [...existing, ...uniqueNewFiles]
        };
      });
    }
  };

  // Handle duplicate file confirmations
  const handleDuplicates = (attributeId, duplicates, uniqueNewFiles, existing) => {
    // Process each duplicate
    const processNextDuplicate = (index, currentExisting, filesToAdd) => {
      if (index >= duplicates.length) {
        // All duplicates processed, update responses
        setResponses(prev => ({
          ...prev,
          [attributeId]: [...currentExisting, ...filesToAdd]
        }));
        return;
      }

      const { newFile, existingFile, baseName } = duplicates[index];
      const existingName = existingFile.name || existingFile.fileName;
      
      const choice = window.confirm(
        `A file with the name "${baseName}" already exists (as "${existingName}").\n\n` +
        `Click OK to KEEP BOTH files (new file will be numbered).\n` +
        `Click Cancel to REPLACE the existing file.`
      );

      if (choice) {
        // Keep both - add the new file (backend will add number)
        newFile.previewUrl = URL.createObjectURL(newFile);
        filesToAdd.push(newFile);
      } else {
        // Replace - mark old file for deletion and add new one
        if (existingFile.url) {
          // Only mark saved photos for deletion
          existingFile.markedForDeletion = true;
        }
        currentExisting = currentExisting.filter(e => {
          const name = e.name || e.fileName;
          const baseName = getBaseFilename(name);
          return baseName !== getBaseFilename(existingName);
        });
        newFile.previewUrl = URL.createObjectURL(newFile);
        filesToAdd.push(newFile);
      }

      // Process next duplicate
      processNextDuplicate(index + 1, currentExisting, filesToAdd);
    };

    // Start processing duplicates
    processNextDuplicate(0, existing, uniqueNewFiles);
  };

  // Handle removing a photo (mark for deletion, don't delete immediately)
  const handleRemovePhoto = (attributeId, photoIndex) => {
    setResponses(prev => {
      const existing = prev[attributeId] || [];
      const photoToRemove = existing[photoIndex];
      
      // If it's a saved photo (has path), mark for deletion
      // We'll delete it when "Save Responses" is clicked
      if (photoToRemove && photoToRemove.path) {
        photoToRemove.markedForDeletion = true;
      }
      
      // Remove from the list
      const updated = existing.filter((_, idx) => idx !== photoIndex);
      
      return {
        ...prev,
        [attributeId]: updated.length > 0 ? updated : []
      };
    });
  };

  // Submit responses
  const handleSubmit = async () => {
    if (!selectedAsset || !surveyData) return;

    setSaving(true);
    try {
      // First, collect all photos marked for deletion
      const photosToDelete = [];
      surveyData.attributes.forEach(attr => {
        if (attr.type === 'photos' && Array.isArray(responses[attr.id])) {
          // Find any photos marked for deletion that are no longer in the responses
          const currentPhotoIds = responses[attr.id].map(p => p.path).filter(Boolean);
          
          // Check original survey data for photos that were removed
          const originalResponse = surveyData.responses?.[attr.id];
          if (originalResponse?.response_metadata?.photos) {
            originalResponse.response_metadata.photos.forEach(photo => {
              if (!currentPhotoIds.includes(photo.path)) {
                photosToDelete.push(photo.path);
              }
            });
          }
        }
      });

      // Delete marked photos from storage
      for (const filePath of photosToDelete) {
        try {
          await surveyService.deletePhoto(filePath, user.token);
        } catch (error) {
          console.error('Error deleting photo:', error);
          // Continue even if deletion fails
        }
      }

      const responsesArray = await Promise.all(
        surveyData.attributes.map(async (attr) => {
          let value = responses[attr.id] || '';
          let metadata = {};

          // Handle photo uploads
          if (attr.type === 'photos' && Array.isArray(responses[attr.id])) {
            const allPhotos = responses[attr.id];
            const photoUrls = [];
            
            // Separate saved photos from new files
            const savedPhotos = allPhotos.filter(photo => photo.url); // Already uploaded photos
            const newFiles = allPhotos.filter(photo => !photo.url && photo instanceof File); // New files to upload
            
            // Add already saved photos to the list
            savedPhotos.forEach(photo => {
              photoUrls.push({
                name: photo.name,
                size: photo.size,
                url: photo.url,
                path: photo.path
              });
            });
            
            // Upload only NEW photos
            for (const file of newFiles) {
              try {
                const uploadResponse = await surveyService.uploadPhoto(
                  selectedProject.id,
                  selectedAsset.id,
                  attr.id,
                  file,
                  user.token
                );

                if (uploadResponse.success) {
                  photoUrls.push({
                    name: uploadResponse.data.fileName,
                    size: uploadResponse.data.fileSize,
                    url: uploadResponse.data.publicUrl,
                    path: uploadResponse.data.filePath
                  });
                }
              } catch (uploadError) {
                console.error('Error uploading photo:', uploadError);
                alert(`Failed to upload photo: ${file.name}`);
              }
            }
            
            value = '';  // Photos don't have a text value
            metadata = { 
              photos: photoUrls,
              photoCount: photoUrls.length
            };
          }

          return {
            attributeId: attr.id,
            attributeTitle: attr.title,
            value: value || '',
            metadata
          };
        })
      );

      const result = await surveyService.submitResponses(
        selectedProject.id,
        selectedAsset.id,
        responsesArray,
        user.token
      );

      if (result.success) {
        // Show success notification
        setShowSaveSuccess(true);
        setTimeout(() => setShowSaveSuccess(false), 3000);
        // Reload the survey to get fresh data
        handleAssetSelect(selectedAsset.id);
      }
    } catch (error) {
      console.error('Error submitting responses:', error);
      alert('Failed to save responses. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Filter assets based on selected type
  const getFilteredAssets = () => {
    let filtered = assets;
    
    // Only show assets whose type has attributes
    filtered = filtered.filter(asset => {
      if (!asset.asset_type_id) return false; // No type = no attributes
      const assetType = assetTypes.find(type => type.id === asset.asset_type_id);
      return assetType && assetType.attributes && assetType.attributes.length > 0;
    });
    
    // Filter by type
    if (typeFilter === 'no-type') {
      filtered = filtered.filter(asset => !asset.asset_type_id);
    } else if (typeFilter !== 'all') {
      filtered = filtered.filter(asset => asset.asset_type_id === typeFilter);
    }
    
    // Filter by search text
    if (assetSearchText.trim()) {
      filtered = filtered.filter(asset => 
        asset.title.toLowerCase().includes(assetSearchText.toLowerCase())
      );
    }
    
    return filtered;
  };

  // Get only asset types that have assets AND have attributes
  const getAssetTypesWithAssets = () => {
    return assetTypes.filter(type => 
      type.attributes && type.attributes.length > 0 &&
      assets.some(asset => asset.asset_type_id === type.id)
    );
  };

  // Sort assets based on current sort column and direction
  const getSortedAssets = (assetsToSort) => {
    const sorted = [...assetsToSort];
    
    sorted.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortColumn) {
        case 'name':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'type':
          const aType = assetTypes.find(type => type.id === a.asset_type_id);
          const bType = assetTypes.find(type => type.id === b.asset_type_id);
          aValue = aType?.title.toLowerCase() || '';
          bValue = bType?.title.toLowerCase() || '';
          break;
        case 'attributes':
          const aTypeAttr = assetTypes.find(type => type.id === a.asset_type_id);
          const bTypeAttr = assetTypes.find(type => type.id === b.asset_type_id);
          aValue = aTypeAttr?.attributes?.length || 0;
          bValue = bTypeAttr?.attributes?.length || 0;
          break;
        case 'completion':
          aValue = completionStatus[a.id]?.percentage || 0;
          bValue = completionStatus[b.id]?.percentage || 0;
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    return sorted;
  };

  // Handle column header click for sorting
  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Navigation functions
  const handleNavigate = (direction) => {
    const currentIndex = sortedFilteredAssets.findIndex(asset => asset.id === selectedAsset?.id);
    if (currentIndex === -1) return;
    
    let nextIndex;
    if (direction === 'next') {
      nextIndex = currentIndex + 1;
      if (nextIndex >= sortedFilteredAssets.length) nextIndex = 0; // Wrap to beginning
    } else {
      nextIndex = currentIndex - 1;
      if (nextIndex < 0) nextIndex = sortedFilteredAssets.length - 1; // Wrap to end
    }
    
    const nextAsset = sortedFilteredAssets[nextIndex];
    if (nextAsset) {
      handleAssetSelect(nextAsset.id);
      setAssetSearchText(nextAsset.title);
    }
  };

  const handleCloseForm = () => {
    setSelectedAsset(null);
    setSurveyData(null);
    setResponses({});
    setAssetSearchText('');
  };

  const filteredAssets = getFilteredAssets();
  const sortedFilteredAssets = getSortedAssets(filteredAssets);
  const assetTypesWithAssets = getAssetTypesWithAssets();

  if (!selectedProject) {
    return (
      <div className="survey-screen">
        <div className="no-project-message">
          <h2>No Project Selected</h2>
          <p>Please select a project from the home screen to enter data.</p>
        </div>
      </div>
    );
  }

  const handleImportSuccess = () => {
    // Refresh data after successful import
    if (selectedAsset?.id) {
      handleAssetSelect(selectedAsset.id);
    }
  };

  return (
    <div className="survey-screen">
      {/* Success notification bar */}
      {showSaveSuccess && (
        <div className="save-success-bar">
          <span className="success-icon">✓</span>
          Saved
        </div>
      )}
      
      <div className="survey-header">
        <div className="header-text">
          <h1>Survey</h1>
          <p>Select an asset and enter attribute values</p>
        </div>
        <button 
          className="import-btn"
          onClick={() => setShowImportModal(true)}
          title="Import attribute values from spreadsheet"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          Import Values
        </button>
      </div>

      <ImportResponsesModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        projectId={selectedProject?.id}
        token={user?.token}
        onImportSuccess={handleImportSuccess}
      />

      <div className="survey-content">
        {/* Filter and Search */}
        {!surveyData && (
          <div className="asset-selection">
            <div className="filter-section">
              <div className="filter-group">
                <label htmlFor="type-filter">Filter by Type:</label>
                <select
                  id="type-filter"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="filter-dropdown"
                >
                  <option value="all">All Types</option>
                  {assetTypesWithAssets.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.title}
                    </option>
                  ))}
                </select>
                <span className="asset-count">
                  ({sortedFilteredAssets.length} asset{sortedFilteredAssets.length !== 1 ? 's' : ''})
                </span>
              </div>
              <div className="filter-group">
                <label htmlFor="asset-search">Search:</label>
                <input
                  id="asset-search"
                  type="text"
                  value={assetSearchText}
                  onChange={(e) => setAssetSearchText(e.target.value)}
                  placeholder="Search assets..."
                  className="asset-search-input"
                />
              </div>
            </div>

            {/* Assets Table */}
            <div className="assets-table-container">
              <table className="assets-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('name')} className="sortable">
                      Asset Name
                      {sortColumn === 'name' && (
                        <span className="sort-indicator">{sortDirection === 'asc' ? ' ▲' : ' ▼'}</span>
                      )}
                    </th>
                    <th onClick={() => handleSort('type')} className="sortable">
                      Type
                      {sortColumn === 'type' && (
                        <span className="sort-indicator">{sortDirection === 'asc' ? ' ▲' : ' ▼'}</span>
                      )}
                    </th>
                    <th onClick={() => handleSort('attributes')} className="sortable">
                      Attributes
                      {sortColumn === 'attributes' && (
                        <span className="sort-indicator">{sortDirection === 'asc' ? ' ▲' : ' ▼'}</span>
                      )}
                    </th>
                    <th onClick={() => handleSort('completion')} className="sortable">
                      Status
                      {sortColumn === 'completion' && (
                        <span className="sort-indicator">{sortDirection === 'asc' ? ' ▲' : ' ▼'}</span>
                      )}
                    </th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedFilteredAssets.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="no-assets">
                        {assetSearchText ? `No assets found matching "${assetSearchText}"` : 'No assets with attributes found'}
                      </td>
                    </tr>
                  ) : (
                    sortedFilteredAssets.map(asset => {
                      const assetType = assetTypes.find(type => type.id === asset.asset_type_id);
                      const status = completionStatus[asset.id] || { total: 0, filled: 0, percentage: 0 };
                      const attributeCount = assetType?.attributes?.length || 0;
                      
                      return (
                        <tr 
                          key={asset.id}
                          onClick={() => {
                            handleAssetSelect(asset.id);
                            setAssetSearchText(asset.title);
                          }}
                          className="asset-row"
                        >
                          <td className="asset-name" data-label="Name">{asset.title}</td>
                          <td className="asset-type" data-label="Type">{assetType?.title || 'No Type'}</td>
                          <td className="asset-attributes" data-label="Attributes">{attributeCount} attribute{attributeCount !== 1 ? 's' : ''}</td>
                          <td className="asset-status" data-label="Status">
                            <div className="status-container">
                              <div className="progress-bar">
                                <div 
                                  className={`progress-fill ${
                                    status.percentage === 100 ? 'complete' :
                                    status.percentage > 0 ? 'partial' : 'empty'
                                  }`}
                                  style={{ width: `${status.percentage}%` }}
                                />
                              </div>
                              <span className="status-text">{status.filled}/{status.total}</span>
                            </div>
                          </td>
                          <td className="asset-action" data-label="Action">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAssetSelect(asset.id);
                                setAssetSearchText(asset.title);
                              }}
                              className="edit-btn"
                            >
                              Edit →
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Survey Form */}
        {loading && (
          <div className="loading">
            <div className="loading-spinner"></div>
            <p>Loading...</p>
          </div>
        )}

        {!loading && surveyData && (
          <div className="survey-form">
            {/* Navigation Controls */}
            <div className="form-navigation">
              <button
                onClick={() => handleNavigate('prev')}
                className="nav-btn prev-btn"
                title="Previous asset"
              >
                ← Previous
              </button>
              <div className="form-header-info">
                <h2>{selectedAsset.title}</h2>
                <span className="form-asset-type">{surveyData.assetType?.title || 'No Type'}</span>
              </div>
              <div className="nav-right-controls">
                <button
                  onClick={() => handleNavigate('next')}
                  className="nav-btn next-btn"
                  title="Next asset"
                >
                  Next →
                </button>
                <button
                  onClick={handleCloseForm}
                  className="nav-btn close-btn"
                  title="Back to list"
                >
                  ✕ Close
                </button>
              </div>
            </div>

            {surveyData.attributes.length === 0 ? (
              <div className="no-attributes">
                <p>This asset type has no attributes defined.</p>
                <p>Please add attributes in the <strong>Structure → Asset Types</strong> section.</p>
              </div>
            ) : (
              <div className="questions-container">
                {surveyData.attributes.map((attribute, index) => (
                  <div key={attribute.id} className="question-item">
                    <label htmlFor={`attr-${attribute.id}`}>
                      <span className="question-number">{index + 1}.</span>
                      <span className="question-text">{attribute.title}</span>
                      <span className="attribute-type-badge">
                        {attribute.type === 'number' ? '(Number)' : 
                         attribute.type === 'photos' ? '(Photos)' : '(Text)'}
                      </span>
                    </label>
                    
                    {attribute.type === 'text' && (
                      <textarea
                        id={`attr-${attribute.id}`}
                        value={responses[attribute.id] || ''}
                        onChange={(e) => handleResponseChange(attribute.id, e.target.value)}
                        placeholder="Enter your response..."
                        rows={3}
                        className="response-input"
                      />
                    )}
                    
                    {attribute.type === 'number' && (
                      <input
                        type="number"
                        id={`attr-${attribute.id}`}
                        value={responses[attribute.id] || ''}
                        onChange={(e) => handleResponseChange(attribute.id, e.target.value)}
                        placeholder="Enter a number..."
                        className="response-input response-number-input"
                      />
                    )}
                    
                    {attribute.type === 'photos' && (
                      <div className="photo-upload-container">
                        <input
                          type="file"
                          id={`attr-${attribute.id}`}
                          accept="image/*"
                          multiple
                          onChange={(e) => handlePhotoUpload(attribute.id, e.target.files)}
                          className="photo-input"
                        />
                        <div className="photo-preview">
                          {responses[attribute.id] && responses[attribute.id].length > 0 ? (
                            <div className="photo-gallery">
                              {(() => {
                                // Separate new uploads from existing photos
                                const newPhotos = responses[attribute.id].filter(p => !p.url);
                                const existingPhotos = responses[attribute.id]
                                  .filter(p => p.url)
                                  .sort((a, b) => a.name.localeCompare(b.name)); // Sort by name
                                
                                // Default to collapsed if not explicitly set
                                const isCollapsed = collapsedSections[attribute.id] !== false;
                                
                                return (
                                  <>
                                    {/* New Uploads Section */}
                                    {newPhotos.length > 0 && (
                                      <div className="photo-section">
                                        <div className="photo-section-header">
                                          New Uploads ({newPhotos.length})
                                        </div>
                                        <div className="photo-grid">
                                          {newPhotos.map((photo, idx) => {
                                            const actualIndex = responses[attribute.id].indexOf(photo);
                                            const displayUrl = photo.previewUrl;
                                            
                                            return (
                                              <div key={actualIndex} className="photo-thumbnail photo-new">
                                                <button
                                                  className="remove-photo-btn"
                                                  onClick={() => handleRemovePhoto(attribute.id, actualIndex)}
                                                  title="Remove photo"
                                                >
                                                  ×
                                                </button>
                                                {displayUrl ? (
                                                  <img src={displayUrl} alt={photo.name} />
                                                ) : (
                                                  <div className="photo-placeholder">
                                                    <span className="photo-icon">📷</span>
                                                  </div>
                                                )}
                                                <span className="photo-name">{photo.name}</span>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    )}
                                    
                                    {/* Existing Photos Section */}
                                    {existingPhotos.length > 0 && (
                                      <div className="photo-section">
                                        <div 
                                          className="photo-section-header photo-section-collapsible"
                                          onClick={() => toggleCollapse(attribute.id)}
                                        >
                                          <span>Saved Photos ({existingPhotos.length})</span>
                                          <span className="collapse-icon">
                                            {isCollapsed ? '▼' : '▲'}
                                          </span>
                                        </div>
                                        {!isCollapsed && (
                                          <div className="photo-grid">
                                            {existingPhotos.map((photo, idx) => {
                                              const actualIndex = responses[attribute.id].indexOf(photo);
                                              
                                              return (
                                                <div key={actualIndex} className="photo-thumbnail photo-saved">
                                                  <button
                                                    className="remove-photo-btn"
                                                    onClick={() => handleRemovePhoto(attribute.id, actualIndex)}
                                                    title="Remove photo"
                                                  >
                                                    ×
                                                  </button>
                                                  {photo.url ? (
                                                    <img 
                                                      src={photo.url} 
                                                      alt={photo.name || 'Photo'} 
                                                      onError={(e) => {
                                                        // Hide broken image and show placeholder
                                                        e.target.style.display = 'none';
                                                        const placeholder = document.createElement('div');
                                                        placeholder.className = 'photo-placeholder';
                                                        placeholder.innerHTML = '<span class="photo-icon">📷</span>';
                                                        e.target.parentNode.insertBefore(placeholder, e.target);
                                                      }}
                                                    />
                                                  ) : (
                                                    <div className="photo-placeholder">
                                                      <span className="photo-icon">📷</span>
                                                    </div>
                                                  )}
                                                  <span className="photo-name">{photo.name || 'Unknown'}</span>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </>
                                );
                              })()}
                            </div>
                          ) : (
                            <div className="no-photos">No photos uploaded</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {surveyData.attributes.length > 0 && (
              <div className="form-actions">
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="submit-button"
                >
                  {saving ? 'Saving...' : 'Save Responses'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SurveyScreen;

