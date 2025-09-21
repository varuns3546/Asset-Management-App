import {createSlice, createAsyncThunk} from '@reduxjs/toolkit'          
import projectService from './projectService'

const initialState = {
    projects: [],
    selectedProject: null,
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


export const projectSlice = createSlice({
    name: 'projects',
    initialState,
    reducers: {
        reset: (state) => initialState,
        setSelectedProject: (state, action) => {
            state.selectedProject = action.payload
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
            })
            .addCase(updateProject.rejected, (state, action) => {
                state.isLoading = false
                state.isError = true
                state.message = action.payload
            })
    }
})

export const {reset, setSelectedProject} = projectSlice.actions
export default projectSlice.reducer