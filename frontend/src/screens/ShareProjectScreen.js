import '../styles/shareProject.css'
import { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { getProjects, addUserToProject, removeUserFromProject } from '../features/projects/projectSlice'
import { loadUser } from '../features/auth/authSlice'
import axios from 'axios'

const ShareProjectScreen = () => {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const initialProjectId = searchParams.get('projectId') || ''
    
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
    const hasProjectsAlready = projects && Array.isArray(projects) && projects.length > 0
    
    useEffect(() => {
        if (!user?.token) return
        if (hasProjectsAlready) return
        if (isLoading) return
        
        dispatch(getProjects())
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.token])

    // Filter projects to only show ones the user owns
    const ownedProjects = (projects || []).filter(project => project.owner_id === user?.id)

    // Set initial project ID from URL params
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
                const existingUserIds = new Set((projectUsers || []).map(pu => pu.user?.id || pu.user_id || pu.id))
                const filtered = (response.data.data || []).filter(u => u && u.id && !existingUserIds.has(u.id))
                setSearchResults(filtered)
            } else {
                setSearchResults([])
            }
        } catch (error) {
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
            await loadProjectUsers()
            
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
            await loadProjectUsers()
            
            setTimeout(() => setSuccess(''), 3000)
        } catch (error) {
            const errorMessage = error?.message || error?.toString() || 'Failed to remove user'
            setError(errorMessage)
        }
    }

    const selectedProject = ownedProjects.find(p => p.id === selectedProjectId)

    if (!user) {
        return (
            <div className="share-project-screen">
                <div className="share-project-container">
                    <p>Please log in to share projects.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="share-project-screen">
            <div className="share-project-container">
                <div className="share-project-header">
                    <button 
                        className="back-button"
                        onClick={() => navigate(-1)}
                    >
                        ← Back
                    </button>
                    <h1>Share Project</h1>
                </div>

                {error && (
                    <div className="error-message">
                        ⚠️ {error}
                    </div>
                )}

                {success && (
                    <div className="success-message">
                        ✓ {success}
                    </div>
                )}

                {/* Project Selection */}
                <div className="form-section">
                    <label htmlFor="project-select" className="form-label">
                        Select Project to Share
                    </label>
                    <select
                        id="project-select"
                        className="form-select"
                        value={selectedProjectId}
                        onChange={(e) => setSelectedProjectId(e.target.value)}
                    >
                        <option value="">-- Select a project --</option>
                        {ownedProjects.map(project => (
                            <option key={project.id} value={project.id}>
                                {project.title || project.name || `Project ${project.id}`}
                            </option>
                        ))}
                    </select>
                </div>

                {ownedProjects.length === 0 && !isLoading && (
                    <div className="empty-state">
                        You don't own any projects yet.
                    </div>
                )}

                {selectedProject && (
                    <>
                        {/* Add User Section */}
                        <div className="form-section">
                            <label htmlFor="email-search" className="form-label">
                                Add User by Email
                            </label>
                            <input
                                id="email-search"
                                type="email"
                                className="form-input"
                                placeholder="Search by email..."
                                value={emailSearch}
                                onChange={(e) => setEmailSearch(e.target.value)}
                            />

                            {isSearching && (
                                <div className="search-status">Searching...</div>
                            )}

                            {!isSearching && searchResults.length > 0 && (
                                <div className="search-results">
                                    <div className="search-results-label">
                                        Select a user to add:
                                    </div>
                                    <div className="user-list">
                                        {searchResults.map(userResult => (
                                            <div key={userResult.id} className="user-card">
                                                <div className="user-info">
                                                    <div className="user-name">
                                                        {userResult.firstName} {userResult.lastName}
                                                    </div>
                                                    <div className="user-email">
                                                        {userResult.email}
                                                    </div>
                                                </div>
                                                <button
                                                    className="btn-add"
                                                    onClick={() => handleAddUser(userResult.id)}
                                                >
                                                    Add
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {!isSearching && emailSearch.trim() && searchResults.length === 0 && (
                                <div className="no-results">
                                    No users found matching "{emailSearch}"
                                </div>
                            )}
                        </div>

                        {/* Current Project Users */}
                        <div className="form-section">
                            <label className="form-label">
                                Project Users ({projectUsers?.length || 0})
                            </label>
                            {isLoadingUsers ? (
                                <div className="loading-state">Loading users...</div>
                            ) : !Array.isArray(projectUsers) || projectUsers.length === 0 ? (
                                <div className="empty-state">
                                    No users have been added to this project yet.
                                </div>
                            ) : (
                                <div className="user-list">
                                    {projectUsers.map(projectUser => (
                                        <div
                                            key={projectUser.user?.id || projectUser.user_id}
                                            className="user-card"
                                        >
                                            <div className="user-info">
                                                <div className="user-name">
                                                    {projectUser.user?.user_metadata?.firstName || ''} {projectUser.user?.user_metadata?.lastName || ''}
                                                    {projectUser.role === 'owner' && (
                                                        <span className="owner-badge">Owner</span>
                                                    )}
                                                </div>
                                                <div className="user-email">
                                                    {projectUser.user?.email || 'Unknown email'}
                                                </div>
                                                <div className="user-role">
                                                    Role: {projectUser.role}
                                                </div>
                                            </div>
                                            {projectUser.role !== 'owner' && (
                                                <button
                                                    className="btn-remove"
                                                    onClick={() => handleRemoveUser(projectUser.user?.id || projectUser.user_id)}
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
        </div>
    )
}

export default ShareProjectScreen

