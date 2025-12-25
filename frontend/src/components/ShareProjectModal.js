import '../styles/projectComponents.css'
import { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { getProjects, addUserToProject, removeUserFromProject } from '../features/projects/projectSlice'
import { loadUser } from '../features/auth/authSlice'
import axios from 'axios'

const ShareProjectModal = ({ onClose }) => {
    const dispatch = useDispatch()
    const [selectedProjectId, setSelectedProjectId] = useState('')
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

    useEffect(() => {
        if (user && user.token) {
            dispatch(getProjects())
        }
    }, [dispatch, user])

    // Filter projects to only show ones the user owns
    const ownedProjects = (projects || []).filter(project => project.owner_id === user?.id)

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

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Share Project</h2>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>

                <div className="modal-body">
                    {error && (
                        <div className="error-message" style={{ marginBottom: '16px', padding: '10px', background: '#fee', color: '#c33', borderRadius: '4px' }}>
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="success-message" style={{ marginBottom: '16px', padding: '10px', background: '#efe', color: '#3c3', borderRadius: '4px' }}>
                            {success}
                        </div>
                    )}

                    {/* Project Selection */}
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                            Select Project to Share
                        </label>
                        {isLoading ? (
                            <div>Loading projects...</div>
                        ) : ownedProjects.length === 0 ? (
                            <div style={{ padding: '12px', background: '#f5f5f5', borderRadius: '4px', color: '#666' }}>
                                You don't own any projects yet.
                            </div>
                        ) : (
                            <select
                                value={selectedProjectId}
                                onChange={(e) => setSelectedProjectId(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    fontSize: '14px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px'
                                }}
                            >
                                <option value="">-- Select a project --</option>
                                {ownedProjects.map(project => (
                                    <option key={project.id} value={project.id}>
                                        {project.title}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {selectedProject && (
                        <>
                            {/* Add User Section */}
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                                    Add User by Email
                                </label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input
                                        type="email"
                                        value={emailSearch}
                                        onChange={(e) => setEmailSearch(e.target.value)}
                                        placeholder="Search by email..."
                                        style={{
                                            flex: 1,
                                            padding: '10px',
                                            fontSize: '14px',
                                            border: '1px solid #ddd',
                                            borderRadius: '4px'
                                        }}
                                    />
                                </div>

                                {/* Search Results */}
                                {isSearching && (
                                    <div style={{ marginTop: '8px', color: '#666', fontSize: '14px' }}>
                                        Searching...
                                    </div>
                                )}

                                {!isSearching && searchResults.length > 0 && (
                                    <div style={{ marginTop: '12px' }}>
                                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                                            Select a user to add:
                                        </div>
                                        {searchResults.map(userResult => (
                                            <div
                                                key={userResult.id}
                                                style={{
                                                    padding: '10px',
                                                    marginBottom: '8px',
                                                    background: '#f9f9f9',
                                                    border: '1px solid #ddd',
                                                    borderRadius: '4px',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center'
                                                }}
                                            >
                                                <div>
                                                    <div style={{ fontWeight: '500' }}>
                                                        {userResult.firstName} {userResult.lastName}
                                                    </div>
                                                    <div style={{ fontSize: '12px', color: '#666' }}>
                                                        {userResult.email}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleAddUser(userResult.id)}
                                                    style={{
                                                        padding: '6px 12px',
                                                        background: '#007bff',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer',
                                                        fontSize: '13px'
                                                    }}
                                                >
                                                    Add
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {!isSearching && emailSearch.trim() && searchResults.length === 0 && (
                                    <div style={{ marginTop: '8px', color: '#666', fontSize: '14px' }}>
                                        No users found matching "{emailSearch}"
                                    </div>
                                )}
                            </div>

                            {/* Current Project Users */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                                    Project Users
                                </label>
                                {isLoadingUsers ? (
                                    <div>Loading users...</div>
                                ) : !Array.isArray(projectUsers) || projectUsers.length === 0 ? (
                                    <div style={{ padding: '12px', background: '#f5f5f5', borderRadius: '4px', color: '#666' }}>
                                        No users have been added to this project yet.
                                    </div>
                                ) : (
                                    <div>
                                        {projectUsers.map(projectUser => (
                                            <div
                                                key={projectUser.user?.id || projectUser.user_id}
                                                style={{
                                                    padding: '12px',
                                                    marginBottom: '8px',
                                                    background: '#f9f9f9',
                                                    border: '1px solid #ddd',
                                                    borderRadius: '4px',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center'
                                                }}
                                            >
                                                <div>
                                                    <div style={{ fontWeight: '500' }}>
                                                        {projectUser.user?.user_metadata?.firstName || ''} {projectUser.user?.user_metadata?.lastName || ''}
                                                        {projectUser.role === 'owner' && (
                                                            <span style={{ marginLeft: '8px', padding: '2px 6px', background: '#ffc107', color: '#000', borderRadius: '3px', fontSize: '11px' }}>
                                                                Owner
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div style={{ fontSize: '12px', color: '#666' }}>
                                                        {projectUser.user?.email || 'Unknown email'}
                                                    </div>
                                                    <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
                                                        Role: {projectUser.role}
                                                    </div>
                                                </div>
                                                {projectUser.role !== 'owner' && (
                                                    <button
                                                        onClick={() => handleRemoveUser(projectUser.user?.id || projectUser.user_id)}
                                                        style={{
                                                            padding: '6px 12px',
                                                            background: '#dc3545',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                            fontSize: '13px'
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
                </div>

                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ShareProjectModal

