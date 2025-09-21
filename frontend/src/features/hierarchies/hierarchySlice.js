import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import hierarchyService from './hierarchyService'
const initialState = {  
  hierarchies: [],
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: '',
}

// Create new hierarchy
export const createHierarchy = createAsyncThunk(
  'hierarchies/create',
  async ({ hierarchyData, projectId }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token
      return await hierarchyService.createHierarchy(hierarchyData, projectId, token)
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

// Get user hierarchies
export const getHierarchies = createAsyncThunk(
  'hierarchies/getAll', 
  async (projectId, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token
      return await hierarchyService.getHierarchies(projectId, token)
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

// Delete user hierarchy
export const deleteHierarchy = createAsyncThunk(
  'hierarchies/delete',
  async ({ id, projectId }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token
      const data = await hierarchyService.deleteHierarchy(id, projectId, token)
      console.log('delete hierarchy result', data)
      return data
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

    export const hierarchySlice = createSlice({
  name: 'hierarchy',
  initialState,
  reducers: {
    reset: (state) => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(createHierarchy.pending, (state) => {
        state.isLoading = true
      })
      .addCase(createHierarchy.fulfilled, (state, action) => {
        state.isLoading = false
        state.isSuccess = true
        state.hierarchies.push(action.payload)
      })
      .addCase(createHierarchy.rejected, (state, action) => {
        state.isLoading = false
        state.isError = true
        state.message = action.payload
      })
      .addCase(getHierarchies.pending, (state) => {
        state.isLoading = true
      })
      .addCase(getHierarchies.fulfilled, (state, action) => {
        state.isLoading = false
        state.isSuccess = true
        state.hierarchies = action.payload
      })
      .addCase(getHierarchies.rejected, (state, action) => {
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
            state.hierarchies = state.hierarchies.filter(
          (hierarchy) => hierarchy.id !== action.payload
        )
        console.log('hierarchies after filter', state.hierarchies);

      })
      .addCase(deleteHierarchy.rejected, (state, action) => {
        state.isLoading = false
        state.isError = true
        state.message = action.payload
      })
  },
})

export const { reset } = hierarchySlice.actions
export default hierarchySlice.reducer