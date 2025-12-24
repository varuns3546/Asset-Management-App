import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateProject } from '../features/projects/projectSlice';
import FormField from '../components/forms/FormField';
import ButtonGroup from '../components/forms/ButtonGroup';
import ErrorMessage from '../components/forms/ErrorMessage';
import '../styles/homeScreen.css';

const HomeScreen = () => {
  const { selectedProject } = useSelector((state) => state.projects);
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    latitude: '',
    longitude: ''
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Initialize form data when project changes
  useEffect(() => {
    if (selectedProject) {
      setFormData({
        title: selectedProject.title || selectedProject.name || '',
        description: selectedProject.description || '',
        latitude: selectedProject.latitude !== null && selectedProject.latitude !== undefined ? selectedProject.latitude.toString() : '',
        longitude: selectedProject.longitude !== null && selectedProject.longitude !== undefined ? selectedProject.longitude.toString() : ''
      });
    }
  }, [selectedProject]);

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
        description: selectedProject.description || '',
        latitude: selectedProject.latitude !== null && selectedProject.latitude !== undefined ? selectedProject.latitude.toString() : '',
        longitude: selectedProject.longitude !== null && selectedProject.longitude !== undefined ? selectedProject.longitude.toString() : ''
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

    // Validate latitude if provided
    if (formData.latitude && formData.latitude.trim() !== '') {
      const lat = parseFloat(formData.latitude.trim());
      if (isNaN(lat) || lat < -90 || lat > 90) {
        setError('Latitude must be a number between -90 and 90');
        return;
      }
    }

    // Validate longitude if provided
    if (formData.longitude && formData.longitude.trim() !== '') {
      const lng = parseFloat(formData.longitude.trim());
      if (isNaN(lng) || lng < -180 || lng > 180) {
        setError('Longitude must be a number between -180 and 180');
        return;
      }
    }

    setSaving(true);
    try {
      const updateData = {
        title: formData.title.trim(),
        description: formData.description.trim() || ''
      };

      // Add latitude if provided
      if (formData.latitude && formData.latitude.trim() !== '') {
        updateData.latitude = parseFloat(formData.latitude.trim());
      } else {
        updateData.latitude = null;
      }

      // Add longitude if provided
      if (formData.longitude && formData.longitude.trim() !== '') {
        updateData.longitude = parseFloat(formData.longitude.trim());
      } else {
        updateData.longitude = null;
      }

      await dispatch(updateProject({
        projectId: selectedProject.id,
        projectData: updateData
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
            <div className="project-info-card">
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

                  <div className="coordinates-grid">
                    <FormField
                      label="Latitude:"
                      id="project-latitude-edit"
                      type="number"
                      placeholder="e.g., 40.7128"
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                      disabled={saving}
                      inputProps={{ 
                        step: 'any',
                        min: '-90',
                        max: '90'
                      }}
                    />
                    
                    <FormField
                      label="Longitude:"
                      id="project-longitude-edit"
                      type="number"
                      placeholder="e.g., -74.0060"
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                      disabled={saving}
                      inputProps={{ 
                        step: 'any',
                        min: '-180',
                        max: '180'
                      }}
                    />
                  </div>

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
                  <div className="project-header">
                    <div className="project-content">
                      <h3 className="project-title">
                        {selectedProject.title || selectedProject.name}
                      </h3>
                      {selectedProject.description && (
                        <p className="project-description">
                          {selectedProject.description}
                        </p>
                      )}
                      {!selectedProject.description && (
                        <p className="project-description-empty">
                          No description
                        </p>
                      )}
                      {(selectedProject.latitude !== null && selectedProject.latitude !== undefined) || 
                       (selectedProject.longitude !== null && selectedProject.longitude !== undefined) ? (
                        <div className="location-values">
                          {selectedProject.latitude !== null && selectedProject.latitude !== undefined && (
                            <span>Latitude: {selectedProject.latitude}</span>
                          )}
                          <br/>
                          {selectedProject.longitude !== null && selectedProject.longitude !== undefined && (
                            <span>Longitude: {selectedProject.longitude}</span>
                          )}
                        </div>
                      ) : null}
                    </div>
                    <button
                      onClick={handleEdit}
                      className="btn btn-secondary project-edit-button"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="project-info-card">
              <h3 className="project-title">No Project Selected</h3>
              <p>Please select or create a project to get started.</p>
              <p>Use the <strong>Project</strong> menu in the navigation bar to:</p>
              <ul className="info-list">
                <li>Open an existing project</li>
                <li>Create a new project</li>
              </ul>
            </div>
          )}
        </div>

        <div className="metrics-section">
          <h2>Getting Started</h2>
          <div className="project-info-card">
            <p>Use the navigation menu to access different features:</p>
            <ul className="info-list">
              <li><strong>Project</strong> - Create, open, or manage projects</li>
              <li><strong>Structure</strong> - Set up asset hierarchies and types</li>
              <li><strong>Enter Data</strong> - Add questionnaire responses and geodata</li>
              <li><strong>Map</strong> - View and edit your geographic data</li>
              <li><strong>Usage</strong> - View account usage and storage metrics</li>
            </ul>
            <div className="docs-button-container">
              <a
                href="https://github.com/varuns3546/GIS-Vulnerability-Assesment-Tool"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary docs-link"
              >
                📚 Read the Docs
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;
