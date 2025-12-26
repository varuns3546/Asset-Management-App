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
    description: ''
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Initialize form data when project changes
  useEffect(() => {
    if (selectedProject) {
      setFormData({
        title: selectedProject.title || selectedProject.name || '',
        description: selectedProject.description || ''
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
          <h2>Getting Started</h2>
          <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '8px', marginTop: '20px' }}>
            <p>Use the navigation menu to access different features:</p>
            <ul style={{ marginTop: '15px', paddingLeft: '20px' }}>
              <li><strong>Project</strong> - Create, open, or manage projects</li>
              <li><strong>Structure</strong> - Set up asset hierarchies and types</li>
              <li><strong>Enter Data</strong> - Add questionnaire responses and geodata</li>
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
