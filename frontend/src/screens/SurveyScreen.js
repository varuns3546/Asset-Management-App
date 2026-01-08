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
  const [collapsedSections, setCollapsedSections] = useState({});
  const [isChildrenCollapsed, setIsChildrenCollapsed] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [navigationHistory, setNavigationHistory] = useState([]);
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

  // Get root assets (assets without parents)
  const getRootAssets = () => {
    return assets.filter(asset => !asset.parent_id);
  };

  // Get children of a specific asset
  const getChildrenAssets = (parentId) => {
    return assets.filter(asset => asset.parent_id === parentId);
  };

  // Get assets with attributes
  const getAssetsWithAttributes = (assetList) => {
    return assetList.filter(asset => {
      if (!asset.asset_type_id) return false;
      const assetType = assetTypes.find(type => type.id === asset.asset_type_id);
      return assetType && assetType.attributes && assetType.attributes.length > 0;
    });
  };

  // Count ancestors for an asset type (recursive)
  const countTypeAncestors = (typeId, visited = new Set()) => {
    if (!typeId || visited.has(typeId)) return 0;
    
    const assetType = assetTypes.find(type => type.id === typeId);
    if (!assetType) return 0;
    
    visited.add(typeId);
    
    const parentIds = assetType.parent_ids || [];
    if (parentIds.length === 0) return 0;
    
    // Count direct parents plus their ancestors
    let ancestorCount = parentIds.length;
    parentIds.forEach(parentId => {
      ancestorCount += countTypeAncestors(parentId, visited);
    });
    
    return ancestorCount;
  };

  // Sort assets by their type's ancestor count (fewest ancestors first - closest to root)
  const sortAssetsByTypeAncestors = (assetList) => {
    return [...assetList].sort((a, b) => {
      const aAncestorCount = a.asset_type_id ? countTypeAncestors(a.asset_type_id) : Infinity;
      const bAncestorCount = b.asset_type_id ? countTypeAncestors(b.asset_type_id) : Infinity;
      
      // Sort by ancestor count (ascending - fewest ancestors first)
      if (aAncestorCount !== bAncestorCount) {
        return aAncestorCount - bAncestorCount;
      }
      
      // If same ancestor count, sort by asset title
      return a.title.localeCompare(b.title);
    });
  };


  // Load survey when asset is selected
  const handleAssetSelect = async (asset, skipHistoryUpdate = false) => {
    if (!asset || !selectedProject) {
      if (isRouteMounted()) {
        setSelectedAsset(null);
        setSurveyData(null);
        setResponses({});
        setNavigationHistory([]);
      }
      return;
    }
    
    // Add current asset to navigation history only if not skipping
    if (!skipHistoryUpdate) {
      setNavigationHistory(prev => [...prev, asset]);
    }
    
    if (isRouteMounted()) {
      setLoading(true);
    }
    
    try {
      const data = await surveyService.getAssetSurvey(
        selectedProject.id,
        asset.id,
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

  // Navigate back in breadcrumb
  const handleBreadcrumbClick = (index) => {
    if (index === -1) {
      // Back to root
      setSelectedAsset(null);
      setSurveyData(null);
      setResponses({});
      setNavigationHistory([]);
    } else {
      // Navigate to specific level
      const targetAsset = navigationHistory[index];
      const newHistory = navigationHistory.slice(0, index + 1);
      setNavigationHistory(newHistory);
      handleAssetSelect(targetAsset, true); // Skip history update since we just set it
    }
  };

  const handleBack = () => {
    if (navigationHistory.length > 1) {
      // Go back one level
      const newHistory = navigationHistory.slice(0, -1);
      const previousAsset = newHistory[newHistory.length - 1];
      setNavigationHistory(newHistory);
      handleAssetSelect(previousAsset, true); // Skip history update since we just set it
    } else if (navigationHistory.length === 1) {
      // Back to root from first level
      setSelectedAsset(null);
      setSurveyData(null);
      setResponses({});
      setNavigationHistory([]);
    } else {
      // Already at root
      setSelectedAsset(null);
      setSurveyData(null);
      setResponses({});
      setNavigationHistory([]);
    }
  };

  // Get the current level's assets to display
  const getCurrentLevelAssets = () => {
    if (!selectedAsset) {
      // Show root assets, sorted by type ancestor count
      const rootAssets = getAssetsWithAttributes(getRootAssets());
      return sortAssetsByTypeAncestors(rootAssets);
    } else {
      // Show children of selected asset, sorted by type ancestor count
      const childAssets = getAssetsWithAttributes(getChildrenAssets(selectedAsset.id));
      return sortAssetsByTypeAncestors(childAssets);
    }
  };

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
    if (selectedAsset) {
      handleAssetSelect(selectedAsset);
    }
  };

  const currentLevelAssets = getCurrentLevelAssets();

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
        {/* Breadcrumb Navigation */}
        {navigationHistory.length > 0 && (
          <div className="breadcrumb-navigation">
            <button 
              className="breadcrumb-item" 
              onClick={() => handleBreadcrumbClick(-1)}
            >
              Root
            </button>
            {navigationHistory.map((asset, index) => (
              <React.Fragment key={asset.id}>
                <span className="breadcrumb-separator">›</span>
                <button 
                  className={`breadcrumb-item ${index === navigationHistory.length - 1 ? 'active' : ''}`}
                  onClick={() => index < navigationHistory.length - 1 && handleBreadcrumbClick(index)}
                >
                  {asset.title}
                </button>
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="loading">
            <div className="loading-spinner"></div>
            <p>Loading...</p>
          </div>
        )}

        {/* Survey Form and Children */}
        {!loading && surveyData && (
          <div className="survey-form">
            {/* Header with Back Button */}
            <div className="form-navigation">
              <button
                onClick={handleBack}
                className="nav-btn back-btn"
                title="Go back"
              >
                ← Back
              </button>
              <div className="form-header-info">
                <h2>{selectedAsset.title}</h2>
                <span className="form-asset-type">{surveyData.assetType?.title || 'No Type'}</span>
              </div>
            </div>

            {/* Children Assets Section - Above Questions */}
            {currentLevelAssets.length > 0 && (
              <div className="children-assets-section collapsible">
                <div 
                  className="children-assets-header"
                  onClick={() => setIsChildrenCollapsed(!isChildrenCollapsed)}
                >
                  <h3>Child Assets ({currentLevelAssets.length})</h3>
                  <span className="collapse-icon">
                    {isChildrenCollapsed ? '▼' : '▲'}
                  </span>
                </div>
                {!isChildrenCollapsed && (
                  <div className="children-assets-grid">
                    {currentLevelAssets.map(asset => {
                      const assetType = assetTypes.find(type => type.id === asset.asset_type_id);
                      const attributeCount = assetType?.attributes?.length || 0;
                      
                      return (
                        <div 
                          key={asset.id}
                          className="child-asset-card"
                          onClick={() => handleAssetSelect(asset)}
                        >
                          <div className="child-asset-name">{asset.title}</div>
                          <div className="child-asset-type">{assetType?.title || 'No Type'}</div>
                          <div className="child-asset-attributes">
                            {attributeCount} attribute{attributeCount !== 1 ? 's' : ''}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

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

        {/* Root Assets - Show when no asset is selected */}
        {!loading && !surveyData && (
          <div className="root-assets-section">
            <h2>Select an Asset</h2>
            {currentLevelAssets.length === 0 ? (
              <div className="no-assets-message">
                <p>No assets with attributes found at this level.</p>
                <p>Please create assets with attributes in the <strong>Structure → Asset Hierarchy</strong> section.</p>
              </div>
            ) : (
              <div className="root-assets-grid">
                {currentLevelAssets.map(asset => {
                  const assetType = assetTypes.find(type => type.id === asset.asset_type_id);
                  const attributeCount = assetType?.attributes?.length || 0;
                  const childrenCount = getChildrenAssets(asset.id).length;
                  
                  return (
                    <div 
                      key={asset.id}
                      className="root-asset-card"
                      onClick={() => handleAssetSelect(asset)}
                    >
                      <div className="root-asset-name">{asset.title}</div>
                      <div className="root-asset-type">{assetType?.title || 'No Type'}</div>
                      <div className="root-asset-info">
                        <span className="root-asset-attributes">
                          {attributeCount} attribute{attributeCount !== 1 ? 's' : ''}
                        </span>
                        {childrenCount > 0 && (
                          <span className="root-asset-children">
                            {childrenCount} child{childrenCount !== 1 ? 'ren' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SurveyScreen;

