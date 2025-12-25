import '../styles/projectComponents.css'
import { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { getProjects, setSelectedProjectAsync, deleteProject, cloneProject, getMasterProjects } from '../features/projects/projectSlice'
import { loadUser } from '../features/auth/authSlice'
import ButtonGroup from './forms/ButtonGroup'
import FormField from './forms/FormField'

const MyProjectsModal = ({ onClose }) => {
    const dispatch = useDispatch()
    const [selectedProjectId, setSelectedProjectId] = useState('')
    const [searchTerm, setSearchTerm] = useState('')
    const [deleteConfirmation, setDeleteConfirmation] = useState({ show: false, project: null, input: '' })
    const [showCloneModal, setShowCloneModal] = useState(false)
    const [cloneData, setCloneData] = useState({ masterProjectId: '', title: '', description: '' })
    const { projects, masterProjects, isLoading, isError, message } = useSelector((state) => state.projects)
    const { user } = useSelector((state) => state.auth)

    useEffect(() => {
        // Load user from localStorage when component mounts
        dispatch(loadUser())
    }, [dispatch])

    useEffect(() => {
        if (user && user.token) {
            dispatch(getProjects())
            dispatch(getMasterProjects())
        } 
    }, [dispatch, user])

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
    const filteredProjects = (projects || []).filter(project => {
        // Filter out null/undefined projects
        if (!project) {
            console.warn('MyProjectsModal: Filtered out null/undefined project')
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
    
    // Debug: Log if projects exist but none are shown
    if (projects && projects.length > 0 && filteredProjects.length === 0 && (!searchTerm || searchTerm.trim() === '')) {
        console.error('MyProjectsModal: Projects exist but none passed filter', {
            totalProjects: projects.length,
            searchTerm: searchTerm || '(empty)',
            sampleProject: projects[0],
            filteredCount: filteredProjects.length
        })
    }

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

    const handleDeleteClick = (project) => {
        const projectName = getDisplayNameWithIndex(project, projects)
        setDeleteConfirmation({
            show: true,
            project: project,
            input: ''
        })
    }

    const handleDeleteCancel = () => {
        setDeleteConfirmation({ show: false, project: null, input: '' })
    }

    const handleDeleteConfirm = async () => {
        if (!deleteConfirmation.project) return

        const projectName = getDisplayNameWithIndex(deleteConfirmation.project, projects)
        const expectedText = `delete ${projectName.toLowerCase()}`
        
        if (deleteConfirmation.input.toLowerCase().trim() !== expectedText) {
            alert(`Please type exactly: "${expectedText}"`)
            return
        }

        try {
            await dispatch(deleteProject(deleteConfirmation.project.id || deleteConfirmation.project._id))
            // Refresh projects list
            if (user && user.token) {
                dispatch(getProjects())
            }
            // Reset delete confirmation
            setDeleteConfirmation({ show: false, project: null, input: '' })
            setSelectedProjectId('')
        } catch (error) {
            console.error('Error deleting project:', error)
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

    const handleCloneClick = () => {
        setShowCloneModal(true)
        setCloneData({ masterProjectId: '', title: '', description: '' })
    }

    const handleCloneSubmit = async () => {
        if (!cloneData.masterProjectId || !cloneData.title.trim()) {
            alert('Please select a master project and enter a title')
            return
        }

        try {
            await dispatch(cloneProject({
                projectId: cloneData.masterProjectId,
                cloneData: {
                    title: cloneData.title.trim(),
                    description: cloneData.description.trim() || ''
                }
            })).unwrap()
            
            // Refresh projects list
            dispatch(getProjects())
            setShowCloneModal(false)
            setCloneData({ masterProjectId: '', title: '', description: '' })
        } catch (error) {
            alert(`Failed to clone project: ${error}`)
        }
    }

    const handleCloneCancel = () => {
        setShowCloneModal(false)
        setCloneData({ masterProjectId: '', title: '', description: '' })
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
                        onClick={handleRetry}
                        style={{ marginRight: '12px' }}
                    >
                        🔄 Retry API
                    </button>
                </div>
            </div>
            </div>
        )
    }

    // Show delete confirmation dialog
    if (deleteConfirmation.show && deleteConfirmation.project) {
        const projectName = getDisplayNameWithIndex(deleteConfirmation.project, projects)
        const expectedText = `delete ${projectName.toLowerCase()}`
        const isMatch = deleteConfirmation.input.toLowerCase().trim() === expectedText

        return (
            <div className="open-project-modal">
                <div className="form-group">
                    <div style={{ 
                        padding: '18px', 
                        background: '#fee2e2', 
                        border: '2px solid #ef4444', 
                        borderRadius: '6px',
                        marginBottom: '24px'
                    }}>
                        <div style={{ fontSize: '21px', fontWeight: 'bold', color: '#dc2626', marginBottom: '12px' }}>
                            ⚠️ Delete Project
                        </div>
                        <div style={{ fontSize: '18px', marginBottom: '12px' }}>
                            You are about to delete: <strong>{projectName}</strong>
                        </div>
                        <div style={{ fontSize: '16px', color: '#666' }}>
                            This action cannot be undone. All data associated with this project will be permanently deleted.
                        </div>
                    </div>

                    <FormField
                        label={`Type "${expectedText}" to confirm deletion:`}
                        id="delete-confirmation"
                        type="text"
                        placeholder={`Type: ${expectedText}`}
                        value={deleteConfirmation.input}
                        onChange={(e) => setDeleteConfirmation({
                            ...deleteConfirmation,
                            input: e.target.value
                        })}
                    />

                    <div style={{ 
                        marginTop: '12px', 
                        padding: '12px', 
                        background: isMatch ? '#d1fae5' : '#fef3c7', 
                        border: `1px solid ${isMatch ? '#10b981' : '#f59e0b'}`, 
                        borderRadius: '6px',
                        fontSize: '16px'
                    }}>
                        {isMatch ? (
                            <span style={{ color: '#059669' }}>✓ Ready to delete</span>
                        ) : (
                            <span style={{ color: '#d97706' }}>Please type exactly: "{expectedText}"</span>
                        )}
                    </div>

                    <ButtonGroup
                        buttons={[
                            {
                                label: 'Cancel',
                                variant: 'secondary',
                                onClick: handleDeleteCancel
                            },
                            {
                                label: 'Confirm Delete',
                                variant: 'primary',
                                onClick: handleDeleteConfirm,
                                disabled: !isMatch,
                                style: { 
                                    backgroundColor: isMatch ? '#dc2626' : undefined,
                                    borderColor: isMatch ? '#dc2626' : undefined
                                }
                            }
                        ]}
                    />
                </div>
            </div>
        )
    }

    // Show clone modal
    if (showCloneModal) {
        return (
            <div className="open-project-modal">
                <div className="form-group">
                    <h2 style={{ marginTop: 0, marginBottom: '20px' }}>Clone from Master Project</h2>
                    
                    <FormField
                        label="Master Project:"
                        id="master-project"
                        type="select"
                        value={cloneData.masterProjectId}
                        onChange={(e) => setCloneData({ ...cloneData, masterProjectId: e.target.value })}
                        required
                        selectOptions={[
                            { value: '', label: 'Select a master project...' },
                            ...(masterProjects || []).map(project => ({
                                value: project.id,
                                label: project.title
                            }))
                        ]}
                    />

                    <FormField
                        label="New Project Title:"
                        id="clone-title"
                        type="text"
                        placeholder="Enter title for cloned project..."
                        value={cloneData.title}
                        onChange={(e) => setCloneData({ ...cloneData, title: e.target.value })}
                        required
                    />

                    <FormField
                        label="Description (optional):"
                        id="clone-description"
                        type="textarea"
                        placeholder="Enter description for cloned project..."
                        value={cloneData.description}
                        onChange={(e) => setCloneData({ ...cloneData, description: e.target.value })}
                        rows={4}
                    />

                    <ButtonGroup
                        buttons={[
                            {
                                label: 'Cancel',
                                variant: 'secondary',
                                onClick: handleCloneCancel
                            },
                            {
                                label: 'Clone Project',
                                variant: 'primary',
                                onClick: handleCloneSubmit,
                                disabled: !cloneData.masterProjectId || !cloneData.title.trim() || isLoading
                            }
                        ]}
                    />
                </div>
            </div>
        )
    }

    return (
        <div className="open-project-modal">
            {/* Clone Button */}
            <div style={{ marginBottom: '16px' }}>
                <button
                    className="btn btn-primary"
                    onClick={handleCloneClick}
                    style={{ width: '100%', marginBottom: '12px' }}
                >
                    + Clone from Master Project
                </button>
            </div>

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
            
            {/* Projects List */}
            <div className="form-group">
                <label className="form-label">
                    My Projects ({projects?.length || 0} total, {sortedProjects?.length || 0} shown):
                </label>
                <div style={{ 
                    border: '1px solid #d1d5db', 
                    borderRadius: '6px', 
                    maxHeight: '400px', 
                    overflowY: 'auto',
                    padding: '8px'
                }}>
                    {sortedProjects.length > 0 ? (
                        sortedProjects.map((project) => {
                            const displayName = getDisplayNameWithIndex(project, projects)
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
                                                        fontSize: '12px',
                                                        padding: '2px 6px',
                                                        background: '#6f42c1',
                                                        color: 'white',
                                                        borderRadius: '4px',
                                                        fontWeight: '600'
                                                    }}>
                                                        MASTER
                                                    </span>
                                                )}
                                                {project.parent_project_id && (
                                                    <span style={{
                                                        fontSize: '12px',
                                                        padding: '2px 6px',
                                                        background: '#0366d6',
                                                        color: 'white',
                                                        borderRadius: '4px',
                                                        fontWeight: '600'
                                                    }}>
                                                        CLONE
                                                    </span>
                                                )}
                                            </div>
                                            {project.description && (
                                                <div style={{ 
                                                    fontSize: '14px', 
                                                    color: '#6b7280',
                                                    marginBottom: '4px'
                                                }}>
                                                    {project.description.length > 60 
                                                        ? `${project.description.substring(0, 60)}...` 
                                                        : project.description}
                                                </div>
                                            )}
                                            {project.created_at && (
                                                <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                                                    Created: {new Date(project.created_at).toLocaleDateString()}
                                                </div>
                                            )}
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
                                            <button
                                                className="btn"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleDeleteClick(project)
                                                }}
                                                style={{ 
                                                    fontSize: '14px', 
                                                    padding: '6px 12px',
                                                    backgroundColor: '#dc2626',
                                                    color: 'white',
                                                    borderColor: '#dc2626'
                                                }}
                                            >
                                                Delete
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
                             projects.length === 0 ? 'No projects found' : `No projects match "${searchTerm}"`}
                        </div>
                    )}
                </div>
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
                                const selected = projects.find(p => (p.id || p._id) === selectedProjectId)
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
                        label: 'Open Selected Project',
                        variant: 'primary',
                        onClick: handleOpenProject,
                        disabled: !selectedProjectId
                    }
                ]}
            />
        </div>
    )
}

export default MyProjectsModal

