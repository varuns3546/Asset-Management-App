import '../styles/formStyles.css'
import { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { getProjects, addUserToProject, removeUserFromProject } from '../features/projects/projectSlice'
import { loadUser } from '../features/auth/authSlice'
import ButtonGroup from './forms/ButtonGroup'
import FormField from './forms/FormField'
import ErrorMessage from './forms/ErrorMessage'
import axios from 'axios'

const ShareProjectModal = ({ onClose, initialProjectId = '' }) => {
    const dispatch = useDispatch()
    const [selectedProjectId, setSelectedProjectId] = useState(initialProjectId)
    const [emailSearch, setEmailSearch] = useState('')
    const [searchResults, setSearchResults] = useState([])
    const [isSearching, setIsSearching] = useState(false)
    const [projectUsers, setProjectUsers] = useState([])
    const [isLoadingUsers, setIsLoadingUsers] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const { projects, isLoading } = useSelector((state) => state.projects)
    const { user } = useSelector((state) => state.auth)

    useEffect(() => {
        dispatch(loadUser())
    }, [dispatch])

    // Only load projects if we don't have any
    // Skip if projects already exist (they might be loaded from ProjectsModal)
    const hasProjectsAlready = projects && Array.isArray(projects) && projects.length > 0
    
    useEffect(() => {
        if (!user?.token) return
        if (hasProjectsAlready) return // Don't reload if we already have projects
        if (isLoading) return // Don't reload if already loading
        
        dispatch(getProjects())
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.token]) // Only depend on user token

    // Filter projects to only show ones the user owns
    const ownedProjects = (projects || []).filter(project => project.owner_id === user?.id)

    // Set initial project ID when prop changes
    useEffect(() => {
        if (initialProjectId) {
            setSelectedProjectId(initialProjectId)
        }
    }, [initialProjectId])

    // Load project users when a project is selected
    useEffect(() => {
        if (selectedProjectId && user?.token) {
            loadProjectUsers()
        } else {
            setProjectUsers([])
        }
    }, [selectedProjectId])

    const loadProjectUsers = async () => {
        if (!selectedProjectId || !user?.token) return
        
        setIsLoadingUsers(true)
        setError('')
        try {
            const response = await axios.get(
                `${process.env.REACT_APP_API_BASE_URL}/api/projects/${selectedProjectId}/users`,
                {
                    headers: {
                        'Authorization': `Bearer ${user.token}`
                    }
                }
            )
            setProjectUsers(Array.isArray(response.data) ? response.data : [])
        } catch (error) {
            console.error('Error loading project users:', error)
            const errorMessage = error?.response?.data?.error || error?.message || 'Failed to load project users'
            setError(errorMessage)
        } finally {
            setIsLoadingUsers(false)
        }
    }

    // Search for users by email
    const searchUsers = async (email) => {
        if (!email || email.trim() === '' || !user?.token) {
            setSearchResults([])
            return
        }

        setIsSearching(true)
        setError('')
        try {
            const response = await axios.get(
                `${process.env.REACT_APP_API_BASE_URL}/api/users/search`,
                {
                    params: { email: email.trim() },
                    headers: {
                        'Authorization': `Bearer ${user.token}`
                    }
                }
            )
            if (response.data && response.data.success) {
                // Filter out users who are already in the project
                const existingUserIds = new Set((projectUsers || []).map(pu => pu.user?.id || pu.user_id || pu.id))
                const filtered = (response.data.data || []).filter(u => u && u.id && !existingUserIds.has(u.id))
                setSearchResults(filtered)
            } else {
                setSearchResults([])
            }
        } catch (error) {
            console.error('Error searching users:', error)
            const errorMessage = error?.response?.data?.error || error?.message || 'Failed to search users'
            setError(errorMessage)
            setSearchResults([])
        } finally {
            setIsSearching(false)
        }
    }

    // Debounce email search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (emailSearch.trim()) {
                searchUsers(emailSearch)
            } else {
                setSearchResults([])
            }
        }, 300)

        return () => clearTimeout(timer)
    }, [emailSearch])

    const handleAddUser = async (userId) => {
        if (!selectedProjectId || !user?.token) return

        setError('')
        setSuccess('')
        try {
            await dispatch(addUserToProject({
                projectId: selectedProjectId,
                userData: { userId, role: 'member' }
            })).unwrap()
            
            setSuccess('User added successfully')
            setEmailSearch('')
            setSearchResults([])
            // Reload project users
            await loadProjectUsers()
            
            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(''), 3000)
        } catch (error) {
            const errorMessage = error?.message || error?.toString() || 'Failed to add user'
            setError(errorMessage)
        }
    }

    const handleRemoveUser = async (userId) => {
        if (!selectedProjectId || !user?.token) return

        setError('')
        setSuccess('')
        try {
            await dispatch(removeUserFromProject({
                projectId: selectedProjectId,
                userId
            })).unwrap()
            
            setSuccess('User removed successfully')
            // Reload project users
            await loadProjectUsers()
            
            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(''), 3000)
        } catch (error) {
            const errorMessage = error?.message || error?.toString() || 'Failed to remove user'
            setError(errorMessage)
        }
    }

    const selectedProject = ownedProjects.find(p => p.id === selectedProjectId)

    // Only show loading if we're actively loading AND don't have projects yet
    // If projects already exist (even if isLoading is true from other actions), show the modal
    if (isLoading && !hasProjectsAlready && user?.token) {
        return <div className="open-project-modal"><div className="form-group">Loading projects...</div></div>
    }

    return (
        <div className="open-project-modal">
            <div className="form-group">
                <h2 style={{ marginBottom: '24px', fontSize: '24px', fontWeight: 'bold' }}>
                    Share Project
                </h2>

                {error && (
                    <ErrorMessage message={error} style={{ marginBottom: '16px' }} />
                )}

                {success && (
                    <div style={{ 
                        marginBottom: '16px', 
                        padding: '12px', 
                        background: '#d1fae5', 
                        color: '#059669', 
                        borderRadius: '6px',
                        border: '1px solid #10b981',
                        fontSize: '16px'
                    }}>
                        ✓ {success}
                    </div>
                )}

                {/* Project Selection */}
                <FormField
                    label="Select Project to Share"
                    id="project-select"
                    type="select"
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    selectOptions={[
                        { value: '', label: '-- Select a project --' },
                        ...(ownedProjects || []).map(project => ({
                            value: project.id,
                            label: project.title || project.name || `Project ${project.id}`
                        }))
                    ]}
                />

                {ownedProjects.length === 0 && !isLoading && (
                    <div style={{ 
                        padding: '16px', 
                        background: '#f3f4f6', 
                        borderRadius: '6px', 
                        color: '#6b7280',
                        marginTop: '12px',
                        textAlign: 'center'
                    }}>
                        You don't own any projects yet.
                    </div>
                )}

                {selectedProject && (
                    <>
                        {/* Add User Section */}
                        <div style={{ marginTop: '24px' }}>
                            <FormField
                                label="Add User by Email"
                                id="email-search"
                                type="email"
                                placeholder="Search by email..."
                                value={emailSearch}
                                onChange={(e) => setEmailSearch(e.target.value)}
                            />

                            {/* Search Results */}
                            {isSearching && (
                                <div style={{ marginTop: '8px', color: '#6b7280', fontSize: '16px' }}>
                                    Searching...
                                </div>
                            )}

                            {!isSearching && searchResults.length > 0 && (
                                <div style={{ marginTop: '16px' }}>
                                    <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '12px', fontWeight: '500' }}>
                                        Select a user to add:
                                    </div>
                                    <div style={{ 
                                        border: '1px solid #d1d5db', 
                                        borderRadius: '6px', 
                                        maxHeight: '300px', 
                                        overflowY: 'auto',
                                        padding: '8px'
                                    }}>
                                        {searchResults.map(userResult => (
                                            <div
                                                key={userResult.id}
                                                style={{
                                                    padding: '12px',
                                                    marginBottom: '8px',
                                                    background: '#ffffff',
                                                    border: '1px solid #e5e7eb',
                                                    borderRadius: '6px',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                <div>
                                                    <div style={{ 
                                                        fontWeight: '600',
                                                        fontSize: '16px',
                                                        marginBottom: '4px'
                                                    }}>
                                                        {userResult.firstName} {userResult.lastName}
                                                    </div>
                                                    <div style={{ fontSize: '14px', color: '#6b7280' }}>
                                                        {userResult.email}
                                                    </div>
                                                </div>
                                                <button
                                                    className="button button-primary"
                                                    onClick={() => handleAddUser(userResult.id)}
                                                    style={{ fontSize: '14px', padding: '8px 16px' }}
                                                >
                                                    Add
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {!isSearching && emailSearch.trim() && searchResults.length === 0 && (
                                <div style={{ 
                                    marginTop: '12px', 
                                    padding: '12px',
                                    background: '#f3f4f6',
                                    borderRadius: '6px',
                                    color: '#6b7280', 
                                    fontSize: '16px' 
                                }}>
                                    No users found matching "{emailSearch}"
                                </div>
                            )}
                        </div>

                        {/* Current Project Users */}
                        <div style={{ marginTop: '24px' }}>
                            <label className="form-label">
                                Project Users ({projectUsers?.length || 0}):
                            </label>
                            {isLoadingUsers ? (
                                <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                                    Loading users...
                                </div>
                            ) : !Array.isArray(projectUsers) || projectUsers.length === 0 ? (
                                <div style={{ 
                                    padding: '16px', 
                                    background: '#f3f4f6', 
                                    borderRadius: '6px', 
                                    color: '#6b7280',
                                    textAlign: 'center'
                                }}>
                                    No users have been added to this project yet.
                                </div>
                            ) : (
                                <div style={{ 
                                    border: '1px solid #d1d5db', 
                                    borderRadius: '6px', 
                                    maxHeight: '400px', 
                                    overflowY: 'auto',
                                    padding: '8px'
                                }}>
                                    {projectUsers.map(projectUser => (
                                        <div
                                            key={projectUser.user?.id || projectUser.user_id}
                                            style={{
                                                padding: '12px',
                                                marginBottom: '8px',
                                                background: '#ffffff',
                                                border: '1px solid #e5e7eb',
                                                borderRadius: '6px',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            <div>
                                                <div style={{ 
                                                    fontWeight: '600',
                                                    fontSize: '16px',
                                                    marginBottom: '4px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px'
                                                }}>
                                                    {projectUser.user?.user_metadata?.firstName || ''} {projectUser.user?.user_metadata?.lastName || ''}
                                                    {projectUser.role === 'owner' && (
                                                        <span style={{ 
                                                            padding: '2px 8px', 
                                                            background: '#fbbf24', 
                                                            color: '#000', 
                                                            borderRadius: '4px', 
                                                            fontSize: '12px',
                                                            fontWeight: '500'
                                                        }}>
                                                            Owner
                                                        </span>
                                                    )}
                                                </div>
                                                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '2px' }}>
                                                    {projectUser.user?.email || 'Unknown email'}
                                                </div>
                                                <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                                                    Role: {projectUser.role}
                                                </div>
                                            </div>
                                            {projectUser.role !== 'owner' && (
                                                <button
                                                    className="button button-secondary"
                                                    onClick={() => handleRemoveUser(projectUser.user?.id || projectUser.user_id)}
                                                    style={{ 
                                                        fontSize: '14px', 
                                                        padding: '8px 16px',
                                                        backgroundColor: '#dc2626',
                                                        borderColor: '#dc2626',
                                                        color: 'white'
                                                    }}
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}

                <ButtonGroup
                    buttons={[
                        {
                            label: 'Close',
                            variant: 'secondary',
                            onClick: onClose
                        }
                    ]}
                />
            </div>
        </div>
    )
}

export default ShareProjectModal

