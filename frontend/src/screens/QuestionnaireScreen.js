import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import questionnaireService from '../services/questionnaireService';
import { getHierarchy } from '../features/projects/projectSlice';
import { useRouteMount } from '../contexts/RouteMountContext';
import useClickOutside from '../hooks/useClickOutside';
import useDebouncedAsync from '../hooks/useDebouncedAsync';
import '../styles/questionnaire.css';

const QuestionnaireScreen = () => {
  const dispatch = useDispatch();
  const { selectedProject, currentHierarchy } = useSelector((state) => state.projects);
  const { user } = useSelector((state) => state.auth);
  
  const [assets, setAssets] = useState([]);
  const [assetTypes, setAssetTypes] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [questionnaireData, setQuestionnaireData] = useState(null);
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  const [collapsedSections, setCollapsedSections] = useState({});
  const [assetSearchText, setAssetSearchText] = useState('');
  const [showAssetDropdown, setShowAssetDropdown] = useState(false);
  const { isRouteMounted } = useRouteMount();
  const dropdownRef = useClickOutside(() => {
    if (showAssetDropdown) {
      setShowAssetDropdown(false);
    }
  }, showAssetDropdown);

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
        const response = await questionnaireService.getAssetTypes(
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

  // Load questionnaire when asset is selected
  const handleAssetSelect = async (assetId) => {
    if (!assetId || !selectedProject) {
      if (isRouteMounted()) {
        setSelectedAsset(null);
        setQuestionnaireData(null);
        setResponses({});
      }
      return;
    }
    
    if (isRouteMounted()) {
      setLoading(true);
    }
    
    try {
      const data = await questionnaireService.getAssetQuestionnaire(
        selectedProject.id,
        assetId,
        user.token
      );

      if (data.success && isRouteMounted()) {
        setQuestionnaireData(data.data);
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
        console.error('Error loading questionnaire:', error);
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
    if (!selectedAsset || !questionnaireData) return;

    setSaving(true);
    try {
      // First, collect all photos marked for deletion
      const photosToDelete = [];
      questionnaireData.attributes.forEach(attr => {
        if (attr.type === 'photos' && Array.isArray(responses[attr.id])) {
          // Find any photos marked for deletion that are no longer in the responses
          const currentPhotoIds = responses[attr.id].map(p => p.path).filter(Boolean);
          
          // Check original questionnaire data for photos that were removed
          const originalResponse = questionnaireData.responses?.[attr.id];
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
          await questionnaireService.deletePhoto(filePath, user.token);
        } catch (error) {
          console.error('Error deleting photo:', error);
          // Continue even if deletion fails
        }
      }

      const responsesArray = await Promise.all(
        questionnaireData.attributes.map(async (attr) => {
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
                const uploadResponse = await questionnaireService.uploadPhoto(
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

      const result = await questionnaireService.submitResponses(
        selectedProject.id,
        selectedAsset.id,
        responsesArray,
        user.token
      );

      if (result.success) {
        alert('Responses saved successfully!');
        // Reload the questionnaire to get fresh data
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
    
    // Filter by type
    if (typeFilter === 'no-type') {
      filtered = filtered.filter(asset => !asset.item_type_id);
    } else if (typeFilter !== 'all') {
      filtered = filtered.filter(asset => asset.item_type_id === typeFilter);
    }
    
    // Filter by search text
    if (assetSearchText.trim()) {
      filtered = filtered.filter(asset => 
        asset.title.toLowerCase().includes(assetSearchText.toLowerCase())
      );
    }
    
    return filtered;
  };

  // Get only asset types that have assets
  const getAssetTypesWithAssets = () => {
    return assetTypes.filter(type => 
      assets.some(asset => asset.item_type_id === type.id)
    );
  };

  // Handle asset selection from dropdown
  const handleAssetSelectFromDropdown = (asset) => {
    setAssetSearchText(asset.title);
    setShowAssetDropdown(false);
    handleAssetSelect(asset.id);
  };

  const filteredAssets = getFilteredAssets();
  const assetTypesWithAssets = getAssetTypesWithAssets();

  if (!selectedProject) {
    return (
      <div className="questionnaire-screen">
        <div className="no-project-message">
          <h2>No Project Selected</h2>
          <p>Please select a project from the home screen to use the questionnaire.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="questionnaire-screen">
      <div className="questionnaire-header">
        <h1>Questionnaire</h1>
        <p>Select an asset and answer questions based on its attributes</p>
      </div>

      <div className="questionnaire-content">
        {/* Filter and Asset Selection */}
        <div className="asset-selection">
          <div className="filter-section">
            <div className="filter-group">
              <label htmlFor="type-filter">Filter by Type:</label>
              <select
                id="type-filter"
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setSelectedAsset(null);
                  setQuestionnaireData(null);
                  setResponses({});
                  setAssetSearchText('');
                  setShowAssetDropdown(false);
                }}
                className="filter-dropdown"
              >
                <option value="all">All Types</option>
                <option value="no-type">No Type</option>
                {assetTypesWithAssets.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.title}
                  </option>
                ))}
              </select>
              <span className="asset-count">
                ({filteredAssets.length} asset{filteredAssets.length !== 1 ? 's' : ''})
              </span>
            </div>
          </div>

          <div className="asset-select-group">
            <label htmlFor="asset-search">Select Asset:</label>
            <div className="searchable-dropdown" ref={dropdownRef}>
              <input
                id="asset-search"
                type="text"
                value={assetSearchText}
                onChange={(e) => {
                  setAssetSearchText(e.target.value);
                  setShowAssetDropdown(true);
                }}
                onFocus={() => setShowAssetDropdown(true)}
                placeholder="Type to search or click to browse..."
                className="asset-search-input"
              />
              {showAssetDropdown && filteredAssets.length > 0 && (
                <div className="asset-dropdown-list">
                  {filteredAssets.map(asset => {
                    const assetType = assetTypes.find(type => type.id === asset.item_type_id);
                    const typeName = assetType ? assetType.title : 'No Type';
                    return (
                      <div
                        key={asset.id}
                        className="asset-dropdown-item"
                        onClick={() => handleAssetSelectFromDropdown(asset)}
                      >
                        <span className="asset-item-title">{asset.title}</span>
                        <span className="asset-item-type">({typeName})</span>
                      </div>
                    );
                  })}
                </div>
              )}
              {showAssetDropdown && assetSearchText && filteredAssets.length === 0 && (
                <div className="asset-dropdown-list">
                  <div className="asset-dropdown-item asset-no-results">
                    No assets found matching "{assetSearchText}"
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Questionnaire Form */}
        {loading && (
          <div className="loading">
            <div className="loading-spinner"></div>
            <p>Loading questionnaire...</p>
          </div>
        )}

        {!loading && questionnaireData && (
          <div className="questionnaire-form">
            <div className="asset-info">
              <h2>{selectedAsset.title}</h2>
              <p className="asset-type">
                Type: {questionnaireData.assetType?.title || 'No Type'}
              </p>
            </div>

            {questionnaireData.attributes.length === 0 ? (
              <div className="no-attributes">
                <p>This asset type has no attributes defined.</p>
                <p>Please add attributes in the <strong>Structure → Item Types</strong> section.</p>
              </div>
            ) : (
              <div className="questions-container">
                {questionnaireData.attributes.map((attribute, index) => (
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
                                              
                                              // Debug: log photo object to see what we're working with
                                              console.log('Rendering photo:', {
                                                index: actualIndex,
                                                name: photo.name,
                                                url: photo.url,
                                                path: photo.path,
                                                fullPhoto: photo
                                              });
                                              
                                              if (!photo.url) {
                                                console.warn('Photo missing URL:', photo);
                                              }
                                              
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
                                                        console.error('Failed to load image:', {
                                                          url: photo.url,
                                                          name: photo.name,
                                                          photo: photo
                                                        });
                                                        // Hide broken image and show placeholder
                                                        e.target.style.display = 'none';
                                                        const placeholder = document.createElement('div');
                                                        placeholder.className = 'photo-placeholder';
                                                        placeholder.innerHTML = '<span class="photo-icon">📷</span>';
                                                        e.target.parentNode.insertBefore(placeholder, e.target);
                                                      }}
                                                      onLoad={() => {
                                                        // Image loaded successfully
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

            {questionnaireData.attributes.length > 0 && (
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

export default QuestionnaireScreen;

