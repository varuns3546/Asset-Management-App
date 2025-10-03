import {createSlice, createAsyncThunk} from '@reduxjs/toolkit'          
import projectService from './projectService'

// Load selected project from localStorage on initialization
const getInitialSelectedProject = () => {
    try {
        const savedProject = localStorage.getItem('selectedProject')
        return savedProject ? JSON.parse(savedProject) : null
    } catch (error) {
        console.error('Error loading selected project from localStorage:', error)
        return null
    }
}

// Helper function to save selected project to localStorage
const saveSelectedProjectToStorage = (project) => {
    try {
        if (project) {
            localStorage.setItem('selectedProject', JSON.stringify(project))
        } else {
            localStorage.removeItem('selectedProject')
        }
    } catch (error) {
        console.error('Error saving selected project to localStorage:', error)
    }
}

const initialState = {
    projects: [],
    selectedProject: getInitialSelectedProject(),
    // Single hierarchy object instead of array
    currentHierarchy: null,
    // Item types for the current project
    currentItemTypes: [],
    isError: false,
    isSuccess: false,
    isLoading: false,
    message: '',
}  

export const createProject = createAsyncThunk(
    'projects/create',
    async (projectData, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token
            return await projectService.createProject(projectData, token)
        } catch (error) {
            const message =
                (error.response && 
                    error.response.data &&
                    error.response.data.message) ||
                error.message ||
                error.toString()
            return thunkAPI.rejectWithValue(message)
        }
    }
)

export const getProject = createAsyncThunk(
    'projects/getOne',
    async (projectId, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token
            return await projectService.getProject(projectId, token)
        } catch (error) {
            const message =
                (error.response && 
                    error.response.data &&
                    error.response.data.message) ||
                error.message ||
                error.toString()
            return thunkAPI.rejectWithValue(message)
        }
    }
)

export const getProjects = createAsyncThunk(
    'projects/getAll',
    async (_, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token
            return await projectService.getProjects(token)
        } catch (error) {
            const message =
                (error.response && 
                    error.response.data &&
                    error.response.data.message) ||
                error.message ||
                error.toString()
            return thunkAPI.rejectWithValue(message)
        }
    }
)

export const updateProject = createAsyncThunk(
    'projects/update',
    async ({projectId, projectData}, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token
            return await projectService.updateProject(projectId, projectData, token)
        } catch (error) {
            const message =
                (error.response && 
                    error.response.data &&
                    error.response.data.message) ||
                error.message ||
                error.toString()
            return thunkAPI.rejectWithValue(message)
        }
    }
)

export const deleteProject = createAsyncThunk(
    'projects/delete',
    async (projectId, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token
            return await projectService.deleteProject(projectId, token)
        } catch (error) {
            const message =
                (error.response && 
                    error.response.data &&
                    error.response.data.message) ||
                error.message ||
                error.toString()
            return thunkAPI.rejectWithValue(message)
        }
    }
)

// Get project hierarchy
export const getHierarchy = createAsyncThunk(
    'projects/getHierarchy',
    async (projectId, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token
            return await projectService.getHierarchy(projectId, token)
        } catch (error) {
            const message =
                (error.response && 
                    error.response.data &&
                    error.response.data.message) ||
                error.message ||
                error.toString()
            return thunkAPI.rejectWithValue(message)
        }
    }
)

// Update project hierarchy
export const updateHierarchy = createAsyncThunk(
    'projects/updateHierarchy',
    async ({projectId, hierarchyData}, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token
            return await projectService.updateHierarchy(projectId, hierarchyData, token)
        } catch (error) {
            const message =
                (error.response &&
                    error.response.data &&
                    error.response.data.message) ||
                error.message ||
                error.toString()
            return thunkAPI.rejectWithValue(message)
        }
    }
)

// Delete project hierarchy
export const deleteHierarchy = createAsyncThunk(
    'projects/deleteHierarchy',
    async ({ projectId }, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token
            return await projectService.deleteHierarchy(projectId, token)
        } catch (error) {
            const message =
                (error.response &&
                    error.response.data &&
                    error.response.data.message) ||
                error.message ||
                error.toString()
            return thunkAPI.rejectWithValue(message)
        }
    }
)

// Create individual hierarchy item
export const createHierarchyItem = createAsyncThunk(
    'projects/createHierarchyItem',
    async ({ projectId, itemData }, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token
            return await projectService.createHierarchyItem(projectId, itemData, token)
        } catch (error) {
            const message =
                (error.response && 
                    error.response.data &&
                    error.response.data.message) ||
                error.message ||
                error.toString()
            return thunkAPI.rejectWithValue(message)
        }
    }
)

// Update individual hierarchy item
export const updateHierarchyItem = createAsyncThunk(
    'projects/updateHierarchyItem',
    async ({ projectId, itemId, itemData }, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token
            return await projectService.updateHierarchyItem(projectId, itemId, itemData, token)
        } catch (error) {
            const message =
                (error.response && 
                    error.response.data &&
                    error.response.data.message) ||
                error.message ||
                error.toString()
            return thunkAPI.rejectWithValue(message)
        }
    }
)

// Delete individual hierarchy item
export const deleteHierarchyItem = createAsyncThunk(
    'projects/deleteHierarchyItem',
    async ({ projectId, itemId }, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token
            return await projectService.deleteHierarchyItem(projectId, itemId, token)
        } catch (error) {
            const message =
                (error.response && 
                    error.response.data &&
                    error.response.data.message) ||
                error.message ||
                error.toString()
            return thunkAPI.rejectWithValue(message)
        }
    }
)

export const getHierarchyItemTypes = createAsyncThunk(
    'projects/getHierarchyItemTypes',
    async (projectId, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token
            return await projectService.getHierarchyItemTypes(projectId, token)
        } catch (error) {
            const message =
                (error.response && 
                    error.response.data &&
                    error.response.data.message) ||
                error.message ||
                error.toString()
            return thunkAPI.rejectWithValue(message)
        }
    }
)

export const updateHierarchyItemTypes = createAsyncThunk(

    'projects/updateHierarchyItemTypes',
    async ({ projectId, itemTypesData }, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token
            return await projectService.updateHierarchyItemTypes(projectId, itemTypesData, token)
        }
        catch (error) {
            const message =
                (error.response && 
                    error.response.data &&
                    error.response.data.message) ||
                error.message ||
                error.toString()
            return thunkAPI.rejectWithValue(message)
        }
    }
)

// Create hierarchy item type
export const createHierarchyItemType = createAsyncThunk(
    'projects/createHierarchyItemType',
    async ({ projectId, itemTypeData }, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token
            return await projectService.createHierarchyItemType(projectId, itemTypeData, token)
        } catch (error) {
            const message =
                (error.response && 
                    error.response.data &&
                    error.response.data.message) ||
                error.message ||
                error.toString()
            return thunkAPI.rejectWithValue(message)
        }
    }
)

// Update individual hierarchy item type
export const updateHierarchyItemType = createAsyncThunk(
    'projects/updateHierarchyItemType',
    async ({ projectId, itemTypeId, itemTypeData }, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token
            return await projectService.updateHierarchyItemType(projectId, itemTypeId, itemTypeData, token)
        } catch (error) {
            const message =
                (error.response && 
                    error.response.data &&
                    error.response.data.message) ||
                error.message ||
                error.toString()
            return thunkAPI.rejectWithValue(message)
        }
    }
)

// Delete hierarchy item type
export const deleteHierarchyItemType = createAsyncThunk(
    'projects/deleteHierarchyItemType',
    async ({ projectId, itemTypeId }, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token
            return await projectService.deleteHierarchyItemType(projectId, itemTypeId, token)
        } catch (error) {
            const message =
                (error.response && 
                    error.response.data &&
                    error.response.data.message) ||
                error.message ||
                error.toString()
            return thunkAPI.rejectWithValue(message)
        }
    }
)

export const getProjectUsers = createAsyncThunk(
    'projects/getProjectUsers',
    async (projectId, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token
            return await projectService.getProjectUsers(projectId, token)
        } catch (error) {
            const message =
                (error.response &&
                    error.response.data &&
                    error.response.data.message) ||
                error.message ||
                error.toString()
            return thunkAPI.rejectWithValue(message)
        }
    }
)

export const addUserToProject = createAsyncThunk(
    'projects/addUserToProject',
    async ({projectId, userData}, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token
            return await projectService.addUserToProject(projectId, userData, token)
        } catch (error) {
            const message =
                (error.response && 
                    error.response.data &&
                    error.response.data.message) ||
                error.message ||
                error.toString()
            return thunkAPI.rejectWithValue(message)
        }
    }
)

export const removeUserFromProject = createAsyncThunk(
    'projects/removeUserFromProject',
    async ({projectId, userId}, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token
            return await projectService.removeUserFromProject(projectId, userId, token)
        } catch (error) {
            const message =
                (error.response && 
                    error.response.data &&
                    error.response.data.message) ||
                error.message ||
                error.toString()
            return thunkAPI.rejectWithValue(message)
        }
    }
)

export const projectSlice = createSlice({
    name: 'projects',
    initialState,
    reducers: {
        reset: (state) => {
            state.isLoading = false
            state.isSuccess = false
            state.isError = false
            state.message = ''
        },
        setSelectedProject: (state, action) => {
            state.selectedProject = action.payload
            saveSelectedProjectToStorage(action.payload)
        },
        clearSelectedProject: (state) => {
            state.selectedProject = null
            saveSelectedProjectToStorage(null)
        },
        setCurrentHierarchy: (state, action) => {
            state.currentHierarchy = action.payload 
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(createProject.pending, (state) => {
                state.isLoading = true
            })
            .addCase(createProject.fulfilled, (state, action) => {
                state.isLoading = false
                state.isSuccess = true
                state.projects.push(action.payload)
                state.selectedProject = action.payload
                saveSelectedProjectToStorage(action.payload)
            })
            .addCase(createProject.rejected, (state, action) => {
                state.isLoading = false
                state.isError = true
                state.message = action.payload
            })
            .addCase(getProjects.pending, (state) => {
                state.isLoading = true
            })
            .addCase(getProjects.fulfilled, (state, action) => {
                state.isLoading = false
                state.isSuccess = true
                state.projects = action.payload
            })
            .addCase(getProjects.rejected, (state, action) => {
                state.isLoading = false
                state.isError = true
                state.message = action.payload
            })
            .addCase(getProject.pending, (state) => {
                state.isLoading = true
            })
            .addCase(getProject.fulfilled, (state, action) => {
                state.isLoading = false
                state.isSuccess = true
                state.selectedProject = action.payload
            })
            .addCase(getProject.rejected, (state, action) => {
                state.isLoading = false
                state.isError = true
                state.message = action.payload
            })
            .addCase(updateProject.pending, (state) => {
                state.isLoading = true
            })
            .addCase(updateProject.fulfilled, (state, action) => {
                state.isLoading = false
                state.isSuccess = true
                state.projects = state.projects.map(project => 
                    project.id === action.payload.id ? action.payload : project
                )
                if (state.selectedProject && state.selectedProject.id === action.payload.id) {
                    state.selectedProject = action.payload
                }
            })
            .addCase(updateProject.rejected, (state, action) => {
                state.isLoading = false
                state.isError = true
                state.message = action.payload
            })
            .addCase(deleteProject.pending, (state) => {
                state.isLoading = true
            })
            .addCase(deleteProject.fulfilled, (state, action) => {
                state.isLoading = false
                state.isSuccess = true
                state.projects = state.projects.filter(project => project.id !== action.payload.id)
                if (state.selectedProject && state.selectedProject.id === action.payload.id) {
                    state.selectedProject = null
                }
            })
            .addCase(deleteProject.rejected, (state, action) => {
                state.isLoading = false
                state.isError = true
                state.message = action.payload
            })
            .addCase(getHierarchy.pending, (state) => {
                state.isLoading = true
                // Don't clear hierarchy immediately - let the fulfilled case handle the update
                // This prevents temporary disappearance of children during refresh
            })
            .addCase(getHierarchy.fulfilled, (state, action) => {
                state.isLoading = false
                state.isSuccess = true
                state.currentHierarchy = action.payload.data
                console.log('getHierarchy fulfilled - updated hierarchy:', action.payload.data);
            })
            .addCase(getHierarchy.rejected, (state, action) => {
                state.isLoading = false
                state.isError = true
                state.message = action.payload
            })
            .addCase(updateHierarchy.pending, (state) => {
                state.isLoading = true
            })
            .addCase(updateHierarchy.fulfilled, (state, action) => {
                state.isLoading = false
                state.isSuccess = true
                state.currentHierarchy = action.payload.data
            })
            .addCase(updateHierarchy.rejected, (state, action) => {
                state.isLoading = false
                state.isError = true
                state.message = action.payload
            })
            .addCase(deleteHierarchy.pending, (state) => {
                state.isLoading = true
            })
            .addCase(deleteHierarchy.fulfilled, (state, action) => {
                state.isLoading = false
                state.isSuccess = true
                state.currentHierarchy = null
            })
            .addCase(deleteHierarchy.rejected, (state, action) => {
                state.isLoading = false
                state.isError = true
                state.message = action.payload
            })
            // Individual hierarchy item reducers
            .addCase(createHierarchyItem.pending, (state) => {
                state.isLoading = true
            })
            .addCase(createHierarchyItem.fulfilled, (state, action) => {
                state.isLoading = false
                state.isSuccess = true
                // Add the new item to current hierarchy
                if (state.currentHierarchy) {
                    state.currentHierarchy.push(action.payload.data)
                } else {
                    state.currentHierarchy = [action.payload.data]
                }
            })
            .addCase(createHierarchyItem.rejected, (state, action) => {
                state.isLoading = false
                state.isError = true
                state.message = action.payload
            })
            .addCase(updateHierarchyItem.pending, (state) => {
                state.isLoading = true
            })
            .addCase(updateHierarchyItem.fulfilled, (state, action) => {
                state.isLoading = false
                state.isSuccess = true
                // Update the item in current hierarchy
                if (state.currentHierarchy) {
                    const index = state.currentHierarchy.findIndex(item => item.id === action.payload.data.id)
                    if (index !== -1) {
                        state.currentHierarchy[index] = action.payload.data
                    }
                }
            })
            .addCase(updateHierarchyItem.rejected, (state, action) => {
                state.isLoading = false
                state.isError = true
                state.message = action.payload
            })
            .addCase(deleteHierarchyItem.pending, (state) => {
                state.isLoading = true
            })
            .addCase(deleteHierarchyItem.fulfilled, (state, action) => {
                state.isLoading = false
                state.isSuccess = true
                // Remove the item from current hierarchy
                if (state.currentHierarchy) {
                    state.currentHierarchy = state.currentHierarchy.filter(
                        item => item.id !== action.payload.data.id
                    )
                }
            })
            .addCase(deleteHierarchyItem.rejected, (state, action) => {
                state.isLoading = false
                state.isError = true
                state.message = action.payload
            })
            // Item Types reducers
            .addCase(getHierarchyItemTypes.pending, (state) => {
                state.isLoading = true
            })
            .addCase(getHierarchyItemTypes.fulfilled, (state, action) => {
                state.isLoading = false
                state.isSuccess = true
                state.currentItemTypes = action.payload.data || []
            })
            .addCase(getHierarchyItemTypes.rejected, (state, action) => {
                state.isLoading = false
                state.isError = true
                state.message = action.payload
            })
            .addCase(createHierarchyItemType.pending, (state) => {
                state.isLoading = true
            })
            .addCase(createHierarchyItemType.fulfilled, (state, action) => {
                state.isLoading = false
                state.isSuccess = true
                // Add the new item type to currentItemTypes
                if (state.currentItemTypes) {
                    state.currentItemTypes.push(action.payload.data)
                } else {
                    state.currentItemTypes = [action.payload.data]
                }
            })
            .addCase(createHierarchyItemType.rejected, (state, action) => {
                state.isLoading = false
                state.isError = true
                state.message = action.payload
            })
            .addCase(updateHierarchyItemType.pending, (state) => {
                state.isLoading = true
            })
            .addCase(updateHierarchyItemType.fulfilled, (state, action) => {
                state.isLoading = false
                state.isSuccess = true
                // Update the item type in currentItemTypes
                if (state.currentItemTypes) {
                    const index = state.currentItemTypes.findIndex(item => item.id === action.payload.data.id)
                    if (index !== -1) {
                        state.currentItemTypes[index] = action.payload.data
                    }
                }
            })
            .addCase(updateHierarchyItemType.rejected, (state, action) => {
                state.isLoading = false
                state.isError = true
                state.message = action.payload
            })
            .addCase(deleteHierarchyItemType.pending, (state) => {
                state.isLoading = true
            })
            .addCase(deleteHierarchyItemType.fulfilled, (state, action) => {
                state.isLoading = false
                state.isSuccess = true
                console.log('Delete fulfilled - action.payload:', action.payload);
                console.log('Delete fulfilled - currentItemTypes before filter:', state.currentItemTypes);
                state.currentItemTypes = state.currentItemTypes.filter(
                    itemType => itemType.id !== action.payload.id
                )
                console.log('Delete fulfilled - currentItemTypes after filter:', state.currentItemTypes);
                
                // Don't clear hierarchy data - let the getHierarchy call handle the refresh
                // This prevents the temporary disappearance of children
            })
            .addCase(deleteHierarchyItemType.rejected, (state, action) => {
                state.isLoading = false
                state.isError = true
                state.message = action.payload
            })
            .addCase(getProjectUsers.pending, (state) => {
                state.isLoading = true
            })
            .addCase(getProjectUsers.fulfilled, (state, action) => {
                state.isLoading = false
                state.isSuccess = true
                state.projectUsers = action.payload.data || []
            })
            .addCase(getProjectUsers.rejected, (state, action) => {
                state.isLoading = false
                state.isError = true
                state.message = action.payload
            })
            .addCase(addUserToProject.pending, (state) => {
                state.isLoading = true
            })
            .addCase(addUserToProject.fulfilled, (state, action) => {
                state.isLoading = false
                state.isSuccess = true
                state.projectUsers.push(action.payload.data)
            })
            .addCase(addUserToProject.rejected, (state, action) => {
                state.isLoading = false
                state.isError = true
                state.message = action.payload
            })
            .addCase(removeUserFromProject.pending, (state) => {
                state.isLoading = true
            })
            .addCase(removeUserFromProject.fulfilled, (state, action) => {
                state.isLoading = false
                state.isSuccess = true
                state.projectUsers = state.projectUsers.filter(
                    user => user.id !== action.payload.id
                )
            })
            .addCase(removeUserFromProject.rejected, (state, action) => {
                state.isLoading = false
                state.isError = true
                state.message = action.payload
            })
    }
})

export const { reset, setSelectedProject, clearSelectedProject, setCurrentHierarchy } = projectSlice.actions
export default projectSlice.reducer