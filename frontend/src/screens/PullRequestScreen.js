import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import PullRequestList from '../components/pullRequests/PullRequestList';
import CreatePullRequestModal from '../components/pullRequests/CreatePullRequestModal';
import Modal from '../components/Modal';
import '../styles/pullRequest.css';

const PullRequestScreen = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { selectedProject } = useSelector((state) => state.projects);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleCreatePR = () => {
    if (!selectedProject) {
      alert('Please select a project first');
      return;
    }

    // Check if project is a clone (has parent_project_id)
    if (!selectedProject.parent_project_id) {
      alert('You can only create pull requests from cloned projects. Please clone a master project first.');
      return;
    }

    setShowCreateModal(true);
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ margin: 0 }}>Pull Requests</h1>
        <button
          className="btn btn-primary"
          onClick={handleCreatePR}
          disabled={!selectedProject || !selectedProject.parent_project_id}
          style={{
            padding: '10px 20px',
            fontSize: '16px'
          }}
        >
          + New Pull Request
        </button>
      </div>

      {!selectedProject && (
        <div style={{ padding: '20px', background: '#fff3cd', border: '1px solid #ffc107', borderRadius: '6px', marginBottom: '20px' }}>
          Please select a project to view its pull requests
        </div>
      )}

      <PullRequestList projectId={selectedProject?.id} />

      {showCreateModal && (
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Create Pull Request"
        >
          <CreatePullRequestModal
            sourceProjectId={selectedProject?.id}
            onClose={() => setShowCreateModal(false)}
          />
        </Modal>
      )}
    </div>
  );
};

export default PullRequestScreen;

