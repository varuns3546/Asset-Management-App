import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import questionnaireService from '../services/questionnaireService';
import { getHierarchy } from '../features/projects/projectSlice';
import '../styles/questionnaire.css';

const QuestionnaireScreen = () => {
  const dispatch = useDispatch();
  const { selectedProject, currentHierarchy } = useSelector((state) => state.projects);
  const { user } = useSelector((state) => state.auth);
  
  const [assets, setAssets] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [questionnaireData, setQuestionnaireData] = useState(null);
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load assets for the project
  useEffect(() => {
    if (selectedProject && user) {
      dispatch(getHierarchy(selectedProject.id));
    }
  }, [selectedProject, dispatch, user]);

  // Update assets when hierarchy changes
  useEffect(() => {
    if (currentHierarchy && Array.isArray(currentHierarchy)) {
      setAssets(currentHierarchy);
    }
  }, [currentHierarchy]);

  // Load questionnaire when asset is selected
  const handleAssetSelect = async (assetId) => {
    if (!assetId || !selectedProject) {
      setSelectedAsset(null);
      setQuestionnaireData(null);
      setResponses({});
      return;
    }
    
    setLoading(true);
    try {
      const data = await questionnaireService.getAssetQuestionnaire(
        selectedProject.id,
        assetId,
        user.token
      );

      if (data.success) {
        setQuestionnaireData(data.data);
        setSelectedAsset(data.data.asset);
        
        // Initialize responses from existing data
        const initialResponses = {};
        if (data.data.responses) {
          Object.entries(data.data.responses).forEach(([attrId, response]) => {
            initialResponses[attrId] = response.response_value || '';
          });
        }
        setResponses(initialResponses);
      }
    } catch (error) {
      console.error('Error loading questionnaire:', error);
      alert('Failed to load questionnaire. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle response change
  const handleResponseChange = (attributeId, value) => {
    setResponses(prev => ({
      ...prev,
      [attributeId]: value
    }));
  };

  // Submit responses
  const handleSubmit = async () => {
    if (!selectedAsset || !questionnaireData) return;

    setSaving(true);
    try {
      const responsesArray = questionnaireData.attributes.map(attr => ({
        attributeId: attr.id,
        attributeTitle: attr.title,
        value: responses[attr.id] || '',
        metadata: {}
      }));

      const result = await questionnaireService.submitResponses(
        selectedProject.id,
        selectedAsset.id,
        responsesArray,
        user.token
      );

      if (result.success) {
        alert('Responses saved successfully!');
      }
    } catch (error) {
      console.error('Error submitting responses:', error);
      alert('Failed to save responses. Please try again.');
    } finally {
      setSaving(false);
    }
  };

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
        {/* Asset Selection */}
        <div className="asset-selection">
          <h2>Select Asset</h2>
          <select
            value={selectedAsset?.id || ''}
            onChange={(e) => handleAssetSelect(e.target.value)}
            className="asset-dropdown"
          >
            <option value="">-- Choose an asset --</option>
            {assets.map(asset => (
              <option key={asset.id} value={asset.id}>
                {asset.title}
              </option>
            ))}
          </select>
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
                    </label>
                    <textarea
                      id={`attr-${attribute.id}`}
                      value={responses[attribute.id] || ''}
                      onChange={(e) => handleResponseChange(attribute.id, e.target.value)}
                      placeholder="Enter your response..."
                      rows={3}
                      className="response-input"
                    />
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

