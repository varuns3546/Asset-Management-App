import '../styles/projectComponents.css'
import { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { getProjects } from '../features/projects/projectSlice'

const OpenProject = () => {
    const dispatch = useDispatch()
    const [selectedProjectId, setSelectedProjectId] = useState('')
    const [searchTerm, setSearchTerm] = useState('')
    
    const { projects, isLoading, isError, message } = useSelector((state) => state.projects)
    const { user } = useSelector((state) => state.auth)

    useEffect(() => {
        console.log('OpenProject: User state:', user)
        console.log('OpenProject: Dispatching getProjects')
        dispatch(getProjects())
    }, [dispatch])

    // Debug logging
    useEffect(() => {
        console.log('OpenProject: Projects state changed:', { 
            projects, 
            isLoading, 
            isError, 
            message,
            userToken: user?.token ? 'Token exists' : 'No token'
        })
    }, [projects, isLoading, isError, message, user])

    const handleOpenProject = () => {
        if (!selectedProjectId) {
            alert('Please select a project first')
            return
        }
        
        const selectedProject = projects.find(p => p.id === selectedProjectId)
        console.log('Opening project:', selectedProject)
        
        // TODO: Add logic to actually open the project
        alert(`Opening project: ${selectedProject?.title || selectedProject?.name}`)
    }

    const handleCancel = () => {
        console.log('Cancel clicked')
        // TODO: Close the modal
    }

    const handleRetry = () => {
        console.log('Retrying getProjects')
        dispatch(getProjects())
    }

    // Filter projects based on search term
    const filteredProjects = projects.filter(project => {
        const title = project.title || project.name || ''
        return title.toLowerCase().includes(searchTerm.toLowerCase())
    })

    if (isLoading) {
        return <div className="form-group">Loading projects...</div>
    }

    if (isError) {
        return (
            <div className="form-group">
                <div style={{ color: 'red', marginBottom: '16px' }}>
                    ⚠️ Backend Error: {message}
                </div>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '16px' }}>
                    <div>🔍 Debug Info:</div>
                    <div>• API URL: http://localhost:3001/api/projects</div>
                    <div>• User: {user?.firstName} {user?.lastName}</div>
                    <div>• Token: {user?.token ? 'Present' : 'Missing'}</div>
                    <div>• Backend Status: Check if server is running on port 3001</div>
                </div>
                
                {/* Temporary fallback with sample projects */}
                <div style={{ marginBottom: '16px', padding: '12px', background: '#f0f9ff', border: '1px solid #0ea5e9', borderRadius: '4px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>📋 Sample Projects (Backend offline)</div>
                    <div className="form-group">
                        <label htmlFor="sample-project-list" className="form-label">
                            Select a sample project:
                        </label>
                        <select 
                            id="sample-project-list"
                            className="form-select"
                            value={selectedProjectId}
                            onChange={(e) => setSelectedProjectId(e.target.value)}
                        >
                            <option value="">Select a project...</option>
                            <option value="sample-1">Sample Project 1</option>
                            <option value="sample-2">Sample Project 2</option>
                            <option value="sample-3">Sample Project 3</option>
                        </select>
                    </div>
                </div>

                <div className="button-group">
                    <button className="btn btn-secondary" onClick={handleCancel}>
                        Cancel
                    </button>
                    <button 
                        className="btn btn-primary" 
                        onClick={handleRetry}
                        style={{ marginRight: '8px' }}
                    >
                        🔄 Retry API
                    </button>
                    <button 
                        className="btn btn-primary" 
                        onClick={handleOpenProject}
                        disabled={!selectedProjectId}
                    >
                        Open Project
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div>
            <div className="form-group">
                <label htmlFor="project-search" className="form-label">
                    Search Projects:
                </label>
                <input 
                    type="text" 
                    id="project-search"
                    placeholder="Enter project name..."
                    className="form-input"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            
            <div className="form-group">
                <label htmlFor="project-list" className="form-label">
                    Available Projects ({projects.length} total):
                </label>
                <select 
                    id="project-list"
                    className="form-select"
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                >
                    <option value="">Select a project...</option>
                    {filteredProjects.length > 0 ? (
                        filteredProjects.map((project) => (
                            <option key={project.id || project._id} value={project.id || project._id}>
                                {project.title || project.name || `Project ${project.id || project._id}`}
                            </option>
                        ))
                    ) : (
                        <option value="" disabled>
                            {projects.length === 0 ? 'No projects found' : 'No projects match your search'}
                        </option>
                    )}
                </select>
            </div>
            
            <div className="button-group">
                <button className="btn btn-secondary" onClick={handleCancel}>
                    Cancel
                </button>
                <button 
                    className="btn btn-primary" 
                    onClick={handleOpenProject}
                    disabled={!selectedProjectId}
                >
                    Open Project
                </button>
            </div>
        </div>
    )
}

export default OpenProject
