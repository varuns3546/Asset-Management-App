import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, ScrollView, Alert, Animated } from 'react-native';
import { createProject, getProjects, deleteProject, updateProject } from '../features/projects/projectSlice';
import { useDispatch } from 'react-redux';
import { loadUser } from '../features/auth/authSlice';
import { componentStyles } from '../styles';

const ProjectNavbar = ({ navigation }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isOpenModalVisible, setIsOpenModalVisible] = useState(false);
  // Mock projects data - in a real app, this would come from Redux store
  const [projects, setProjects] = useState([]);
  
  const [currentProject, setCurrentProject] = useState(null);
  const [newProjectFormData, setNewProjectFormData] = useState({
        title: '',
        description: '',
    })
    const dispatch = useDispatch()
    useEffect(() => {
            dispatch(loadUser())
        }, [])
    const handleSubmit = () => {
        
    }

  const toggleNavbar = () => {
    setIsExpanded(!isExpanded);
  };

  const autoCollapse = () => {
    setIsExpanded(false);
  };

  const handleCreateProject = () => {
    if (!newProjectFormData.title.trim()) { 
      Alert.alert('Error', 'Please enter a project name');
      return;
    }

    const newProject = {
      id: Date.now(),
      title: newProjectFormData.title.trim(),
      description: newProjectFormData.description.trim(),
      lastModified: new Date().toISOString().split('T')[0],
    };

    dispatch(createProject(newProjectFormData))
    setNewProjectFormData({
        title: '',
        description: '',
    })    
    setCurrentProject(newProject);
    setNewProjectFormData({
        title: '',
        description: '',
    })
    setIsCreateModalVisible(false);
    autoCollapse(); // Auto-collapse after creating project
    
    Alert.alert('Success', `Project "${newProject.title}" created successfully!`);
  };

  const handleOpenProject = (project) => {
    setCurrentProject(project);
    setIsOpenModalVisible(false);
    autoCollapse(); // Auto-collapse after selecting project
    Alert.alert('Success', `Switched to project "${project.title}"`);
  };

  const handleDeleteProject = (projectId) => {
    Alert.alert(
      'Delete Project',
      'Are you sure you want to delete this project? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updatedProjects = projects.filter(p => p.id !== projectId);
            setProjects(updatedProjects);
            
            if (currentProject.id === projectId && updatedProjects.length > 0) {
              setCurrentProject(updatedProjects[0]);
            }
            autoCollapse(); // Auto-collapse after deleting project
          }
        }
      ]
    );
  };

  const handleCreateButtonPress = () => {
    setIsCreateModalVisible(true);
    autoCollapse(); // Auto-collapse when opening create modal
  };

  const handleOpenButtonPress = () => {
    setIsOpenModalVisible(true);
    autoCollapse(); // Auto-collapse when opening project list
  };

  return (
    <View style={componentStyles.projectNavbar.container}>
      {/* Collapsed State - Always Visible */}
      <View style={componentStyles.projectNavbar.collapsedHeader}>
        {currentProject && (
            <View style={componentStyles.projectNavbar.currentProject}>
            <Text style={componentStyles.projectNavbar.currentProjectLabel}>Current Project:</Text>
            <Text style={componentStyles.projectNavbar.currentProjectName}>
                {currentProject?.name || 'No Project Selected'}
            </Text>
            </View>
        )}
        
        <TouchableOpacity
          style={componentStyles.projectNavbar.toggleButton}
          onPress={toggleNavbar}
        >
          <Text style={componentStyles.projectNavbar.toggleButtonText}>
            {isExpanded ? '▲' : '▼'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Expanded State - Only Visible When Expanded */}
      {isExpanded && (
        <View style={componentStyles.projectNavbar.expandedContent}>
          <View style={componentStyles.projectNavbar.actions}>
            <TouchableOpacity
              style={componentStyles.projectNavbar.createButton}
              onPress={handleCreateButtonPress}
            >
              <Text style={componentStyles.projectNavbar.createButtonText}>➕ New Project</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={componentStyles.projectNavbar.openButton}
              onPress={handleOpenButtonPress}
            >
              <Text style={componentStyles.projectNavbar.openButtonText}>📁 Open Project</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Create Project Modal */}
      <Modal
        visible={isCreateModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsCreateModalVisible(false)}
      >
        <View style={componentStyles.projectNavbar.modalOverlay}>
          <View style={componentStyles.projectNavbar.modalContent}>
            <Text style={componentStyles.projectNavbar.modalTitle}>Create New Project</Text>
            
            <TextInput
              style={componentStyles.projectNavbar.input}
              placeholder="Project Name"
              value={newProjectFormData.title}
              onChangeText={(text) => setNewProjectFormData({...newProjectFormData, title: text})}
              maxLength={50}
            />
            
            <TextInput
              style={[componentStyles.projectNavbar.input, componentStyles.projectNavbar.textArea]}
              placeholder="Project Description (optional)"
              value={newProjectFormData.description}
              onChangeText={(text) => setNewProjectFormData({...newProjectFormData, description: text}) }
              multiline
              numberOfLines={3}
              maxLength={200}
            />

            <View style={componentStyles.projectNavbar.modalActions}>
              <TouchableOpacity
                style={componentStyles.projectNavbar.cancelButton}
                onPress={() => {
                  setIsCreateModalVisible(false);
                    setNewProjectFormData({
                    title: '',
                    description: '',
                  })
                }}
              >
                <Text style={componentStyles.projectNavbar.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={componentStyles.projectNavbar.confirmButton}
                onPress={handleCreateProject}
              >
                <Text style={componentStyles.projectNavbar.confirmButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Open Project Modal */}
      <Modal
        visible={isOpenModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsOpenModalVisible(false)}
      >
        <View style={componentStyles.projectNavbar.modalOverlay}>
          <View style={componentStyles.projectNavbar.modalContent}>
            <Text style={componentStyles.projectNavbar.modalTitle}>Open Project</Text>
            
            <ScrollView style={componentStyles.projectNavbar.projectList}>
              {projects.map((project) => (
                <TouchableOpacity
                  key={project.id}
                  style={[
                    componentStyles.projectNavbar.projectItem,
                    currentProject?.id === project.id && componentStyles.projectNavbar.projectItemActive
                  ]}
                  onPress={() => handleOpenProject(project)}
                >
                  <View style={componentStyles.projectNavbar.projectInfo}>
                    <Text style={componentStyles.projectNavbar.projectName}>{project.name}</Text>
                    <Text style={componentStyles.projectNavbar.projectDescription}>
                      {project.description || 'No description'}
                    </Text>
                    <Text style={componentStyles.projectNavbar.projectDate}>
                      Last modified: {project.lastModified}
                    </Text>
                  </View>
                  
                  <TouchableOpacity
                    style={componentStyles.projectNavbar.deleteButton}
                    onPress={() => handleDeleteProject(project.id)}
                  >
                    <Text style={componentStyles.projectNavbar.deleteButtonText}>🗑️</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={componentStyles.projectNavbar.closeButton}
              onPress={() => setIsOpenModalVisible(false)}
            >
              <Text style={componentStyles.projectNavbar.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ProjectNavbar;
