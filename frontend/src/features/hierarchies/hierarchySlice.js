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


// Get user hierarchies
export const getHierarchy = createAsyncThunk(
  'hierarchies/getOne', 
  async (projectId, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token
      return await hierarchyService.getHierarchy(projectId, token)
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

// Update user hierarchy
export const updateHierarchy = createAsyncThunk(
  'hierarchies/update',
  async ({ projectId, hierarchyData }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token
      const data = await hierarchyService.updateHierarchy(projectId, hierarchyData, token)
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

// Delete user hierarchy
export const deleteHierarchy = createAsyncThunk(
  'hierarchies/delete',
  async ({ projectId }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token
      const data = await hierarchyService.deleteHierarchy(projectId, token)
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
      .addCase(updateHierarchy.pending, (state) => {
        state.isLoading = true
      })
      .addCase(updateHierarchy.fulfilled, (state, action) => {
        state.isLoading = false
        state.isSuccess = true
        // Fix: Extract the data array from the API response and replace all hierarchies
        state.hierarchies = action.payload.data || []
      })
      .addCase(updateHierarchy.rejected, (state, action) => {
        state.isLoading = false
        state.isError = true
        state.message = action.payload
      })
      .addCase(getHierarchy.pending, (state) => {
        state.isLoading = true
        // Clear previous hierarchies immediately when starting to fetch new ones
        state.hierarchies = []
      })
      .addCase(getHierarchy.fulfilled, (state, action) => {
        state.isLoading = false
        state.isSuccess = true
        // Fix: Extract the data array from the API response
        state.hierarchies = action.payload.data || []
      })
      .addCase(getHierarchy.rejected, (state, action) => {
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