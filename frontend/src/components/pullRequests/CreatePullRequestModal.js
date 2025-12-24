import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createPullRequest } from '../../features/pullRequests/pullRequestSlice';
import { getMasterProjects } from '../../features/projects/projectSlice';
import FormField from '../forms/FormField';
import ButtonGroup from '../forms/ButtonGroup';
import ErrorMessage from '../forms/ErrorMessage';
import '../../styles/pullRequest.css';

const CreatePullRequestModal = ({ sourceProjectId, onClose }) => {
  const dispatch = useDispatch();
  const { masterProjects, isLoading: projectsLoading } = useSelector((state) => state.projects);
  const { isLoading, isError, message } = useSelector((state) => state.pullRequests);
  
  const [formData, setFormData] = useState({
    targetProjectId: '',
    title: '',
    description: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    // Load master projects
    dispatch(getMasterProjects());
  }, [dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.targetProjectId || !formData.title.trim()) {
      setError('Target project and title are required');
      return;
    }

    try {
      await dispatch(createPullRequest({
        sourceProjectId,
        targetProjectId: formData.targetProjectId,
        title: formData.title.trim(),
        description: formData.description.trim() || ''
      })).unwrap();

      if (onClose) {
        onClose();
      }
    } catch (err) {
      setError(err || 'Failed to create pull request');
    }
  };

  const handleCancel = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="create-pr-modal" style={{ padding: '24px', maxWidth: '600px' }}>
      <h2 style={{ marginTop: 0, marginBottom: '20px' }}>Create Pull Request</h2>

      <form onSubmit={handleSubmit}>
        <FormField
          label="Target Master Project:"
          id="target-project"
          type="select"
          value={formData.targetProjectId}
          onChange={(e) => setFormData({ ...formData, targetProjectId: e.target.value })}
          required
          disabled={isLoading || projectsLoading}
          selectOptions={[
            { value: '', label: 'Select a master project...' },
            ...(masterProjects || []).map(project => ({
              value: project.id,
              label: project.title
            }))
          ]}
        />

        <FormField
          label="Title:"
          id="pr-title"
          type="text"
          placeholder="Enter pull request title..."
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
          disabled={isLoading}
        />

        <FormField
          label="Description:"
          id="pr-description"
          type="textarea"
          placeholder="Describe the changes in this pull request..."
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={6}
          disabled={isLoading}
        />

        <ErrorMessage message={error || message} />

        <ButtonGroup
          buttons={[
            {
              label: 'Cancel',
              variant: 'secondary',
              onClick: handleCancel,
              disabled: isLoading
            },
            {
              label: isLoading ? 'Creating...' : 'Create Pull Request',
              variant: 'primary',
              onClick: handleSubmit,
              disabled: isLoading || !formData.targetProjectId || !formData.title.trim()
            }
          ]}
        />
      </form>
    </div>
  );
};

export default CreatePullRequestModal;

