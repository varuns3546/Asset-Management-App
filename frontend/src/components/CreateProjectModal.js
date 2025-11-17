import '../styles/projectComponents.css'
import { createProject } from '../features/projects/projectSlice'
import { useDispatch } from 'react-redux'
import { useState } from 'react'
const CreateProjectModal = ({ onClose }) => {
    const dispatch = useDispatch()
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        latitude: '',
        longitude: ''
    })
    const { title, description, latitude, longitude } = formData
    const handleCreateProject = () => {
        if (title.trim() === '') {
            console.log('Project title is required')
            return
        }
        else{
            dispatch(createProject(formData))
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
            <div className="form-group">
                <label htmlFor="project-title" className="form-label">
                    Project Title:
                </label>
                <input 
                    type="text" 
                    id="project-title"
                    placeholder="Enter project title..."
                    className="form-input"
                    value={title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
            </div>
            
            <div className="form-group">
                <label htmlFor="project-description" className="form-label">
                    Description:
                </label>
                <textarea 
                    id="project-description"
                    placeholder="Enter project description..."
                    rows="4"
                    className="form-textarea"
                    value={description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
            </div>

            <div className="form-group">
                <label htmlFor="project-latitude" className="form-label">
                    Latitude:
                </label>
                <input 
                    type="number" 
                    id="project-latitude"
                    placeholder="Enter latitude (e.g., 40.7128)"
                    className="form-input"
                    value={latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    step="any"
                />
            </div>

            <div className="form-group">
                <label htmlFor="project-longitude" className="form-label">
                    Longitude:
                </label>
                <input 
                    type="number" 
                    id="project-longitude"
                    placeholder="Enter longitude (e.g., -74.0060)"
                    className="form-input"
                    value={longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    step="any"
                />
            </div>        
            <div className="button-group">
                <button className="btn btn-secondary" onClick={() => onClose && onClose()}>
                    Cancel
                </button>
                <button className="btn btn-success" onClick={handleCreateProject}>
                    Create Project
                </button>
            </div>
        </div>
    )
}

export default CreateProjectModal

