import '../styles/projectComponents.css'
import { createProject } from '../features/projects/projectSlice'
import { useDispatch } from 'react-redux'
import { useState } from 'react'
const CreateProject = ({ onClose }) => {
    const dispatch = useDispatch()
    const [formData, setFormData] = useState({
        title: '',
        description: ''
    })
    const { title, description } = formData
    const handleCreateProject = () => {
        if (title.trim() === '') {
            console.log('Project title is required')
            return
        }
        else{
            dispatch(createProject(formData))
            setFormData({
                title: '',
                description: ''
            })
            // Close the modal after creating project
            if (onClose) {
                onClose()
            }
        }
    }
    return (
        <div>
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

export default CreateProject

