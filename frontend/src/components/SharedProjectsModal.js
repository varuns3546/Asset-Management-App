import '../styles/projectComponents.css'
import { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { getSharedProjects, setSelectedProjectAsync } from '../features/projects/projectSlice'
import { loadUser } from '../features/auth/authSlice'
import ButtonGroup from './forms/ButtonGroup'
import FormField from './forms/FormField'

const SharedProjectsModal = ({ onClose }) => {
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
            dispatch(getSharedProjects())
        } 
    }, [dispatch, user])

    // Use projects from Redux state (already filtered by backend to only include shared projects)
    const sharedProjects = (projects || []).filter(project => project !== null && project !== undefined)

    // Function to get display name with index for duplicate names
    const getDisplayNameWithIndex = (project, allProjects) => {
        if (!project) return 'Unknown Project'
        const projectName = project.title || project.name || `Project ${project.id || project._id}`
        
        // Find all projects with the same name (case-insensitive)
        const sameNameProjects = (allProjects || []).filter(p => {
            if (!p) return false
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
    // First filter out null/undefined projects, then apply search filter
    const filteredProjects = sharedProjects.filter(project => {
        // Filter out null/undefined projects
        if (!project) {
            console.warn('SharedProjectsModal: Filtered out null/undefined project')
            return false
        }
        
        // If no search term, show all projects
        if (!searchTerm || searchTerm.trim() === '') return true
        
        const searchLower = searchTerm.toLowerCase().trim()
        const title = (project.title || project.name || '').toLowerCase()
        const description = (project.description || '').toLowerCase()
        const projectId = (project.id || project._id || '').toLowerCase()
        
        // Search in title, name, description, and ID
        return title.includes(searchLower) || 
               description.includes(searchLower) ||
               projectId.includes(searchLower)
    })

    // Sort projects by relevance (exact matches first, then partial matches)
    // Create a copy to avoid mutating the original array
    const sortedProjects = [...filteredProjects].sort((a, b) => {
        // Handle null/undefined values
        if (!a && !b) return 0
        if (!a) return 1
        if (!b) return -1
        
        const aTitle = (a.title || a.name || '').toLowerCase()
        const bTitle = (b.title || b.name || '').toLowerCase()
        
        // If no search term, just sort alphabetically
        if (!searchTerm || searchTerm.trim() === '') {
            return aTitle.localeCompare(bTitle)
        }
        
        const searchLower = searchTerm.toLowerCase().trim()
        
        // Exact match gets highest priority
        if (aTitle === searchLower && bTitle !== searchLower) return -1
        if (bTitle === searchLower && aTitle !== searchLower) return 1
        
        // Starts with search term gets second priority
        if (aTitle.startsWith(searchLower) && !bTitle.startsWith(searchLower)) return -1
        if (bTitle.startsWith(searchLower) && !aTitle.startsWith(searchLower)) return 1
        
        // Alphabetical order for the rest
        return aTitle.localeCompare(bTitle)
    })

    const handleOpenProject = async (projectId = null) => {
        // Use provided projectId or fall back to selectedProjectId state
        const idToOpen = projectId || selectedProjectId
        if (!idToOpen) {
            return
        }
        
        // Set the selected project in user_profiles and global state
        await dispatch(setSelectedProjectAsync(idToOpen))
        
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
                
                <div className="button-group">
                    <button className="btn btn-secondary" onClick={handleCancel}>
                        Cancel
                    </button>
                    <button 
                        className="btn btn-primary" 
                        onClick={() => {
                            if (user && user.token) {
                                dispatch(getSharedProjects())
                            }
                        }}
                        style={{ marginRight: '12px' }}
                    >
                        🔄 Retry API
                    </button>
                </div>
            </div>
            </div>
        )
    }

    return (
        <div className="open-project-modal">
            <div className="form-group">
                <h2 style={{ marginBottom: '24px', fontSize: '24px', fontWeight: 'bold' }}>
                    Shared with Me
                </h2>
                
                {/* Search Bar */}
                <div style={{ marginBottom: '24px' }}>
                    <FormField
                        label="Search Projects"
                        id="search-projects"
                        type="text"
                        placeholder="Search by title, description, or ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <div style={{ fontSize: '18px', color: '#6b7280', marginTop: '6px' }}>
                            {filteredProjects.length} of {sharedProjects.length} projects match "{searchTerm}"
                        </div>
                    )}
                </div>
                
                {/* Projects List */}
                <div className="form-group">
                    <label className="form-label">
                        Shared Projects ({sharedProjects?.length || 0} total, {sortedProjects?.length || 0} shown):
                    </label>
                    <div style={{ 
                        border: '1px solid #d1d5db', 
                        borderRadius: '6px', 
                        maxHeight: '400px', 
                        overflowY: 'auto',
                        padding: '8px'
                    }}>
                        {sortedProjects && sortedProjects.length > 0 ? (
                            sortedProjects.map((project) => {
                                const displayName = getDisplayNameWithIndex(project, sharedProjects)
                                const projectId = project.id || project._id
                                const isSelected = selectedProjectId === projectId
                                
                                return (
                                    <div
                                        key={projectId}
                                        style={{
                                            padding: '12px',
                                            marginBottom: '8px',
                                            border: isSelected ? '2px solid #0ea5e9' : '1px solid #e5e7eb',
                                            borderRadius: '6px',
                                            background: isSelected ? '#f0f9ff' : '#ffffff',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                        onClick={() => setSelectedProjectId(projectId)}
                                        onDoubleClick={() => handleOpenProject(projectId)}
                                    >
                                        <div style={{ 
                                            display: 'flex', 
                                            justifyContent: 'space-between', 
                                            alignItems: 'center',
                                            marginBottom: '8px'
                                        }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ 
                                                    fontSize: '18px', 
                                                    fontWeight: 'bold',
                                                    marginBottom: '4px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px'
                                                }}>
                                                    {displayName}
                                                    {project.master && (
                                                        <span style={{ 
                                                            padding: '2px 6px', 
                                                            background: '#fbbf24', 
                                                            color: '#000', 
                                                            borderRadius: '3px', 
                                                            fontSize: '11px',
                                                            fontWeight: 'normal'
                                                        }}>
                                                            Master
                                                        </span>
                                                    )}
                                                </div>
                                                {project.description && (
                                                    <div style={{ 
                                                        fontSize: '14px', 
                                                        color: '#6b7280',
                                                        marginBottom: '4px'
                                                    }}>
                                                        {project.description}
                                                    </div>
                                                )}
                                                <div style={{ 
                                                    fontSize: '12px', 
                                                    color: '#9ca3af',
                                                    display: 'flex',
                                                    gap: '12px',
                                                    flexWrap: 'wrap'
                                                }}>
                                                    {project.latitude && project.longitude && (
                                                        <span>📍 {project.latitude}, {project.longitude}</span>
                                                    )}
                                                    {project.created_at && (
                                                        <span>📅 {new Date(project.created_at).toLocaleDateString()}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div style={{ 
                                                display: 'flex', 
                                                gap: '8px',
                                                marginLeft: '12px'
                                            }}>
                                                <button
                                                    className="btn btn-primary"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleOpenProject(projectId)
                                                    }}
                                                    style={{ fontSize: '14px', padding: '6px 12px' }}
                                                >
                                                    Open
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
                        ) : (
                            <div style={{ 
                                padding: '24px', 
                                textAlign: 'center', 
                                color: '#6b7280' 
                            }}>
                                {!user ? 'Please log in first' : 
                                 isError && message.includes('token') ? 'Authentication error - please log in again' :
                                 sharedProjects.length === 0 ? 'No shared projects found' : `No shared projects match "${searchTerm}"`}
                            </div>
                        )}
                    </div>
                </div>

                <ButtonGroup
                    primaryLabel="Open Selected"
                    secondaryLabel="Cancel"
                    onPrimaryClick={() => handleOpenProject()}
                    onSecondaryClick={handleCancel}
                    primaryDisabled={!selectedProjectId}
                />
            </div>
        </div>
    )
}

export default SharedProjectsModal

