import '../styles/formStyles.css'
import '../styles/projectsModal.css'
import { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { 
    getProjects, 
    getSharedProjects, 
    setSelectedProjectAsync, 
    deleteProject, 
    cloneProject, 
    getMasterProjects 
    } from '../features/projects/projectSlice'
import { loadUser } from '../features/auth/authSlice'
import ButtonGroup from './forms/ButtonGroup'
import FormField from './forms/FormField'
import ShareProjectModal from './ShareProjectModal'

const ProjectsModal = ({ onClose, initialTab = 'myProjects' }) => {
    const dispatch = useDispatch()
    const [activeTab, setActiveTab] = useState(initialTab) // 'myProjects' or 'shared'
    const [selectedProjectId, setSelectedProjectId] = useState('')
    const [searchTerm, setSearchTerm] = useState('')
    const [deleteConfirmation, setDeleteConfirmation] = useState({ show: false, project: null, input: '' })
    const [showCloneModal, setShowCloneModal] = useState(false)
    const [cloneData, setCloneData] = useState({ masterProjectId: '', title: '', description: '' })
    const [showShareModal, setShowShareModal] = useState(false)
    const [shareProjectId, setShareProjectId] = useState('')
    const { projects, masterProjects, isLoading, isError, message } = useSelector((state) => state.projects)
    const { user } = useSelector((state) => state.auth)

    useEffect(() => {
        // Load user from localStorage when component mounts
        dispatch(loadUser())
    }, [dispatch])

    useEffect(() => {
        if (user && user.token) {
            if (activeTab === 'myProjects') {
                dispatch(getProjects())
                dispatch(getMasterProjects())
            } else {
                dispatch(getSharedProjects())
            }
        } 
    }, [dispatch, user, activeTab])

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

    // Get projects based on active tab
    const getCurrentProjects = () => {
        if (activeTab === 'myProjects') {
            return (projects || []).filter(project => project !== null && project !== undefined)
        } else {
            return (projects || []).filter(project => project !== null && project !== undefined)
        }
    }

    const currentProjects = getCurrentProjects()

    // Enhanced filtering with multiple search criteria
    const filteredProjects = currentProjects.filter(project => {
        if (!project) {
            console.warn('ProjectsModal: Filtered out null/undefined project')
            return false
        }
        
        if (!searchTerm || searchTerm.trim() === '') return true
        
        const searchLower = searchTerm.toLowerCase().trim()
        const title = (project.title || project.name || '').toLowerCase()
        const description = (project.description || '').toLowerCase()
        const projectId = (project.id || project._id || '').toLowerCase()
        
        return title.includes(searchLower) || 
               description.includes(searchLower) ||
               projectId.includes(searchLower)
    })
    
    // Sort projects by relevance
    const sortedProjects = [...filteredProjects].sort((a, b) => {
        if (!a && !b) return 0
        if (!a) return 1
        if (!b) return -1
        
        const aTitle = (a.title || a.name || '').toLowerCase()
        const bTitle = (b.title || b.name || '').toLowerCase()
        
        if (!searchTerm || searchTerm.trim() === '') {
            return aTitle.localeCompare(bTitle)
        }
        
        const searchLower = searchTerm.toLowerCase().trim()
        
        if (aTitle === searchLower && bTitle !== searchLower) return -1
        if (bTitle === searchLower && aTitle !== searchLower) return 1
        
        if (aTitle.startsWith(searchLower) && !bTitle.startsWith(searchLower)) return -1
        if (bTitle.startsWith(searchLower) && !aTitle.startsWith(searchLower)) return 1
        
        return aTitle.localeCompare(bTitle)
    })

    const handleOpenProject = async (projectId = null) => {
        const idToOpen = projectId || selectedProjectId
        if (!idToOpen) {
            return
        }
        
        await dispatch(setSelectedProjectAsync(idToOpen))
        
        if (onClose) {
            onClose()
        }
    }

    const handleDeleteClick = (project) => {
        const projectName = getDisplayNameWithIndex(project, currentProjects)
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

        const projectName = getDisplayNameWithIndex(deleteConfirmation.project, currentProjects)
        const expectedText = `delete ${projectName.toLowerCase()}`
        
        if (deleteConfirmation.input.toLowerCase().trim() !== expectedText) {
            alert(`Please type exactly: "${expectedText}"`)
            return
        }

        try {
            await dispatch(deleteProject(deleteConfirmation.project.id || deleteConfirmation.project._id))
            if (user && user.token) {
                dispatch(getProjects())
            }
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
            if (activeTab === 'myProjects') {
                dispatch(getProjects())
            } else {
                dispatch(getSharedProjects())
            }
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

    const handleShareClick = (projectId) => {
        setShareProjectId(projectId)
        setShowShareModal(true)
    }

    const handleShareClose = () => {
        setShowShareModal(false)
        setShareProjectId('')
    }

    // Reset selected project when switching tabs
    useEffect(() => {
        setSelectedProjectId('')
        setSearchTerm('')
    }, [activeTab])

    // Only show loading if we're actually loading AND don't have projects yet
    // If projects already exist, show the modal even if isLoading is true (might be from other actions)
    const hasProjects = projects && Array.isArray(projects) && projects.length > 0
    if (isLoading && !hasProjects) {
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
        const projectName = getDisplayNameWithIndex(deleteConfirmation.project, currentProjects)
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

    // Show share modal
    if (showShareModal) {
        return (
            <div className="open-project-modal">
                <ShareProjectModal 
                    onClose={handleShareClose}
                    initialProjectId={shareProjectId}
                />
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
            {/* Tab Navigation */}
            <div className="projects-modal-tabs">
                <button
                    className={`projects-tab-button ${activeTab === 'myProjects' ? 'active' : ''}`}
                    onClick={() => setActiveTab('myProjects')}
                >
                    My Projects
                </button>
                <button
                    className={`projects-tab-button ${activeTab === 'shared' ? 'active' : ''}`}
                    onClick={() => setActiveTab('shared')}
                >
                    Shared with Me
                </button>
            </div>

            {/* Tab Content */}
            <div className="projects-modal-content">
                {activeTab === 'myProjects' && (
                    <>
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
                            {searchTerm && (
                                <div style={{ fontSize: '18px', color: '#6b7280', marginTop: '6px' }}>
                                    {filteredProjects.length} of {currentProjects.length} projects match "{searchTerm}"
                                </div>
                            )}
                        </div>
                        
                        {/* Projects List */}
                        <div className="form-group">
                            <label className="form-label">
                                My Projects ({currentProjects?.length || 0} total, {sortedProjects?.length || 0} shown):
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
                                        const displayName = getDisplayNameWithIndex(project, currentProjects)
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
                                                                handleShareClick(projectId)
                                                            }}
                                                            style={{ 
                                                                fontSize: '14px', 
                                                                padding: '6px 12px',
                                                                backgroundColor: '#10b981',
                                                                color: 'white',
                                                                borderColor: '#10b981'
                                                            }}
                                                        >
                                                            Share
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
                                         currentProjects.length === 0 ? 'No projects found' : `No projects match "${searchTerm}"`}
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
                                            const selected = currentProjects.find(p => (p.id || p._id) === selectedProjectId)
                                            return selected ? (
                                                <>
                                                    <div><strong>Title:</strong> {getDisplayNameWithIndex(selected, currentProjects)}</div>
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
                    </>
                )}

                {activeTab === 'shared' && (
                    <>
                        {/* Search Bar */}
                        <div style={{ marginBottom: '24px' }}>
                            <div style={{ position: 'relative' }}>
                                <FormField
                                    label="Search Projects"
                                    id="search-projects"
                                    type="text"
                                    placeholder="Search by title, description, or ID..."
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
                            </div>
                            {searchTerm && (
                                <div style={{ fontSize: '18px', color: '#6b7280', marginTop: '6px' }}>
                                    {filteredProjects.length} of {currentProjects.length} projects match "{searchTerm}"
                                </div>
                            )}
                        </div>
                        
                        {/* Projects List */}
                        <div className="form-group">
                            <label className="form-label">
                                Shared Projects ({currentProjects?.length || 0} total, {sortedProjects?.length || 0} shown):
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
                                        const displayName = getDisplayNameWithIndex(project, currentProjects)
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
                                         currentProjects.length === 0 ? 'No shared projects found' : `No shared projects match "${searchTerm}"`}
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
                                            const selected = currentProjects.find(p => (p.id || p._id) === selectedProjectId)
                                            return selected ? (
                                                <>
                                                    <div><strong>Title:</strong> {getDisplayNameWithIndex(selected, currentProjects)}</div>
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
                    </>
                )}
            </div>
            
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

export default ProjectsModal

