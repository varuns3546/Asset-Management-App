import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateProject } from '../features/projects/projectSlice';
import FormField from '../components/forms/FormField';
import ButtonGroup from '../components/forms/ButtonGroup';
import ErrorMessage from '../components/forms/ErrorMessage';
import MapPreview from '../components/map/MapPreview';
import projectService from '../features/projects/projectService';
import '../styles/homeScreen.css';

const HomeScreen = () => {
  const { selectedProject } = useSelector((state) => state.projects);
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [surveyStatistics, setSurveyStatistics] = useState({
    surveyQuestionsTotal: 0,
    surveyAnswersTotal: 0
  });
  const [loadingStatistics, setLoadingStatistics] = useState(false);

  // Initialize form data when project changes
  useEffect(() => {
    if (selectedProject) {
      setFormData({
        title: selectedProject.title || selectedProject.name || '',
        description: selectedProject.description || ''
      });
    }
  }, [selectedProject]);

  // Fetch survey statistics when project changes
  useEffect(() => {
    const fetchSurveyStatistics = async () => {
      if (!selectedProject?.id || !user) {
        setSurveyStatistics({
          surveyQuestionsTotal: 0,
          surveyAnswersTotal: 0
        });
        return;
      }

      setLoadingStatistics(true);
      try {
        const userData = JSON.parse(localStorage.getItem('user'));
        const response = await projectService.getSurveyStatistics(
          selectedProject.id,
          userData?.token
        );
        
        if (response.success && response.data) {
          setSurveyStatistics({
            surveyQuestionsTotal: response.data.surveyQuestionsTotal || 0,
            surveyAnswersTotal: response.data.surveyAnswersTotal || 0
          });
        }
      } catch (error) {
        console.error('Error fetching survey statistics:', error);
        // Don't show error to user, just keep default values
      } finally {
        setLoadingStatistics(false);
      }
    };

    fetchSurveyStatistics();
  }, [selectedProject?.id, user]);

  const handleEdit = () => {
    setIsEditing(true);
    setError('');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError('');
    // Reset form data to original project values
    if (selectedProject) {
      setFormData({
        title: selectedProject.title || selectedProject.name || '',
        description: selectedProject.description || ''
      });
    }
  };

  const handleSave = async () => {
    if (!selectedProject) return;

    setError('');
    
    // Validate title
    if (!formData.title || formData.title.trim() === '') {
      setError('Project title is required');
      return;
    }

    setSaving(true);
    try {
      await dispatch(updateProject({
        projectId: selectedProject.id,
        projectData: {
          title: formData.title.trim(),
          description: formData.description.trim() || ''
        }
      })).unwrap();
      
      setIsEditing(false);
    } catch (err) {
      setError(err || 'Failed to update project');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="home-screen">
      <div className="home-header">
        <div>
          <h1>Welcome</h1>
          <p className="header-subtitle">Your project dashboard</p>
        </div>
      </div>

      <div className="metrics-container">
        <div className="metrics-section">
          <h2>Project Information</h2>
          {selectedProject ? (
            <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '8px', marginTop: '20px' }}>
              {isEditing ? (
                <div>
                  <FormField
                    label="Project Title:"
                    id="project-title-edit"
                    type="text"
                    placeholder="Enter project title..."
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    disabled={saving}
                  />
                  
                  <FormField
                    label="Description:"
                    id="project-description-edit"
                    type="textarea"
                    placeholder="Enter project description..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    disabled={saving}
                  />

                  <ErrorMessage message={error} />
                  
                  <ButtonGroup
                    buttons={[
                      {
                        label: 'Cancel',
                        variant: 'secondary',
                        onClick: handleCancel,
                        disabled: saving
                      },
                      {
                        label: saving ? 'Saving...' : 'Save',
                        variant: 'primary',
                        onClick: handleSave,
                        disabled: saving
                      }
                    ]}
                  />
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ marginTop: 0, marginBottom: '8px' }}>
                        {selectedProject.title || selectedProject.name}
                      </h3>
                      {selectedProject.description && (
                        <p style={{ color: '#666', marginTop: '8px', whiteSpace: 'pre-wrap' }}>
                          {selectedProject.description}
                        </p>
                      )}
                      {!selectedProject.description && (
                        <p style={{ color: '#999', fontStyle: 'italic', marginTop: '8px' }}>
                          No description
                        </p>
                      )}
                    </div>
                    <button
                      onClick={handleEdit}
                      className="btn btn-secondary"
                      style={{ marginLeft: '15px' }}
                    >
                      Edit
                    </button>
                  </div>
                  
                  {/* Map Snapshot */}
                  {selectedProject.map_snapshot_url && (
                    <div style={{ marginTop: '20px', marginBottom: '20px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #ddd' }}>
                      <img 
                        src={selectedProject.map_snapshot_url} 
                        alt="Map snapshot" 
                        style={{ 
                          width: '100%', 
                          height: 'auto', 
                          maxHeight: '400px',
                          objectFit: 'cover',
                          display: 'block'
                        }}
                        onError={(e) => {
                          // Hide image if it fails to load
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  
                  {/* Map Preview */}
                  <div className="map-preview-section">
                    <h4>Map Preview</h4>
                    <MapPreview 
                      projectId={selectedProject.id}
                      projectCoordinates={selectedProject.latitude != null && selectedProject.longitude != null
                        ? [parseFloat(selectedProject.latitude), parseFloat(selectedProject.longitude)]
                        : null}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '8px', marginTop: '20px' }}>
              <h3 style={{ marginTop: 0 }}>No Project Selected</h3>
              <p>Please select or create a project to get started.</p>
              <p>Use the <strong>Project</strong> menu in the navigation bar to:</p>
              <ul style={{ marginTop: '15px', paddingLeft: '20px' }}>
                <li>Open an existing project</li>
                <li>Create a new project</li>
              </ul>
            </div>
          )}
        </div>

        <div className="metrics-section">
          <h2>Survey Statistics</h2>
          {selectedProject ? (
            <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '8px', marginTop: '20px' }}>
              {loadingStatistics ? (
                <p>Loading statistics...</p>
              ) : (
                <>
                  <div style={{ marginBottom: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontSize: '16px', color: '#495057' }}>Survey Questions Total:</span>
                      <strong style={{ fontSize: '18px', color: '#212529' }}>{surveyStatistics.surveyQuestionsTotal}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '16px', color: '#495057' }}>Survey Answers Total:</span>
                      <strong style={{ fontSize: '18px', color: '#212529' }}>{surveyStatistics.surveyAnswersTotal}</strong>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '8px', marginTop: '20px' }}>
              <p>Please select a project to view survey statistics.</p>
            </div>
          )}
        </div>

        <div className="metrics-section">
          <h2>Getting Started</h2>
          <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '8px', marginTop: '20px' }}>
            <p>Use the navigation menu to access different features:</p>
            <ul style={{ marginTop: '15px', paddingLeft: '20px' }}>
              <li><strong>Project</strong> - Create, open, or manage projects</li>
              <li><strong>Structure</strong> - Set up asset hierarchies and types</li>
              <li><strong>Enter Data</strong> - Add attribute values and geodata</li>
              <li><strong>Map</strong> - View and edit your geographic data</li>
              <li><strong>Usage</strong> - View account usage and storage metrics</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;
