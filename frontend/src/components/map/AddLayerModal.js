import React, { useState } from 'react';
import FormField from '../forms/FormField';
import ErrorMessage from '../forms/ErrorMessage';
import ButtonGroup from '../forms/ButtonGroup';
import '../../styles/modal.css';

const AddLayerModal = ({ isOpen, onClose, onAddLayer }) => {
  const [layerUrl, setLayerUrl] = useState('');
  const [layerType, setLayerType] = useState('feature');
  const [layerName, setLayerName] = useState('');
  const [error, setError] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [activeTab, setActiveTab] = useState('manual'); // 'manual' or 'search'

  // Popular ArcGIS Online sample layers
  const sampleLayers = [
    {
      name: 'World Countries',
      url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/World_Countries_(Generalized)/FeatureServer/0',
      type: 'feature'
    },
    {
      name: 'USA States',
      url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_States_Generalized/FeatureServer/0',
      type: 'feature'
    },
    {
      name: 'World Cities',
      url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/World_Cities/FeatureServer/0',
      type: 'feature'
    },
    {
      name: 'World Transportation',
      url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/World_Transportation/FeatureServer/0',
      type: 'feature'
    },
    {
      name: 'USA Highways',
      url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_Freeway_System/FeatureServer/0',
      type: 'feature'
    }
  ];

  const handleClose = () => {
    setLayerUrl('');
    setLayerName('');
    setLayerType('feature');
    setError(null);
    setSearchQuery('');
    setSearchResults([]);
    setSearchError(null);
    setActiveTab('manual');
    onClose();
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchError('Please enter a search term');
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setSearchResults([]);

    try {
      // Search ArcGIS Online for layers
      const searchUrl = `https://www.arcgis.com/sharing/rest/search`;
      const params = new URLSearchParams({
        q: `${searchQuery} AND (type:"Feature Service" OR type:"Map Service" OR type:"Image Service")`,
        f: 'json',
        num: 20,
        sortField: 'relevance',
        sortOrder: 'desc'
      });

      const response = await fetch(`${searchUrl}?${params}`);
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        setSearchResults(data.results);
      } else {
        setSearchError('No layers found. Try a different search term.');
      }
    } catch (err) {
      console.error('Search error:', err);
      setSearchError('Failed to search. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = async (result) => {
    console.log('Search result selected:', result);
    
    // Determine layer type from result
    let type = 'feature';
    if (result.type === 'Map Service') {
      type = 'map-image';
    } else if (result.type === 'Image Service') {
      type = 'tile';
    }

    console.log('Determined layer type:', type);

    // Construct the layer URL
    let url = result.url;
    console.log('Result URL from API:', url);
    
    if (!url && result.id && result.owner) {
      // Fallback URL construction
      url = `https://services.arcgis.com/${result.owner}/arcgis/rest/services/${result.name}/FeatureServer/0`;
      console.log('Constructed fallback URL:', url);
    }

    // If we have a valid URL, directly add the layer
    if (url) {
      console.log('Attempting to add layer with URL:', url);
      setIsAdding(true);
      setError(null);
      setSearchError(null);

      try {
        const layerData = {
          url: url,
          type: type,
          name: result.title || result.name || 'Custom Layer'
        };
        console.log('Calling onAddLayer with:', layerData);
        await onAddLayer(layerData);
        console.log('Layer added successfully!');

        // Reset and close modal on success
        handleClose();
      } catch (err) {
        console.error('Failed to add layer:', err);
        // If adding fails, populate the form for manual editing
        setLayerUrl(url);
        setLayerName(result.title || result.name || '');
        setLayerType(type);
        setSearchError(err.message || 'Failed to add layer. You can edit the URL and try again.');
        setActiveTab('manual'); // Switch to manual tab to show the populated fields
      } finally {
        setIsAdding(false);
      }
    } else {
      console.warn('No URL found for result:', result);
      // No URL found, just populate the form
      setLayerUrl('');
      setLayerName(result.title || result.name || '');
      setLayerType(type);
      setSearchError('Could not find layer URL. Please enter it manually.');
      setActiveTab('manual');
    }
  };

  const handleAddLayer = async () => {
    if (!layerUrl.trim()) {
      setError('Please enter a layer URL');
      return;
    }

    // Basic URL validation
    if (!layerUrl.match(/^https?:\/\/.+/i)) {
      setError('Please enter a valid URL starting with http:// or https://');
      return;
    }

    setIsAdding(true);
    setError(null);

    try {
      // Pass the layer info to the parent component
      await onAddLayer({
        url: layerUrl.trim(),
        type: layerType,
        name: layerName.trim() || 'Custom Layer'
      });

      // Reset form and close modal
      handleClose();
    } catch (err) {
      setError(err.message || 'Failed to add layer. Please check the URL and try again.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleUseSample = (sample) => {
    setLayerUrl(sample.url);
    setLayerType(sample.type);
    setLayerName(sample.name);
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="overlay" onClick={handleClose}>
      <div className="content add-layer-modal" onClick={(e) => e.stopPropagation()}>
        <div className="header">
          <h2 className="title">Add Layer from ArcGIS Online</h2>
          <button className="close-btn" onClick={handleClose}>×</button>
        </div>

        <div className="body">
          <ErrorMessage message={error} style={{ marginBottom: '15px' }} />

          {/* Tab Navigation */}
          <div className="tab-navigation" style={{ 
            display: 'flex', 
            gap: '10px', 
            marginBottom: '20px',
            borderBottom: '2px solid #e5e7eb'
          }}>
            <button
              type="button"
              onClick={() => setActiveTab('manual')}
              style={{
                padding: '10px 20px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontWeight: activeTab === 'manual' ? '600' : '400',
                color: activeTab === 'manual' ? '#007bff' : '#666',
                borderBottom: activeTab === 'manual' ? '3px solid #007bff' : '3px solid transparent',
                marginBottom: '-2px',
                fontSize: '14px'
              }}
            >
              Manual Entry
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('search')}
              style={{
                padding: '10px 20px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontWeight: activeTab === 'search' ? '600' : '400',
                color: activeTab === 'search' ? '#007bff' : '#666',
                borderBottom: activeTab === 'search' ? '3px solid #007bff' : '3px solid transparent',
                marginBottom: '-2px',
                fontSize: '14px'
              }}
            >
              Search ArcGIS Online
            </button>
          </div>

          {/* Manual Entry Tab */}
          {activeTab === 'manual' && (
            <>
              <FormField
                label="Layer Name (Optional)"
                id="layer-name"
                type="text"
                value={layerName}
                onChange={(e) => setLayerName(e.target.value)}
                placeholder="e.g., My Custom Layer"
                disabled={isAdding}
              />
              <small className="form-text" style={{ display: 'block', marginTop: '-15px', marginBottom: '15px', fontSize: '14px', color: '#666' }}>
                Most ArcGIS Online layers are Feature Layers or Map Image Layers
              </small>

              <FormField
                label="Layer Type"
                id="layer-type"
                type="select"
                value={layerType}
                onChange={(e) => setLayerType(e.target.value)}
                disabled={isAdding}
                selectOptions={[
                  { value: 'feature', label: 'Feature Layer' },
                  { value: 'map-image', label: 'Map Image Layer' },
                  { value: 'tile', label: 'Tile Layer' },
                  { value: 'vector-tile', label: 'Vector Tile Layer' }
                ]}
              />

              <FormField
                label="Layer URL *"
                id="layer-url"
                type="text"
                value={layerUrl}
                onChange={(e) => setLayerUrl(e.target.value)}
                placeholder="https://services.arcgis.com/..."
                disabled={isAdding}
                required
              />
              <small className="form-text" style={{ display: 'block', marginTop: '-15px', marginBottom: '15px', fontSize: '14px', color: '#666' }}>
                Enter the REST service URL from ArcGIS Online
              </small>

          <div className="sample-layers-section" style={{ marginTop: '20px' }}>
            <h4 style={{ marginBottom: '10px', fontSize: '14px', fontWeight: 'bold' }}>
              Sample Layers
            </h4>
            <div className="sample-layers-grid" style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: '8px'
            }}>
              {sampleLayers.map((sample, index) => (
                <button
                  key={index}
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => handleUseSample(sample)}
                  disabled={isAdding}
                  style={{ 
                    padding: '6px 10px',
                    fontSize: '12px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {sample.name}
                </button>
              ))}
            </div>
          </div>

          <div className="layer-help-section" style={{ 
            marginTop: '20px', 
            padding: '12px',
            backgroundColor: '#f8f9fa',
            borderRadius: '4px',
            fontSize: '13px'
          }}>
            <strong>How to find layer URLs:</strong>
            <ol style={{ marginTop: '8px', marginBottom: '0', paddingLeft: '20px' }}>
              <li>Go to <a href="https://www.arcgis.com" target="_blank" rel="noopener noreferrer">ArcGIS.com</a></li>
              <li>Search for feature layers or map services</li>
              <li>Open the item details page</li>
              <li>Click "View" under the service URL</li>
              <li>Copy the REST endpoint URL</li>
            </ol>
          </div>
            </>
          )}

          {/* Search Tab */}
          {activeTab === 'search' && (
            <>
              <div className="search-section">
                <div className="form-group">
                  <label htmlFor="search-query">Search for Layers</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                      id="search-query"
                      type="text"
                      className="form-control"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      placeholder="e.g., population, roads, boundaries..."
                      disabled={isSearching}
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleSearch}
                      disabled={isSearching || !searchQuery.trim()}
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      {isSearching ? 'Searching...' : 'Search'}
                    </button>
                  </div>
                  <small className="form-text">
                    Search for publicly available layers on ArcGIS Online. Click on a result to select it.
                  </small>
                </div>

                {searchError && (
                  <div className="error-message" style={{ marginTop: '15px' }}>
                    {searchError}
                  </div>
                )}

                {isAdding && (
                  <div style={{
                    marginTop: '20px',
                    padding: '15px',
                    backgroundColor: '#e7f3ff',
                    border: '1px solid #007bff',
                    borderRadius: '6px',
                    textAlign: 'center',
                    color: '#007bff',
                    fontWeight: '500'
                  }}>
                    Adding layer to map...
                  </div>
                )}

                {searchResults.length > 0 && !isAdding && (
                  <div className="search-results" style={{ 
                    marginTop: '20px',
                    maxHeight: '400px',
                    overflowY: 'auto',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px'
                  }}>
                    <h4 style={{ 
                      margin: '0',
                      padding: '12px 15px',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      borderBottom: '1px solid #e5e7eb',
                      backgroundColor: '#f8f9fa',
                      position: 'sticky',
                      top: 0,
                      zIndex: 1
                    }}>
                      Search Results ({searchResults.length}) - Click to add
                    </h4>
                    <div style={{ padding: '10px' }}>
                      {searchResults.map((result, index) => (
                        <div
                          key={result.id || index}
                          onClick={() => handleSelectSearchResult(result)}
                          style={{
                            padding: '12px',
                            marginBottom: '8px',
                            border: '1px solid #e5e7eb',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            backgroundColor: '#fff'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#f0f7ff';
                            e.currentTarget.style.borderColor = '#007bff';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#fff';
                            e.currentTarget.style.borderColor = '#e5e7eb';
                          }}
                        >
                          <div style={{ 
                            fontWeight: '600',
                            marginBottom: '4px',
                            color: '#1f2937',
                            fontSize: '14px'
                          }}>
                            {result.title || result.name}
                          </div>
                          <div style={{ 
                            fontSize: '12px',
                            color: '#6b7280',
                            marginBottom: '6px'
                          }}>
                            {result.snippet || result.description || 'No description available'}
                          </div>
                          <div style={{ 
                            fontSize: '11px',
                            color: '#9ca3af',
                            display: 'flex',
                            gap: '15px',
                            flexWrap: 'wrap'
                          }}>
                            <span>
                              <strong>Type:</strong> {result.type}
                            </span>
                            {result.owner && (
                              <span>
                                <strong>Owner:</strong> {result.owner}
                              </span>
                            )}
                            {result.numViews && (
                              <span>
                                <strong>Views:</strong> {result.numViews.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!isSearching && !searchError && searchResults.length === 0 && !searchQuery && (
                  <div style={{ 
                    textAlign: 'center',
                    padding: '40px 20px',
                    color: '#6b7280',
                    fontSize: '14px'
                  }}>
                    Enter a search term and click Search to find layers
                  </div>
                )}
              </div>
            </>
          )}
          
          {/* Action buttons - only show on manual tab */}
          {activeTab === 'manual' && (
            <ButtonGroup
              buttons={[
                {
                  label: 'Cancel',
                  variant: 'secondary',
                  onClick: handleClose,
                  disabled: isAdding
                },
                {
                  label: isAdding ? 'Adding...' : 'Add Layer',
                  variant: 'primary',
                  onClick: handleAddLayer,
                  disabled: isAdding || !layerUrl.trim()
                }
              ]}
            />
          )}
          
          {/* Close button on search tab */}
          {activeTab === 'search' && (
            <ButtonGroup
              buttons={[
                {
                  label: 'Close',
                  variant: 'secondary',
                  onClick: handleClose
                }
              ]}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AddLayerModal;

