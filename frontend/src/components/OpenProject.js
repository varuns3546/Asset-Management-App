import '../styles/projectComponents.css'
import { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { getProjects, setSelectedProject } from '../features/projects/projectSlice'
import { loadUser } from '../features/auth/authSlice'

const OpenProject = ({ onClose }) => {
    const dispatch = useDispatch()
    const [selectedProjectId, setSelectedProjectId] = useState('')
    const [searchTerm, setSearchTerm] = useState('')
    const { projects, isLoading, isError, message } = useSelector((state) => state.projects)
    const { user } = useSelector((state) => state.auth)

    useEffect(() => {
        // Load user from localStorage when component mounts
        dispatch(loadUser())
    }, [dispatch])

    useEffect(() => {
        console.log('OpenProject: User state:', user)
        if (user && user.token) {
            console.log('OpenProject: Dispatching getProjects')
            dispatch(getProjects())
        } else {
            console.log('OpenProject: No user or token, cannot fetch projects')
        }
    }, [dispatch, user])

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
            return
        }
        
        const selectedProject = projects.find(p => p.id === selectedProjectId)
        
        // Set the selected project in global state
        dispatch(setSelectedProject(selectedProject))
        
        // Close the modal
        if (onClose) {
            onClose()
        }
        
        // TODO: Add logic to actually open the project
    }

    const handleCancel = () => {
        console.log('Cancel clicked')
        if (onClose) {
            onClose()
        }
    }

    const handleRetry = () => {
        console.log('Retrying getProjects')
        if (user && user.token) {
            dispatch(getProjects())
        } else {
            console.log('No user token available for retry')
        }
    }

    const clearSearch = () => {
        setSearchTerm('')
        setSelectedProjectId('')
    }

    // Enhanced filtering with multiple search criteria
    const filteredProjects = projects.filter(project => {
        if (!searchTerm) return true
        
        const searchLower = searchTerm.toLowerCase()
        const title = (project.title || project.name || '').toLowerCase()
        const description = (project.description || '').toLowerCase()
        
        // Search in title, name, and description
        return title.includes(searchLower) || 
               description.includes(searchLower) ||
               (project.id && project.id.toLowerCase().includes(searchLower))
    })

    // Sort projects by relevance (exact matches first, then partial matches)
    const sortedProjects = filteredProjects.sort((a, b) => {
        const aTitle = (a.title || a.name || '').toLowerCase()
        const bTitle = (b.title || b.name || '').toLowerCase()
        const searchLower = searchTerm.toLowerCase()
        
        // Exact match gets highest priority
        if (aTitle === searchLower && bTitle !== searchLower) return -1
        if (bTitle === searchLower && aTitle !== searchLower) return 1
        
        // Starts with search term gets second priority
        if (aTitle.startsWith(searchLower) && !bTitle.startsWith(searchLower)) return -1
        if (bTitle.startsWith(searchLower) && !aTitle.startsWith(searchLower)) return 1
        
        // Alphabetical order for the rest
        return aTitle.localeCompare(bTitle)
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
                    <div>• API URL: {process.env.REACT_APP_API_BASE_URL}/api/projects</div>
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
            {/* Search Section */}
            <div className="form-group">
                <label htmlFor="project-search" className="form-label">
                    Search Projects:
                </label>
                <div style={{ position: 'relative' }}>
                    <input 
                        type="text" 
                        id="project-search"
                        placeholder="Search by project name, description, or ID..."
                        className="form-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ paddingRight: searchTerm ? '40px' : '12px' }}
                    />
                    {searchTerm && (
                        <button
                            onClick={clearSearch}
                            style={{
                                position: 'absolute',
                                right: '8px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '16px',
                                color: '#6b7280'
                            }}
                            title="Clear search"
                        >
                            ×
                        </button>
                    )}
                </div>
                
                {/* Search Results Info */}
                {searchTerm && (
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                        {filteredProjects.length} of {projects.length} projects match "{searchTerm}"
                    </div>
                )}
            </div>
            
            {/* Projects Dropdown */}
            <div className="form-group">
                <label htmlFor="project-list" className="form-label">
                    Available Projects ({projects.length} total):
                </label>
                <select 
                    id="project-list"
                    className="form-select"
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    size={Math.min(sortedProjects.length + 1, 8)} // Show up to 8 options
                >
                    <option value="">Select a project...</option>
                    {sortedProjects.length > 0 ? (
                        sortedProjects.map((project) => (
                            <option key={project.id || project._id} value={project.id || project._id}>
                                {project.title || project.name || `Project ${project.id || project._id}`}
                                {project.description && ` - ${project.description.substring(0, 50)}${project.description.length > 50 ? '...' : ''}`}
                            </option>
                        ))
                    ) : (
                        <option value="" disabled>
                            {!user ? 'Please log in first' : 
                             isError && message.includes('token') ? 'Authentication error - please log in again' :
                             projects.length === 0 ? 'No projects found' : `No projects match "${searchTerm}"`}
                        </option>
                    )}
                </select>
            </div>

            {/* Selected Project Info */}
            {selectedProjectId && (
                <div className="form-group">
                    <div style={{ 
                        padding: '12px', 
                        background: '#f0f9ff', 
                        border: '1px solid #0ea5e9', 
                        borderRadius: '4px',
                        fontSize: '14px'
                    }}>
                        <strong>Selected Project:</strong>
                        <div style={{ marginTop: '4px' }}>
                            {(() => {
                                const selected = projects.find(p => p.id === selectedProjectId)
                                return selected ? (
                                    <>
                                        <div><strong>Title:</strong> {selected.title || selected.name}</div>
                                        {selected.description && (
                                            <div><strong>Description:</strong> {selected.description}</div>
                                        )}
                                        {selected.created_at && (
                                            <div><strong>Created:</strong> {new Date(selected.created_at).toLocaleDateString()}</div>
                                        )}
                                    </>
                                ) : null
                            })()}
                        </div>
                    </div>
                </div>
            )}
            
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
