import '../styles/formStyles.css'
import { createProject, setSelectedProjectAsync } from '../features/projects/projectSlice'
import { useDispatch } from 'react-redux'
import { useState } from 'react'
import { useFormState } from '../hooks/useFormReset'
import useAsyncOperation from '../hooks/useAsyncOperation'
import { validateRequired } from '../utils/validation'
import FormField from './forms/FormField'
import ButtonGroup from './forms/ButtonGroup'
import ErrorMessage from './forms/ErrorMessage'
const CreateProjectModal = ({ onClose }) => {
    const dispatch = useDispatch()
    const initialState = {
        title: '',
        description: '',
        latitude: '',
        longitude: ''
    }
    const [formData, setFormData, resetForm] = useFormState(initialState)
    const { title, description, latitude, longitude } = formData
    
    const { execute: createProjectAsync, loading, error } = useAsyncOperation(
        async (data) => {
            const result = await dispatch(createProject(data))
            // If project was created successfully, set it as selected in user_profiles
            if (createProject.fulfilled.match(result) && result.payload?.id) {
                await dispatch(setSelectedProjectAsync(result.payload.id))
            }
            return result
        },
        {
            onSuccess: () => {
                resetForm()
                if (onClose) {
                    onClose()
                }
            }
        }
    )
    
    const [validationError, setValidationError] = useState('')
    
    const handleCreateProject = async () => {
        setValidationError('')
        const titleError = validateRequired(title, 'Project title')
        if (titleError) {
            setValidationError(titleError)
            return
        }
        try {
            await createProjectAsync(formData)
        } catch (err) {
            // Error is handled by useAsyncOperation hook
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
            
            <ErrorMessage message={error || validationError} />
            
            <ButtonGroup
                buttons={[
                    {
                        label: 'Cancel',
                        variant: 'secondary',
                        onClick: () => onClose && onClose(),
                        disabled: loading
                    },
                    {
                        label: loading ? 'Creating...' : 'Create Project',
                        variant: 'success',
                        onClick: handleCreateProject,
                        disabled: loading
                    }
                ]}
            />
        </div>
    )
}

export default CreateProjectModal

