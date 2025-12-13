import '../styles/projectComponents.css'
import { createProject, setSelectedProjectAsync } from '../features/projects/projectSlice'
import { useDispatch } from 'react-redux'
import { useState } from 'react'
import FormField from './forms/FormField'
import ButtonGroup from './forms/ButtonGroup'
const CreateProjectModal = ({ onClose }) => {
    const dispatch = useDispatch()
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        latitude: '',
        longitude: ''
    })
    const { title, description, latitude, longitude } = formData
    const handleCreateProject = async () => {
        if (title.trim() === '') {
            console.log('Project title is required')
            return
        }
        else{
            const result = await dispatch(createProject(formData))
            // If project was created successfully, set it as selected in user_profiles
            if (createProject.fulfilled.match(result) && result.payload?.id) {
                await dispatch(setSelectedProjectAsync(result.payload.id))
            }
            setFormData({
                title: '',
                description: '',
                latitude: '',
                longitude: ''
            })
            // Close the modal after creating project
            if (onClose) {
                onClose()
            }
        }
    }
    return (
        <div className="create-project-modal">
            <FormField
                label="Project Title:"
                id="project-title"
                type="text"
                placeholder="Enter project title..."
                value={title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
            
            <FormField
                label="Description:"
                id="project-description"
                type="textarea"
                placeholder="Enter project description..."
                value={description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
            />

            <FormField
                label="Latitude:"
                id="project-latitude"
                type="number"
                placeholder="Enter latitude (e.g., 40.7128)"
                value={latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                inputProps={{ step: 'any' }}
            />

            <FormField
                label="Longitude:"
                id="project-longitude"
                type="number"
                placeholder="Enter longitude (e.g., -74.0060)"
                value={longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                inputProps={{ step: 'any' }}
            />
            
            <ButtonGroup
                buttons={[
                    {
                        label: 'Cancel',
                        variant: 'secondary',
                        onClick: () => onClose && onClose()
                    },
                    {
                        label: 'Create Project',
                        variant: 'success',
                        onClick: handleCreateProject
                    }
                ]}
            />
        </div>
    )
}

export default CreateProjectModal

