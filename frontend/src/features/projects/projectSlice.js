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

const initialState = {
    projects: [],
    selectedProject: getInitialSelectedProject(),
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

export const projectSlice = createSlice({
    name: 'projects',
    initialState,
    reducers: {
        reset: (state) => {
            // Don't reset selectedProject on reset, keep it persistent
            state.isError = false
            state.isSuccess = false
            state.isLoading = false
            state.message = ''
        },
        setSelectedProject: (state, action) => {
            state.selectedProject = action.payload
            saveSelectedProjectToStorage(action.payload)
        },
        clearSelectedProject: (state) => {
            state.selectedProject = null
            saveSelectedProjectToStorage(null)
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
            .addCase(getProject.pending, (state) => {
                state.isLoading = true
            })
            .addCase(getProject.fulfilled, (state, action) => {
                state.isLoading = false
                state.isSuccess = true
                state.project = action.payload
            })
            .addCase(getProject.rejected, (state, action) => {
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
            .addCase(deleteProject.pending, (state) => {
                state.isLoading = true
            })
            .addCase(deleteProject.fulfilled, (state, action) => {
                state.isLoading = false
                state.isSuccess = true
                state.projects = state.projects.filter((project) => project.id !== action.payload)
                // If the deleted project was selected, clear the selection
                if (state.selectedProject && state.selectedProject.id === action.payload) {
                    state.selectedProject = null
                    saveSelectedProjectToStorage(null)
                }
            })
            .addCase(deleteProject.rejected, (state, action) => {
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
                state.projects = state.projects.map((project) => project.id === action.payload.id ? action.payload : project)
                // Update selectedProject if it was the one being updated
                if (state.selectedProject && state.selectedProject.id === action.payload.id) {
                    state.selectedProject = action.payload
                    saveSelectedProjectToStorage(action.payload)
                }
            })
            .addCase(updateProject.rejected, (state, action) => {
                state.isLoading = false
                state.isError = true
                state.message = action.payload
            })
    }
})

export const {reset, setSelectedProject, clearSelectedProject} = projectSlice.actions
export default projectSlice.reducer