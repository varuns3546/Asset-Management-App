import '../styles/projectComponents.css'
import { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { getProjects, setSelectedProjectAsync } from '../features/projects/projectSlice'
import { loadUser } from '../features/auth/authSlice'
import ButtonGroup from './forms/ButtonGroup'
import FormField from './forms/FormField'

const OpenProjectModal = ({ onClose }) => {
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
        if (user && user.token) {
            dispatch(getProjects())
        } 
    }, [dispatch, user])

    // Debug logging
    const handleOpenProject = async () => {
        if (!selectedProjectId) {
            return
        }
        
        // Set the selected project in user_profiles and global state
        await dispatch(setSelectedProjectAsync(selectedProjectId))
        
        // Close the modal
        if (onClose) {
            onClose()
        }
    }

    const handleCancel = () => {
        if (onClose) {
            onClose()
        }
    }

    const handleRetry = () => {
        if (user && user.token) {
            dispatch(getProjects())
        }
    }

    const clearSearch = () => {
        setSearchTerm('')
        setSelectedProjectId('')
    }

    // Function to add indices to duplicate project names
    const getDisplayNameWithIndex = (project, allProjects) => {
        const projectName = project.title || project.name || `Project ${project.id || project._id}`
        
        // Find all projects with the same name (case-insensitive)
        const sameNameProjects = allProjects.filter(p => {
            const pName = (p.title || p.name || '').toLowerCase()
            return pName === projectName.toLowerCase()
        })
        
        // If there's only one project with this name, return it as-is
        if (sameNameProjects.length <= 1) {
            return projectName
        }
        
        // Sort by creation date or ID to ensure consistent ordering
        sameNameProjects.sort((a, b) => {
            if (a.created_at && b.created_at) {
                return new Date(a.created_at) - new Date(b.created_at)
            }
            return (a.id || a._id || '').localeCompare(b.id || b._id || '')
        })
        
        // Find the index of this project in the sorted list
        const index = sameNameProjects.findIndex(p => 
            (p.id || p._id) === (project.id || project._id)
        )
        
        // First project (index 0) gets no suffix, others get (1), (2), etc.
        if (index === 0) {
            return projectName
        } else {
            return `${projectName}(${index})`
        }
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
        return <div className="open-project-modal"><div className="form-group">Loading projects...</div></div>
    }

    if (isError) {
        return (
            <div className="open-project-modal">
            <div className="form-group">
                <div style={{ color: 'red', marginBottom: '16px' }}>
                    ⚠️ Backend Error: {message}
                </div>
                <div style={{ fontSize: '18px', color: '#666', marginBottom: '24px' }}>
                    <div>🔍 Debug Info:</div>
                    <div>• API URL: {process.env.REACT_APP_API_BASE_URL}/api/projects</div>
                    <div>• User: {user?.firstName} {user?.lastName}</div>
                    <div>• Token: {user?.token ? 'Present' : 'Missing'}</div>
                    <div>• Backend Status: Check if server is running on port 3001</div>
                </div>
                
                {/* Temporary fallback with sample projects */}
                <div style={{ marginBottom: '24px', padding: '18px', background: '#f0f9ff', border: '1px solid #0ea5e9', borderRadius: '6px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '12px', fontSize: '21px' }}>📋 Sample Projects (Backend offline)</div>
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
                        style={{ marginRight: '12px' }}
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
            </div>
        )
    }

    return (
        <div className="open-project-modal">
            {/* Search Section */}
            <div style={{ position: 'relative' }}>
                <FormField
                    label="Search Projects:"
                    id="project-search"
                    type="text"
                    placeholder="Search by project name, description, or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    inputProps={{ style: { paddingRight: searchTerm ? '60px' : '18px' } }}
                />
                {searchTerm && (
                    <button
                        onClick={clearSearch}
                        style={{
                            position: 'absolute',
                            right: '12px',
                            top: '42px',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '24px',
                            color: '#6b7280'
                        }}
                        title="Clear search"
                    >
                        ×
                    </button>
                )}
                {/* Search Results Info */}
                {searchTerm && (
                    <div style={{ fontSize: '18px', color: '#6b7280', marginTop: '6px' }}>
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
                    size={Math.min(sortedProjects.length + 1, 8)}
                >
                    <option value="">Select a project...</option>
                    {sortedProjects.length > 0 ? (
                        sortedProjects.map((project) => {
                            const displayName = getDisplayNameWithIndex(project, projects)
                            return (
                                <option key={project.id || project._id} value={project.id || project._id}>
                                    {displayName}
                                    {project.description && ` - ${project.description.substring(0, 50)}${project.description.length > 50 ? '...' : ''}`}
                                </option>
                            )
                        })
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
                        padding: '18px', 
                        background: '#f0f9ff', 
                        border: '1px solid #0ea5e9', 
                        borderRadius: '6px',
                        fontSize: '21px'
                    }}>
                        <strong>Selected Project:</strong>
                        <div style={{ marginTop: '6px' }}>
                            {(() => {
                                const selected = projects.find(p => p.id === selectedProjectId)
                                return selected ? (
                                    <>
                                        <div><strong>Title:</strong> {getDisplayNameWithIndex(selected, projects)}</div>
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
            
            <ButtonGroup
                buttons={[
                    {
                        label: 'Cancel',
                        variant: 'secondary',
                        onClick: handleCancel
                    },
                    {
                        label: 'Open Project',
                        variant: 'primary',
                        onClick: handleOpenProject,
                        disabled: !selectedProjectId
                    }
                ]}
            />
        </div>
    )
}

export default OpenProjectModal
