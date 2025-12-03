import {createSlice, createAsyncThunk} from '@reduxjs/toolkit'          
import projectService from './projectService'

const initialState = {
    projects: [],
    selectedProject: null,
    // Single hierarchy object instead of array
    currentHierarchy: null,
    // Feature types for the current project
    currentFeatureTypes: [],
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

export const createFeature = createAsyncThunk(
    'projects/createFeature',
    async ({ projectId, featureData }, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token
            return await projectService.createFeature(projectId, featureData, token)
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

export const updateFeature = createAsyncThunk(
    'projects/updateFeature',
    async ({ projectId, featureId, featureData }, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token
            return await projectService.updateFeature(projectId, featureId, featureData, token)
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

export const deleteFeature = createAsyncThunk(
    'projects/deleteFeature',
    async ({ projectId, featureId }, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token
            return await projectService.deleteFeature(projectId, featureId, token)
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

export const getFeatureTypes = createAsyncThunk(
    'projects/getFeatureTypes',
    async (projectId, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token
            return await projectService.getFeatureTypes(projectId, token)
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

export const createFeatureType = createAsyncThunk(
    'projects/createFeatureType',
    async ({ projectId, featureTypeData }, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token
            return await projectService.createFeatureType(projectId, featureTypeData, token)
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

export const updateFeatureType = createAsyncThunk(
    'projects/updateFeatureType',
    async ({ projectId, featureTypeId, featureTypeData }, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token
            return await projectService.updateFeatureType(projectId, featureTypeId, featureTypeData, token)
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

export const deleteFeatureType = createAsyncThunk(
    'projects/deleteFeatureType',
    async ({ projectId, featureTypeId }, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token
            return await projectService.deleteFeatureType(projectId, featureTypeId, token)
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

export const uploadHierarchyFile = createAsyncThunk(
    'projects/uploadHierarchyFile',
    async ({ projectId, file }, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token
            return await projectService.uploadHierarchyFile(projectId, file, token)
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

export const importHierarchyData = createAsyncThunk(
    'projects/importHierarchyData',
    async ({ projectId, mappings, data }, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token
            return await projectService.importHierarchyData(projectId, mappings, data, token)
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

// Get selected project from user_profiles
export const getSelectedProject = createAsyncThunk(
    'projects/getSelectedProject',
    async (_, thunkAPI) => {
        try {
            return await projectService.getUserSelectedProject()
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

// Set selected project in user_profiles
export const setSelectedProjectAsync = createAsyncThunk(
    'projects/setSelectedProjectAsync',
    async (projectId, thunkAPI) => {
        try {
            return await projectService.setUserSelectedProject(projectId)
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
        },
        clearSelectedProject: (state) => {
            state.selectedProject = null
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
                // Automatically set the newly created project as selected in user_profiles
                // This will be handled by dispatching setSelectedProjectAsync after createProject
            })
            .addCase(getSelectedProject.pending, (state) => {
                state.isLoading = true
            })
            .addCase(getSelectedProject.fulfilled, (state, action) => {
                state.isLoading = false
                state.isSuccess = true
                state.selectedProject = action.payload
            })
            .addCase(getSelectedProject.rejected, (state, action) => {
                state.isLoading = false
                state.isError = true
                state.message = action.payload
                state.selectedProject = null
            })
            .addCase(setSelectedProjectAsync.pending, (state) => {
                state.isLoading = true
            })
            .addCase(setSelectedProjectAsync.fulfilled, (state, action) => {
                state.isLoading = false
                state.isSuccess = true
                state.selectedProject = action.payload
            })
            .addCase(setSelectedProjectAsync.rejected, (state, action) => {
                state.isLoading = false
                state.isError = true
                state.message = action.payload
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
            // Individual feature reducers
            .addCase(createFeature.pending, (state) => {
                state.isLoading = true
            })
            .addCase(createFeature.fulfilled, (state, action) => {
                state.isLoading = false
                state.isSuccess = true
                // Add the new feature to current hierarchy
                if (state.currentHierarchy) {
                    state.currentHierarchy.push(action.payload.data)
                } else {
                    state.currentHierarchy = [action.payload.data]
                }
            })
            .addCase(createFeature.rejected, (state, action) => {
                state.isLoading = false
                state.isError = true
                state.message = action.payload
            })
            .addCase(updateFeature.pending, (state) => {
                state.isLoading = true
            })
            .addCase(updateFeature.fulfilled, (state, action) => {
                state.isLoading = false
                state.isSuccess = true
                // Update the feature in current hierarchy
                if (state.currentHierarchy) {
                    const index = state.currentHierarchy.findIndex(feature => feature.id === action.payload.data.id)
                    if (index !== -1) {
                        state.currentHierarchy[index] = action.payload.data
                    }
                }
            })
            .addCase(updateFeature.rejected, (state, action) => {
                state.isLoading = false
                state.isError = true
                state.message = action.payload
            })
            .addCase(deleteFeature.pending, (state) => {
                state.isLoading = true
            })
            .addCase(deleteFeature.fulfilled, (state, action) => {
                state.isLoading = false
                state.isSuccess = true
                // Remove the feature from current hierarchy
                if (state.currentHierarchy) {
                    state.currentHierarchy = state.currentHierarchy.filter(
                        feature => feature.id !== action.payload.data.id
                    )
                }
            })
            .addCase(deleteFeature.rejected, (state, action) => {
                state.isLoading = false
                state.isError = true
                state.message = action.payload
            })
            // Feature Types reducers
            .addCase(getFeatureTypes.pending, (state) => {
                state.isLoading = true
            })
            .addCase(getFeatureTypes.fulfilled, (state, action) => {
                state.isLoading = false
                state.isSuccess = true
                state.currentFeatureTypes = action.payload.data || []
            })
            .addCase(getFeatureTypes.rejected, (state, action) => {
                state.isLoading = false
                state.isError = true
                state.message = action.payload
            })
            .addCase(createFeatureType.pending, (state) => {
                state.isLoading = true
            })
            .addCase(createFeatureType.fulfilled, (state, action) => {
                state.isLoading = false
                state.isSuccess = true
                // Add the new feature type to currentFeatureTypes
                if (state.currentFeatureTypes) {
                    state.currentFeatureTypes.push(action.payload.data)
                } else {
                    state.currentFeatureTypes = [action.payload.data]
                }
            })
            .addCase(createFeatureType.rejected, (state, action) => {
                state.isLoading = false
                state.isError = true
                state.message = action.payload
            })
            .addCase(updateFeatureType.pending, (state) => {
                state.isLoading = true
            })
            .addCase(updateFeatureType.fulfilled, (state, action) => {
                state.isLoading = false
                state.isSuccess = true
            })
            .addCase(updateFeatureType.rejected, (state, action) => {
                state.isLoading = false
                state.isError = true
                state.message = action.payload
            })
            .addCase(deleteFeatureType.pending, (state) => {
                state.isLoading = true
            })
            .addCase(deleteFeatureType.fulfilled, (state, action) => {
                state.isLoading = false
                state.isSuccess = true
                state.currentFeatureTypes = state.currentFeatureTypes.filter(
                    featureType => featureType.id !== action.payload.id
                )
            })
            .addCase(deleteFeatureType.rejected, (state, action) => {
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